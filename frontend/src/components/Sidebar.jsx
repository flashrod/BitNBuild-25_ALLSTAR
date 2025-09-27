import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  HomeIcon,
  CalculatorIcon,
  CreditCardIcon,
  CloudArrowUpIcon,
  ChartBarIcon,
  DocumentTextIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

const Sidebar = () => {
  const menuItems = [
    { path: '/dashboard', name: 'Dashboard', icon: HomeIcon },
    { path: '/upload', name: 'Upload Files', icon: CloudArrowUpIcon },
    { path: '/tax', name: 'Tax Calculator', icon: CalculatorIcon },
    { path: '/cibil', name: 'CIBIL Advisor', icon: CreditCardIcon },
  ];

  const secondaryItems = [
    { path: '/reports', name: 'Reports', icon: DocumentTextIcon },
    { path: '/analytics', name: 'Analytics', icon: ChartBarIcon },
    { path: '/help', name: 'Help & Support', icon: QuestionMarkCircleIcon },
  ];

  return (
    <div className="h-full bg-white border-r border-gray-100">
      <div className="flex flex-col h-full">
        {/* Main Navigation */}
        <div className="flex-1 py-4">
          <nav className="px-4 space-y-1">
            {menuItems.map((item, index) => (
              <motion.div
                key={item.path}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                      isActive
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon className={`w-5 h-5 ${isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                      <span className="font-medium">{item.name}</span>
                      {isActive && (
                        <motion.div
                          layoutId="activeIndicator"
                          className="ml-auto w-1 h-4 bg-primary-600 rounded-full"
                        />
                      )}
                    </>
                  )}
                </NavLink>
              </motion.div>
            ))}
          </nav>

          {/* Divider */}
          <div className="mx-4 my-6 border-t border-gray-100"></div>

          {/* Secondary Navigation */}
          <nav className="px-4 space-y-1">
            {secondaryItems.map((item, index) => (
              <motion.div
                key={item.path}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: (menuItems.length + index) * 0.1 }}
              >
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                      isActive
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`
                  }
                >
                  <item.icon className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
                  <span className="font-medium">{item.name}</span>
                </NavLink>
              </motion.div>
            ))}
          </nav>
        </div>

        {/* Premium Badge */}
        <div className="p-4">
          <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl p-4 text-white">
            <div className="flex items-center space-x-2 mb-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="font-semibold">Pro Features</span>
            </div>
            <p className="text-xs text-primary-100 mb-3">
              Unlock advanced tax optimization and AI insights
            </p>
            <button className="w-full bg-white text-primary-700 text-sm font-medium py-2 rounded-lg hover:bg-primary-50 transition-colors">
              Upgrade Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;