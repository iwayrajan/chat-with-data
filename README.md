# Chat with Data (Excel/CSV) — natural language charts & answers

Upload one or more spreadsheets — including multi-sheet Excel workbooks — and ask
questions in plain English. The system writes and runs actual pandas/Plotly code
against your specific data to answer, rather than searching a pre-built index, so
it can handle genuinely open-ended questions: "what % of contribution is male vs
female this month," "plot revenue by region over time," "what's the average order
value for repeat customers," and so on.

## How it works (and how it differs from the other two products)

`pdf-rag-chat` and `chat-with-youtube` are both **retrieval** systems: they search
for the passage/transcript segment that best answers a question. That doesn't work
for data analysis questions, because there's no pre-written passage that says "34%
of contribution is from women this month" — that number has to be *computed* from
the raw rows, and the computation depends entirely on the specific question asked.

So this product uses a different pattern — **text-to-code**:

1. **Load** — every sheet of every uploaded file becomes its own named pandas
   DataFrame (e.g. `sales__Q1`, `sales__Q2`, `employees__Roster`).
2. **Schema summary** — for each DataFrame, the columns, their types, and a few
   sample rows are collected into a compact text summary (not the whole dataset —
   just enough for the model to write correct code).
3. **Code generation** — Groq is given the schema summary and the user's question,
   and writes Python code using pandas and Plotly. It's instructed to assign a
   Plotly figure to `fig` for visual questions, or a value to `result` for direct
   answers.
4. **Sandboxed execution** — the generated code runs with a restricted `exec()`:
   no file access, no network, no imports beyond pandas/numpy/plotly, only the
   loaded dataframes in scope.
5. **Retry on error** — if the code fails (wrong column name, type mismatch), the
   error is fed back to Groq for up to 2 corrected attempts before giving up.
6. **Multi-sheet joins** — the model sees all loaded DataFrames' schemas at once
   and writes its own `pd.merge()` when a question needs data from more than one
   sheet/file (it can see, for example, that `employee_id` appears in both).

## Setup

```bash
python3 -m venv venv
source venv/bin/activate        # on Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## Get a free Groq API key

1. Go to https://console.groq.com/keys
2. Sign up with email or Google (no credit card required)
3. Create an API key and copy it

Paste it into the app's sidebar, or set it as `GROQ_API_KEY` so it's pre-filled.

## Run it

```bash
streamlit run app.py
```

1. Paste your Groq API key in the sidebar
2. Upload one or more CSV/Excel files
3. Ask a question — try a chart request ("show me revenue by month as a bar
   chart") and a direct question ("what's the average order value?") to see both
   response types
4. Expand "Show generated code" under any answer to see exactly what ran — useful
   both for spotting a wrong assumption and for viva prep

## Security note

The sandboxed `exec()` restricts builtins to a safe subset (no `open`, no
`__import__`, no `os`/`sys`/`subprocess` access) and only exposes pandas, numpy,
plotly, and the loaded dataframes. This is meant to contain accidental mistakes in
LLM-generated code (e.g. an attempted file write), not to be a hardened security
boundary against a deliberately adversarial prompt — don't expose this app
publicly with untrusted users typing arbitrary questions without additional
sandboxing (e.g. running the whole app in a container with no filesystem/network
access at the OS level) if that's ever a concern for your deployment.

## Known limitations

- Very large spreadsheets (100k+ rows) may make the schema summary's sample rows
  unrepresentative of the full data's edge cases — the model only sees a preview,
  not the whole sheet.
- Ambiguous questions (e.g. "show me the important columns") may need a follow-up
  clarification from the user; the system doesn't ask clarifying questions itself.
- Chart type selection is entirely up to the model's judgment — it usually picks
  sensibly (bar for comparisons, line for trends, pie for part-to-whole) but isn't
  guaranteed to match what a specific user has in mind.

## Files

- `app.py` — Streamlit UI (upload, chat, chart/text rendering, code inspection)
- `data_chat.py` — core pipeline: loading, schema summarization, prompt
  construction, sandboxed execution, retry logic
- `requirements.txt` — dependencies
