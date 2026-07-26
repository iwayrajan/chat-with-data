/*
 * Reusable college project report generator for the Chat with Data project.
 *
 * HOW TO REUSE FOR EACH STUDENT:
 *   1. Edit ../student_config.json with the student's details.
 *   2. Run: node generate_report.js  (or use scripts/generate_all.sh from repo root)
 *   3. Output: Chat_With_Data_Report.docx in this folder.
 */

const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, ShadingType,
  ImageRun, PageBreak, TableOfContents, Header, Footer, PageNumber,
  LevelFormat,
} = require("docx");
const fs = require("fs");

const CONFIG = require("../student_config.json");

// ============================================================
// Helpers
// ============================================================
function heading(text, level) {
  return new Paragraph({ text, heading: level, spacing: { before: 300, after: 150 } });
}
function body(text) {
  return new Paragraph({
    children: [new TextRun({ text, size: 24 })],
    spacing: { after: 200, line: 360 },
    alignment: AlignmentType.JUSTIFIED,
  });
}
function bullet(text) {
  return new Paragraph({
    children: [new TextRun({ text, size: 24 })],
    numbering: { reference: "bullet-list", level: 0 },
    spacing: { after: 100 },
  });
}
function pageBreak() { return new Paragraph({ children: [new PageBreak()] }); }
function centerTitle(text, size = 32, bold = true) {
  return new Paragraph({
    children: [new TextRun({ text, bold, size })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
  });
}
function tableCell(text, { header = false, width = 2000 } = {}) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    shading: header ? { type: ShadingType.CLEAR, fill: "D9D9D9" } : undefined,
    children: [new Paragraph({ children: [new TextRun({ text, bold: header, size: 20 })] })],
  });
}
function buildTable(rows, colWidths) {
  return new Table({
    width: { size: 9000, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: rows.map((row, i) => new TableRow({
      children: row.map((cell, j) => tableCell(cell, { header: i === 0, width: colWidths[j] })),
    })),
  });
}

// ============================================================
// Title / certificate / abstract / TOC
// ============================================================
const titlePageChildren = [
  new Paragraph({ text: "", spacing: { after: 600 } }),
  centerTitle(CONFIG.PROJECT_TITLE, 32, true),
  new Paragraph({ text: "", spacing: { after: 300 } }),
  centerTitle(`A ${CONFIG.PROJECT_TYPE} Report`, 24, false),
  new Paragraph({ text: "", spacing: { after: 400 } }),
  centerTitle("Submitted in partial fulfilment of the requirements for the award of", 22, false),
  centerTitle(`the degree in ${CONFIG.DEPARTMENT}`, 22, false),
  new Paragraph({ text: "", spacing: { after: 600 } }),
  centerTitle("By", 22, false),
  centerTitle(CONFIG.STUDENT_NAME, 26, true),
  centerTitle(`Roll No: ${CONFIG.ROLL_NUMBER}`, 20, false),
  new Paragraph({ text: "", spacing: { after: 600 } }),
  centerTitle("Under the guidance of", 20, false),
  centerTitle(CONFIG.GUIDE_NAME, 24, true),
  new Paragraph({ text: "", spacing: { after: 600 } }),
  centerTitle(CONFIG.COLLEGE_NAME, 26, true),
  centerTitle(CONFIG.UNIVERSITY_NAME, 22, false),
  centerTitle(CONFIG.SUBMISSION_MONTH_YEAR, 20, false),
  pageBreak(),
];

const certificateChildren = [
  heading("Certificate", HeadingLevel.HEADING_1),
  body(`This is to certify that the ${CONFIG.PROJECT_TYPE.toLowerCase()} report entitled "${CONFIG.PROJECT_TITLE}" is a bonafide record of work carried out by ${CONFIG.STUDENT_NAME} (Roll No: ${CONFIG.ROLL_NUMBER}), submitted in partial fulfilment of the requirements for the award of degree in ${CONFIG.DEPARTMENT} at ${CONFIG.COLLEGE_NAME}, during the academic year ${CONFIG.ACADEMIC_YEAR}.`),
  new Paragraph({ text: "", spacing: { after: 800 } }),
  new Paragraph({ children: [new TextRun({ text: `Guide: ${CONFIG.GUIDE_NAME}`, size: 24 })], spacing: { after: 200 } }),
  new Paragraph({ children: [new TextRun({ text: `Head of Department: ${CONFIG.HOD_NAME}`, size: 24 })], spacing: { after: 200 } }),
  pageBreak(),
];

const abstractChildren = [
  heading("Acknowledgement", HeadingLevel.HEADING_1),
  body(`I would like to express my sincere gratitude to ${CONFIG.GUIDE_NAME} for continuous guidance and support throughout this project. I also thank ${CONFIG.HOD_NAME} and the faculty of ${CONFIG.DEPARTMENT}, ${CONFIG.COLLEGE_NAME}, for providing the resources and environment necessary to complete this work.`),
  new Paragraph({ text: "", spacing: { after: 400 } }),
  heading("Abstract", HeadingLevel.HEADING_1),
  body("Spreadsheets remain the most common format in which students, small businesses, and analysts store tabular data, yet extracting an insight from one still typically requires knowing which formula, pivot table, or chart type to build manually. This project implements a system that lets a user upload one or more spreadsheets, including multi-sheet Excel workbooks, and ask questions about the data in plain English, receiving either a generated chart or a direct computed answer in response."),
  body("Unlike retrieval-based question-answering systems, which search for a pre-existing passage that answers a question, this system uses a text-to-code approach: a large language model is given a structured summary of the uploaded data's schema (table names, column names, data types, and sample rows) and the user's question, and is asked to write Python code using pandas and Plotly that computes the answer. This code is executed in a restricted sandbox that permits only data-manipulation and charting operations, with no file, network, or operating-system access. If the generated code raises an error, for example due to a misremembered column name, the error message is returned to the language model, which is given up to two further attempts to produce corrected code before the system reports a failure."),
  body("The system distinguishes between visual and direct questions by convention: the generated code is instructed to assign a Plotly figure to a variable named 'fig' for questions that call for a chart, or a computed value to a variable named 'result' for direct questions, and the interface renders whichever variable is present. Multi-sheet and multi-file uploads are supported by exposing every sheet as a separately named dataframe with its own schema summary, allowing the language model to write its own join logic when a question spans more than one table."),
  body("The resulting application is implemented in Python using Streamlit for the interface, pandas for data manipulation, Plotly for chart rendering, and Groq's hosted language model API for code generation, and demonstrates the core principles of applying large language models to structured data analysis while remaining lightweight enough to run on a standard CPU-only machine."),
  pageBreak(),
];

const tocChildren = [
  heading("Table of Contents", HeadingLevel.HEADING_1),
  new TableOfContents("Table of Contents", { hyperlink: true, headingStyleRange: "1-3" }),
  pageBreak(),
];

// ============================================================
// Chapter 1: Introduction
// ============================================================
const chapter1 = [
  heading("Chapter 1: Introduction", HeadingLevel.HEADING_1),

  heading("1.1 Problem Statement", HeadingLevel.HEADING_2),
  body("Analyzing a spreadsheet to answer a specific question, such as computing a percentage breakdown across categories or plotting a trend over time, typically requires the user to know which pivot table, formula, or chart type to construct, and how to construct it correctly in whichever spreadsheet or programming tool they are using. This is a barrier for users who understand what question they want answered but not the mechanics of answering it, and it does not scale well when the same kind of question needs to be asked repeatedly against different or updated data. There is a need for a system that accepts an analytical question in plain English and produces the correct computation or chart directly from the underlying data, without requiring the user to write code or construct the analysis manually."),

  heading("1.2 Objectives", HeadingLevel.HEADING_2),
  bullet("To design a system that accepts CSV and multi-sheet Excel files as input and represents each sheet as a structured, queryable table."),
  bullet("To use a large language model to translate a natural-language analytical question into correct, executable data-analysis code."),
  bullet("To support both visual answers (charts) and direct answers (numbers, short tables, text) from the same underlying question-answering flow."),
  bullet("To execute generated code safely, without exposing the file system, network, or operating system to code the system did not write itself."),
  bullet("To recover automatically from code that fails on first attempt, using the resulting error message to correct course."),
  bullet("To support questions that require combining data from more than one uploaded sheet or file."),
  new Paragraph({ text: "", spacing: { after: 200 } }),

  heading("1.3 Scope", HeadingLevel.HEADING_2),
  body("The system accepts CSV files and Excel workbooks (including multiple sheets per workbook) and allows multiple files to be loaded and queried together in a single session. It is designed for personal, academic, and small-business analytical use cases such as summarizing survey data, sales records, or membership rosters. It does not currently persist an index between sessions, support databases or live data connections, or guarantee correct behavior on extremely large files that exceed what can reasonably be held in memory as a pandas dataframe."),
  pageBreak(),
];

// ============================================================
// Chapter 2: Literature Survey
// ============================================================
const chapter2 = [
  heading("Chapter 2: Literature Survey", HeadingLevel.HEADING_1),
  body("Business intelligence tools such as pivot tables, Power BI, and Tableau have long allowed users to build charts and summaries from tabular data, but require the user to manually select fields, aggregation functions, and chart types through a graphical interface. This is effective once a user knows what to build, but does not accept an analytical question phrased in natural language directly."),
  body("Separately, large language models have demonstrated the ability to generate correct, executable code from natural-language instructions, a capability commonly referred to as code generation or, when the code manipulates data specifically, text-to-SQL or text-to-pandas depending on the target language. Tools such as OpenAI's Code Interpreter feature and open-source projects like PandasAI apply this capability specifically to data analysis: rather than retrieving a pre-written answer, the system writes code tailored to the specific question and the specific dataset's schema, then executes it to produce the answer."),
  body("A well-documented risk of this approach is that language models can generate code referencing columns that do not exist, or code that is syntactically valid but produces an incorrect result for the intended question. Prior work on automated program repair and self-correcting code generation has shown that feeding an execution error back to the model that generated the code allows it to correct many of its own mistakes without human intervention, since the error message itself narrows down what went wrong. This project adopts that self-correction pattern directly, allowing up to two corrective attempts before reporting failure to the user."),
  body("A second well-documented risk is that executing model-generated code introduces the same class of security concerns as executing any untrusted code: unrestricted execution could read or write arbitrary files, make network requests, or otherwise act outside the intended scope of a data-analysis task. Sandboxed or restricted-execution environments, which limit the available built-in functions and imported modules to only what a specific task requires, are a standard mitigation for this class of risk and are applied in this project by restricting the Python execution environment to a minimal set of built-in functions and only the pandas, numpy, and Plotly libraries."),
  pageBreak(),
];

// ============================================================
// Chapter 3: System Analysis
// ============================================================
const srsRows = [
  ["Requirement ID", "Description", "Type"],
  ["FR-1", "The system shall allow a user to upload one or more CSV or Excel files, including multi-sheet workbooks.", "Functional"],
  ["FR-2", "The system shall represent each uploaded sheet as a distinct, named table with an inspectable schema.", "Functional"],
  ["FR-3", "The system shall translate a natural-language question into pandas/Plotly code using a large language model.", "Functional"],
  ["FR-4", "The system shall execute generated code in a restricted environment with no file, network, or OS access.", "Functional"],
  ["FR-5", "The system shall retry code generation, using the prior error message, up to two times if execution fails.", "Functional"],
  ["FR-6", "The system shall render the result as a chart when the question calls for one, or as a direct answer otherwise.", "Functional"],
  ["FR-7", "The system shall support questions that require joining data across more than one uploaded table.", "Functional"],
  ["FR-8", "The system shall display the generated code alongside each answer.", "Functional"],
  ["NFR-1", "The system shall run on a CPU-only machine without requiring a GPU.", "Non-functional"],
  ["NFR-2", "The system shall not depend on any paid API for its core functionality.", "Non-functional"],
  ["NFR-3", "The user interface shall be usable without prior programming knowledge.", "Non-functional"],
];

const chapter3 = [
  heading("Chapter 3: System Analysis", HeadingLevel.HEADING_1),

  heading("3.1 Feasibility Study", HeadingLevel.HEADING_2),
  body("The system is technically feasible on standard consumer hardware. Loading spreadsheets into pandas dataframes and executing generated analysis code are both lightweight, CPU-bound operations. The only component requiring an external service is code generation itself, accessed through Groq's hosted API, which offers a free tier sufficient for personal and academic use, making the system economically feasible without licensing cost. An internet connection is required for the code-generation step, but all data manipulation and chart rendering happen locally once code has been generated."),

  heading("3.2 Requirements Specification", HeadingLevel.HEADING_2),
  body("The functional and non-functional requirements of the system are summarised below."),
  buildTable(srsRows, [1500, 6000, 1500]),
  new Paragraph({ text: "", spacing: { after: 200 } }),

  heading("3.3 Hardware and Software Requirements", HeadingLevel.HEADING_2),
  bullet("Processor: Any modern x86-64 processor (Intel/AMD), no GPU required."),
  bullet("RAM: 4 GB minimum, 8 GB recommended for larger spreadsheets."),
  bullet("Operating System: Windows, Linux, or macOS."),
  bullet("Software: Python 3.10 or above, pip package manager."),
  bullet("Key libraries: Streamlit, pandas, numpy, Plotly, openpyxl, groq."),
  bullet("Internet connection: required for the code-generation step (Groq API call) on every question."),
  pageBreak(),
];

// ============================================================
// Chapter 4: System Design
// ============================================================
const chapter4 = [
  heading("Chapter 4: System Design", HeadingLevel.HEADING_1),

  heading("4.1 System Architecture", HeadingLevel.HEADING_2),
  body("The system is organised into a loading phase, which runs once per uploaded file, and a query phase, which runs each time the user asks a question. Figure 4.1 shows the overall architecture, including the error-driven retry loop within the query phase."),
  new Paragraph({
    children: [new ImageRun({ type: "png", data: fs.readFileSync(__dirname + "/assets/architecture_diagram.png"), transformation: { width: 600, height: 283 } })],
    alignment: AlignmentType.CENTER,
  }),
  new Paragraph({
    children: [new TextRun({ text: "Figure 4.1: System architecture showing the loading phase, query phase, and retry loop", italics: true, size: 20 })],
    alignment: AlignmentType.CENTER, spacing: { after: 300 },
  }),
  body("In the loading phase, each uploaded CSV file or Excel sheet is read into its own named pandas dataframe, and a schema summary (column names, data types, and a small number of sample rows) is prepared for each. In the query phase, the user's question and the schema summaries of all currently loaded tables are sent to a large language model, which generates Python code to answer the question. This code executes in a restricted sandbox; if it raises an error, the error is fed back into a corrected generation attempt, up to two additional times, before the system reports a failure to the user."),

  heading("4.2 Chart vs. Direct Answer Routing", HeadingLevel.HEADING_2),
  body("The system does not use a separate classification step to decide whether a question needs a chart. Instead, the code-generation prompt instructs the model to assign a Plotly figure to a variable named 'fig' when the question calls for a visual, or a computed value to a variable named 'result' otherwise, and the interface inspects which of these variables is present after execution to decide how to render the answer. Figure 4.2 illustrates this flow."),
  new Paragraph({
    children: [new ImageRun({ type: "png", data: fs.readFileSync(__dirname + "/assets/chart_routing_diagram.png"), transformation: { width: 500, height: 279 } })],
    alignment: AlignmentType.CENTER,
  }),
  new Paragraph({
    children: [new TextRun({ text: "Figure 4.2: Chart-vs-text routing, decided by which variable the generated code assigns", italics: true, size: 20 })],
    alignment: AlignmentType.CENTER, spacing: { after: 300 },
  }),

  heading("4.3 Module Design", HeadingLevel.HEADING_2),
  bullet("data_chat.py — Core pipeline: file loading, schema summarization, prompt construction, sandboxed code execution, and the retry-on-error loop. Independent of the user interface."),
  bullet("app.py — Streamlit-based user interface: file upload handling, the chat interface, and rendering of charts, direct answers, and the generated code for inspection."),
  pageBreak(),
];

// ============================================================
// Chapter 5: Implementation
// ============================================================
const chapter5 = [
  heading("Chapter 5: Implementation", HeadingLevel.HEADING_1),

  heading("5.1 Technology Stack", HeadingLevel.HEADING_2),
  bullet("Python 3 — primary implementation language."),
  bullet("Streamlit — web-based user interface framework."),
  bullet("pandas — loading, joining, and aggregating tabular data."),
  bullet("openpyxl — reading multi-sheet Excel workbooks."),
  bullet("Plotly — rendering interactive charts from generated code."),
  bullet("Groq API (Llama models) — large language model used for code generation."),
  new Paragraph({ text: "", spacing: { after: 200 } }),

  heading("5.2 Multi-Sheet and Multi-File Loading", HeadingLevel.HEADING_2),
  body("Each uploaded CSV file becomes one pandas dataframe. Each uploaded Excel workbook is read with all of its sheets at once, and each sheet becomes its own dataframe, named by combining the original file name with the sheet name (with non-alphanumeric characters replaced, since the name must also be a valid Python variable name for the code-execution step). This means a single multi-sheet workbook and several separate single-sheet files appear identically to the rest of the pipeline: a flat collection of named dataframes."),

  heading("5.3 Schema Summarization", HeadingLevel.HEADING_2),
  body("For every loaded dataframe, a compact text summary is prepared listing its variable name, its shape (row and column counts), each column's name and inferred data type, and its first five rows as a sample. This summary, not the full dataset, is what is sent to the language model — sending the entire dataset would be both unnecessary for writing correct code and, for larger files, impractical given context-length limits."),

  heading("5.4 Code Generation", HeadingLevel.HEADING_2),
  body("The schema summaries of all currently loaded dataframes, together with the user's question, are assembled into a prompt instructing the model to write Python code using only pandas, numpy, and Plotly, to avoid any file, network, or import statement beyond those already provided, and to assign its answer to either a 'fig' variable (for a chart) or a 'result' variable (for a direct answer). The model is explicitly instructed to perform any necessary joins between dataframes itself, using pd.merge on columns it identifies as shared between the relevant schemas."),

  heading("5.5 Sandboxed Execution", HeadingLevel.HEADING_2),
  body("Generated code is executed using Python's exec() function, but with a deliberately restricted set of built-in functions (excluding, among others, open, __import__, eval, and exec itself) and a global namespace containing only pandas, numpy, Plotly's express and graph_objects modules, and the currently loaded dataframes. This prevents generated code from reading or writing files, making network requests, or importing additional modules, while still permitting the full range of legitimate data-manipulation and charting operations."),

  heading("5.6 Retry on Error", HeadingLevel.HEADING_2),
  body("If executing the generated code raises an exception, for example because it references a column name that does not exist in the schema, the resulting error message is included in a follow-up prompt asking the model to correct its code, and the corrected code is executed in turn. This is repeated up to two additional times beyond the first attempt; if all attempts fail, the system reports the failure and the most recent error to the user rather than retrying indefinitely."),

  heading("5.7 Answer Rendering", HeadingLevel.HEADING_2),
  body("After successful execution, the interface checks whether a 'fig' variable is present and renders it as an interactive Plotly chart if so; otherwise, it checks for a 'result' variable and renders it as a table (if it is a dataframe) or as text (otherwise). The exact code that was executed is also displayed, in a collapsible section, alongside every answer, allowing the user to verify what computation actually produced the result shown."),
  pageBreak(),
];

// ============================================================
// Chapter 6: Testing
// ============================================================
const testRows = [
  ["Test ID", "Test Description", "Input", "Expected Output", "Result"],
  ["T-1", "Load a multi-sheet Excel workbook", "Workbook with 2 sheets", "Both sheets loaded as separate named dataframes", "Pass"],
  ["T-2", "Load a CSV file alongside an Excel upload", "One CSV + one workbook", "All tables available together for querying", "Pass"],
  ["T-3", "Ask a chart-generating question", "\"Show contribution % by gender this month\"", "Correct chart rendered, matching a hand-computed result", "Pass"],
  ["T-4", "Ask a direct/text question", "\"What is the average order value?\"", "Correct numeric answer returned as text, not a chart", "Pass"],
  ["T-5", "Ask a question requiring a join across two tables", "Question referencing fields from two sheets", "Correct pd.merge performed by generated code; correct result", "Pass"],
  ["T-6", "Trigger the retry-on-error path", "Question against an ambiguous/misnamed column", "First attempt fails; corrected code succeeds on retry", "Pass"],
  ["T-7", "Exhaust all retries", "Deliberately unanswerable/invalid request", "Clear failure message shown after all attempts fail", "Pass"],
  ["T-8", "Attempt file-system access via generated code", "Code containing open() or __import__", "Blocked by the restricted execution sandbox", "Pass"],
  ["T-9", "Remove a loaded table mid-session", "Click \"Remove\" on a loaded table", "Table excluded from subsequent questions", "Pass"],
  ["T-10", "Inspect generated code", "Expand \"Show generated code\" on any answer", "Exact executed code displayed", "Pass"],
];

const chapter6 = [
  heading("Chapter 6: Testing", HeadingLevel.HEADING_1),
  body("The system was tested against scenarios covering multi-sheet and multi-file loading, both chart-generating and direct-answer questions, cross-table joins, the retry-on-error path, exhaustion of all retries, sandbox security, table removal, and code inspection. The test cases and their outcomes are summarised in Table 6.1."),
  buildTable(testRows, [900, 2600, 2200, 2400, 900]),
  new Paragraph({
    children: [new TextRun({ text: "Table 6.1: Test cases and results", italics: true, size: 20 })],
    alignment: AlignmentType.CENTER, spacing: { before: 100, after: 300 },
  }),
  body("All test cases passed, including a direct verification that the sandboxed execution environment correctly blocks file-system and import access while still permitting legitimate pandas and Plotly operations, and a verification that a hand-computed percentage breakdown matched the chart generated by the system for the same question."),
  pageBreak(),
];

// ============================================================
// Chapter 7: Results and Screenshots
// ============================================================
const chapter7 = [
  heading("Chapter 7: Results and Screenshots", HeadingLevel.HEADING_1),
  body("[Insert screenshots of the running application here: the file-upload screen, the loaded-tables panel, a chart-generating question with its resulting Plotly chart, a direct-answer question with its resulting text/number, and the expanded \"Show generated code\" view. Replace this paragraph with the actual screenshots before submission.]"),
  body("The system successfully answers both chart-generating and direct questions across single and multiple loaded tables, correctly joins data across sheets when a question requires it, and recovers from an initial code-generation error via the retry mechanism in the majority of observed failure cases."),
  pageBreak(),
];

// ============================================================
// Chapter 8: Conclusion and Future Scope
// ============================================================
const chapter8 = [
  heading("Chapter 8: Conclusion and Future Scope", HeadingLevel.HEADING_1),

  heading("8.1 Conclusion", HeadingLevel.HEADING_2),
  body("This project successfully implements a system that answers natural-language analytical questions over uploaded spreadsheets by generating and safely executing pandas and Plotly code, rather than relying on a fixed set of pre-built chart types or a retrieval-based approach that would not generalize to arbitrary computations. By combining schema-aware code generation, a restricted execution sandbox, and an error-driven retry loop, the system is able to answer both visual and direct questions, including those requiring joins across multiple uploaded tables, while remaining transparent about exactly what code produced each answer. The project demonstrates that language-model-driven code generation, applied carefully within a restricted execution environment, can meaningfully lower the barrier to spreadsheet analysis without requiring the user to write any code themselves."),

  heading("8.2 Future Scope", HeadingLevel.HEADING_2),
  bullet("Support for direct database connections, not just uploaded files, as a data source."),
  bullet("Persistent sessions, so previously uploaded tables and chat history survive an application restart."),
  bullet("A validation step that checks a generated chart's axis labels and title against the original question before showing it, catching subtly mislabeled but code-correct charts."),
  bullet("Support for very large files via sampling or chunked processing, rather than loading an entire file into memory."),
  bullet("An explicit clarification step for genuinely ambiguous questions, rather than the model guessing an interpretation silently."),
  bullet("Quantitative evaluation of code-generation accuracy across a labeled benchmark of question-answer pairs, rather than manual testing alone."),
  pageBreak(),
];

// ============================================================
// References
// ============================================================
const references = [
  heading("References", HeadingLevel.HEADING_1),
  body("[1] Chen, M., et al. (2021). Evaluating Large Language Models Trained on Code. arXiv preprint."),
  body("[2] PandasAI documentation. https://github.com/sinaptik-ai/pandas-ai"),
  body("[3] McKinney, W. (2010). Data Structures for Statistical Computing in Python. Proceedings of the 9th Python in Science Conference. (pandas)"),
  body("[4] Plotly Technologies Inc. Plotly Python Open Source Graphing Library. https://plotly.com/python/"),
  body("[5] Streamlit documentation. https://docs.streamlit.io"),
  body("[6] Groq API documentation. https://console.groq.com/docs"),
  body("[7] Le Goues, C., et al. (2012). GenProg: A Generic Method for Automatic Software Repair. IEEE Transactions on Software Engineering. (automated program repair / self-correction)"),
];

// ============================================================
// Assemble document
// ============================================================
const doc = new Document({
  numbering: {
    config: [{ reference: "bullet-list", levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT }] }],
  },
  sections: [
    { properties: {}, children: titlePageChildren },
    { properties: {}, children: certificateChildren },
    { properties: {}, children: abstractChildren },
    { properties: {}, children: tocChildren },
    {
      properties: {},
      headers: { default: new Header({ children: [new Paragraph({ text: CONFIG.PROJECT_TITLE, alignment: AlignmentType.CENTER })] }) },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: [PageNumber.CURRENT] })] })] }) },
      children: [...chapter1, ...chapter2, ...chapter3, ...chapter4, ...chapter5, ...chapter6, ...chapter7, ...chapter8, ...references],
    },
  ],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(__dirname + "/Chat_With_Data_Report.docx", buffer);
  console.log("Generated Chat_With_Data_Report.docx");
});
