"""
Chat with Data - natural language queries over Excel/CSV files, answered with
either a generated chart or a direct text answer.

Run with: streamlit run app.py
"""

import os
import tempfile

import streamlit as st
import pandas as pd

from data_chat import DataChat

st.set_page_config(page_title="Chat with Data", page_icon="\U0001F4CA", layout="wide")

# ---------------- Sidebar ----------------
with st.sidebar:
    st.header("Settings")

    default_key = os.environ.get("GROQ_API_KEY", "")
    groq_key = st.text_input(
        "Groq API key",
        value=default_key,
        type="password",
        help="Free key from https://console.groq.com/keys",
    )

    model_name = st.selectbox(
        "Groq model",
        ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"],
        help="70B writes more reliable pandas code; 8B is faster but makes more mistakes on complex joins.",
    )

    st.markdown("---")
    st.caption(
        "Pipeline: upload CSV/Excel \u2192 schema summary (columns, dtypes, sample rows) \u2192 "
        "Groq writes pandas/plotly code for your question \u2192 code runs in a restricted "
        "sandbox \u2192 chart or text answer, with up to 2 automatic retries on error."
    )

# ---------------- Session state ----------------
if "chat_history" not in st.session_state:
    st.session_state.chat_history = []
if "loaded_files" not in st.session_state:
    st.session_state.loaded_files = []  # display names, for the UI list


@st.cache_resource(show_spinner=False)
def get_engine():
    return DataChat()


engine = get_engine()

# ---------------- Main: file upload ----------------
st.title("\U0001F4CA Chat with Data")
st.caption("Upload one or more spreadsheets (CSV or multi-sheet Excel), then ask questions in plain English.")

uploaded = st.file_uploader(
    "Upload CSV or Excel files", type=["csv", "xlsx", "xls"], accept_multiple_files=True
)

if uploaded:
    for f in uploaded:
        if f.name in st.session_state.loaded_files:
            continue
        with tempfile.NamedTemporaryFile(delete=False, suffix="_" + f.name) as tmp:
            tmp.write(f.getvalue())
            tmp_path = tmp.name
        try:
            added = engine.load_file(tmp_path, display_name=f.name)
            st.session_state.loaded_files.append(f.name)
            st.success(f"Loaded **{f.name}** \u2192 {len(added)} table(s): {', '.join(added)}")
        except Exception as e:
            st.error(f"Couldn't load {f.name}: {e}")

# ---------------- Loaded tables panel ----------------
if engine.dataframes:
    with st.expander(f"\U0001F4C2 Loaded tables ({len(engine.dataframes)})", expanded=False):
        for name, df in list(engine.dataframes.items()):
            col1, col2 = st.columns([5, 1])
            col1.write(f"**{name}** \u2014 {df.shape[0]} rows \u00d7 {df.shape[1]} columns")
            if col2.button("Remove", key=f"remove_{name}"):
                engine.remove_dataframe(name)
                st.rerun()
            col1.dataframe(df.head(3), use_container_width=True)

# ---------------- Chat ----------------
if engine.dataframes:
    for msg in st.session_state.chat_history:
        with st.chat_message(msg["role"]):
            if msg.get("fig") is not None:
                st.plotly_chart(msg["fig"], use_container_width=True)
            elif msg.get("result") is not None:
                if isinstance(msg["result"], pd.DataFrame):
                    st.dataframe(msg["result"], use_container_width=True)
                else:
                    st.markdown(str(msg["result"]))
            else:
                st.markdown(msg["content"])
            if msg.get("code"):
                with st.expander("Show generated code"):
                    st.code(msg["code"], language="python")

    question = st.chat_input("Ask a question about your data...")

    if question:
        if not groq_key:
            st.error("Add your Groq API key in the sidebar first.")
        else:
            st.session_state.chat_history.append({"role": "user", "content": question})
            with st.chat_message("user"):
                st.markdown(question)

            with st.chat_message("assistant"):
                with st.spinner("Writing and running code against your data..."):
                    outcome = engine.answer(question, groq_api_key=groq_key, model=model_name)

                if outcome["type"] == "chart":
                    st.plotly_chart(outcome["fig"], use_container_width=True)
                    entry = {"role": "assistant", "fig": outcome["fig"], "code": outcome["code"]}
                elif outcome["type"] == "text":
                    if isinstance(outcome["result"], pd.DataFrame):
                        st.dataframe(outcome["result"], use_container_width=True)
                    else:
                        st.markdown(str(outcome["result"]))
                    entry = {"role": "assistant", "result": outcome["result"], "code": outcome["code"]}
                else:
                    st.error(outcome["error"])
                    entry = {"role": "assistant", "content": f"Error: {outcome['error']}", "code": outcome.get("code", "")}

                if outcome.get("code"):
                    with st.expander("Show generated code"):
                        st.code(outcome["code"], language="python")

            st.session_state.chat_history.append(entry)
else:
    st.info("Upload a CSV or Excel file above to get started.")
