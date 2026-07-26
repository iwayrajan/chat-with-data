# Report template — reuse for each student

Generates `Chat_With_Data_Report.docx` — all 8 standard chapters, both architecture
diagrams embedded, a requirements table, and a testing table — everything except
the student's personal details and their own screenshots.

## To generate a report for a new student

**Recommended:** use `../scripts/generate_all.sh`, which regenerates both the
report and the presentation together and packages them into `../deliverables/`.

To run just this one manually:
1. Edit `../student_config.json` (shared by both the report and the presentation).
2. Run: `node generate_report.js`
3. `Chat_With_Data_Report.docx` is regenerated with the new details.

## Before handing it to the student

- **Update the Table of Contents**: open in Word, right-click it, "Update Field" →
  "Update entire table" — standard Word behavior, not specific to this script.
- **Replace Chapter 7 placeholder text** with real screenshots: the file-upload
  screen, loaded-tables panel, a chart-generating Q&A, a direct-answer Q&A, and
  the expanded generated-code view.
- **Check citation style**: Chapter 2's references are generic ML/software-
  engineering citations, not tied to any specific department's required format —
  reformat to IEEE/APA if the student's department requires it.

## Customization notes

- The two diagrams in Chapter 4 come from `assets/architecture_diagram.png` and
  `assets/chart_routing_diagram.png` — regenerate from the SVGs in `../docs/` if
  the pipeline design changes.
- To make a submission look distinct from a classmate's, consider varying: the
  example dataset domain mentioned in Chapter 1/7 (e.g. "college fest expense
  tracking" instead of a generic sales example), or implementing one Chapter 8
  future-scope item for real (a validation step that checks chart labels against
  the question is a natural, self-contained pick).
