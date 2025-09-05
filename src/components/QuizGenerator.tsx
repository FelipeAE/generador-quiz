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

const QuizGenerator: React.FC = () => {
  const [jsonInput, setJsonInput] = useState('');
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [isRandomMode, setIsRandomMode] = useState(false);
  
  // Sistema de URLs con hash - funciona siempre, sin APIs externas

  // Cargar quiz desde enlace compartido al iniciar
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const gistId = urlParams.get('gist');
    const binId = urlParams.get('bin');
    const hash = window.location.hash;
    
    if (gistId) {
      loadQuizFromGist(gistId);
    } else if (binId) {
      loadQuizFromBin(binId);
    } else if (hash.includes('#quiz=')) {
      loadQuizFromHash();
    }
  }, []);

  const loadQuizFromGist = async (gistId: string) => {
    try {
      const response = await fetch(`https://api.github.com/gists/${gistId}`);
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      
      const gist = await response.json();
      const quizFile = gist.files['quiz.json'];
      
      if (!quizFile) {
        throw new Error('No se encontró el archivo quiz.json en el enlace');
      }
      
      const parsedData = JSON.parse(quizFile.content);
      
      if (!Array.isArray(parsedData) || parsedData.length === 0) {
        throw new Error('El quiz debe contener al menos una pregunta');
      }
      
      setJsonInput(JSON.stringify(parsedData, null, 2));
      // Auto-generar el quiz
      generateQuizFromData(parsedData);
      
      // Limpiar URL
      window.history.replaceState({}, document.title, window.location.pathname);
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error al cargar el quiz';
      alert(`❌ Error al cargar el quiz compartido: ${errorMsg}\n\n💡 Verifica que el enlace sea correcto y que tengas conexión a internet.`);
      
      // Limpiar URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  };

  const loadQuizFromBin = async (binId: string) => {
    try {
      const response = await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
        headers: {
          'X-Bin-Meta': 'false'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      const parsedData = data.quiz || data;
      
      if (!Array.isArray(parsedData) || parsedData.length === 0) {
        throw new Error('El quiz debe contener al menos una pregunta');
      }
      
      setJsonInput(JSON.stringify(parsedData, null, 2));
      // Auto-generar el quiz
      generateQuizFromData(parsedData);
      
      // Limpiar URL
      window.history.replaceState({}, document.title, window.location.pathname);
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error al cargar el quiz';
      alert(`❌ Error al cargar el quiz compartido: ${errorMsg}\n\n💡 Verifica que el enlace sea correcto y que tengas conexión a internet.`);
      
      // Limpiar URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  };


  const loadQuizFromHash = async () => {
    try {
      const hash = window.location.hash;
      const quizMatch = hash.match(/#quiz=(.+)/);
      
      if (!quizMatch) {
        throw new Error('Formato de enlace inválido');
      }
      
      const compressed = quizMatch[1];
      
      // Descomprimir el Base64
      const restored = compressed.replace(/-/g, '+').replace(/_/g, '/');
      const padding = '='.repeat((4 - restored.length % 4) % 4);
      const jsonString = atob(restored + padding);
      
      const parsedData = JSON.parse(jsonString);
      
      if (!Array.isArray(parsedData) || parsedData.length === 0) {
        throw new Error('El quiz debe contener al menos una pregunta');
      }
      
      setJsonInput(JSON.stringify(parsedData, null, 2));
      // Auto-generar el quiz
      generateQuizFromData(parsedData);
      
      // Limpiar hash
      window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error al cargar el quiz';
      alert(`❌ Error al cargar el quiz compartido: ${errorMsg}\n\n💡 Verifica que el enlace sea correcto y no esté corrupto.`);
      
      // Limpiar hash
      window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
    }
  };

  const exampleJson = `[
  {
    "question": "¿Cuál es la capital de Francia?",
    "choices": ["París", "Madrid", "Berlín", "Roma"],
    "answer": 0
  },
  {
    "question": "La Tierra es el tercer planeta del sistema solar",
    "choices": ["Verdadero", "Falso"],
    "answer": 0
  },
  {
    "question": "¿Cuál es el resultado de 2 + 2?",
    "choices": ["3", "4", "5", "6"],
    "answer": 1
  }
]`;

  const generateQuizFromData = (parsedData: QuizQuestion[]) => {
    if (!Array.isArray(parsedData)) {
      throw new Error('El JSON debe ser un array de preguntas');
    }

    parsedData.forEach((question, index) => {
      const isMultipleChoice = question.choices.length === 4;
      const isTrueFalse = question.choices.length === 2;
      const maxAnswer = question.choices.length - 1;
      
      if (!question.question || !Array.isArray(question.choices) || 
          (!isMultipleChoice && !isTrueFalse) || 
          typeof question.answer !== 'number' ||
          question.answer < 0 || question.answer > maxAnswer) {
        throw new Error(`Pregunta ${index + 1} debe tener 2 opciones (V/F) o 4 opciones (selección múltiple)`);
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
  };

  const generateQuiz = () => {
    try {
      const parsedData: QuizQuestion[] = JSON.parse(jsonInput);
      generateQuizFromData(parsedData);
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

  const shareResults = () => {
    if (!quizResult || !quizData) return;

    // Generar resumen de resultados para compartir
    const emoji = quizResult.percentage >= 70 ? '🎉' : '📚';
    const status = quizResult.percentage >= 70 ? '¡Aprobado!' : 'Necesito estudiar más';
    
    let shareText = `${emoji} Resultados del Quiz ${emoji}\n\n`;
    shareText += `📊 Puntuación: ${quizResult.score}/${quizResult.total} (${quizResult.percentage}%)\n`;
    shareText += `${status}\n\n`;
    
    // Agregar algunas respuestas incorrectas para contexto (máximo 3)
    const incorrectAnswers = quizData.questions
      .map((q, i) => ({
        question: q.question,
        correct: q.choices[q.answer],
        userAnswer: userAnswers[i] !== null ? q.choices[userAnswers[i] as number] : 'Sin responder',
        wasCorrect: userAnswers[i] !== null && userAnswers[i] === q.answer
      }))
      .filter(q => !q.wasCorrect)
      .slice(0, 3);
    
    if (incorrectAnswers.length > 0) {
      shareText += `❌ Respuestas a repasar:\n\n`;
      incorrectAnswers.forEach((q, index) => {
        shareText += `${index + 1}. ${q.question}\n`;
        shareText += `   ✅ Correcta: ${q.correct}\n`;
        shareText += `   ❌ Mi respuesta: ${q.userAnswer}\n\n`;
      });
      
      if (quizData.questions.length - quizResult.score > 3) {
        shareText += `... y ${quizData.questions.length - quizResult.score - 3} más\n\n`;
      }
    }
    
    shareText += `📝 Quiz generado con el Generador de Quiz Personalizado`;
    
    // Copiar al portapapeles
    navigator.clipboard.writeText(shareText).then(() => {
      alert(`📱 Resultados copiados al portapapeles!\n\nPuedes pegarlos en WhatsApp, redes sociales, o donde quieras compartir tu progreso.`);
    }).catch(() => {
      // Fallback si no se puede copiar
      prompt('📱 Copia este texto para compartir tus resultados:', shareText);
    });
  };

  const shareQuiz = () => {
    if (!quizData) return;
    
    const jsonString = JSON.stringify(quizData.questions, null, 2);
    const questionsCount = quizData.questions.length;
    
    // Copiar JSON al portapapeles
    navigator.clipboard.writeText(jsonString).then(() => {
      alert(
        `📋 Quiz copiado al portapapeles! (${questionsCount} preguntas)\n\n` +
        `💡 Para compartir:\n` +
        `1. Pega este texto donde quieras (WhatsApp, email, etc.)\n` +
        `2. La otra persona lo copia y pega en el campo de texto\n` +
        `3. Hace clic en "Generar Cuestionario"\n\n` +
        `✅ Funciona siempre, sin límites de tamaño.`
      );
    }).catch(() => {
      // Fallback si no se puede copiar
      prompt('📋 Copia este JSON para compartir:', jsonString);
    });
  };

  const shareQuizOnline = async () => {
    if (!quizData) return;
    
    const questionsCount = quizData.questions.length;
    
    // Obtener referencia del botón
    const button = document.querySelector('.btn-share-online') as HTMLButtonElement;
    const originalText = button?.textContent || '🔗 Compartir Online';
    
    try {
      // Mostrar indicador de carga
      if (button) {
        button.textContent = '⏳ Generando URL...';
        button.disabled = true;
      }
      
      // Comprimir JSON usando Base64 mejorado
      const jsonString = JSON.stringify(quizData.questions);
      
      // Usar compresión simple con Base64 URL-safe
      const compressed = btoa(jsonString)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
      
      const shareUrl = `${window.location.origin}${window.location.pathname}#quiz=${compressed}`;
      
      // Copiar URL al portapapeles
      await navigator.clipboard.writeText(shareUrl);
      
      // Calcular tamaño aproximado de la URL
      const urlLength = shareUrl.length;
      const sizeWarning = urlLength > 2000 ? '\n⚠️ URL larga - puede tener problemas en algunos servicios de mensajería' : '';
      
      alert(
        `🔗 URL de quiz generada y copiada! (${questionsCount} preguntas)\n\n` +
        `✅ Funciona inmediatamente sin servidor\n` +
        `✅ Sin límites ni expiración\n` +
        `✅ Completamente offline\n` +
        `📏 Tamaño: ${urlLength} caracteres${sizeWarning}\n\n` +
        `💡 Solo pega el enlace y la otra persona podrá acceder directamente al quiz.`
      );
      
    } catch (error) {
      console.error('Error al crear URL:', error);
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      
      alert(
        `❌ Error al generar URL: ${errorMsg}\n\n` +
        `💡 Como alternativa, usa "📋 Copiar JSON" para compartir manualmente.`
      );
    } finally {
      // Restaurar botón
      if (button) {
        button.textContent = originalText;
        button.disabled = false;
      }
    }
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
          <button onClick={shareResults} className="btn-secondary">
            📱 Compartir Resultados
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
          <div className={`choices ${currentQuestion.choices.length === 2 ? 'true-false' : ''}`}>
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

        <div className="quiz-actions">
          <button onClick={shareQuizOnline} className="btn-primary btn-share-online">
            🔗 Compartir Online
          </button>
          <button onClick={shareQuiz} className="btn-secondary">
            📋 Copiar JSON
          </button>
          <button onClick={resetQuiz} className="btn-danger">
            🗑️ Eliminar Quiz
          </button>
        </div>
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
          <p>Analiza el siguiente contenido y genera una cantidad personalizada de preguntas en formato JSON. Puedes crear preguntas de opción múltiple (4 alternativas) o verdadero/falso (2 alternativas). Pregunta primero al usuario cuántas preguntas desea generar (mínimo 20). Luego, entrega exclusivamente el bloque JSON con las preguntas, siguiendo la estructura exacta que se indica abajo.</p>
          <p><strong>Estructura esperada:</strong></p>
          <pre>{exampleJson}</pre>
          <p><strong>Reglas:</strong></p>
          <ul>
            <li>Preguntas de opción múltiple: exactamente 4 alternativas (campo "choices").</li>
            <li>Preguntas verdadero/falso: exactamente 2 alternativas ["Verdadero", "Falso"].</li>
            <li>El índice correcto va en el campo "answer" (0 para primera opción, 1 para segunda, etc.).</li>
            <li>No incluyas explicaciones, encabezados ni texto adicional fuera del JSON.</li>
            <li>El JSON debe estar bien formado para ser leído por una aplicación externa.</li>
            <li>La cantidad de preguntas debe ser la que indique el usuario (mínimo 20).</li>
            <li>El contenido debe estar basado en el texto que te entregó el usuario.</li>
          </ul>
          <p><strong>Idioma del cuestionario:</strong> El mismo del contenido entregado, o en español si no se especifica otro.</p>
        </div>
        <button onClick={() => navigator.clipboard.writeText(`Analiza el siguiente contenido y genera una cantidad personalizada de preguntas en formato JSON. Puedes crear preguntas de opción múltiple (4 alternativas) o verdadero/falso (2 alternativas). Pregunta primero al usuario cuántas preguntas desea generar (mínimo 20). Luego, entrega exclusivamente el bloque JSON con las preguntas, siguiendo la estructura exacta que se indica abajo.\n\nEstructura esperada:\n${exampleJson}\n\nReglas:\n- Preguntas de opción múltiple: exactamente 4 alternativas (campo "choices").\n- Preguntas verdadero/falso: exactamente 2 alternativas ["Verdadero", "Falso"].\n- El índice correcto va en el campo "answer" (0 para primera opción, 1 para segunda, etc.).\n- No incluyas explicaciones, encabezados ni texto adicional fuera del JSON.\n- El JSON debe estar bien formado para ser leído por una aplicación externa.\n- La cantidad de preguntas debe ser la que indique el usuario (mínimo 20).\n- El contenido debe estar basado en el texto que te entregó el usuario.\n\nIdioma del cuestionario: El mismo del contenido entregado, o en español si no se especifica otro.`)} className="btn-copy">
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