import React, { useState, useEffect } from 'react';
import { saveSettings } from '../utils/quizStorage';

interface Theme {
  id: string;
  name: string;
  icon: string;
  preview: {
    primary: string;
    secondary: string;
  };
}

const themes: Theme[] = [
  {
    id: 'light',
    name: 'Claro',
    icon: '☀️',
    preview: { primary: '#6366f1', secondary: '#8b5cf6' }
  },
  {
    id: 'dark',
    name: 'Oscuro',
    icon: '🌙',
    preview: { primary: '#818cf8', secondary: '#a78bfa' }
  },
  {
    id: 'ocean',
    name: 'Océano',
    icon: '🌊',
    preview: { primary: '#0ea5e9', secondary: '#06b6d4' }
  },
  {
    id: 'forest',
    name: 'Bosque',
    icon: '🌲',
    preview: { primary: '#10b981', secondary: '#14b8a6' }
  },
  {
    id: 'sunset',
    name: 'Atardecer',
    icon: '🌅',
    preview: { primary: '#f59e0b', secondary: '#ec4899' }
  },
  {
    id: 'purple',
    name: 'Púrpura',
    icon: '💜',
    preview: { primary: '#a855f7', secondary: '#d946ef' }
  }
];

interface ThemeSelectorProps {
  onClose: () => void;
}

const ThemeSelector: React.FC<ThemeSelectorProps> = ({ onClose }) => {
  const [currentTheme, setCurrentTheme] = useState('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('app-theme') || 'light';
    setCurrentTheme(savedTheme);
  }, []);

  const handleThemeChange = (themeId: string) => {
    setCurrentTheme(themeId);

    // Apply theme
    document.documentElement.setAttribute('data-theme', themeId);

    // Save to localStorage
    localStorage.setItem('app-theme', themeId);

    // Update settings
    saveSettings({ darkMode: themeId === 'dark' });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content theme-selector-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🎨 Personalizar Tema</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="theme-selector-content">
          <p className="theme-description">
            Elige el tema que más te guste. Tu preferencia se guardará automáticamente.
          </p>

          <div className="themes-grid">
            {themes.map((theme) => (
              <div
                key={theme.id}
                className={`theme-card ${currentTheme === theme.id ? 'active' : ''}`}
                onClick={() => handleThemeChange(theme.id)}
              >
                <div className="theme-icon">{theme.icon}</div>
                <div className="theme-name">{theme.name}</div>
                <div className="theme-preview">
                  <div
                    className="preview-color"
                    style={{ background: theme.preview.primary }}
                  ></div>
                  <div
                    className="preview-color"
                    style={{ background: theme.preview.secondary }}
                  ></div>
                </div>
                {currentTheme === theme.id && (
                  <div className="theme-check">✓</div>
                )}
              </div>
            ))}
          </div>

          <div className="theme-info">
            <h4>💡 Información</h4>
            <ul>
              <li>El tema se aplica inmediatamente a toda la aplicación</li>
              <li>Tu preferencia se guarda automáticamente</li>
              <li>Puedes cambiar de tema en cualquier momento</li>
            </ul>
          </div>
        </div>

        <div className="theme-actions">
          <button className="btn-primary" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThemeSelector;
