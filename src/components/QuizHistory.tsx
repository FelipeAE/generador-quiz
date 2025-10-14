import React, { useState, useEffect } from 'react';
import { getSavedQuizzes, deleteSavedQuiz, formatDate, type SavedQuiz } from '../utils/quizStorage';

interface QuizHistoryProps {
  onLoadQuiz: (quiz: SavedQuiz) => void;
  onClose: () => void;
}

const QuizHistory: React.FC<QuizHistoryProps> = ({ onLoadQuiz, onClose }) => {
  const [savedQuizzes, setSavedQuizzes] = useState<SavedQuiz[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadQuizzes();
  }, []);

  const loadQuizzes = () => {
    const quizzes = getSavedQuizzes();
    setSavedQuizzes(quizzes);
  };

  const handleDelete = (quizId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (confirm('¿Estás seguro de que quieres eliminar este quiz?')) {
      deleteSavedQuiz(quizId);
      loadQuizzes();
    }
  };

  const filteredQuizzes = savedQuizzes.filter(quiz =>
    quiz.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content quiz-history-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📚 Historial de Quizzes</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="search-bar">
          <input
            type="text"
            placeholder="🔍 Buscar quiz..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="quiz-history-list">
          {filteredQuizzes.length === 0 ? (
            <div className="empty-state">
              <p>📭 No hay quizzes guardados</p>
              <small>Los quizzes se guardan automáticamente cuando los generas</small>
            </div>
          ) : (
            filteredQuizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="quiz-history-item"
                onClick={() => {
                  onLoadQuiz(quiz);
                  onClose();
                }}
              >
                <div className="quiz-history-info">
                  <h3>{quiz.name}</h3>
                  <div className="quiz-history-meta">
                    <span>📝 {quiz.data.questions.length} preguntas</span>
                    <span>🕐 {formatDate(quiz.lastUsed)}</span>
                    <span>🎯 Jugado {quiz.timesPlayed} {quiz.timesPlayed === 1 ? 'vez' : 'veces'}</span>
                    {quiz.bestScore !== undefined && (
                      <span className="best-score">⭐ Mejor: {quiz.bestScore}%</span>
                    )}
                  </div>
                </div>
                <div className="quiz-history-actions">
                  <button
                    className="btn-delete-small"
                    onClick={(e) => handleDelete(quiz.id, e)}
                    title="Eliminar quiz"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {savedQuizzes.length > 0 && (
          <div className="quiz-history-stats">
            <p>Total: {savedQuizzes.length} quizzes guardados</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizHistory;
