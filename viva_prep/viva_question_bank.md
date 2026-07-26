# Viva Question Bank — Chat With Data (Text-to-Code Analytics)

## How to use this

Read through once for understanding, then use the **cheat sheet** at the end for
last-minute review. Practice the **2-minute pitch** out loud at least twice.

---

## Section 1: Conceptual

**Q: What problem does this project solve?**
A: It lets someone ask an analytical question about a spreadsheet in plain
English — like "what % of contribution is male vs female this month" — and get
a correct chart or number back, without needing to know how to build a pivot
table or write the underlying formula themselves.

**Q: Is this a RAG (Retrieval-Augmented Generation) system?**
A: No, and that's an important distinction. RAG retrieves a passage that already
answers a question. There's no pre-written passage that says "34% of
contribution is from women this month" — that number has to be computed from
raw rows, and the computation is different for every possible question. This
project instead uses text-to-code: the model writes and runs code tailored to
the specific question, rather than searching for a pre-existing answer.

**Q: What is text-to-code / text-to-pandas?**
A: A pattern where a large language model translates a natural-language
instruction directly into executable code — in this case Python code using
pandas for data manipulation and Plotly for charting — rather than into another
natural-language response. The code is then actually run, and its output (a
chart or a value) is what's shown to the user.

**Q: Why not just use a fixed set of pre-built chart templates instead of
generating code?**
A: A fixed template set can only answer the specific questions it was built for.
The moment a user asks something the template designer didn't anticipate — a
specific groupby, a specific filter, a specific combination of two tables —
a template-based system either fails or gives a wrong-shaped answer. Generating
code fresh for every question is what makes "ask literally anything" actually
work, at the cost of needing safeguards (sandboxing, retry) that a fixed
template wouldn't need.

**Q: What is a sandbox, in the context of this project?**
A: A restricted code execution environment that limits what the executed code
is allowed to do. Here, the sandbox exposes only pandas, numpy, and Plotly, and
a minimal set of safe built-in functions, while removing access to file I/O,
network calls, and the ability to import other modules — so even if the
generated code is buggy or does something unexpected, it can't do anything
outside the scope of data analysis.

---

## Section 2: Architecture & design

**Q: Walk me through what happens when I upload a spreadsheet.**
A: Each CSV file becomes one pandas dataframe. Each Excel file is read with all
of its sheets, and every sheet becomes its own separately named dataframe. Each
dataframe gets a schema summary prepared: its variable name, shape, column
names and types, and a handful of sample rows. That's the loading phase, and it
only happens once per file.

**Q: Walk me through what happens when I ask a question.**
A: The schema summaries of every currently loaded dataframe, plus the question
itself, go into a prompt sent to the Groq API. The model returns Python code.
That code runs inside the restricted sandbox. If it runs successfully and set a
variable called `fig`, a chart is shown; if it set a variable called `result`
instead, that value is shown as text or a table. If the code raised an error,
the error message is fed back into a new prompt asking for corrected code, and
this repeats up to two more times before giving up.

**Q: How does the system decide whether to make a chart or give a text
answer?**
A: There's no separate classification step — the decision is made implicitly by
the code itself. The prompt instructs the model: if the question calls for a
visual, assign a Plotly figure to `fig`; otherwise assign the computed value to
`result`. The interface just checks which of those two variables exists after
execution and renders accordingly.

**Q: How are multi-sheet workbooks and multiple uploaded files handled the
same way?**
A: Every sheet, regardless of which file or workbook it came from, becomes its
own independently named dataframe with its own schema summary. From that point
on, the pipeline doesn't distinguish between "sheet 2 of one workbook" and "a
separate CSV file" — they're just two more named tables the model can see and,
if needed, join together.

**Q: Why let the model write its own joins instead of pre-computing them?**
A: Pre-computing joins would require knowing in advance which tables relate to
each other and how — information that isn't available until you know the
question being asked. By giving the model every table's schema at once, it can
notice, for example, that `employee_id` appears in two different tables and
write the appropriate `pd.merge()` itself, for whatever combination a specific
question actually requires.

---

## Section 3: Technical deep-dive

**Q: What exactly does the sandbox restrict, mechanically?**
A: The code executes via Python's `exec()`, but with a custom `__builtins__`
dictionary containing only a small safe subset (things like `len`, `range`,
`str`, `round` — not `open`, `__import__`, `eval`, or `exec` itself), and a
global namespace containing only pandas, numpy, Plotly's modules, and the
loaded dataframes. Anything not explicitly provided simply isn't available to
the generated code, so referencing it raises a `NameError` rather than
succeeding.

**Q: What's the retry loop for, and how many attempts does it get?**
A: Generated code sometimes fails — most commonly by referencing a column name
that doesn't exactly match the schema. Rather than surfacing that failure
immediately, the error message (including the exception type and text) is
included in a follow-up prompt asking the model to correct its own code. This
is allowed up to two additional attempts (three total) before the system gives
up and reports the failure with the last error shown.

**Q: What happens if the model's code runs successfully but doesn't set `fig`
or `result`?**
A: The system checks for anything printed to standard output as a fallback, and
if there's genuinely nothing — no `fig`, no `result`, no printed output — it
raises its own error explaining that the code ran without producing an
answer, which then also feeds into the retry loop like any other failure.

**Q: How would a chart-generating question and a direct-answer question differ
in the actual generated code?**
A: For "plot revenue by month," the code would end with something like `fig =
px.line(df, x="month", y="revenue")`. For "what's the average order value,"
it would end with something like `result = round(df["order_value"].mean(), 2)`
— no figure at all, just a computed number assigned to a plain variable.

**Q: What are the limitations of this system?**
A: It doesn't persist loaded data or chat history between sessions; very large
files may not be well-represented by the schema's small sample of rows; the
model's chart-type choice (bar vs. pie vs. line) isn't guaranteed to match what
a specific user actually wants; and there's no formal accuracy benchmark, only
manual test cases.

---

## Section 4: Testing & evaluation

**Q: How did you test this system?**
A: Manually, against a set of representative scenarios: loading a multi-sheet
workbook and a separate CSV together, asking a chart-generating question,
asking a direct-answer question, asking a question requiring a join across two
tables, deliberately triggering the retry-on-error path, deliberately
exhausting all retries, and confirming the sandbox blocks file and import
access. All test cases produced the expected behavior.

**Q: How did you verify the generated chart was actually correct, not just
that it rendered without error?**
A: By hand-computing the expected answer against the same test data and
comparing it to what the generated code produced — for example, manually
summing contribution amounts by gender for a known month and confirming the
percentage in the resulting chart matched.

**Q: What would you do to formally evaluate this system's accuracy?**
A: Build a benchmark of question-answer pairs with known-correct results across
a variety of schemas, then measure what fraction of questions produce a
correct result on the first attempt, and separately what fraction succeed
after retries — this would also make it possible to compare different
underlying models or prompt designs objectively rather than by spot-checking.

---

## Section 5: Tricky / comparative questions examiners like to ask

**Q: Why not just have the LLM answer the question directly, in natural
language, using the data as context, instead of writing code?**
A: For genuinely small datasets this can sometimes work, but it doesn't scale:
language models are not reliable at doing exact arithmetic over many rows
purely by reading them as text, and there's no way to verify a natural-language
numeric claim the way you can verify a line of pandas code. Generating actual
code that gets executed guarantees the arithmetic is done by pandas, not
"eyeballed" by the model.

**Q: Isn't letting an LLM write and run code on your machine dangerous?**
A: It would be, without the sandbox. That's precisely why the execution
environment restricts built-in functions and available libraries to a minimal
set with no file, network, or process access — the risk isn't eliminated by
trusting the model to behave, it's contained by not giving unapproved code
anywhere to reach even if it tried.

**Q: What if the retry loop just keeps making the same mistake?**
A: It's capped at two retries specifically to avoid this — if the same or a
different error persists after three total attempts, the system stops and
reports the failure rather than looping indefinitely or silently returning a
wrong answer.

**Q: How would you extend this to work with a live database instead of
uploaded files?**
A: The loading phase would need to change to query the database and pull
schema and sample rows (e.g. via a `LIMIT`-style query) rather than reading an
uploaded file, but the rest of the pipeline — code generation, sandboxed
execution, chart/text routing, retries — would only need the schema summary,
not to know the loading method used.

---

## Cheat sheet — one-pager

| Component | Tool used | One-line justification |
|---|---|---|
| Loading | pandas + openpyxl | Every sheet/file becomes its own named dataframe |
| Schema summary | Custom (columns, dtypes, sample rows) | Enough for correct code, without sending the whole dataset |
| Code generation | Groq API (Llama models) | Free tier, fast, generates pandas/Plotly code |
| Chart vs. text decision | fig/result variable convention | No extra classification step needed |
| Execution | Restricted Python exec() | No file/network/import access beyond approved libraries |
| Error recovery | Retry with error context (up to 2x) | Fixes the majority of real generation mistakes |
| Multi-table joins | Model-written pd.merge() | Model sees all schemas at once, joins on shared columns |
| Interface | Streamlit | Chat UI, chart rendering, and code inspection |

---

## 2-minute pitch script

> "My project lets you upload a spreadsheet — even a multi-sheet Excel workbook
> — and ask questions about it in plain English, and get back either a chart or
> a direct answer, whatever the question calls for.
>
> Under the hood, this isn't a search system — there's nothing to search for,
> because the answer to something like 'what percent of contribution is male
> versus female' has to be computed fresh from the raw data every time. So
> instead, I give a language model a summary of the data's schema — column
> names, types, a few sample rows — and it writes actual Python code, using
> pandas and Plotly, to answer the specific question.
>
> That code doesn't just run freely, though — it runs inside a restricted
> sandbox that only allows pandas, numpy, and Plotly, with no file access, no
> network access, and no ability to import anything else. So even though the
> code is written by a model, it can't do anything outside the scope of
> analyzing the data.
>
> The model decides for itself whether the question needs a chart or a direct
> answer — I just told it, in the prompt, to assign a chart to one variable
> name and a computed value to another, and the interface renders whichever one
> shows up.
>
> If the code fails — say it guesses a column name slightly wrong — the error
> message gets sent right back to the model, and it gets up to two more tries
> to fix its own mistake before I give up and show the user what went wrong.
>
> And when a question needs data from more than one uploaded sheet, the model
> sees every table's schema at once and writes its own join — I don't have to
> pre-configure how the tables relate to each other.
>
> The whole thing runs on a normal laptop with a free API key — no GPU, no
> paid subscription — which was a deliberate goal, same as the rest of my
> product line."

---

## Tips for the actual viva

- Expect at least one question specifically probing whether you understand
  *why* the sandbox is necessary, not just that it exists — this is the one
  part of this project examiners will most want to see you actually understand
  rather than copied.
- If asked "what if the model writes malicious code," your answer should be
  about containment (the sandbox), not about trusting the model to behave.
- Have the exact fig/result convention ready to explain in one sentence — it's
  the cleanest, most quotable design decision in this project.
- Expect a "why not just use Power BI / Excel pivot tables" question — your
  answer is: those require the user to already know how to build the analysis;
  this accepts the question in plain English instead.
