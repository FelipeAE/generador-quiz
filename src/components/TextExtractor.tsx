import React from 'react';

interface TextExtractorProps {
  extractedText: string;
  onClearText: () => void;
}

const TextExtractor: React.FC<TextExtractorProps> = ({ extractedText, onClearText }) => {
  const copyTextToClipboard = () => {
    navigator.clipboard.writeText(extractedText).then(() => {
      alert('📋 Texto copiado al portapapeles!\n\n💡 Ahora ve a tu IA favorita, pega este texto junto con el prompt que se muestra abajo.');
    }).catch(() => {
      // Fallback si no se puede copiar
      prompt('📋 Copia este texto para llevarlo a tu IA:', extractedText);
    });
  };

  const wordCount = extractedText.split(/\s+/).filter(word => word.length > 0).length;
  const charCount = extractedText.length;

  return (
    <div className="text-extractor-section">
      <div className="extracted-text-header">
        <h3>📝 Texto extraído del documento</h3>
        <div className="text-stats">
          <span>📊 {wordCount.toLocaleString()} palabras</span>
          <span>📄 {charCount.toLocaleString()} caracteres</span>
        </div>
      </div>

      <div className="extracted-text-preview">
        <textarea
          value={extractedText}
          readOnly
          className="extracted-text-display"
          rows={10}
          placeholder="El texto extraído aparecerá aquí..."
        />
      </div>

      <div className="text-actions">
        <button onClick={copyTextToClipboard} className="btn-primary">
          📋 Copiar texto para IA
        </button>
        <button onClick={onClearText} className="btn-secondary">
          🗑️ Limpiar texto
        </button>
      </div>

      <div className="next-steps">
        <h4>🚀 Próximos pasos:</h4>
        <ol>
          <li><strong>Copia el texto</strong> haciendo clic en "📋 Copiar texto para IA"</li>
          <li><strong>Ve a tu IA favorita</strong> (ChatGPT, Claude, Gemini, etc.)</li>
          <li><strong>Pega el texto</strong> seguido del prompt que aparece más abajo</li>
          <li><strong>La IA generará preguntas en formato JSON</strong></li>
          <li><strong>Copia el JSON</strong> y pégalo en el campo de arriba</li>
          <li><strong>¡Genera tu quiz!</strong> 🎉</li>
        </ol>
      </div>
    </div>
  );
};

export default TextExtractor;