# Personal order tracker

`Student_Order_Tracker.xlsx` — tracks who's ordered which project, what they
paid, and where each delivery stands, across all three products: `PDF RAG Chat`,
`Chat with YouTube`, and `Chat with Data`.

**This is now the canonical copy** — it's the most recently updated one, with all
three products in the Product dropdown. Treat this as the one you actually keep
using day to day, and archive/delete the older copies in `pdf-rag-chat/tracker/`
and `chat-with-youtube/tracker/` so you're not updating three files and losing
track of which is current.

## Sheets

**Orders Tracker** — one row per order. Yellow cells are for you to fill in;
gray cells (Balance Due, Payment Status) calculate automatically. Summary totals
are at the top. Add a fourth product later by editing the `dv_product` list in
`build_tracker.py`.

**Delivery Checklist** — the same steps every order needs. The checklist
mentions `student_config.json` and `scripts/generate_all.sh`, which are
per-product — run them from whichever product's repo the order is for.

## Regenerating

```bash
pip install openpyxl --break-system-packages   # if not already installed
python3 build_tracker.py
```
Opening the file in Excel or LibreOffice recalculates formulas automatically.
This overwrites `Student_Order_Tracker.xlsx` — copy your existing data out first
if you've already been using it.
