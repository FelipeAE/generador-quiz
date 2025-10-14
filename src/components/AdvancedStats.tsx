import React from 'react';
import type { QuizResult, QuizData } from '../types/quiz';
import { formatTime } from '../utils/quizStorage';

interface AdvancedStatsProps {
  result: QuizResult;
  quizData: QuizData;
  timeSpent: number;
  previousAttempts?: number;
  averageScore?: number;
  trend?: 'improving' | 'declining' | 'stable';
}

const AdvancedStats: React.FC<AdvancedStatsProps> = ({
  result,
  quizData,
  timeSpent,
  previousAttempts,
  averageScore,
  trend
}) => {
  // Calcular estadísticas avanzadas
  const totalQuestions = quizData.questions.length;
  const avgTimePerQuestion = Math.round(timeSpent / totalQuestions);

  // Preguntas por dificultad (basado en si acertó o no)
  const correctAnswers = result.answers.filter(
    (answer, index) => answer !== null && answer === quizData.questions[index].answer
  ).length;

  const incorrectAnswers = result.answers.filter(
    (answer, index) => answer !== null && answer !== quizData.questions[index].answer
  ).length;

  const unanswered = result.answers.filter(answer => answer === null).length;

  // Progreso visual
  const accuracyPercentage = result.percentage;

  // Análisis de tipos de preguntas
  const trueFalseQuestions = quizData.questions.filter(q => q.choices.length === 2);
  const multipleChoiceQuestions = quizData.questions.filter(q => q.choices.length === 4);

  const trueFalseCorrect = trueFalseQuestions.filter((q) => {
    const qIndex = quizData.questions.indexOf(q);
    return result.answers[qIndex] === q.answer;
  }).length;

  const multipleChoiceCorrect = multipleChoiceQuestions.filter((q) => {
    const qIndex = quizData.questions.indexOf(q);
    return result.answers[qIndex] === q.answer;
  }).length;

  const getTrendEmoji = () => {
    if (!trend) return '';
    switch (trend) {
      case 'improving': return '📈';
      case 'declining': return '📉';
      case 'stable': return '➡️';
    }
  };

  const getTrendText = () => {
    if (!trend) return '';
    switch (trend) {
      case 'improving': return 'Mejorando';
      case 'declining': return 'Bajando';
      case 'stable': return 'Estable';
    }
  };

  return (
    <div className="advanced-stats">
      <h3 className="stats-title">📊 Estadísticas Detalladas</h3>

      {/* Resumen General */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">⏱️</div>
          <div className="stat-content">
            <div className="stat-value">{formatTime(timeSpent)}</div>
            <div className="stat-label">Tiempo Total</div>
            <div className="stat-sublabel">{avgTimePerQuestion}s por pregunta</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-content">
            <div className="stat-value">{accuracyPercentage}%</div>
            <div className="stat-label">Precisión</div>
            <div className="stat-sublabel">{correctAnswers}/{totalQuestions} correctas</div>
          </div>
        </div>

        {previousAttempts !== undefined && previousAttempts > 0 && (
          <div className="stat-card">
            <div className="stat-icon">🔄</div>
            <div className="stat-content">
              <div className="stat-value">{previousAttempts}</div>
              <div className="stat-label">Intentos Previos</div>
              {averageScore !== undefined && (
                <div className="stat-sublabel">Promedio: {averageScore}%</div>
              )}
            </div>
          </div>
        )}

        {trend && (
          <div className="stat-card">
            <div className="stat-icon">{getTrendEmoji()}</div>
            <div className="stat-content">
              <div className="stat-value">{getTrendText()}</div>
              <div className="stat-label">Tendencia</div>
              <div className="stat-sublabel">Últimos intentos</div>
            </div>
          </div>
        )}
      </div>

      {/* Progreso Visual */}
      <div className="stats-section">
        <h4>Distribución de Respuestas</h4>
        <div className="answers-breakdown">
          <div className="breakdown-item correct">
            <div className="breakdown-bar" style={{ width: `${(correctAnswers / totalQuestions) * 100}%` }}>
              <span>{correctAnswers}</span>
            </div>
            <span className="breakdown-label">✅ Correctas</span>
          </div>
          <div className="breakdown-item incorrect">
            <div className="breakdown-bar" style={{ width: `${(incorrectAnswers / totalQuestions) * 100}%` }}>
              <span>{incorrectAnswers}</span>
            </div>
            <span className="breakdown-label">❌ Incorrectas</span>
          </div>
          {unanswered > 0 && (
            <div className="breakdown-item unanswered">
              <div className="breakdown-bar" style={{ width: `${(unanswered / totalQuestions) * 100}%` }}>
                <span>{unanswered}</span>
              </div>
              <span className="breakdown-label">⚪ Sin responder</span>
            </div>
          )}
        </div>
      </div>

      {/* Análisis por tipo */}
      {trueFalseQuestions.length > 0 && multipleChoiceQuestions.length > 0 && (
        <div className="stats-section">
          <h4>Rendimiento por Tipo de Pregunta</h4>
          <div className="type-analysis">
            <div className="type-item">
              <span className="type-label">Verdadero/Falso</span>
              <div className="type-bar">
                <div
                  className="type-fill"
                  style={{ width: `${(trueFalseCorrect / trueFalseQuestions.length) * 100}%` }}
                ></div>
              </div>
              <span className="type-percentage">
                {Math.round((trueFalseCorrect / trueFalseQuestions.length) * 100)}%
                ({trueFalseCorrect}/{trueFalseQuestions.length})
              </span>
            </div>
            <div className="type-item">
              <span className="type-label">Opción Múltiple</span>
              <div className="type-bar">
                <div
                  className="type-fill"
                  style={{ width: `${(multipleChoiceCorrect / multipleChoiceQuestions.length) * 100}%` }}
                ></div>
              </div>
              <span className="type-percentage">
                {Math.round((multipleChoiceCorrect / multipleChoiceQuestions.length) * 100)}%
                ({multipleChoiceCorrect}/{multipleChoiceQuestions.length})
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Comparación con intentos anteriores */}
      {averageScore !== undefined && (
        <div className="stats-section">
          <h4>Comparación con Promedio</h4>
          <div className="comparison">
            <div className="comparison-bars">
              <div className="comparison-bar">
                <div className="comparison-label">Este intento</div>
                <div className="comparison-fill-container">
                  <div
                    className="comparison-fill current"
                    style={{ width: `${accuracyPercentage}%` }}
                  >
                    <span>{accuracyPercentage}%</span>
                  </div>
                </div>
              </div>
              <div className="comparison-bar">
                <div className="comparison-label">Promedio</div>
                <div className="comparison-fill-container">
                  <div
                    className="comparison-fill average"
                    style={{ width: `${averageScore}%` }}
                  >
                    <span>{averageScore}%</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="comparison-summary">
              {accuracyPercentage > averageScore ? (
                <span className="improvement">🎉 ¡{accuracyPercentage - averageScore}% mejor que tu promedio!</span>
              ) : accuracyPercentage < averageScore ? (
                <span className="decline">📚 {averageScore - accuracyPercentage}% por debajo de tu promedio</span>
              ) : (
                <span className="stable">➡️ Igual a tu promedio</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedStats;
