// Quiz Storage Utility - LocalStorage management
import type { QuizData, QuizResult } from '../types/quiz';

export interface SavedQuiz {
  id: string;
  name: string;
  data: QuizData;
  createdAt: number;
  lastUsed: number;
  timesPlayed: number;
  bestScore?: number;
}

export interface QuizAttempt {
  quizId: string;
  quizName: string;
  result: QuizResult;
  timestamp: number;
  timeSpent: number; // in seconds
  examMode: boolean;
  timerUsed?: number; // timer duration if exam mode
}

const STORAGE_KEYS = {
  SAVED_QUIZZES: 'generador_quiz_saved',
  QUIZ_ATTEMPTS: 'generador_quiz_attempts',
  CURRENT_QUIZ: 'generador_quiz_current',
  SETTINGS: 'generador_quiz_settings'
};

const MAX_SAVED_QUIZZES = 20;
const MAX_ATTEMPTS = 100;

// ==================== SAVED QUIZZES ====================

export const saveQuiz = (name: string, data: QuizData): SavedQuiz => {
  const savedQuizzes = getSavedQuizzes();

  const newQuiz: SavedQuiz = {
    id: generateId(),
    name: name || `Quiz ${new Date().toLocaleDateString()}`,
    data,
    createdAt: Date.now(),
    lastUsed: Date.now(),
    timesPlayed: 0
  };

  // Add to beginning, limit to MAX_SAVED_QUIZZES
  const updatedQuizzes = [newQuiz, ...savedQuizzes].slice(0, MAX_SAVED_QUIZZES);

  localStorage.setItem(STORAGE_KEYS.SAVED_QUIZZES, JSON.stringify(updatedQuizzes));

  return newQuiz;
};

export const getSavedQuizzes = (): SavedQuiz[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SAVED_QUIZZES);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading saved quizzes:', error);
    return [];
  }
};

export const deleteSavedQuiz = (quizId: string): void => {
  const savedQuizzes = getSavedQuizzes();
  const filtered = savedQuizzes.filter(q => q.id !== quizId);
  localStorage.setItem(STORAGE_KEYS.SAVED_QUIZZES, JSON.stringify(filtered));

  // Also delete related attempts
  const attempts = getQuizAttempts();
  const filteredAttempts = attempts.filter(a => a.quizId !== quizId);
  localStorage.setItem(STORAGE_KEYS.QUIZ_ATTEMPTS, JSON.stringify(filteredAttempts));
};

export const updateQuizUsage = (quizId: string, score?: number): void => {
  const savedQuizzes = getSavedQuizzes();
  const updated = savedQuizzes.map(quiz => {
    if (quiz.id === quizId) {
      return {
        ...quiz,
        lastUsed: Date.now(),
        timesPlayed: quiz.timesPlayed + 1,
        bestScore: score !== undefined && (quiz.bestScore === undefined || score > quiz.bestScore)
          ? score
          : quiz.bestScore
      };
    }
    return quiz;
  });

  localStorage.setItem(STORAGE_KEYS.SAVED_QUIZZES, JSON.stringify(updated));
};

export const loadQuizById = (quizId: string): SavedQuiz | null => {
  const savedQuizzes = getSavedQuizzes();
  return savedQuizzes.find(q => q.id === quizId) || null;
};

// ==================== QUIZ ATTEMPTS ====================

export const saveAttempt = (
  quizId: string,
  quizName: string,
  result: QuizResult,
  timeSpent: number,
  examMode: boolean,
  timerUsed?: number
): void => {
  const attempts = getQuizAttempts();

  const newAttempt: QuizAttempt = {
    quizId,
    quizName,
    result,
    timestamp: Date.now(),
    timeSpent,
    examMode,
    timerUsed
  };

  // Add to beginning, limit to MAX_ATTEMPTS
  const updatedAttempts = [newAttempt, ...attempts].slice(0, MAX_ATTEMPTS);

  localStorage.setItem(STORAGE_KEYS.QUIZ_ATTEMPTS, JSON.stringify(updatedAttempts));
};

export const getQuizAttempts = (quizId?: string): QuizAttempt[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.QUIZ_ATTEMPTS);
    const attempts: QuizAttempt[] = data ? JSON.parse(data) : [];

    if (quizId) {
      return attempts.filter(a => a.quizId === quizId);
    }

    return attempts;
  } catch (error) {
    console.error('Error loading quiz attempts:', error);
    return [];
  }
};

export const clearAllAttempts = (): void => {
  localStorage.removeItem(STORAGE_KEYS.QUIZ_ATTEMPTS);
};

// ==================== CURRENT QUIZ (AUTO-SAVE) ====================

export const saveCurrentQuiz = (jsonInput: string): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.CURRENT_QUIZ, jsonInput);
  } catch (error) {
    console.error('Error saving current quiz:', error);
  }
};

export const getCurrentQuiz = (): string | null => {
  try {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_QUIZ);
  } catch (error) {
    console.error('Error loading current quiz:', error);
    return null;
  }
};

export const clearCurrentQuiz = (): void => {
  localStorage.removeItem(STORAGE_KEYS.CURRENT_QUIZ);
};

// ==================== SETTINGS ====================

export interface QuizSettings {
  darkMode: boolean;
  defaultExamMode: boolean;
  defaultTimerMinutes: number;
  autoSave: boolean;
  soundEnabled: boolean;
}

const DEFAULT_SETTINGS: QuizSettings = {
  darkMode: false,
  defaultExamMode: false,
  defaultTimerMinutes: 30,
  autoSave: true,
  soundEnabled: false
};

export const getSettings = (): QuizSettings => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
  } catch (error) {
    console.error('Error loading settings:', error);
    return DEFAULT_SETTINGS;
  }
};

export const saveSettings = (settings: Partial<QuizSettings>): void => {
  try {
    const currentSettings = getSettings();
    const updatedSettings = { ...currentSettings, ...settings };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updatedSettings));
  } catch (error) {
    console.error('Error saving settings:', error);
  }
};

// ==================== STATISTICS ====================

export const getQuizStatistics = (quizId?: string) => {
  const attempts = getQuizAttempts(quizId);

  if (attempts.length === 0) {
    return null;
  }

  const scores = attempts.map(a => a.result.percentage);
  const times = attempts.map(a => a.timeSpent);

  return {
    totalAttempts: attempts.length,
    averageScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
    bestScore: Math.max(...scores),
    worstScore: Math.min(...scores),
    averageTime: Math.round(times.reduce((a, b) => a + b, 0) / times.length),
    lastAttempt: attempts[0].timestamp,
    trend: calculateTrend(scores)
  };
};

const calculateTrend = (scores: number[]): 'improving' | 'declining' | 'stable' => {
  if (scores.length < 3) return 'stable';

  const recent = scores.slice(0, 3);
  const older = scores.slice(3, 6);

  if (older.length === 0) return 'stable';

  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;

  const diff = recentAvg - olderAvg;

  if (diff > 5) return 'improving';
  if (diff < -5) return 'declining';
  return 'stable';
};

// ==================== UTILITIES ====================

const generateId = (): string => {
  return `quiz_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// ==================== EXPORT/IMPORT ====================

export const exportAllData = () => {
  return {
    quizzes: getSavedQuizzes(),
    attempts: getQuizAttempts(),
    settings: getSettings(),
    exportDate: Date.now()
  };
};

export const importAllData = (data: any): boolean => {
  try {
    if (data.quizzes) {
      localStorage.setItem(STORAGE_KEYS.SAVED_QUIZZES, JSON.stringify(data.quizzes));
    }
    if (data.attempts) {
      localStorage.setItem(STORAGE_KEYS.QUIZ_ATTEMPTS, JSON.stringify(data.attempts));
    }
    if (data.settings) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data.settings));
    }
    return true;
  } catch (error) {
    console.error('Error importing data:', error);
    return false;
  }
};

export const clearAllData = (): void => {
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
};
