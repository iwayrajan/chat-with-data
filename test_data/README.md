# Sample test data

Three ready-made datasets, covering multi-sheet joins, a single-sheet trend, and
a second domain for variety across student demos — analogous to `pdf-rag-chat`'s
generated test PDFs, except these can genuinely be reused as-is since they're real
files, not something that has to exist on a live external platform.

## `Company_HR_Data.xlsx` (2 sheets: Employees, Contributions)

12 employees across 3 departments, with 4 months of individual contribution
amounts. Good for demoing joins, groupby, and percentage-breakdown questions.

Suggested questions:
- *"What % of total contribution is from male vs female employees this month?"*
  — join, filter to latest month, groupby gender, percentage, pie chart.
- *"Show total contribution by department as a bar chart"*
  — join, groupby department, bar chart.
- *"Which employee has the highest total contribution across all months?"*
  — direct/text answer, not a chart.
- *"Plot Priya Singh's contribution trend over the 4 months"*
  — filter by name, line chart.

## `Monthly_Revenue.csv` (single sheet)

7 months of revenue for one region. Good for demoing a simple trend chart and a
direct numeric question without needing any join.

Suggested questions:
- *"Plot the revenue trend over time"* — line chart.
- *"What was the month-over-month growth rate?"* — direct answer requiring a
  computed new column (percentage change), not just a lookup.
- *"What's the average monthly revenue?"* — simple direct answer.

## `College_Fest_Budget.xlsx` (2 sheets: Budget, Sponsors)

A different domain (event budgeting instead of HR/sales) — useful for a second
demo video/dataset so two students' submissions don't look identical, and for
testing filter-plus-derived-column questions rather than only groupby-and-chart.

Suggested questions:
- *"Which categories went over budget, and by how much?"* — derived column,
  filter, direct/table answer (verified in testing: Decoration over by \u20b92,000).
- *"Show sponsorship amount by category as a bar chart"* — groupby, bar chart.
- *"What % of the Venue budget came from sponsors vs our own spending?"* — join
  across both sheets, percentage computation.

## Suggested test script (in this order)

1. Load `Company_HR_Data.xlsx` alone. Try the join+percentage question, then the
   department bar chart, then the direct-answer employee lookup — this exercises
   chart generation, join logic, and text-answer routing all from one file.
2. Add `Monthly_Revenue.csv` alongside it (now two unrelated datasets are
   loaded). Confirm a question about revenue doesn't get confused with the HR
   data, and vice versa.
3. Remove both, load `College_Fest_Budget.xlsx` alone, and try its questions —
   this is a good one to demo live in a viva since the over-budget question
   requires a derived column, not just an existing one.
4. For the retry-on-error path specifically: ask a question using a slightly
   wrong column name on purpose (e.g. "show contribution by gender" without
   specifying "this month" against `Contributions`, which lacks a gender column
   directly) and observe the join get attempted, or, to force an actual error to
   demo the retry, temporarily rename a column in a copy of the file and ask a
   question using its original name.
