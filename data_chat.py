"""
data_chat.py
------------
Core pipeline: load one or more CSV/Excel files (including multi-sheet
workbooks) -> summarize their schema -> ask an LLM to write pandas/plotly
code answering a natural-language question -> execute that code in a
restricted sandbox -> retry with the error message if it fails.

This is NOT a retrieval pipeline (no embeddings/FAISS) - open-ended chart and
aggregation queries need code that's correct for the *specific* question and
the *specific* columns present, which retrieval can't produce. This mirrors
the "text-to-code" pattern behind tools like PandasAI / ChatGPT's Code
Interpreter, scoped down to pandas + plotly.
"""

import re
import io
import contextlib
import traceback

import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go

from groq import Groq

MAX_RETRIES = 2
SAMPLE_ROWS = 5


class CodeExecutionError(Exception):
    """Raised when generated code fails even after all retries."""


class DataChat:
    def __init__(self):
        # {sheet_name: pd.DataFrame} - flat across all uploaded files, so a
        # multi-file upload and a multi-sheet single workbook look identical
        # to the rest of the pipeline.
        self.dataframes: dict[str, pd.DataFrame] = {}

    # ---------- Step 1: Loading ----------
    def load_file(self, path: str, display_name: str | None = None) -> list[str]:
        """
        Loads a CSV or Excel file. Excel files contribute one dataframe per
        sheet, named '<file>__<sheet>' so sheets from different uploads never
        collide. Returns the list of dataframe names that were added.
        """
        display_name = display_name or path.split("/")[-1]
        base_name = re.sub(r"\.\w+$", "", display_name)
        base_name = re.sub(r"[^A-Za-z0-9_]", "_", base_name)

        added = []
        if path.lower().endswith(".csv"):
            df = pd.read_csv(path)
            name = self._unique_name(base_name)
            self.dataframes[name] = df
            added.append(name)
        else:
            sheets = pd.read_excel(path, sheet_name=None)  # dict of all sheets
            for sheet_name, df in sheets.items():
                clean_sheet = re.sub(r"[^A-Za-z0-9_]", "_", sheet_name)
                name = self._unique_name(f"{base_name}__{clean_sheet}")
                self.dataframes[name] = df
                added.append(name)
        return added

    def _unique_name(self, base: str) -> str:
        if base not in self.dataframes:
            return base
        i = 2
        while f"{base}_{i}" in self.dataframes:
            i += 1
        return f"{base}_{i}"

    def remove_dataframe(self, name: str):
        self.dataframes.pop(name, None)

    # ---------- Step 2: Schema summary for the prompt ----------
    def schema_summary(self) -> str:
        parts = []
        for name, df in self.dataframes.items():
            dtypes = "\n".join(f"    {col}: {dtype}" for col, dtype in df.dtypes.items())
            sample = df.head(SAMPLE_ROWS).to_string(index=False)
            parts.append(
                f"Dataframe variable name: {name}\n"
                f"  shape: {df.shape[0]} rows x {df.shape[1]} columns\n"
                f"  columns and dtypes:\n{dtypes}\n"
                f"  sample rows:\n{sample}\n"
            )
        return "\n".join(parts)

    # ---------- Step 3: Prompt construction ----------
    def _build_prompt(self, question: str, error_context: str | None = None) -> str:
        base = f"""You are a Python data analyst. You are given one or more pandas \
DataFrames already loaded into variables (see schema below). Write Python code to \
answer the user's question.

Available DataFrame variables and their schema:
{self.schema_summary()}

Available libraries in scope: pandas as pd, numpy as np, plotly.express as px, \
plotly.graph_objects as go. Do not import anything else. Do not read or write any \
files. Do not access the network.

Rules:
- If the question calls for a visual (comparison, trend, distribution, breakdown, \
percentage split across categories, etc.), build a Plotly figure and assign it to \
a variable named `fig`. Use px (plotly.express) unless go is genuinely needed.
- If the question asks for a specific value, list, or short table instead \
(e.g. "what is the average X", "list the top 5 Y"), compute it and assign it to a \
variable named `result` (a plain string, number, or small DataFrame - not a figure).
- Only ever set ONE of `fig` or `result`, never both.
- If dataframes need to be joined, do it yourself with pd.merge() using columns \
that appear in both schemas.
- Handle missing/NaN values sensibly (e.g. dropna or fillna where it affects the \
computation) rather than letting them silently skew a result.
- Write ONLY the Python code, no explanation, no markdown code fences, no comments \
about what you're about to do - just the code itself.

Question: {question}
"""
        if error_context:
            base += f"""
Your previous code raised this error when executed:
{error_context}

Fix the code and write the corrected version, following all the same rules above.
"""
        return base

    @staticmethod
    def _strip_code_fences(text: str) -> str:
        text = text.strip()
        text = re.sub(r"^```(?:python)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
        return text.strip()

    # ---------- Step 4: Sandboxed execution ----------
    def _safe_exec(self, code: str) -> dict:
        """
        Executes generated code with a restricted builtins set and only the
        loaded dataframes + approved libraries in scope. Returns whatever ends
        up in `fig` or `result` after execution, or raises on error/failure.
        """
        safe_builtins = {
            "len": len, "range": range, "min": min, "max": max, "sum": sum,
            "sorted": sorted, "list": list, "dict": dict, "set": set, "tuple": tuple,
            "str": str, "int": int, "float": float, "bool": bool, "round": round,
            "enumerate": enumerate, "zip": zip, "abs": abs, "print": print,
            "isinstance": isinstance, "type": type, "map": map, "filter": filter,
        }

        exec_globals = {
            "__builtins__": safe_builtins,
            "pd": pd, "np": np, "px": px, "go": go,
        }
        exec_globals.update(self.dataframes)  # each dataframe as its own named variable

        stdout_capture = io.StringIO()
        with contextlib.redirect_stdout(stdout_capture):
            exec(code, exec_globals)  # noqa: S102 - deliberately sandboxed, see safe_builtins above

        if "fig" in exec_globals and exec_globals["fig"] is not None:
            return {"type": "chart", "fig": exec_globals["fig"]}
        if "result" in exec_globals and exec_globals["result"] is not None:
            return {"type": "text", "result": exec_globals["result"]}

        printed = stdout_capture.getvalue().strip()
        if printed:
            return {"type": "text", "result": printed}

        raise CodeExecutionError(
            "Code ran without error but didn't set `fig` or `result`, and printed nothing."
        )

    # ---------- Step 5: End-to-end with retry ----------
    def answer(self, question: str, groq_api_key: str, model: str = "llama-3.3-70b-versatile") -> dict:
        """
        Returns:
          {"type": "chart", "fig": <plotly Figure>, "code": "..."} or
          {"type": "text", "result": ..., "code": "..."} or
          {"type": "error", "error": "...", "code": "..."}
        """
        if not self.dataframes:
            return {"type": "error", "error": "No data loaded yet.", "code": ""}

        client = Groq(api_key=groq_api_key)
        error_context = None
        last_code = ""

        for attempt in range(MAX_RETRIES + 1):
            prompt = self._build_prompt(question, error_context)
            try:
                response = client.chat.completions.create(
                    model=model,
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0,
                )
                code = self._strip_code_fences(response.choices[0].message.content)
                last_code = code
            except Exception as e:
                return {"type": "error", "error": f"Groq API error: {e}", "code": last_code}

            try:
                result = self._safe_exec(code)
                result["code"] = code
                return result
            except Exception:
                error_context = traceback.format_exc(limit=2)
                if attempt == MAX_RETRIES:
                    return {
                        "type": "error",
                        "error": f"Code failed after {MAX_RETRIES + 1} attempts:\n{error_context}",
                        "code": last_code,
                    }
                continue

    @staticmethod
    def is_visual_query(question: str) -> bool:
        """Lightweight heuristic used only for UI hints (e.g. showing a chart-type
        icon while thinking) - the actual chart-vs-text decision is made by the
        LLM itself via the fig/result convention above, this is not load-bearing."""
        signals = ["chart", "graph", "plot", "trend", "compare", "breakdown",
                   "distribution", "visuali", "%", "percent", "over time"]
        q = question.lower()
        return any(s in q for s in signals)
