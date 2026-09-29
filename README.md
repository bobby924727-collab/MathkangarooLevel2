# Math Kangaroo Practice

A self-check practice test site for Math Kangaroo (Känguru der Mathematik), Level Écolier
(Grade 3 + 4), covering 2009–2023. Pick a year, answer the 24 multiple-choice questions,
and check your score using the real Känguru scoring rules (24 starting points, 3/4/5
points per tier, a wrong answer costs a quarter of that question's points).

## Run locally

```
pip install -r requirements.txt
streamlit run app.py
```

## Structure

- `app.py` — the Streamlit app.
- `data/<year>.json` — questions-to-page mapping, answer key, and scoring rules per year.
- `assets/<year>/pageN.png` — the actual exam pages, rendered from the original PDFs.
- `index.html` / `quiz.html` / `css/` / `js/` — a standalone static-site version (2023 only).
