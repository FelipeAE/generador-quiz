export type QuizQuestion = {
  question: string;
  choices: string[];
  answer: number;
  explanation?: string; // Optional explanation for study mode
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