import json
from pathlib import Path

import streamlit as st

ROOT = Path(__file__).parent
DATA_DIR = ROOT / "data"
LETTERS = ["A", "B", "C", "D", "E"]
TIER_EMOJI = {3: "🌟", 4: "🌈", 5: "🏆"}

st.set_page_config(page_title="Math Kangaroo Practice", page_icon="🦘", layout="wide")


def available_years():
    years = sorted(int(p.stem) for p in DATA_DIR.glob("*.json"))
    return years


def load_year(year):
    with open(DATA_DIR / f"{year}.json", encoding="utf-8") as f:
        return json.load(f)


def tier_for(data, qnum):
    for t in data["tiers"]:
        if t["from"] <= qnum <= t["to"]:
            return t
    raise ValueError(f"no tier for question {qnum}")


def max_possible_score(data):
    return data["startingPoints"] + sum(
        t["points"] * (t["to"] - t["from"] + 1) for t in data["tiers"]
    )


def reset_count_key(year):
    return f"y{year}_reset_count"


def question_key(year, qnum):
    # Streamlit re-populates a widget's session_state from the last value the
    # browser reported, so merely popping the key on Reset doesn't clear it.
    # Folding a reset counter into the key makes Reset create brand-new,
    # never-before-seen widgets instead, which is the reliable way to clear one.
    count = st.session_state.get(reset_count_key(year), 0)
    return f"y{year}_r{count}_q{qnum}"


def submitted_key(year):
    return f"y{year}_submitted"


def render_question(data, qnum, submitted):
    key = question_key(data["year"], qnum)
    tier = tier_for(data, qnum)
    with st.container(border=True):
        st.markdown(f"**{TIER_EMOJI.get(tier['points'], '⭐')} Question {qnum}**")
        st.segmented_control(
            f"Question {qnum} answer",
            LETTERS,
            key=key,
            disabled=submitted,
            width="stretch",
            label_visibility="collapsed",
        )
        if submitted:
            correct_letter = data["answerKey"][str(qnum)]
            given = st.session_state.get(key)
            if given is None:
                st.info(f"⬜ No answer — the correct answer was **{correct_letter}**.")
            elif given == correct_letter:
                st.success(f"✅ Correct! +{tier['points']} points.")
            else:
                penalty = tier["points"] * data["wrongPenaltyFraction"]
                st.error(f"❌ Not quite — the correct answer was **{correct_letter}**. -{penalty:.2f} points.")


def compute_score(data):
    score = data["startingPoints"]
    correct = incorrect = blank = 0
    for qnum_str, correct_letter in data["answerKey"].items():
        qnum = int(qnum_str)
        given = st.session_state.get(question_key(data["year"], qnum))
        tier = tier_for(data, qnum)
        if given is None:
            blank += 1
        elif given == correct_letter:
            correct += 1
            score += tier["points"]
        else:
            incorrect += 1
            score -= tier["points"] * data["wrongPenaltyFraction"]
    return round(score, 2), correct, incorrect, blank


def cheer_for(score, max_score):
    pct = score / max_score
    if pct >= 0.85:
        return "🏆 Amazing! You're a Math Kangaroo champion!"
    if pct >= 0.65:
        return "🌟 Great job! That's a really solid score!"
    if pct >= 0.45:
        return "🎉 Nice work! Keep practicing and you'll get even better!"
    return "💪 Good try! Every practice test makes you stronger — try again!"


def answered_count(data):
    return sum(
        1
        for qnum_str in data["answerKey"]
        if st.session_state.get(question_key(data["year"], int(qnum_str))) is not None
    )


def reset_year(data):
    year = data["year"]
    st.session_state[reset_count_key(year)] = st.session_state.get(reset_count_key(year), 0) + 1
    st.session_state[submitted_key(year)] = False


def main():
    years = available_years()
    if not years:
        st.error("No test data found in data/. Add a <year>.json file first.")
        return

    with st.sidebar:
        st.markdown("## 🦘 Math Kangaroo")
        st.caption("Pick a year and test yourself!")
        year = st.selectbox("Choose a year", years, index=len(years) - 1)

    data = load_year(year)
    submitted = st.session_state.get(submitted_key(year), False)
    total_questions = len(data["answerKey"])

    st.markdown(f"# 🦘 {data['title']}")
    st.caption(data["subtitle"])
    st.info(
        f"✨ Real Känguru scoring: you start with **{data['startingPoints']} points**. "
        + " ".join(
            f"{TIER_EMOJI.get(t['points'], '⭐')} Questions {t['from']}–{t['to']} are worth "
            f"{t['points']} points each."
            for t in data["tiers"]
        )
        + " An unanswered question scores 0. A wrong answer costs a quarter of that "
        "question's points."
    )

    if not submitted:
        st.progress(
            answered_count(data) / total_questions,
            text=f"{answered_count(data)} / {total_questions} answered",
        )

    col1, col2 = st.columns([1, 4])
    with col1:
        if st.button("✅ Check my answers", type="primary", disabled=submitted, width="stretch"):
            st.session_state[submitted_key(year)] = True
            submitted = True
    with col2:
        if st.button("🔄 Reset", width="stretch"):
            reset_year(data)
            st.rerun()

    if submitted:
        score, correct, incorrect, blank = compute_score(data)
        max_score = max_possible_score(data)
        st.markdown("## 🎉 Your Score")
        st.markdown(f"# {score} / {max_score}")
        st.markdown(f"### {cheer_for(score, max_score)}")
        c1, c2, c3 = st.columns(3)
        c1.metric("✅ Correct", correct)
        c2.metric("❌ Incorrect", incorrect)
        c3.metric("⬜ Blank", blank)

    for page in data["pages"]:
        st.divider()
        img_col, q_col = st.columns([1, 1])
        with img_col:
            st.image(str(ROOT / page["image"]), use_container_width=True)
        with q_col:
            for qnum in page["questions"]:
                render_question(data, qnum, submitted)


if __name__ == "__main__":
    main()
