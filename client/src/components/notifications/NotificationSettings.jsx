import React, { useState, useEffect } from 'react';
import { useNotifications } from '../../hooks/useNotifications';
import { FiCheck, FiMoon, FiBell, FiVolume2, FiEye, FiClock, FiZap } from 'react-icons/fi';

const NotificationSettings = () => {
  const { 
    settings, 
    updateSettings, 
    toggleDND, 
    sendTestNotification, 
    supportedApps 
  } = useNotifications();

  // Local state for DND time inputs to allow smooth typing
  const [dndTime, setDndTime] = useState({
    start: settings.dndStart || '22:00',
    end: settings.dndEnd || '08:00'
  });

  // Sync local time state if settings change externally
  useEffect(() => {
    setDndTime({
      start: settings.dndStart || '22:00',
      end: settings.dndEnd || '08:00'
    });
  }, [settings.dndStart, settings.dndEnd]);

  const handleToggleApp = (appId) => {
    const newApps = settings.apps.includes(appId)
      ? settings.apps.filter(a => a !== appId)
      : [...settings.apps, appId];
    updateSettings({ apps: newApps });
  };

  const handleToggleSetting = (key) => {
    updateSettings({ [key]: !settings[key] });
  };

  const handleDNDUpdate = () => {
    // Uses the toggleDND helper from the hook
    toggleDND(settings.doNotDisturb, dndTime.start, dndTime.end);
  };

  return (
    <div className="p-1 space-y-8 animate-fade-in">
      {/* General Preferences */}
      <section>
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center">
          <FiSettings className="mr-2" /> Global Preferences
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Enable/Disable Master Switch */}
          <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <FiBell className="w-4 h-4 text-blue-500" />
              </div>
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Mirroring Enabled</span>
            </div>
            <button
              onClick={() => handleToggleSetting('enabled')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all ${
                settings.enabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          {/* Show Previews */}
          <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <FiEye className="w-4 h-4 text-purple-500" />
              </div>
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Show Body Preview</span>
            </div>
            <button
              onClick={() => handleToggleSetting('showPreview')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all ${
                settings.showPreview ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.showPreview ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>
      </section>

      {/* Do Not Disturb Section */}
      <section className="bg-gray-50 dark:bg-gray-900/50 p-5 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <FiMoon className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800 dark:text-white">Do Not Disturb</p>
              <p className="text-[10px] text-gray-500 uppercase font-medium">Silence mirroring during sleep</p>
            </div>
          </div>
          <button
            onClick={() => toggleDND(!settings.doNotDisturb, dndTime.start, dndTime.end)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all ${
              settings.doNotDisturb ? 'bg-amber-500' : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.doNotDisturb ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
        
        {settings.doNotDisturb && (
          <div className="grid grid-cols-2 gap-4 animate-slide-down">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 flex items-center">
                <FiClock className="mr-1" /> Start
              </label>
              <input
                type="time"
                value={dndTime.start}
                onChange={(e) => setDndTime({ ...dndTime, start: e.target.value })}
                onBlur={handleDNDUpdate}
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-mono focus:ring-2 focus:ring-amber-500 outline-none transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 flex items-center">
                <FiClock className="mr-1" /> End
              </label>
              <input
                type="time"
                value={dndTime.end}
                onChange={(e) => setDndTime({ ...dndTime, end: e.target.value })}
                onBlur={handleDNDUpdate}
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-mono focus:ring-2 focus:ring-amber-500 outline-none transition-all"
              />
            </div>
          </div>
        )}
      </section>
      
      {/* App Filtering Section */}
      <section>
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
          Allowed Applications
        </h3>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {supportedApps.map((app) => {
            const isActive = settings.apps.includes(app.id);
            return (
              <button
                key={app.id}
                onClick={() => handleToggleApp(app.id)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl border transition-all group ${
                  isActive
                    ? 'bg-white border-transparent shadow-md'
                    : 'bg-transparent border-gray-100 dark:border-gray-700 opacity-60 hover:opacity-100'
                }`}
                style={isActive ? { borderLeft: `4px solid ${app.color}` } : {}}
              >
                <span className="text-xl" style={isActive ? { color: app.color } : { grayscale: 1 }}>
                  {app.icon}
                </span>
                <div className="flex-1 text-left min-w-0">
                  <p className={`text-xs font-bold truncate ${isActive ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>
                    {app.name}
                  </p>
                </div>
                {isActive && <FiCheck className="w-3 h-3 text-green-500 flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      </section>
      
      {/* Test Utility */}
      <div className="pt-6 border-t border-gray-100 dark:border-gray-700">
        <button
          onClick={() => sendTestNotification()}
          className="w-full flex items-center justify-center space-x-2 px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-blue-200 dark:shadow-none hover:scale-[1.01] active:scale-[0.99] transition-all"
        >
          <FiZap className="w-4 h-4" />
          <span>Send Test Mirror Notification</span>
        </button>
        <p className="text-[10px] text-center text-gray-400 mt-3 uppercase font-bold tracking-tighter">
          This will simulate a notification arrival from a paired Android device
        </p>
      </div>
    </div>
  );
};

export default NotificationSettings;