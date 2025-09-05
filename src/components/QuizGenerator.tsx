import React, { useState } from 'react';

type QuizQuestion = {
  question: string;
  choices: string[];
  answer: number;
};

type QuizData = {
  questions: QuizQuestion[];
};

type QuizResult = {
  score: number;
  total: number;
  percentage: number;
  answers: (number | null)[];
};

interface QuizGeneratorProps {}

const QuizGenerator: React.FC<QuizGeneratorProps> = () => {
  const [jsonInput, setJsonInput] = useState('');
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [isRandomMode, setIsRandomMode] = useState(false);

  const exampleJson = `[
  {
    "question": "¿Cuál es la capital de Francia?",
    "choices": ["París", "Madrid", "Berlín", "Roma"],
    "answer": 0
  },
  {
    "question": "¿Cuál es el resultado de 2 + 2?",
    "choices": ["3", "4", "5", "6"],
    "answer": 1
  }
]`;

  const generateQuiz = () => {
    try {
      const parsedData: QuizQuestion[] = JSON.parse(jsonInput);
      
      if (!Array.isArray(parsedData)) {
        throw new Error('El JSON debe ser un array de preguntas');
      }

      parsedData.forEach((question, index) => {
        if (!question.question || !Array.isArray(question.choices) || 
            question.choices.length !== 4 || typeof question.answer !== 'number' ||
            question.answer < 0 || question.answer > 3) {
          throw new Error(`Pregunta ${index + 1} tiene formato incorrecto`);
        }
      });

      let questions = parsedData;
      if (isRandomMode) {
        questions = [...parsedData].sort(() => Math.random() - 0.5);
      }

      setQuizData({ questions });
      setUserAnswers(new Array(questions.length).fill(null));
      setCurrentQuestionIndex(0);
      setShowResults(false);
      setQuizResult(null);
    } catch (error) {
      alert(`Error al procesar el JSON: ${(error as Error).message}`);
    }
  };

  const selectAnswer = (answerIndex: number) => {
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = answerIndex;
    setUserAnswers(newAnswers);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < (quizData?.questions.length || 0) - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const finishQuiz = () => {
    if (!quizData) return;

    const score = userAnswers.reduce((total: number, answer, index) => {
      if (answer !== null && answer === quizData.questions[index].answer) {
        return total + 1;
      }
      return total;
    }, 0);

    const total = quizData.questions.length;
    const percentage = Math.round((score / total) * 100);

    setQuizResult({
      score,
      total,
      percentage,
      answers: userAnswers
    });
    setShowResults(true);
  };

  const resetQuiz = () => {
    setQuizData(null);
    setCurrentQuestionIndex(0);
    setUserAnswers([]);
    setShowResults(false);
    setQuizResult(null);
    setJsonInput('');
  };

  const downloadResults = () => {
    if (!quizResult || !quizData) return;

    const results = {
      score: quizResult.score,
      total: quizResult.total,
      percentage: quizResult.percentage,
      questions: quizData.questions.map((q, i) => ({
        question: q.question,
        correctAnswer: q.choices[q.answer],
        userAnswer: userAnswers[i] !== null ? q.choices[userAnswers[i] as number] : 'Sin responder',
        correct: userAnswers[i] !== null && userAnswers[i] === q.answer
      }))
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(results, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "quiz-results.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  if (showResults && quizResult && quizData) {
    return (
      <div className="quiz-container">
        <h1>¡Resultados del Quiz!</h1>
        <div className="results-summary">
          <h2>Puntuación: {quizResult.score}/{quizResult.total} ({quizResult.percentage}%)</h2>
          <div className={`grade ${quizResult.percentage >= 70 ? 'pass' : 'fail'}`}>
            {quizResult.percentage >= 70 ? '¡Aprobado!' : 'Necesitas mejorar'}
          </div>
        </div>

        <div className="results-detail">
          <h3>Respuestas detalladas:</h3>
          {quizData.questions.map((question, index) => (
            <div key={index} className="result-item">
              <h4>{index + 1}. {question.question}</h4>
              <p><strong>Respuesta correcta:</strong> {question.choices[question.answer]}</p>
              <p><strong>Tu respuesta:</strong> 
                <span className={userAnswers[index] !== null && userAnswers[index] === question.answer ? 'correct' : 'incorrect'}>
                  {userAnswers[index] !== null ? question.choices[userAnswers[index] as number] : 'Sin responder'}
                </span>
              </p>
            </div>
          ))}
        </div>

        <div className="results-actions">
          <button onClick={downloadResults} className="btn-download">
            📥 Descargar Resultados
          </button>
          <button onClick={resetQuiz} className="btn-primary">
            🔄 Nuevo Quiz
          </button>
        </div>
      </div>
    );
  }

  if (quizData) {
    const currentQuestion = quizData.questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / quizData.questions.length) * 100;

    return (
      <div className="quiz-container">
        <div className="quiz-header">
          <h1>Quiz Personalizado</h1>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
          <p>Pregunta {currentQuestionIndex + 1} de {quizData.questions.length}</p>
        </div>

        <div className="question-container">
          <h2>{currentQuestion.question}</h2>
          <div className="choices">
            {currentQuestion.choices.map((choice, index) => (
              <button
                key={index}
                className={`choice ${userAnswers[currentQuestionIndex] === index ? 'selected' : ''}`}
                onClick={() => selectAnswer(index)}
              >
                {choice}
              </button>
            ))}
          </div>
        </div>

        <div className="quiz-navigation">
          <button 
            onClick={prevQuestion} 
            disabled={currentQuestionIndex === 0}
            className="btn-secondary"
          >
            ← Anterior
          </button>
          
          {currentQuestionIndex === quizData.questions.length - 1 ? (
            <button onClick={finishQuiz} className="btn-primary">
              🎯 Finalizar Quiz
            </button>
          ) : (
            <button onClick={nextQuestion} className="btn-primary">
              Siguiente →
            </button>
          )}
        </div>

        <button onClick={resetQuiz} className="btn-danger">
          🗑️ Eliminar Quiz
        </button>
      </div>
    );
  }

  return (
    <div className="quiz-container">
      <h1>¡Crea tu Quiz Personalizado!</h1>
      <p>Pega o escribe el archivo JSON con tus preguntas y genera tu cuestionario en segundos.</p>

      <div className="json-input-section">
        <h3>Archivo JSON de preguntas</h3>
        <textarea
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
          placeholder={`Ejemplo: ${exampleJson}`}
          className="json-textarea"
          rows={10}
        />
      </div>

      <div className="options">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={isRandomMode}
            onChange={(e) => setIsRandomMode(e.target.checked)}
          />
          Preguntas aleatorias
        </label>
      </div>

      <div className="instructions">
        <h4>📋 Ver Indicaciones</h4>
        <div className="instructions-content">
          <ol>
            <li><strong>Abre tu IA favorita</strong> (como ChatGPT, Gemini o cualquier otra).</li>
            <li><strong>Súbele tu PDF</strong> o pregúntale sobre el contenido que quieras estudiar.</li>
            <li><strong>Copia el siguiente prompt</strong> y pégalo al final del texto entregado a la IA.</li>
            <li><strong>La IA te entregará un archivo o bloque de texto</strong> en formato JSON como este:</li>
            <pre>{exampleJson}</pre>
            <li><strong>Copia o sube el archivo de texto generado por la IA</strong> y pégalo en esta página (en el campo grande abajo de "Ingresar JSON").</li>
            <li><strong>Haz clic en "Generar Cuestionario"</strong> y listo 🎉.</li>
          </ol>
        </div>
      </div>

      <div className="prompt-section">
        <h4>Prompt para IA:</h4>
        <div className="prompt-text">
          <p>Analiza el siguiente contenido y genera una cantidad personalizada de preguntas de opción múltiple en formato JSON. Pregunta primero al usuario cuántas preguntas desea generar (mínimo 20). Luego, entrega exclusivamente el bloque JSON con las preguntas, siguiendo la estructura exacta que se indica abajo.</p>
          <p><strong>Estructura esperada:</strong></p>
          <pre>{exampleJson}</pre>
          <p><strong>Reglas:</strong></p>
          <ul>
            <li>Cada pregunta debe tener exactamente 4 alternativas (campo "choices").</li>
            <li>El índice correcto va en el campo "answer" (de 0 a 3).</li>
            <li>No incluyas explicaciones, encabezados ni texto adicional fuera del JSON.</li>
            <li>El JSON debe estar bien formado para ser leído por una aplicación externa.</li>
            <li>La cantidad de preguntas debe ser la que indique el usuario (mínimo 20).</li>
            <li>El contenido debe estar basado en el texto que te entregó el usuario.</li>
          </ul>
          <p><strong>Idioma del cuestionario:</strong> El mismo del contenido entregado, o en español si no se especifica otro.</p>
        </div>
        <button onClick={() => navigator.clipboard.writeText("Analiza el siguiente contenido y genera una cantidad personalizada de preguntas de opción múltiple en formato JSON. Pregunta primero al usuario cuántas preguntas desea generar (mínimo 20). Luego, entrega exclusivamente el bloque JSON con las preguntas, siguiendo la estructura exacta que se indica abajo.\n\nEstructura esperada:\n[\n  {\n    \"question\": \"¿Cuál es la capital de Francia?\",\n    \"choices\": [\"París\", \"Madrid\", \"Berlín\", \"Roma\"],\n    \"answer\": 0\n  },\n  {\n    \"question\": \"¿Cuál es el resultado de 2 + 2?\",\n    \"choices\": [\"3\", \"4\", \"5\", \"6\"],\n    \"answer\": 1\n  }\n]\n\nReglas:\n- Cada pregunta debe tener exactamente 4 alternativas (campo \"choices\").\n- El índice correcto va en el campo \"answer\" (de 0 a 3).\n- No incluyas explicaciones, encabezados ni texto adicional fuera del JSON.\n- El JSON debe estar bien formado para ser leído por una aplicación externa.\n- La cantidad de preguntas debe ser la que indique el usuario (mínimo 20).\n- El contenido debe estar basado en el texto que te entregó el usuario.\n\nIdioma del cuestionario: El mismo del contenido entregado, o en español si no se especifica otro.")} className="btn-copy">
          🗂 Copiar con Prompt para IA
        </button>
      </div>

      <div className="actions">
        <button onClick={generateQuiz} className="btn-generate">
          🪄 Generar Cuestionario
        </button>
      </div>
    </div>
  );
};

export default QuizGenerator;