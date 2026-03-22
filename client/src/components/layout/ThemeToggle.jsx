import React from 'react';
import { FiSun, FiMoon } from 'react-icons/fi';

const ThemeToggle = ({ isDark, toggleTheme }) => {
  return (
    <button
      onClick={toggleTheme}
      className="relative p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 group"
      aria-label="Toggle theme"
    >
      {/* Icon */}
      <div className="relative w-5 h-5">
        <div
          className={`absolute inset-0 transform transition-transform duration-300 ${
            isDark ? 'rotate-0 opacity-100' : 'rotate-90 opacity-0'
          }`}
        >
          <FiMoon className="w-5 h-5" />
        </div>
        <div
          className={`absolute inset-0 transform transition-transform duration-300 ${
            !isDark ? 'rotate-0 opacity-100' : '-rotate-90 opacity-0'
          }`}
        >
          <FiSun className="w-5 h-5" />
        </div>
      </div>
      
      {/* Tooltip */}
      <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 dark:bg-gray-700 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
        {isDark ? 'Light mode' : 'Dark mode'}
      </span>
    </button>
  );
};

export default ThemeToggle;