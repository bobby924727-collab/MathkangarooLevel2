(function () {
  const LETTERS = ["A", "B", "C", "D", "E"];

  function getYearFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const y = parseInt(params.get("year"), 10);
    return Number.isFinite(y) ? y : null;
  }

  function loadDataScript(year, onDone, onError) {
    const script = document.createElement("script");
    script.src = `data/${year}.js`;
    script.onload = onDone;
    script.onerror = onError;
    document.head.appendChild(script);
  }

  function tierFor(data, qnum) {
    return data.tiers.find((t) => qnum >= t.from && qnum <= t.to);
  }

  function buildQuestionCard(qnum) {
    const card = document.createElement("div");
    card.className = "question-card";
    card.id = `q-card-${qnum}`;

    const label = document.createElement("div");
    label.className = "qnum";
    label.textContent = `Question ${qnum}`;
    card.appendChild(label);

    const choices = document.createElement("div");
    choices.className = "choices";

    LETTERS.forEach((letter) => {
      const wrap = document.createElement("div");
      wrap.className = "choice";
      wrap.dataset.letter = letter;

      const input = document.createElement("input");
      input.type = "checkbox";
      input.id = `q${qnum}-${letter}`;
      input.name = `q${qnum}`;
      input.value = letter;

      const lab = document.createElement("label");
      lab.setAttribute("for", input.id);
      lab.textContent = letter;

      wrap.appendChild(input);
      wrap.appendChild(lab);
      choices.appendChild(wrap);
    });

    card.appendChild(choices);

    const feedback = document.createElement("div");
    feedback.className = "feedback";
    feedback.hidden = true;
    card.appendChild(feedback);

    return card;
  }

  function render(data) {
    document.title = `${data.title} — Practice Test`;
    document.getElementById("year-title").textContent = data.title;
    document.getElementById("year-subtitle").textContent = data.subtitle;

    const root = document.getElementById("quiz-root");
    root.innerHTML = "";

    const answers = {};

    data.pages.forEach((page) => {
      const block = document.createElement("div");
      block.className = "page-block";

      const imgWrap = document.createElement("div");
      imgWrap.className = "page-image";
      const img = document.createElement("img");
      img.src = page.image;
      img.alt = `Question page showing questions ${page.questions[0]}-${page.questions[page.questions.length - 1]}`;
      img.loading = "lazy";
      imgWrap.appendChild(img);
      block.appendChild(imgWrap);

      const list = document.createElement("div");
      list.className = "question-list";
      page.questions.forEach((qnum) => {
        list.appendChild(buildQuestionCard(qnum));
      });
      block.appendChild(list);

      root.appendChild(block);
    });

    // Mutual exclusivity per question + progress tracking.
    root.querySelectorAll(".question-card").forEach((card) => {
      const qnum = parseInt(card.id.replace("q-card-", ""), 10);
      card.querySelectorAll('input[type="checkbox"]').forEach((input) => {
        input.addEventListener("change", () => {
          if (input.checked) {
            card.querySelectorAll('input[type="checkbox"]').forEach((other) => {
              if (other !== input) other.checked = false;
            });
            answers[qnum] = input.value;
          } else {
            delete answers[qnum];
          }
          updateProgress(data, answers);
        });
      });
    });

    document.getElementById("submit-btn").addEventListener("click", () => submit(data, answers));
    document.getElementById("reset-btn").addEventListener("click", () => reset(data, answers));

    updateProgress(data, answers);
  }

  function totalQuestionCount(data) {
    return data.pages.reduce((sum, p) => sum + p.questions.length, 0);
  }

  function updateProgress(data, answers) {
    const total = totalQuestionCount(data);
    const answered = Object.keys(answers).length;
    document.getElementById("progress-count").textContent = `${answered} / ${total} answered`;
  }

  function submit(data, answers) {
    let score = data.startingPoints;
    let correct = 0, incorrect = 0, blank = 0;

    Object.keys(data.answerKey).forEach((key) => {
      const qnum = parseInt(key, 10);
      const correctLetter = data.answerKey[key];
      const given = answers[qnum];
      const tier = tierFor(data, qnum);
      const card = document.getElementById(`q-card-${qnum}`);
      const feedback = card.querySelector(".feedback");
      feedback.hidden = false;

      card.classList.remove("correct", "incorrect", "blank");

      if (!given) {
        blank++;
        card.classList.add("blank");
        feedback.textContent = `No answer — correct answer was ${correctLetter}.`;
      } else if (given === correctLetter) {
        correct++;
        score += tier.points;
        card.classList.add("correct");
        feedback.textContent = `Correct! +${tier.points} points.`;
      } else {
        incorrect++;
        const penalty = tier.points * data.wrongPenaltyFraction;
        score -= penalty;
        card.classList.add("incorrect");
        feedback.textContent = `Not quite — correct answer was ${correctLetter}. -${penalty.toFixed(2)} points.`;
      }

      // Highlight the correct answer box, and lock further changes.
      card.querySelectorAll(".choice").forEach((choiceEl) => {
        const input = choiceEl.querySelector("input");
        input.disabled = true;
        choiceEl.classList.toggle("answer-key", choiceEl.dataset.letter === correctLetter);
      });
    });

    score = Math.round(score * 100) / 100;

    const results = document.getElementById("results");
    results.classList.add("show");
    document.getElementById("score-value").textContent = score;
    document.getElementById("score-correct").textContent = correct;
    document.getElementById("score-incorrect").textContent = incorrect;
    document.getElementById("score-blank").textContent = blank;
    results.scrollIntoView({ behavior: "smooth" });

    document.getElementById("submit-btn").disabled = true;
  }

  function reset(data, answers) {
    Object.keys(answers).forEach((k) => delete answers[k]);
    document.querySelectorAll(".question-card").forEach((card) => {
      card.classList.remove("correct", "incorrect", "blank");
      card.querySelector(".feedback").hidden = true;
      card.querySelectorAll(".choice").forEach((choiceEl) => {
        choiceEl.classList.remove("answer-key");
        const input = choiceEl.querySelector("input");
        input.checked = false;
        input.disabled = false;
      });
    });
    document.getElementById("results").classList.remove("show");
    document.getElementById("submit-btn").disabled = false;
    updateProgress(data, answers);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function init() {
    const year = getYearFromUrl();
    const root = document.getElementById("quiz-root");
    if (!year) {
      root.innerHTML = "<p>No year specified. Go back to the <a href=\"index.html\">home page</a> and pick a test.</p>";
      return;
    }
    loadDataScript(
      year,
      () => {
        if (typeof QUIZ_DATA === "undefined") {
          root.innerHTML = `<p>Could not load the ${year} test data.</p>`;
          return;
        }
        render(QUIZ_DATA);
      },
      () => {
        root.innerHTML = `<p>No test found for ${year} yet.</p>`;
      }
    );
  }

  document.addEventListener("DOMContentLoaded", init);
})();
