export type QuizQuestion = {
  question: string;
  choices: string[];
  answer: number;
};

export type QuizData = {
  questions: QuizQuestion[];
};

export type QuizResult = {
  score: number;
  total: number;
  percentage: number;
  answers: (number | null)[];
};