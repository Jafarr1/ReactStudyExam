import React, { createContext, useState } from 'react';
import { useColorScheme } from 'react-native';

export const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme();
  const [theme, setTheme] = useState('system');

  const effectiveTheme = theme === 'system' ? systemScheme || 'light' : theme;

  return (
    <ThemeContext.Provider value={{ theme: effectiveTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
