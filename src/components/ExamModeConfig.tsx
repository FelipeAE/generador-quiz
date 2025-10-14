import React, { useState } from 'react';

interface ExamModeConfigProps {
  onStart: (timerMinutes: number) => void;
  onCancel: () => void;
  questionCount: number;
}

const ExamModeConfig: React.FC<ExamModeConfigProps> = ({ onStart, onCancel, questionCount }) => {
  const [timerMinutes, setTimerMinutes] = useState(30);

  const presetTimes = [15, 30, 45, 60, 90];
  const suggestedTime = Math.max(15, Math.ceil(questionCount * 1.5)); // 1.5 min por pregunta

  const handleStart = () => {
    if (timerMinutes < 1 || timerMinutes > 180) {
      alert('El tiempo debe estar entre 1 y 180 minutos');
      return;
    }
    onStart(timerMinutes);
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content exam-config-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🎓 Configurar Modo Examen</h2>
          <button className="modal-close" onClick={onCancel}>✕</button>
        </div>

        <div className="exam-config-content">
          <div className="exam-info">
            <p>
              El modo examen simula condiciones reales de evaluación:
            </p>
            <ul>
              <li>⏱️ Temporizador cuenta regresiva</li>
              <li>🚫 No puedes volver atrás a preguntas anteriores</li>
              <li>⚠️ El quiz termina automáticamente cuando se acaba el tiempo</li>
              <li>📊 Resultados guardados con estadísticas de tiempo</li>
            </ul>
          </div>

          <div className="timer-config">
            <h3>⏰ Configurar Tiempo</h3>
            <p className="config-subtitle">
              Este quiz tiene {questionCount} preguntas
            </p>

            <div className="preset-times">
              {presetTimes.map(time => (
                <button
                  key={time}
                  className={`preset-btn ${timerMinutes === time ? 'active' : ''}`}
                  onClick={() => setTimerMinutes(time)}
                >
                  {time} min
                </button>
              ))}
            </div>

            <div className="custom-timer">
              <label htmlFor="custom-time">Tiempo personalizado (minutos):</label>
              <input
                id="custom-time"
                type="number"
                min="1"
                max="180"
                value={timerMinutes}
                onChange={(e) => setTimerMinutes(parseInt(e.target.value) || 30)}
                className="timer-input"
              />
            </div>

            <div className="timer-suggestion">
              💡 Tiempo sugerido: <strong>{suggestedTime} minutos</strong>
              <br />
              <small>(~1.5 min por pregunta)</small>
              <button
                className="btn-suggestion"
                onClick={() => setTimerMinutes(suggestedTime)}
              >
                Usar sugerido
              </button>
            </div>
          </div>

          <div className="exam-warnings">
            <h4>⚠️ Advertencias</h4>
            <ul>
              <li>No podrás pausar el examen una vez iniciado</li>
              <li>No podrás revisar respuestas anteriores</li>
              <li>El examen se enviará automáticamente al terminar el tiempo</li>
            </ul>
          </div>

          <div className="exam-actions">
            <button className="btn-secondary" onClick={onCancel}>
              Cancelar
            </button>
            <button className="btn-exam-start" onClick={handleStart}>
              🎓 Iniciar Examen ({timerMinutes} min)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamModeConfig;
