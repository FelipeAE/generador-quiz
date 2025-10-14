import React, { useState, useEffect, useRef } from 'react';
import FileUploader from './FileUploader';
import TextExtractor from './TextExtractor';
import QuizHistory from './QuizHistory';
import ExamTimer from './ExamTimer';
import ExamModeConfig from './ExamModeConfig';
import AdvancedStats from './AdvancedStats';
import ThemeSelector from './ThemeSelector';
import {
  saveQuiz,
  saveAttempt,
  updateQuizUsage,
  getQuizStatistics,
  saveCurrentQuiz,
  getCurrentQuiz,
  clearCurrentQuiz,
  type SavedQuiz
} from '../utils/quizStorage';

type QuizQuestion = {
  question: string;
  choices: string[];
  answer: number;
  explanation?: string;
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
  const [isUrlShortening, setIsUrlShortening] = useState(false);
  const [extractedText, setExtractedText] = useState('');
  // const [extractedFiles] = useState<any[]>([]);

  // Nuevas funcionalidades
  const [showHistory, setShowHistory] = useState(false);
  const [currentQuizId, setCurrentQuizId] = useState<string | null>(null);
  const [currentQuizName, setCurrentQuizName] = useState<string>('');
  const [examMode, setExamMode] = useState(false);
  const [showExamConfig, setShowExamConfig] = useState(false);
  const [examTimerSeconds, setExamTimerSeconds] = useState(0);
  const [quizStartTime, setQuizStartTime] = useState<number>(0);
  const timerRef = useRef<number>(0);

  // Modo de Estudio
  const [studyMode, setStudyMode] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [markedQuestions, setMarkedQuestions] = useState<Set<number>>(new Set());
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  
  // Sistema de URLs con hash + compresión LZ - funciona siempre, sin APIs externas
  
  // Compresión simple y segura para URLs más cortas
  const compressString = (str: string): string => {
    // Usar compresión por repetición de patrones comunes
    let compressed = str;
    
    // Reemplazar patrones comunes en JSON de quiz
    const patterns = [
      ['"question":"', '§q§'],
      ['"choices":[', '§c§'],
      ['"answer":', '§a§'],
      ['","', '§,§'],
      ['"}', '§}§'],
      ['{"', '§{§'],
      ['],"', '§],§'],
      ['true', '§T§'],
      ['false', '§F§']
    ];
    
    patterns.forEach(([pattern, replacement]) => {
      compressed = compressed.split(pattern).join(replacement);
    });
    
    return compressed;
  };

  const decompressString = (compressed: string): string => {
    // Restaurar patrones
    let decompressed = compressed;
    
    const patterns = [
      ['§q§', '"question":"'],
      ['§c§', '"choices":['],
      ['§a§', '"answer":'],
      ['§,§', '","'],
      ['§}§', '"}'],
      ['§{§', '{"'],
      ['§],§', '],"'],
      ['§T§', 'true'],
      ['§F§', 'false']
    ];
    
    patterns.forEach(([pattern, replacement]) => {
      decompressed = decompressed.split(pattern).join(replacement);
    });
    
    return decompressed;
  };

  // Función para acortar URLs usando TinyURL API
  const shortenUrl = async (longUrl: string): Promise<string> => {
    try {
      const response = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(longUrl)}`);
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      
      const shortUrl = await response.text();
      
      // Verificar que la respuesta sea una URL válida
      if (shortUrl.startsWith('http') && shortUrl.includes('tinyurl.com')) {
        return shortUrl;
      } else {
        throw new Error('Respuesta inválida del servicio de acortado');
      }
    } catch (error) {
      console.error('Error al acortar URL:', error);
      throw error;
    }
  };

  // Cargar quiz desde enlace compartido al iniciar O recuperar autoguardado
  useEffect(() => {
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
    } else {
      // Recuperar quiz autoguardado si existe
      const savedInput = getCurrentQuiz();
      if (savedInput && savedInput.length > 0) {
        setJsonInput(savedInput);
      }
    }

    // Cargar tema guardado
    const savedTheme = localStorage.getItem('app-theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  // Autoguardado del JSON input cada 3 segundos
  useEffect(() => {
    if (jsonInput && jsonInput.length > 10 && !quizData) {
      const timeoutId = setTimeout(() => {
        saveCurrentQuiz(jsonInput);
      }, 3000);

      return () => clearTimeout(timeoutId);
    }
  }, [jsonInput, quizData]);

  // Iniciar tracking de tiempo cuando comienza el quiz
  useEffect(() => {
    if (quizData && !showResults) {
      setQuizStartTime(Date.now());
      timerRef.current = Date.now();
    }
  }, [quizData, showResults]);

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
      
      // Descomprimir: Base64 → LZ → JSON
      const restored = compressed.replace(/-/g, '+').replace(/_/g, '/');
      const padding = '='.repeat((4 - restored.length % 4) % 4);
      let jsonString: string;
      
      try {
        // Intentar descompresión LZ primero (nuevo formato)
        const base64Decoded = atob(restored + padding);
        jsonString = decompressString(base64Decoded);
      } catch {
        // Fallback al formato anterior (solo Base64)
        jsonString = atob(restored + padding);
      }
      
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

  const generateQuizFromData = (parsedData: QuizQuestion[], quizName?: string) => {
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

    // Guardar quiz en localStorage
    const name = quizName || `Quiz ${new Date().toLocaleDateString()}`;
    const savedQuiz = saveQuiz(name, { questions });
    setCurrentQuizId(savedQuiz.id);
    setCurrentQuizName(savedQuiz.name);

    setQuizData({ questions });
    setUserAnswers(new Array(questions.length).fill(null));
    setCurrentQuestionIndex(0);
    setShowResults(false);
    setQuizResult(null);
    setQuizStartTime(Date.now());

    // Limpiar autoguardado
    clearCurrentQuiz();
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

    // En modo estudio, mostrar explicación inmediatamente después de responder
    if (studyMode) {
      setShowExplanation(true);
    }
  };

  const toggleMarkQuestion = () => {
    const newMarked = new Set(markedQuestions);
    if (newMarked.has(currentQuestionIndex)) {
      newMarked.delete(currentQuestionIndex);
    } else {
      newMarked.add(currentQuestionIndex);
    }
    setMarkedQuestions(newMarked);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < (quizData?.questions.length || 0) - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setShowExplanation(false); // Reset explanation for next question
    }
  };

  const prevQuestion = () => {
    // En modo examen, no se puede volver atrás
    if (examMode) return;

    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setShowExplanation(false); // Reset explanation
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

    const timeSpent = Math.floor((Date.now() - quizStartTime) / 1000);

    const result: QuizResult = {
      score,
      total,
      percentage,
      answers: userAnswers
    };

    setQuizResult(result);
    setShowResults(true);

    // Guardar intento en localStorage
    if (currentQuizId) {
      saveAttempt(
        currentQuizId,
        currentQuizName,
        result,
        timeSpent,
        examMode,
        examMode ? examTimerSeconds / 60 : undefined
      );
      updateQuizUsage(currentQuizId, percentage);
    }
  };

  const resetQuiz = () => {
    setQuizData(null);
    setCurrentQuestionIndex(0);
    setUserAnswers([]);
    setShowResults(false);
    setQuizResult(null);
    setJsonInput('');
    setExtractedText('');
    setExamMode(false);
    setExamTimerSeconds(0);
    setCurrentQuizId(null);
    setCurrentQuizName('');
    setStudyMode(false);
    setShowExplanation(false);
    setMarkedQuestions(new Set());
  };

  const retryIncorrectQuestions = () => {
    if (!quizData || !quizResult) return;

    // Filtrar solo preguntas incorrectas
    const incorrectQuestions = quizData.questions.filter((q, index) => {
      return userAnswers[index] !== q.answer;
    });

    if (incorrectQuestions.length === 0) {
      alert('¡No hay preguntas incorrectas! 🎉');
      return;
    }

    // Crear nuevo quiz solo con preguntas incorrectas
    setQuizData({ questions: incorrectQuestions });
    setUserAnswers(new Array(incorrectQuestions.length).fill(null));
    setCurrentQuestionIndex(0);
    setShowResults(false);
    setQuizResult(null);
    setShowExplanation(false);
    setMarkedQuestions(new Set());
    setQuizStartTime(Date.now());
  };

  const retryMarkedQuestions = () => {
    if (!quizData) return;

    if (markedQuestions.size === 0) {
      alert('No has marcado ninguna pregunta para revisar');
      return;
    }

    // Filtrar solo preguntas marcadas
    const marked = Array.from(markedQuestions).sort((a, b) => a - b);
    const markedQuestionsList = marked.map(index => quizData.questions[index]);

    setQuizData({ questions: markedQuestionsList });
    setUserAnswers(new Array(markedQuestionsList.length).fill(null));
    setCurrentQuestionIndex(0);
    setShowResults(false);
    setQuizResult(null);
    setShowExplanation(false);
    setMarkedQuestions(new Set());
    setQuizStartTime(Date.now());
  };

  const handleLoadQuizFromHistory = (savedQuiz: SavedQuiz) => {
    setJsonInput(JSON.stringify(savedQuiz.data.questions, null, 2));
    setCurrentQuizId(savedQuiz.id);
    setCurrentQuizName(savedQuiz.name);
  };

  const startExamMode = (timerMinutes: number) => {
    setExamMode(true);
    setExamTimerSeconds(timerMinutes * 60);
    setShowExamConfig(false);

    if (!quizData) {
      try {
        const parsedData: QuizQuestion[] = JSON.parse(jsonInput);
        generateQuizFromData(parsedData);
      } catch (error) {
        alert(`Error al procesar el JSON: ${(error as Error).message}`);
        setExamMode(false);
        setExamTimerSeconds(0);
      }
    }
  };

  const handleTimeUp = () => {
    alert('⏰ ¡Se acabó el tiempo! El examen se enviará automáticamente.');
    finishQuiz();
  };

  const handleTextExtracted = (text: string) => {
    setExtractedText(text);
  };


  const clearExtractedText = () => {
    setExtractedText('');
    // setExtractedFiles([]);
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
      setIsUrlShortening(true);
      
      // Mostrar indicador de carga
      if (button) {
        button.textContent = '⏳ Generando URL...';
        button.disabled = true;
      }
      
      // Comprimir JSON usando LZ + Base64
      const jsonString = JSON.stringify(quizData.questions);
      
      // Aplicar compresión LZ primero, luego Base64 URL-safe
      const lzCompressed = compressString(jsonString);
      const base64Compressed = btoa(lzCompressed)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
      
      console.log(`Compresión: ${jsonString.length} → ${lzCompressed.length} → ${base64Compressed.length} chars`);
      
      const longUrl = `${window.location.origin}${window.location.pathname}#quiz=${base64Compressed}`;
      const longUrlLength = longUrl.length;
      
      let finalUrl = longUrl;
      let urlInfo = '';
      
      // Intentar acortar la URL con TinyURL si es muy larga
      if (longUrlLength > 500) {
        try {
          if (button) {
            button.textContent = '🔗 Acortando URL...';
          }
          
          const shortUrl = await shortenUrl(longUrl);
          finalUrl = shortUrl;
          
          // Calcular estadísticas
          const originalSize = jsonString.length;
          const compressedSize = base64Compressed.length;
          const compressionRatio = Math.round((1 - compressedSize / originalSize) * 100);
          const urlReduction = Math.round((1 - shortUrl.length / longUrlLength) * 100);
          
          urlInfo = `🔗 URL acortada exitosamente! (${questionsCount} preguntas)\n\n` +
            `✅ URL corta y fácil de compartir\n` +
            `✅ Funciona inmediatamente sin servidor\n` +
            `✅ Sin límites ni expiración\n` +
            `📏 URL original: ${longUrlLength} → URL final: ${shortUrl.length} caracteres\n` +
            `🗜️ Compresión datos: ${compressionRatio}% | URL: ${urlReduction}% reducción\n\n` +
            `💡 Solo pega el enlace corto y accederán directamente al quiz.`;
        } catch (shortError) {
          console.warn('No se pudo acortar la URL, usando URL larga:', shortError);
          
          // Usar URL larga como fallback
          const originalSize = jsonString.length;
          const compressedSize = base64Compressed.length;
          const compressionRatio = Math.round((1 - compressedSize / originalSize) * 100);
          const sizeWarning = longUrlLength > 2000 ? '\n⚠️ URL larga - puede tener problemas en algunos servicios de mensajería' : '';
          
          urlInfo = `🔗 URL de quiz generada! (${questionsCount} preguntas)\n\n` +
            `⚠️ No se pudo acortar (servicio no disponible)\n` +
            `✅ Funciona inmediatamente sin servidor\n` +
            `✅ Sin límites ni expiración\n` +
            `📏 Tamaño: ${longUrlLength} caracteres\n` +
            `🗜️ Compresión: ${compressionRatio}% reducción${sizeWarning}\n\n` +
            `💡 Solo pega el enlace y accederán directamente al quiz.`;
        }
      } else {
        // URL ya es corta, no necesita acortado
        const originalSize = jsonString.length;
        const compressedSize = base64Compressed.length;
        const compressionRatio = Math.round((1 - compressedSize / originalSize) * 100);
        
        urlInfo = `🔗 URL de quiz generada! (${questionsCount} preguntas)\n\n` +
          `✅ URL ya es compacta (${longUrlLength} caracteres)\n` +
          `✅ Funciona inmediatamente sin servidor\n` +
          `✅ Sin límites ni expiración\n` +
          `🗜️ Compresión: ${compressionRatio}% reducción\n\n` +
          `💡 Solo pega el enlace y accederán directamente al quiz.`;
      }
      
      // Copiar URL final al portapapeles
      await navigator.clipboard.writeText(finalUrl);
      
      alert(urlInfo);
      
    } catch (error) {
      console.error('Error al crear URL:', error);
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      
      alert(
        `❌ Error al generar URL: ${errorMsg}\n\n` +
        `💡 Como alternativa, usa "📋 Copiar JSON" para compartir manualmente.`
      );
    } finally {
      // Restaurar botón
      setIsUrlShortening(false);
      if (button) {
        button.textContent = originalText;
        button.disabled = false;
      }
    }
  };


  if (showResults && quizResult && quizData) {
    const timeSpent = Math.floor((Date.now() - quizStartTime) / 1000);
    const stats = currentQuizId ? getQuizStatistics(currentQuizId) : null;

    return (
      <div className="quiz-container">
        <h1>¡Resultados del Quiz!</h1>
        {examMode && (
          <div className="exam-badge">
            🎓 Modo Examen {examTimerSeconds ? `- ${examTimerSeconds / 60} min` : ''}
          </div>
        )}
        <div className="results-summary">
          <h2>Puntuación: {quizResult.score}/{quizResult.total} ({quizResult.percentage}%)</h2>
          <div className={`grade ${quizResult.percentage >= 70 ? 'pass' : 'fail'}`}>
            {quizResult.percentage >= 70 ? '¡Aprobado!' : 'Necesitas mejorar'}
          </div>
        </div>

        <AdvancedStats
          result={quizResult}
          quizData={quizData}
          timeSpent={timeSpent}
          previousAttempts={stats ? stats.totalAttempts - 1 : undefined}
          averageScore={stats?.averageScore}
          trend={stats?.trend}
        />

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
          {quizResult.score < quizResult.total && (
            <button onClick={retryIncorrectQuestions} className="btn-warning">
              🔁 Repetir Incorrectas ({quizResult.total - quizResult.score})
            </button>
          )}
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
        {examMode && examTimerSeconds > 0 && (
          <ExamTimer
            totalSeconds={examTimerSeconds}
            onTimeUp={handleTimeUp}
            isPaused={false}
          />
        )}

        <div className="quiz-header">
          <h1>Quiz Personalizado</h1>
          {examMode && (
            <div className="exam-mode-indicator">
              🎓 Modo Examen - No puedes volver atrás
            </div>
          )}
          {studyMode && (
            <div className="study-mode-indicator">
              📚 Modo Estudio - Aprende mientras practicas
            </div>
          )}
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
          <p>Pregunta {currentQuestionIndex + 1} de {quizData.questions.length}</p>
          {markedQuestions.size > 0 && (
            <p className="marked-counter">🔖 {markedQuestions.size} marcadas para revisar</p>
          )}
        </div>

        <div className="question-container">
          <div className="question-header">
            <h2>{currentQuestion.question}</h2>
            {studyMode && (
              <button
                className={`btn-mark ${markedQuestions.has(currentQuestionIndex) ? 'marked' : ''}`}
                onClick={toggleMarkQuestion}
              >
                {markedQuestions.has(currentQuestionIndex) ? '🔖 Marcada' : '🔖 Marcar'}
              </button>
            )}
          </div>

          <div className={`choices ${currentQuestion.choices.length === 2 ? 'true-false' : ''}`}>
            {currentQuestion.choices.map((choice, index) => (
              <button
                key={index}
                className={`choice ${userAnswers[currentQuestionIndex] === index ? 'selected' : ''} ${
                  studyMode && showExplanation && index === currentQuestion.answer ? 'correct-answer' : ''
                } ${
                  studyMode && showExplanation && userAnswers[currentQuestionIndex] === index && index !== currentQuestion.answer ? 'wrong-answer' : ''
                }`}
                onClick={() => selectAnswer(index)}
              >
                {choice}
                {studyMode && showExplanation && index === currentQuestion.answer && ' ✓'}
                {studyMode && showExplanation && userAnswers[currentQuestionIndex] === index && index !== currentQuestion.answer && ' ✗'}
              </button>
            ))}
          </div>

          {studyMode && showExplanation && userAnswers[currentQuestionIndex] !== null && (
            <div className={`explanation-box ${userAnswers[currentQuestionIndex] === currentQuestion.answer ? 'correct' : 'incorrect'}`}>
              <div className="explanation-header">
                {userAnswers[currentQuestionIndex] === currentQuestion.answer ? (
                  <span className="explanation-result correct">✅ ¡Correcto!</span>
                ) : (
                  <span className="explanation-result incorrect">❌ Incorrecto</span>
                )}
              </div>
              {currentQuestion.explanation && (
                <div className="explanation-text">
                  <strong>Explicación:</strong> {currentQuestion.explanation}
                </div>
              )}
              {!currentQuestion.explanation && (
                <div className="explanation-text">
                  <strong>Respuesta correcta:</strong> {currentQuestion.choices[currentQuestion.answer]}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="quiz-navigation">
          <button
            onClick={prevQuestion}
            disabled={currentQuestionIndex === 0 || examMode}
            className="btn-secondary"
            title={examMode ? 'No puedes volver atrás en modo examen' : ''}
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
          {studyMode && markedQuestions.size > 0 && (
            <button onClick={retryMarkedQuestions} className="btn-warning">
              🔖 Revisar Marcadas ({markedQuestions.size})
            </button>
          )}
          <button
            onClick={shareQuizOnline}
            className="btn-primary btn-share-online"
            disabled={isUrlShortening}
          >
            {isUrlShortening ? '⏳ Generando...' : '🔗 Compartir Online'}
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
      <p>Sube un documento PDF/Word o pega el JSON con tus preguntas para generar tu cuestionario.</p>

      <div className="top-actions">
        <button
          className="btn-theme"
          onClick={() => setShowThemeSelector(true)}
        >
          🎨 Temas
        </button>
        <button
          className="btn-history"
          onClick={() => setShowHistory(true)}
        >
          📚 Ver Historial
        </button>
      </div>

      {showHistory && (
        <QuizHistory
          onLoadQuiz={handleLoadQuizFromHistory}
          onClose={() => setShowHistory(false)}
        />
      )}

      {showThemeSelector && (
        <ThemeSelector
          onClose={() => setShowThemeSelector(false)}
        />
      )}

      {showExamConfig && jsonInput && (
        <ExamModeConfig
          onStart={startExamMode}
          onCancel={() => setShowExamConfig(false)}
          questionCount={(() => {
            try {
              const parsed = JSON.parse(jsonInput);
              return Array.isArray(parsed) ? parsed.length : 0;
            } catch {
              return 0;
            }
          })()}
        />
      )}

      <FileUploader
        onTextExtracted={handleTextExtracted}
        onMultipleTextsExtracted={() => {}}
      />

      {extractedText && (
        <TextExtractor
          extractedText={extractedText}
          onClearText={clearExtractedText}
        />
      )}

      <div className="json-input-section">
        <h3>Archivo JSON de preguntas</h3>
        <p className="input-description">
          Si ya tienes el JSON generado por tu IA, pégalo aquí:
        </p>
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
        <h4>📋 Instrucciones para generar preguntas</h4>
        <div className="instructions-content">
          <div className="method-options">
            <div className="method-card">
              <h5>🎯 Método recomendado: Subir documento</h5>
              <ol>
                <li><strong>Sube tu PDF o Word</strong> en la sección de arriba</li>
                <li><strong>Copia el texto extraído</strong> automáticamente</li>
                <li><strong>Ve a tu IA favorita</strong> (ChatGPT, Claude, Gemini, etc.)</li>
                <li><strong>Pega el texto + el prompt de abajo</strong></li>
                <li><strong>Copia el JSON generado</strong> y pégalo aquí</li>
                <li><strong>¡Genera tu quiz!</strong> 🎉</li>
              </ol>
              <p className="method-benefit">✅ <strong>Ventajas:</strong> Ahorra tokens, tiempo y mejores resultados</p>
            </div>

            <div className="method-card">
              <h5>📝 Método alternativo: Sin archivo</h5>
              <ol>
                <li><strong>Ve directamente a tu IA favorita</strong></li>
                <li><strong>Sube tu documento o describe el tema</strong></li>
                <li><strong>Usa el prompt de abajo</strong></li>
                <li><strong>Copia el JSON generado</strong> y pégalo aquí</li>
              </ol>
            </div>
          </div>
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

      <div className="mode-selector">
        <h3>Elige el modo de quiz:</h3>
        <div className="mode-options">
          <label className="mode-option">
            <input
              type="radio"
              name="quiz-mode"
              value="normal"
              checked={!studyMode && !examMode}
              onChange={() => {
                setStudyMode(false);
                setExamMode(false);
              }}
            />
            <div className="mode-card">
              <div className="mode-icon">🎯</div>
              <div className="mode-title">Normal</div>
              <div className="mode-description">Modo clásico de quiz</div>
            </div>
          </label>

          <label className="mode-option">
            <input
              type="radio"
              name="quiz-mode"
              value="study"
              checked={studyMode}
              onChange={() => {
                setStudyMode(true);
                setExamMode(false);
              }}
            />
            <div className="mode-card">
              <div className="mode-icon">📚</div>
              <div className="mode-title">Estudio</div>
              <div className="mode-description">Aprende con explicaciones inmediatas</div>
            </div>
          </label>
        </div>
      </div>

      <div className="actions">
        <button onClick={generateQuiz} className="btn-generate">
          🪄 Generar Cuestionario
        </button>
        {jsonInput && jsonInput.length > 50 && !studyMode && (
          <button
            onClick={() => {
              try {
                JSON.parse(jsonInput);
                setShowExamConfig(true);
              } catch (error) {
                alert('Por favor, verifica que el JSON sea válido antes de iniciar el modo examen');
              }
            }}
            className="btn-exam-mode"
          >
            🎓 Modo Examen
          </button>
        )}
      </div>
    </div>
  );
};

export default QuizGenerator;