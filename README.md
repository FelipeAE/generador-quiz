# Generador de Quiz Personalizado

Una aplicación web para crear y realizar cuestionarios personalizados usando React + Vite + TypeScript.

## Características

- ✨ Interfaz moderna y responsive
- 📝 Carga cuestionarios desde JSON
- 🔀 Modo aleatorio para las preguntas
- 📊 Sistema de puntuación y resultados detallados
- 💾 Descarga de resultados en formato JSON
- 🎯 Fácil integración con IAs como ChatGPT, Gemini, etc.

## Cómo usar

1. **Prepara tus preguntas:** Usa el prompt incluido en la aplicación con tu IA favorita
2. **Pega el JSON:** Copia el JSON generado por la IA en el campo de texto
3. **Genera tu quiz:** Haz clic en "Generar Cuestionario"
4. **Realiza el quiz:** Responde las preguntas navegando con los botones
5. **Ve tus resultados:** Obtén tu puntuación y revisa las respuestas correctas

## Formato del JSON

```json
[
  {
    "question": "¿Cuál es la capital de Francia?",
    "choices": ["París", "Madrid", "Berlín", "Roma"],
    "answer": 0
  }
]
```

- `question`: La pregunta (string)
- `choices`: Array de 4 opciones (string[])
- `answer`: Índice de la respuesta correcta (0-3)

## Desarrollo

```bash
# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev

# Construir para producción
npm run build
```

## Tecnologías

- React 18
- TypeScript
- Vite
- CSS moderno con gradientes y efectos
