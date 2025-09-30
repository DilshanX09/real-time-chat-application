import { createContext, useState, useEffect } from 'react';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
     const [theme, setTheme] = useState('light');

     useEffect(() => {
          const storedTheme = localStorage.getItem('theme');
          if (storedTheme) {
               setTheme(storedTheme);
               document.body.className = storedTheme;
          }
     }, []);

     const toggleTheme = () => {
          const newTheme = theme === 'light' ? 'dark' : 'light';
          setTheme(newTheme);
          localStorage.setItem('theme', newTheme);
          document.body.className = newTheme;
     };

     return (
          <ThemeContext.Provider value={{ theme, toggleTheme }}>
               {children}
          </ThemeContext.Provider>
     );
};
