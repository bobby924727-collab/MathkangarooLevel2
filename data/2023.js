// Math Kangaroo (Känguru der Mathematik) 2023 — Level Écolier, Grade 3+4
// Data extracted from 2023_Ecolier.pdf and 2023_Answers.pdf.
const QUIZ_DATA = {
  year: 2023,
  title: "Känguru der Mathematik 2023",
  subtitle: "Level: Écolier — Grade 3 + 4",
  timeMinutes: 60,
  startingPoints: 24,
  wrongPenaltyFraction: 0.25, // losing 1/4 of the question's points for a wrong answer
  tiers: [
    { from: 1, to: 8, points: 3, label: "3-point questions" },
    { from: 9, to: 16, points: 4, label: "4-point questions" },
    { from: 17, to: 24, points: 5, label: "5-point questions" }
  ],
  answerKey: {
    1: "D", 2: "C", 3: "C", 4: "E", 5: "C", 6: "A", 7: "C", 8: "E",
    9: "E", 10: "A", 11: "D", 12: "A", 13: "D", 14: "C", 15: "B", 16: "D",
    17: "D", 18: "B", 19: "B", 20: "D", 21: "B", 22: "B", 23: "D", 24: "E"
  },
  pages: [
    { image: "assets/2023/page1.png", questions: [1, 2, 3, 4, 5] },
    { image: "assets/2023/page2.png", questions: [6, 7, 8, 9, 10, 11, 12] },
    { image: "assets/2023/page3.png", questions: [13, 14, 15, 16, 17, 18] },
    { image: "assets/2023/page4.png", questions: [19, 20, 21, 22, 23, 24] }
  ]
};
