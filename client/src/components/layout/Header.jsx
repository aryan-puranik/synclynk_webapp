import React, { useState } from 'react';
import { FiSun, FiMoon, FiLogOut, FiUser, FiWifi, FiWifiOff, FiBell, FiSettings } from 'react-icons/fi';
import ThemeToggle from './ThemeToggle';

const Header = ({ deviceId, roomId, isConnected, isDark, toggleTheme, onDisconnect }) => {
  const [showMenu, setShowMenu] = useState(false);

  const formatDeviceId = (id) => {
    if (!id) return 'Not paired';
    return `${id.slice(0, 8)}...${id.slice(-4)}`;
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">S</span>
            </div>
            <div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                SYNCLYNK
              </span>
              {roomId && (
                <span className="ml-2 text-xs text-gray-500 dark:text-gray-400 hidden sm:inline">
                  • Room: {roomId.slice(-6)}
                </span>
              )}
            </div>
          </div>

          {/* Connection Status */}
          <div className="flex items-center space-x-4">
            {/* Connection Status Badge */}
            <div className="hidden md:flex items-center space-x-2">
              <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${
                isConnected 
                  ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                  : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
              }`}>
                {isConnected ? (
                  <>
                    <FiWifi className="w-3 h-3" />
                    <span>Connected</span>
                  </>
                ) : (
                  <>
                    <FiWifiOff className="w-3 h-3" />
                    <span>Disconnected</span>
                  </>
                )}
              </div>
            </div>

            {/* Device Info */}
            {deviceId && (
              <div className="hidden lg:block">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  <span className="font-medium">Device:</span> {formatDeviceId(deviceId)}
                </div>
              </div>
            )}

            {/* Theme Toggle */}
            <ThemeToggle isDark={isDark} toggleTheme={toggleTheme} />

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                  <FiUser className="w-4 h-4 text-white" />
                </div>
              </button>

              {/* Dropdown Menu */}
              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                    <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Device Info
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-mono">
                        ID: {deviceId || 'Not paired'}
                      </p>
                      {roomId && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-mono">
                          Room: {roomId}
                        </p>
                      )}
                    </div>
                    
                    <div className="p-2">
                      <button
                        onClick={onDisconnect}
                        className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <FiLogOut className="w-4 h-4" />
                        <span>Disconnect</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;