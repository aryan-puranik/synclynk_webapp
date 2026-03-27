import React, { useState } from 'react';
import { useNotifications } from '../../hooks/useNotifications';
import { FiCheck, FiX, FiMoon, FiBell, FiVolume2, FiEye } from 'react-icons/fi';

const NotificationSettings = () => {
  const { settings, updateSettings, toggleDND, sendTestNotification } = useNotifications();
  const [dndTime, setDndTime] = useState({
    start: settings.dndStart || '22:00',
    end: settings.dndEnd || '08:00'
  });

  const supportedApps = ['whatsapp', 'telegram', 'signal', 'discord', 'slack', 'messenger', 'instagram', 'twitter'];

  const handleToggleApp = (app) => {
    const newApps = settings.apps.includes(app)
      ? settings.apps.filter(a => a !== app)
      : [...settings.apps, app];
    updateSettings({ apps: newApps });
  };

  const handleToggleSetting = (key) => {
    updateSettings({ [key]: !settings[key] });
  };

  const handleDNDToggle = () => {
    toggleDND(!settings.doNotDisturb, dndTime.start, dndTime.end);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Notification Settings
        </h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FiBell className="w-5 h-5 text-gray-500" />
              <span className="text-gray-700 dark:text-gray-300">Enable Notifications</span>
            </div>
            <button
              onClick={() => handleToggleSetting('enabled')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.enabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FiEye className="w-5 h-5 text-gray-500" />
              <span className="text-gray-700 dark:text-gray-300">Show Message Preview</span>
            </div>
            <button
              onClick={() => handleToggleSetting('showPreview')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.showPreview ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.showPreview ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FiVolume2 className="w-5 h-5 text-gray-500" />
              <span className="text-gray-700 dark:text-gray-300">Play Sound</span>
            </div>
            <button
              onClick={() => handleToggleSetting('soundEnabled')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.soundEnabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.soundEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FiMoon className="w-5 h-5 text-gray-500" />
              <span className="text-gray-700 dark:text-gray-300">Do Not Disturb</span>
            </div>
            <button
              onClick={handleDNDToggle}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.doNotDisturb ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.doNotDisturb ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
        
        {settings.doNotDisturb && (
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Start Time</label>
              <input
                type="time"
                value={dndTime.start}
                onChange={(e) => setDndTime({ ...dndTime, start: e.target.value })}
                className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">End Time</label>
              <input
                type="time"
                value={dndTime.end}
                onChange={(e) => setDndTime({ ...dndTime, end: e.target.value })}
                className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg"
              />
            </div>
          </div>
        )}
      </div>
      
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Allowed Apps
        </h3>
        
        <div className="grid grid-cols-2 gap-2">
          {supportedApps.map((app) => (
            <button
              key={app}
              onClick={() => handleToggleApp(app)}
              className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                settings.apps.includes(app)
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                  : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
              }`}
            >
              <span className="capitalize">{app}</span>
              {settings.apps.includes(app) && <FiCheck className="w-4 h-4" />}
            </button>
          ))}
        </div>
      </div>
      
      <div>
        <button
          onClick={() => sendTestNotification()}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Send Test Notification
        </button>
      </div>
    </div>
  );
};

export default NotificationSettings;