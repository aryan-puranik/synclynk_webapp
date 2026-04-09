import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme'; // Import from hooks, not context
import { FiSun, FiMoon, FiMonitor, FiSmartphone, FiCopy, FiVideo, FiBell } from 'react-icons/fi';

const Home = () => {
  const { isDark, toggleTheme } = useTheme(); // Now this works correctly

  const features = [
    {
      icon: <FiCopy className="w-8 h-8" />,
      title: 'Universal Clipboard',
      description: 'Copy text and images between your devices seamlessly'
    },
    {
      icon: <FiVideo className="w-8 h-8" />,
      title: 'Live Video Streaming',
      description: 'Stream your mobile camera to your laptop in real-time'
    },
    {
      icon: <FiBell className="w-8 h-8" />,
      title: 'Notification Mirroring',
      description: 'View and manage mobile notifications on your laptop'
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <nav className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">S</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                SYNCLYNK
              </span>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                {isDark ? <FiSun className="w-5 h-5" /> : <FiMoon className="w-5 h-5" />}
              </button>

              <Link
                to="/pair"
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all font-medium"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Connect Your Devices
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600">
              Seamlessly
            </span>
          </h1>

          <p className="text-xl text-gray-600 dark:text-gray-300 mb-10 max-w-2xl mx-auto">
            Experience the future of device connectivity with SYNCLYNK.
            Universal clipboard, live video streaming, and notification mirroring.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/pair"
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all text-lg font-semibold"
            >
              Start Pairing
            </Link>

            <div className="px-8 py-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl flex items-center justify-center gap-2">
              <FiSmartphone className="w-5 h-5" />
              <span>No login required</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-gray-800/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
            Powerful Features
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500/10 to-purple-600/10 rounded-lg flex items-center justify-center text-blue-500 dark:text-blue-400 mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
            How It Works
          </h2>

          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex-1 text-center">
              <div className="w-16 h-16 bg-blue-500 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Scan QR Code
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Open SYNCLYNK on your mobile and scan the QR code
              </p>
            </div>

            <div className="text-gray-300 dark:text-gray-600 text-4xl hidden md:block">
              →
            </div>

            <div className="flex-1 text-center">
              <div className="w-16 h-16 bg-purple-500 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Auto Pair
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Devices pair automatically without any login
              </p>
            </div>

            <div className="text-gray-300 dark:text-gray-600 text-4xl hidden md:block">
              →
            </div>

            <div className="flex-1 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Start Using
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Enjoy seamless connectivity between your devices
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;