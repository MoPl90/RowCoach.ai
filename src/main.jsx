import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { LangProvider } from './context/LangContext';
import { ThemeProvider } from './context/ThemeContext';
import 'leaflet/dist/leaflet.css';
import './style.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <LangProvider>
        <App />
      </LangProvider>
    </ThemeProvider>
  </StrictMode>
);
