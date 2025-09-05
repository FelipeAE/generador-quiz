# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Start development server**: `npm run dev`
- **Build for production**: `npm run build`
- **Lint code**: `npm run lint`
- **Preview production build**: `npm run preview`

## Project Architecture

This is a React + TypeScript + Vite application for creating and taking personalized quizzes. The app allows users to input JSON-formatted quiz data and provides an interactive quiz-taking interface.

### Core Components

- **App.tsx**: Main application entry point that renders the QuizGenerator component
- **QuizGenerator.tsx**: Main component containing all quiz logic, including:
  - JSON input parsing and validation
  - Quiz state management (questions, current index, user answers)
  - Quiz navigation and completion
  - Results display and download functionality
  - Random question ordering option

### Data Types

The application uses TypeScript types defined in `src/types/quiz.ts`:
- **QuizQuestion**: Individual question with choices array and answer index
- **QuizData**: Container for questions array
- **QuizResult**: Final results with score, percentage, and user answers

### JSON Data Format

The app expects quiz data in this specific JSON format:
```json
[
  {
    "question": "Question text",
    "choices": ["Option 1", "Option 2", "Option 3", "Option 4"],
    "answer": 0
  }
]
```

Key constraints:
- Questions must be an array of objects
- Each question requires exactly 4 choices
- Answer field must be a number (0-3) indicating correct choice index

### Application Flow

1. **Input Phase**: User pastes JSON quiz data into textarea
2. **Generation Phase**: JSON is parsed, validated, and optionally randomized
3. **Quiz Phase**: User navigates through questions, selecting answers
4. **Results Phase**: Shows score, detailed results, and download option

### Styling

The app uses CSS modules with modern styling including gradients and responsive design. Main styles are in `App.css` and `index.css`.

## Key Features

- JSON-based quiz input with validation
- Random question ordering option
- Progress tracking and navigation
- Comprehensive results with correct/incorrect answer review
- JSON results download functionality
- Integration-friendly design for AI-generated content