import React, { useState, useEffect, useRef } from 'react';
import { formatTime } from '../utils/quizStorage';

interface ExamTimerProps {
  totalSeconds: number;
  onTimeUp: () => void;
  isPaused?: boolean;
}

const ExamTimer: React.FC<ExamTimerProps> = ({ totalSeconds, onTimeUp, isPaused = false }) => {
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const intervalRef = useRef<number | null>(null);
  const hasWarned = useRef(false);
  const hasCalledTimeUp = useRef(false);

  useEffect(() => {
    if (isPaused) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = window.setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          if (!hasCalledTimeUp.current) {
            hasCalledTimeUp.current = true;
            onTimeUp();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPaused, onTimeUp]);

  // Advertencia cuando quedan 5 minutos
  useEffect(() => {
    if (secondsLeft === 300 && !hasWarned.current) {
      hasWarned.current = true;
      // Pequeño efecto de vibración si está disponible
      if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200]);
      }
    }
  }, [secondsLeft]);

  const percentage = (secondsLeft / totalSeconds) * 100;
  const minutes = Math.floor(secondsLeft / 60);
  const isLowTime = secondsLeft <= 300; // Menos de 5 minutos
  const isCritical = secondsLeft <= 60; // Menos de 1 minuto

  const getTimerClass = () => {
    if (isCritical) return 'timer-critical';
    if (isLowTime) return 'timer-warning';
    return 'timer-normal';
  };

  return (
    <div className={`exam-timer ${getTimerClass()}`}>
      <div className="timer-icon">
        {isCritical ? '⏰' : isLowTime ? '⏱️' : '⏲️'}
      </div>
      <div className="timer-display">
        <div className="timer-time">{formatTime(secondsLeft)}</div>
        <div className="timer-progress">
          <div
            className="timer-progress-fill"
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>
      {isLowTime && !isCritical && (
        <div className="timer-warning-text">
          {minutes} min restantes
        </div>
      )}
      {isCritical && (
        <div className="timer-critical-text">
          ¡Tiempo terminando!
        </div>
      )}
    </div>
  );
};

export default ExamTimer;
