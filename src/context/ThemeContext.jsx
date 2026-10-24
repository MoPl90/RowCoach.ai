import { createContext, useContext, useState, useEffect } from 'react';

const sysDark = window.matchMedia('(prefers-color-scheme: dark)');

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'auto');
  // Track system preference as proper state so resolvedTheme recomputes automatically
  const [sysPrefersDark, setSysPrefersDark] = useState(sysDark.matches);

  useEffect(() => {
    const handler = () => setSysPrefersDark(sysDark.matches);
    sysDark.addEventListener('change', handler);
    return () => sysDark.removeEventListener('change', handler);
  }, []);

  const resolvedTheme = theme === 'auto' ? (sysPrefersDark ? 'dark' : 'light') : theme;

  useEffect(() => {
    document.documentElement.classList.toggle('light', resolvedTheme === 'light');
  }, [resolvedTheme]);

  function toggleTheme() {
    const next = { auto: 'light', light: 'dark', dark: 'auto' }[theme];
    localStorage.setItem('theme', next);
    setTheme(next);
  }

  const themeBtnLabel = { auto: 'Auto', light: 'Dark', dark: 'Light' }[theme];

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, toggleTheme, themeBtnLabel }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
