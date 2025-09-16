import React, { useState, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import PdfToWordConverter from './PdfToWordConverter';

// Configurar worker desde jsDelivr (más confiable que cdnjs)
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;

interface ExtractedFile {
  name: string;
  text: string;
  size: number;
  wordCount: number;
}

interface FileUploaderProps {
  onTextExtracted: (text: string) => void;
  onMultipleTextsExtracted: (files: ExtractedFile[]) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onTextExtracted, onMultipleTextsExtracted }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [extractedFiles, setExtractedFiles] = useState<ExtractedFile[]>([]);
  const [currentlyProcessing, setCurrentlyProcessing] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const maxFileSize = 15 * 1024 * 1024; // 15MB

  // Función no utilizada actualmente, mantenida para futuras mejoras
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const extractTextFromPDF = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();

      // Configuración básica para PDF
      const pdf = await pdfjsLib.getDocument({
        data: arrayBuffer
      }).promise;

      let extractedText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        extractedText += pageText + '\n\n';
      }

      return extractedText.trim();
    } catch (error) {
      console.error('Error in PDF processing:', error);
      throw new Error('No se pudo procesar el archivo PDF. Verifica que el archivo no esté corrupto o protegido.');
    }
  };

  const extractTextFromWord = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value.trim();
  };

  const extractTextFromRTF = async (file: File): Promise<string> => {
    // Para archivos RTF, extraer texto básico
    const text = await file.text();

    // Limpiar códigos RTF básicos
    let cleanText = text
      .replace(/\\rtf1.*?\\fs\d+/g, '') // Remover header RTF
      .replace(/\\par/g, '\n') // Reemplazar párrafos
      .replace(/\\[a-z]+\d*/g, '') // Remover comandos RTF
      .replace(/[{}]/g, '') // Remover llaves
      .replace(/\s+/g, ' ') // Normalizar espacios
      .trim();

    return cleanText;
  };

  const handleFiles = async (files: FileList) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    setIsProcessing(true);

    try {
      const newExtractedFiles: ExtractedFile[] = [];

      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        setCurrentlyProcessing(`${file.name} (${i + 1}/${fileArray.length})`);

        // Validate file size
        if (file.size > maxFileSize) {
          alert(`❌ ${file.name} es muy grande. Máximo permitido: ${Math.round(maxFileSize / (1024 * 1024))}MB`);
          continue;
        }

        // Validate file type - Word y RTF (documentos convertidos)
        const isPDF = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
        const isWord = file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                       file.name.toLowerCase().endsWith('.docx') ||
                       file.type === 'application/rtf' ||
                       file.name.toLowerCase().endsWith('.rtf');

        if (isPDF) {
          alert(`📄 ${file.name}: Los archivos PDF tienen problemas técnicos en desarrollo.\n\n💡 Solución temporal:\n1. Convierte el PDF a Word (.docx) usando:\n   • Microsoft Word\n   • Google Docs\n   • Convertidores online\n2. Sube el archivo Word convertido\n\n✅ Los archivos Word funcionan perfectamente!`);
          continue;
        }

        if (!isWord) {
          alert(`❌ ${file.name}: Solo se admiten archivos Word (.docx) y RTF por el momento.\n\n📄 Para PDFs: Usa el conversor integrado.`);
          continue;
        }

        try {
          let extractedText = '';

          // Procesar Word y RTF
          if (file.name.toLowerCase().endsWith('.rtf') || file.type === 'application/rtf') {
            extractedText = await extractTextFromRTF(file);
          } else if (isWord) {
            extractedText = await extractTextFromWord(file);
          }

          if (!extractedText || extractedText.length < 50) {
            alert(`⚠️ ${file.name}: No se pudo extraer suficiente texto del archivo.`);
            continue;
          }

          // Clean up text
          const cleanedText = extractedText
            .replace(/\s+/g, ' ')
            .replace(/\n\s*\n/g, '\n\n')
            .trim();

          const wordCount = cleanedText.split(/\s+/).filter(word => word.length > 0).length;

          newExtractedFiles.push({
            name: file.name,
            text: cleanedText,
            size: cleanedText.length,
            wordCount
          });

        } catch (error) {
          console.error(`Error extracting text from ${file.name}:`, error);
          alert(`❌ Error al procesar ${file.name}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
      }

      if (newExtractedFiles.length > 0) {
        const updatedFiles = [...extractedFiles, ...newExtractedFiles];
        setExtractedFiles(updatedFiles);
        onMultipleTextsExtracted(updatedFiles);

        alert(`✅ ${newExtractedFiles.length} archivo(s) procesado(s) correctamente!\n\n💡 Usa los botones de abajo para copiar textos individuales o concatenar todo.`);
      }

    } finally {
      setIsProcessing(false);
      setCurrentlyProcessing('');
    }
  };

  // const handleFile = (file: File) => {
  //   const fileList = new DataTransfer();
  //   fileList.items.add(file);
  //   handleFiles(fileList.files);
  // };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
  };

  const copyIndividualText = (file: ExtractedFile) => {
    navigator.clipboard.writeText(file.text).then(() => {
      alert(`📋 Texto de "${file.name}" copiado al portapapeles!\n\n💡 Lleva este texto a tu IA favorita junto con el prompt.`);
    }).catch(() => {
      prompt(`📋 Copia este texto de "${file.name}":`, file.text);
    });
  };

  const copyAllTexts = () => {
    const allText = extractedFiles
      .map(file => `=== ${file.name} ===\n\n${file.text}`)
      .join('\n\n---\n\n');

    navigator.clipboard.writeText(allText).then(() => {
      alert(`📋 Todos los textos concatenados copiados al portapapeles!\n\n📄 ${extractedFiles.length} archivos combinados\n💡 Lleva este texto completo a tu IA favorita.`);
    }).catch(() => {
      prompt('📋 Copia todo el texto concatenado:', allText);
    });
  };

  const removeFile = (index: number) => {
    const updatedFiles = extractedFiles.filter((_, i) => i !== index);
    setExtractedFiles(updatedFiles);
    onMultipleTextsExtracted(updatedFiles);
  };

  const clearAllFiles = () => {
    setExtractedFiles([]);
    onMultipleTextsExtracted([]);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleConvertedFile = (convertedFile: File) => {
    // Procesar el archivo Word convertido automáticamente
    const fileList = new DataTransfer();
    fileList.items.add(convertedFile);
    handleFiles(fileList.files);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="file-uploader-section">
      <h3>📁 Extraer texto de documentos</h3>
      <p className="file-description">
        Sube archivos Word (.docx) y extraeremos automáticamente el texto para que puedas
        llevarlo a tu IA favorita. <strong>Esto te ahorra tiempo y tokens de procesamiento</strong>
        ya que no necesitas subir el archivo completo a la IA.
      </p>

      <PdfToWordConverter onConvertedFileReady={() => {}} />

      <div
        className={`file-drop-zone ${dragOver ? 'drag-over' : ''} ${isProcessing ? 'processing' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".docx"
          multiple
          onChange={handleFileInput}
          style={{ display: 'none' }}
        />

        {isProcessing ? (
          <div className="upload-content">
            <div className="spinner"></div>
            <p>⚙️ Procesando: {currentlyProcessing}</p>
            <small>Esto puede tomar unos momentos dependiendo del tamaño de los archivos</small>
          </div>
        ) : (
          <div className="upload-content">
            <div className="upload-icon">📄</div>
            <p><strong>Arrastra archivo(s) Word aquí o haz clic para seleccionar</strong></p>
            <small>
              Formato soportado: Word (.docx)<br/>
              Tamaño máximo por archivo: {Math.round(maxFileSize / (1024 * 1024))}MB<br/>
              Puedes seleccionar múltiples archivos<br/>
              <strong>📄 Para PDFs:</strong> Conviértelos a Word primero
            </small>
          </div>
        )}
      </div>

      {extractedFiles.length > 0 && (
        <div className="extracted-files-section">
          <div className="extracted-files-header">
            <h4>📚 Archivos procesados ({extractedFiles.length})</h4>
            <div className="files-actions">
              <button onClick={copyAllTexts} className="btn-primary">
                📋 Concatenar y copiar todo
              </button>
              <button onClick={clearAllFiles} className="btn-secondary">
                🗑️ Limpiar todo
              </button>
            </div>
          </div>

          <div className="files-list">
            {extractedFiles.map((file, index) => (
              <div key={index} className="file-item">
                <div className="file-info">
                  <h5>{file.name}</h5>
                  <div className="file-stats">
                    <span>📊 {file.wordCount.toLocaleString()} palabras</span>
                    <span>📄 {file.size.toLocaleString()} caracteres</span>
                  </div>
                </div>
                <div className="file-actions">
                  <button
                    onClick={() => copyIndividualText(file)}
                    className="btn-primary btn-small"
                  >
                    📋 Copiar
                  </button>
                  <button
                    onClick={() => removeFile(index)}
                    className="btn-danger btn-small"
                  >
                    ❌
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="concatenation-preview">
            <h5>🔗 Vista previa del texto concatenado:</h5>
            <div className="concatenation-info">
              <p>
                <strong>Total:</strong> {extractedFiles.reduce((acc, file) => acc + file.wordCount, 0).toLocaleString()} palabras | {' '}
                {extractedFiles.reduce((acc, file) => acc + file.size, 0).toLocaleString()} caracteres
              </p>
              <p>
                <strong>Estructura:</strong> Cada archivo estará separado por "==== Nombre del archivo ====" para que la IA pueda identificar las secciones.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="file-benefits">
        <h4>💡 ¿Por qué usar esta función?</h4>
        <ul>
          <li>✅ <strong>Ahorra tokens</strong>: Solo envías texto limpio a tu IA</li>
          <li>✅ <strong>Ahorra tiempo</strong>: Extracción automática sin copiar/pegar manual</li>
          <li>✅ <strong>Mejores resultados</strong>: Texto optimizado para generar preguntas</li>
          <li>✅ <strong>Privacidad</strong>: Todo se procesa en tu navegador, no en servidores externos</li>
          <li>✅ <strong>Múltiples archivos</strong>: Procesa individualmente o concatena todo según necesites</li>
        </ul>

        <div className="pdf-notice">
          <h4>📄 ¿Tienes archivos PDF?</h4>
          <p>Los PDFs tienen problemas técnicos en desarrollo. <strong>Solución fácil:</strong></p>
          <ul>
            <li>🔄 <strong>Word:</strong> Abrir PDF → Guardar como → Word (.docx)</li>
            <li>🔄 <strong>Google Docs:</strong> Subir PDF → Descargar como Word</li>
            <li>🔄 <strong>Online:</strong> Usar convertidores gratuitos PDF → Word</li>
          </ul>
          <p><small>💡 Una vez convertido a Word, funciona perfectamente con múltiples archivos!</small></p>
        </div>
      </div>
    </div>
  );
};

export default FileUploader;