import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { PairingProvider } from './context/PairingContext';
import Home from './pages/Home';
import Pair from './pages/Pair';
import Dashboard from './pages/Dashboard';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <ThemeProvider>
      <PairingProvider>
        <Router>
          <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors">
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
                success: {
                  duration: 3000,
                  iconTheme: {
                    primary: '#10b981',
                    secondary: '#fff',
                  },
                },
                error: {
                  duration: 4000,
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff',
                  },
                },
              }}
            />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/pair" element={<Pair />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </Router>
      </PairingProvider>
    </ThemeProvider>
  );
}

export default App;