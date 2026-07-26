const pptxgen = require("pptxgenjs");
const path = require("path");

const CONFIG = require("../student_config.json");
const ASSET = (f) => path.join(__dirname, f);

const NAVY = "0B3D62";
const TEAL = "0F6E56";
const PURPLE = "534AB7";
const WHITE = "FFFFFF";
const OFFWHITE = "F5F6F7";
const TEXT_DARK = "1A1A1A";
const TEXT_MUTED = "5F5E5A";
const CARD_BG = "FFFFFF";
const CARD_BORDER = "E2E4E8";

const FONT_HEAD = "Cambria";
const FONT_BODY = "Calibri";

let pres = new pptxgen();
pres.layout = "LAYOUT_WIDE";
const SW = 13.33, SH = 7.5;

function iconCircle(slide, { x, y, size = 0.6, icon, bg = NAVY }) {
  slide.addShape("ellipse", { x, y, w: size, h: size, fill: { color: bg }, line: { type: "none" } });
  const pad = size * 0.2;
  slide.addImage({ path: ASSET(`icons_${icon}.png`), x: x + pad / 2, y: y + pad / 2, w: size - pad, h: size - pad });
}
function slideTitle(slide, text, opts = {}) {
  slide.addText(text, { x: 0.6, y: 0.45, w: SW - 1.2, h: 0.7, fontFace: FONT_HEAD, fontSize: 30, bold: true, color: TEXT_DARK, margin: 0, ...opts });
}
function pageNum(slide, n) {
  slide.addText(String(n), { x: SW - 0.7, y: SH - 0.45, w: 0.4, h: 0.3, fontFace: FONT_BODY, fontSize: 10, color: TEXT_MUTED, align: "right", margin: 0 });
}

// ============================================================
// Slide 1 — Title
// ============================================================
{
  const s = pres.addSlide();
  s.addShape("rect", { x: 0, y: 0, w: SW, h: SH, fill: { color: NAVY }, line: { type: "none" } });
  s.addImage({ path: ASSET("icons_chunk.png"), x: SW - 2.3, y: 0.6, w: 1.3, h: 1.3, transparency: 15 });
  s.addText("Chat With Data", { x: 0.9, y: 2.5, w: SW - 1.8, h: 1.1, fontFace: FONT_HEAD, fontSize: 44, bold: true, color: WHITE, margin: 0 });
  s.addText("Natural Language Charts and Insights from Spreadsheets", { x: 0.9, y: 3.55, w: SW - 1.8, h: 0.6, fontFace: FONT_BODY, fontSize: 20, color: "CADCFC", margin: 0 });
  s.addText(`[${CONFIG.PROJECT_TYPE}]`, { x: 0.9, y: 4.25, w: 6, h: 0.4, fontFace: FONT_BODY, fontSize: 14, italic: true, color: "8FA8C2", margin: 0 });
  s.addText([
    { text: CONFIG.STUDENT_NAME, options: { bold: true, breakLine: true } },
    { text: `${CONFIG.COLLEGE_NAME}  |  ${CONFIG.ACADEMIC_YEAR}`, options: {} },
  ], { x: 0.9, y: 6.5, w: 8, h: 0.7, fontFace: FONT_BODY, fontSize: 14, color: WHITE, margin: 0 });
}

// ============================================================
// Slide 2 — Problem
// ============================================================
{
  const s = pres.addSlide();
  slideTitle(s, "The problem");
  s.addText([
    { text: "Knowing what to ask isn't the same as knowing how to build it", options: { bold: true, breakLine: true, paraSpaceAfter: 10 } },
    { text: "Answering \"what % is male vs female this month\" means building the right pivot, formula, or chart manually", options: { bullet: true, breakLine: true, paraSpaceAfter: 8 } },
    { text: "That barrier repeats every time the question or the data changes", options: { bullet: true, breakLine: true, paraSpaceAfter: 8 } },
    { text: "Generic chatbots can't compute an answer from a spreadsheet they can't actually run code against", options: { bullet: true } },
  ], { x: 0.6, y: 1.6, w: 7.0, h: 4.5, fontFace: FONT_BODY, fontSize: 16, color: TEXT_DARK, margin: 0, valign: "top", lineSpacingMultiple: 1.15 });

  s.addShape("roundRect", { x: 8.1, y: 1.9, w: 4.6, h: 3.6, rectRadius: 0.12, fill: { color: OFFWHITE }, line: { color: CARD_BORDER, width: 1 } });
  iconCircle(s, { x: 8.5, y: 2.25, size: 0.8, icon: "warning", bg: PURPLE });
  s.addText("\u201cGive me male and female % contribution this month.\u201d", { x: 8.4, y: 3.25, w: 3.9, h: 1.9, fontFace: FONT_HEAD, fontSize: 16, italic: true, color: NAVY, margin: 0 });
  pageNum(s, 2);
}

// ============================================================
// Slide 3 — Objectives
// ============================================================
{
  const s = pres.addSlide();
  slideTitle(s, "Objectives");
  const objectives = [
    { icon: "upload", title: "Upload any spreadsheet", desc: "CSV or multi-sheet Excel, one or many at once" },
    { icon: "robot", title: "Turn questions into code", desc: "Let an LLM write pandas + Plotly, not fixed templates" },
    { icon: "check", title: "Chart or answer, correctly", desc: "Route each question to a visual or a direct answer" },
    { icon: "search", title: "Stay safe and self-correcting", desc: "Sandbox execution, retry automatically on error" },
  ];
  const colW = 5.9, gapX = 0.5, startX = 0.6, rowY = [1.7, 3.55];
  objectives.forEach((o, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = startX + col * (colW + gapX), y = rowY[row];
    iconCircle(s, { x, y: y + 0.1, size: 0.75, icon: o.icon, bg: NAVY });
    s.addText(o.title, { x: x + 1.0, y, w: colW - 1.0, h: 0.4, fontFace: FONT_HEAD, fontSize: 16, bold: true, color: TEXT_DARK, margin: 0, valign: "top" });
    s.addText(o.desc, { x: x + 1.0, y: y + 0.45, w: colW - 1.0, h: 0.8, fontFace: FONT_BODY, fontSize: 13, color: TEXT_MUTED, margin: 0, valign: "top" });
  });
  pageNum(s, 3);
}

// ============================================================
// Slide 4 — Architecture
// ============================================================
{
  const s = pres.addSlide();
  slideTitle(s, "System architecture");
  s.addText("Load once, then generate and run fresh code for every question", { x: 0.6, y: 1.15, w: SW - 1.2, h: 0.4, fontFace: FONT_BODY, fontSize: 14, italic: true, color: TEXT_MUTED, margin: 0 });
  s.addImage({ path: ASSET("architecture_diagram.png"), x: 2.4, y: 1.9, w: 8.5, h: 4.01 });
  pageNum(s, 4);
}

// ============================================================
// Slide 5 — Chart vs text routing
// ============================================================
{
  const s = pres.addSlide();
  slideTitle(s, "Chart or direct answer?");
  s.addText("One code-generation step decides for itself, by which variable it assigns", { x: 0.6, y: 1.15, w: SW - 1.2, h: 0.4, fontFace: FONT_BODY, fontSize: 14, italic: true, color: TEXT_MUTED, margin: 0 });
  s.addImage({ path: ASSET("chart_routing_diagram.png"), x: 4.0, y: 1.65, w: 5.3, h: 2.96 });
  pageNum(s, 5);
}

// ============================================================
// Slide 6 — Tech stack
// ============================================================
{
  const s = pres.addSlide();
  slideTitle(s, "Technology stack");
  const stack = [
    { icon: "python", label: "Python 3", sub: "Core language" },
    { icon: "layer", label: "Streamlit", sub: "Chat + upload interface" },
    { icon: "database", label: "pandas", sub: "Data loading, joins, aggregation" },
    { icon: "chunk", label: "Plotly", sub: "Interactive charts" },
    { icon: "bolt", label: "Groq API", sub: "Free, fast code generation" },
    { icon: "search", label: "openpyxl", sub: "Multi-sheet Excel reading" },
    { icon: "check", label: "Sandboxed exec()", sub: "Restricted, safe code execution" },
    { icon: "robot", label: "Retry loop", sub: "Self-corrects on error" },
  ];
  const cols = 4, cardW = 2.85, cardH = 1.9, gapX = 0.28, gapY = 0.35, startX = 0.6, startY = 1.7;
  stack.forEach((t, i) => {
    const col = i % cols, row = Math.floor(i / cols);
    const x = startX + col * (cardW + gapX), y = startY + row * (cardH + gapY);
    s.addShape("roundRect", { x, y, w: cardW, h: cardH, rectRadius: 0.1, fill: { color: CARD_BG }, line: { color: CARD_BORDER, width: 1 } });
    iconCircle(s, { x: x + 0.25, y: y + 0.25, size: 0.6, icon: t.icon, bg: NAVY });
    s.addText(t.label, { x: x + 0.2, y: y + 0.95, w: cardW - 0.4, h: 0.55, fontFace: FONT_HEAD, fontSize: 12.5, bold: true, color: TEXT_DARK, margin: 0, valign: "top" });
    s.addText(t.sub, { x: x + 0.2, y: y + 1.45, w: cardW - 0.4, h: 0.4, fontFace: FONT_BODY, fontSize: 10, color: TEXT_MUTED, margin: 0 });
  });
  pageNum(s, 6);
}

// ============================================================
// Slide 7 — Why sandboxed execution
// ============================================================
{
  const s = pres.addSlide();
  slideTitle(s, "Why sandbox the generated code");
  s.addText("The code is written by a model, not by us \u2014 it has to be contained before it runs", { x: 0.6, y: 1.15, w: SW - 1.2, h: 0.4, fontFace: FONT_BODY, fontSize: 14, italic: true, color: TEXT_MUTED, margin: 0 });
  const layers = [
    { icon: "warning", title: "Restricted builtins", desc: "No open(), no __import__, no eval/exec \u2014 only safe, minimal Python built-ins are exposed", bg: "FDECEA", accent: "C0392B", accentDark: "922B21" },
    { icon: "check", title: "Approved libraries only", desc: "pandas, numpy, and Plotly are in scope \u2014 nothing else can be imported", bg: "E1F5EE", accent: TEAL, accentDark: "085041" },
    { icon: "robot", title: "Error-driven retry", desc: "A failed run's error message is fed back to the model for up to 2 corrected attempts", bg: "EEEDFE", accent: PURPLE, accentDark: "3C3489" },
  ];
  const cardW = 3.85, cardH = 3.9, gap = 0.35, startX = 0.6, y = 1.9;
  layers.forEach((l, i) => {
    const x = startX + i * (cardW + gap);
    s.addShape("roundRect", { x, y, w: cardW, h: cardH, rectRadius: 0.12, fill: { color: l.bg }, line: { type: "none" } });
    iconCircle(s, { x: x + 0.35, y: y + 0.35, size: 0.7, icon: l.icon, bg: l.accent });
    s.addText(l.title, { x: x + 0.35, y: y + 1.25, w: cardW - 0.7, h: 0.5, fontFace: FONT_HEAD, fontSize: 15, bold: true, color: l.accentDark, margin: 0 });
    s.addText(l.desc, { x: x + 0.35, y: y + 1.8, w: cardW - 0.7, h: 1.9, fontFace: FONT_BODY, fontSize: 12.5, color: TEXT_DARK, margin: 0, valign: "top", lineSpacingMultiple: 1.15 });
  });
  pageNum(s, 7);
}

// ============================================================
// Slide 8 — Why retry-on-error matters
// ============================================================
{
  const s = pres.addSlide();
  slideTitle(s, "Why the retry loop matters");
  s.addText("Example: the model guesses a column name slightly wrong on the first try", { x: 0.6, y: 1.15, w: SW - 1.2, h: 0.4, fontFace: FONT_BODY, fontSize: 14, italic: true, color: TEXT_MUTED, margin: 0 });

  s.addShape("roundRect", { x: 0.6, y: 1.75, w: 5.8, h: 4.6, rectRadius: 0.12, fill: { color: "FAECE7" }, line: { type: "none" } });
  s.addText("Without retry", { x: 1.0, y: 2.0, w: 5.0, h: 0.4, fontFace: FONT_HEAD, fontSize: 16, bold: true, color: "712B13", margin: 0 });
  s.addText([
    { text: "Code references a column that doesn't quite match the real name", options: { bullet: true, breakLine: true, paraSpaceAfter: 8 } },
    { text: "Execution raises a KeyError", options: { bullet: true, breakLine: true, paraSpaceAfter: 8 } },
    { text: "User just sees a failure, with no path to a working answer", options: { bullet: true } },
  ], { x: 1.0, y: 2.5, w: 5.0, h: 3.5, fontFace: FONT_BODY, fontSize: 14, color: TEXT_DARK, margin: 0, valign: "top", lineSpacingMultiple: 1.15 });

  s.addShape("roundRect", { x: 6.9, y: 1.75, w: 5.8, h: 4.6, rectRadius: 0.12, fill: { color: "E1F5EE" }, line: { type: "none" } });
  s.addText("With retry", { x: 7.3, y: 2.0, w: 5.0, h: 0.4, fontFace: FONT_HEAD, fontSize: 16, bold: true, color: "085041", margin: 0 });
  s.addText([
    { text: "The KeyError and its message are sent back to the model", options: { bullet: true, breakLine: true, paraSpaceAfter: 8 } },
    { text: "Model corrects the column name and rewrites the code", options: { bullet: true, breakLine: true, paraSpaceAfter: 8 } },
    { text: "Corrected code runs successfully \u2014 user just sees the right answer", options: { bullet: true } },
  ], { x: 7.3, y: 2.5, w: 5.0, h: 3.5, fontFace: FONT_BODY, fontSize: 14, color: TEXT_DARK, margin: 0, valign: "top", lineSpacingMultiple: 1.15 });
  pageNum(s, 8);
}

// ============================================================
// Slide 9 — Multi-sheet joins
// ============================================================
{
  const s = pres.addSlide();
  slideTitle(s, "Answering questions across sheets");
  s.addText([
    { text: "Every uploaded sheet becomes its own named table", options: { bullet: true, breakLine: true, paraSpaceAfter: 10 } },
    { text: "The model sees every table's schema at once", options: { bullet: true, breakLine: true, paraSpaceAfter: 10 } },
    { text: "It writes its own pd.merge() when a question needs more than one table", options: { bullet: true, breakLine: true, paraSpaceAfter: 10 } },
    { text: "No manual join configuration required from the user", options: { bullet: true } },
  ], { x: 0.6, y: 1.8, w: 6.4, h: 4, fontFace: FONT_BODY, fontSize: 16, color: TEXT_DARK, margin: 0, valign: "top", lineSpacingMultiple: 1.2 });

  s.addShape("roundRect", { x: 7.5, y: 1.9, w: 5.2, h: 3.9, rectRadius: 0.12, fill: { color: OFFWHITE }, line: { color: CARD_BORDER, width: 1 } });
  s.addText("Q: Male vs female % contribution this month?", { x: 7.85, y: 2.2, w: 4.5, h: 0.6, fontFace: FONT_BODY, fontSize: 13, bold: true, color: NAVY, margin: 0 });
  s.addText("merged = pd.merge(contributions, employees, on=\"employee_id\")\n...\nfig = px.pie(grouped, names=\"gender\", values=\"percent\")", {
    x: 7.85, y: 2.9, w: 4.5, h: 1.4, fontFace: "Consolas", fontSize: 11, color: TEXT_DARK, margin: 0, valign: "top",
  });
  s.addShape("roundRect", { x: 7.85, y: 4.5, w: 4.5, h: 0.5, rectRadius: 0.08, fill: { color: "EEEDFE" }, line: { type: "none" } });
  s.addText("\u2192 Pie chart: Female 59.5% / Male 40.5%", { x: 8.0, y: 4.5, w: 4.2, h: 0.5, fontFace: FONT_BODY, fontSize: 11, italic: true, color: PURPLE, valign: "middle", margin: 0 });
  pageNum(s, 9);
}

// ============================================================
// Slide 10 — Testing & results
// ============================================================
{
  const s = pres.addSlide();
  slideTitle(s, "Testing & results");
  s.addText("10", { x: 0.7, y: 1.7, w: 2.6, h: 1.5, fontFace: FONT_HEAD, fontSize: 62, bold: true, color: TEAL, margin: 0, align: "center" });
  s.addText("/ 10", { x: 3.1, y: 2.2, w: 1.2, h: 0.9, fontFace: FONT_HEAD, fontSize: 28, bold: true, color: TEXT_MUTED, margin: 0 });
  s.addText("test cases passed", { x: 0.7, y: 3.15, w: 3.2, h: 0.4, fontFace: FONT_BODY, fontSize: 13, color: TEXT_MUTED, align: "center", margin: 0 });

  const results = [
    { icon: "check", text: "Multi-sheet Excel and CSV loaded together correctly" },
    { icon: "check", text: "Chart and direct-answer questions both routed correctly" },
    { icon: "check", text: "Cross-sheet joins written correctly by generated code" },
    { icon: "check", text: "Retry loop recovers from a column-name error" },
    { icon: "check", text: "Sandbox blocks file and import access" },
  ];
  let ry = 1.65;
  results.forEach((r) => {
    iconCircle(s, { x: 4.7, y: ry, size: 0.45, icon: r.icon, bg: TEAL });
    s.addText(r.text, { x: 5.35, y: ry - 0.05, w: 7.3, h: 0.55, fontFace: FONT_BODY, fontSize: 13.5, color: TEXT_DARK, margin: 0, valign: "middle" });
    ry += 0.85;
  });
  pageNum(s, 10);
}

// ============================================================
// Slide 11 — Demo
// ============================================================
{
  const s = pres.addSlide();
  slideTitle(s, "Demo");
  const shots = ["Screenshot: file upload and loaded tables", "Screenshot: chart question and result", "Screenshot: generated code inspection"];
  const w = 3.85, h = 3.9, gap = 0.35, startX = 0.6, y = 1.9;
  shots.forEach((label, i) => {
    const x = startX + i * (w + gap);
    s.addShape("roundRect", { x, y, w, h, rectRadius: 0.1, fill: { color: OFFWHITE }, line: { color: CARD_BORDER, width: 1, dashType: "dash" } });
    s.addText("[ insert screenshot ]", { x, y: y + h / 2 - 0.5, w, h: 0.4, align: "center", fontFace: FONT_BODY, fontSize: 12, italic: true, color: TEXT_MUTED, margin: 0 });
    s.addText(label, { x: x + 0.2, y: y + h - 0.6, w: w - 0.4, h: 0.5, fontFace: FONT_BODY, fontSize: 12, color: TEXT_DARK, align: "center", margin: 0 });
  });
  pageNum(s, 11);
}

// ============================================================
// Slide 12 — Challenges faced
// ============================================================
{
  const s = pres.addSlide();
  slideTitle(s, "Challenges faced");
  const challenges = [
    { icon: "warning", title: "Executing model-written code safely", desc: "Solved with a restricted exec() sandbox exposing only approved libraries" },
    { icon: "search", title: "Column names the model got slightly wrong", desc: "Solved with the error-driven retry loop, up to 2 corrected attempts" },
    { icon: "chunk", title: "Deciding chart vs. text automatically", desc: "Solved via a fig/result variable convention the model itself follows" },
    { icon: "target", title: "Joining tables without manual config", desc: "Solved by giving the model every table's schema and letting it write its own merge" },
  ];
  const colW = 5.9, gapX = 0.5, startX = 0.6, rowY = [1.65, 3.9];
  challenges.forEach((c, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = startX + col * (colW + gapX), y = rowY[row];
    iconCircle(s, { x, y: y + 0.05, size: 0.65, icon: c.icon, bg: PURPLE });
    s.addText(c.title, { x: x + 0.85, y, w: colW - 0.85, h: 0.4, fontFace: FONT_HEAD, fontSize: 15, bold: true, color: TEXT_DARK, margin: 0, valign: "top" });
    s.addText(c.desc, { x: x + 0.85, y: y + 0.42, w: colW - 0.85, h: 1.4, fontFace: FONT_BODY, fontSize: 12.5, color: TEXT_MUTED, margin: 0, valign: "top", lineSpacingMultiple: 1.1 });
  });
  pageNum(s, 12);
}

// ============================================================
// Slide 13 — Future scope
// ============================================================
{
  const s = pres.addSlide();
  slideTitle(s, "Future scope");
  const future = [
    { icon: "future", text: "Direct database connections, not just uploaded files" },
    { icon: "database", text: "Persistent sessions across app restarts" },
    { icon: "target", text: "A validation step checking chart labels against the original question" },
    { icon: "chat", text: "Explicit clarification prompts for genuinely ambiguous questions" },
  ];
  let fy = 1.85;
  future.forEach((f) => {
    iconCircle(s, { x: 0.7, y: fy, size: 0.6, icon: f.icon, bg: TEAL });
    s.addText(f.text, { x: 1.5, y: fy, w: 10.8, h: 0.6, fontFace: FONT_BODY, fontSize: 16, color: TEXT_DARK, margin: 0, valign: "middle" });
    fy += 1.05;
  });
  pageNum(s, 13);
}

// ============================================================
// Slide 14 — Thank you
// ============================================================
{
  const s = pres.addSlide();
  s.addShape("rect", { x: 0, y: 0, w: SW, h: SH, fill: { color: NAVY }, line: { type: "none" } });
  s.addText("Thank you", { x: 0.9, y: 2.9, w: SW - 1.8, h: 1.0, fontFace: FONT_HEAD, fontSize: 44, bold: true, color: WHITE, margin: 0 });
  s.addText("Questions?", { x: 0.9, y: 3.9, w: SW - 1.8, h: 0.6, fontFace: FONT_BODY, fontSize: 20, color: "CADCFC", margin: 0 });
}

pres.writeFile({ fileName: path.join(__dirname, "Chat_With_Data_Presentation.pptx") }).then(() => {
  console.log("Generated Chat_With_Data_Presentation.pptx");
});
