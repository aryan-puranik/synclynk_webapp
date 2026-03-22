import React from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const Sidebar = ({ isOpen, activeTab, onTabChange, tabs = [], onToggle }) => {
  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-16 left-0 h-[calc(100vh-4rem)] bg-white dark:bg-gray-800 shadow-lg transition-all duration-300 z-30 ${
          isOpen ? 'w-64' : 'w-0 lg:w-16'
        } overflow-hidden`}
      >
        <div className="h-full flex flex-col">
          {/* Toggle Button */}
          <button
            onClick={onToggle}
            className="absolute -right-3 top-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full p-1 shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors hidden lg:block"
          >
            {isOpen ? (
              <FiChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            ) : (
              <FiChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            )}
          </button>

          <nav className="flex-1 py-6 overflow-y-auto">
            <ul className="space-y-2 px-2">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <li key={tab.id}>
                    <button
                      onClick={() => onTabChange(tab.id)}
                      className={`w-full flex items-center py-3 px-3 rounded-lg transition-all relative ${
                        isActive
                          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      <div className={`${isOpen ? 'mr-3' : 'mx-auto'}`}>
                        {tab.icon}
                      </div>
                      
                      {isOpen && (
                        <span className="font-medium">{tab.label}</span>
                      )}
                      
                      {tab.badge !== undefined && tab.badge > 0 && (
                        <span className={`ml-auto ${
                          isOpen ? 'block' : 'hidden'
                        } bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full`}>
                          {tab.badge}
                        </span>
                      )}
                      
                      {isActive && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 dark:bg-blue-400 rounded-r" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Footer Info */}
          {isOpen && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                SYNCLYNK v1.0
              </p>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;