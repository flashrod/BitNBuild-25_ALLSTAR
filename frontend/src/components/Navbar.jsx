
import React, { useEffect, useState } from 'react';
import { BellIcon, CogIcon, Bars3Icon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { useAuth } from '../AuthContext';

const Navbar = ({ sidebarOpen, setSidebarOpen, handleLogout }) => {
  const [show, setShow] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const { currentUser } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY < 10) {
        setShow(true);
      } else if (currentScrollY > lastScrollY) {
        setShow(false); // scrolling down
      } else {
        setShow(true); // scrolling up
      }
      setLastScrollY(currentScrollY);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <motion.nav
      initial={{ y: 0, opacity: 1 }}
      animate={{ y: show ? 0 : -80, opacity: show ? 1 : 0 }}
      transition={{ duration: 0.3 }}
      className="fixed top-0 left-0 w-full z-50 backdrop-blur-lg bg-white/80 shadow-lg border-b border-gray-100"
      style={{ willChange: 'transform' }}
    >
      <div className="w-full px-8">
        <div className="flex flex-row items-center justify-between h-16 w-full">
          {/* Logo and Brand - only in navbar */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-md text-gray-700 hover:bg-gray-100 lg:hidden"
            >
              <Bars3Icon className="w-6 h-6" />
            </button>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl flex items-center justify-center shadow-md">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">TaxWise</h1>
                <p className="text-xs text-gray-500">Smart Finance Platform</p>
              </div>
            </motion.div>
          </div>

          {/* Right Side Menu - fully spaced out horizontally */}
          <div className="flex items-center gap-8">
            {/* Quick Stats */}
            <div className="hidden lg:flex items-center gap-8 mr-8">
              <div className="text-right">
                <p className="text-xs text-gray-500">Tax Year</p>
                <p className="text-sm font-semibold text-gray-900">2024-25</p>
              </div>
              <div className="h-8 w-px bg-gray-200"></div>
              <div className="text-right">
                <p className="text-xs text-gray-500">CIBIL Score</p>
                <p className="text-sm font-semibold text-green-600">750</p>
              </div>
            </div>

            {/* Icons */}
            <button className="p-2 hover:bg-indigo-50 rounded-lg transition-colors relative">
              <BellIcon className="w-5 h-5 text-indigo-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            <button className="p-2 hover:bg-indigo-50 rounded-lg transition-colors">
              <CogIcon className="w-5 h-5 text-indigo-600" />
            </button>

            {currentUser && (
              <button onClick={handleLogout} className="p-2 hover:bg-indigo-50 rounded-lg transition-colors">
                <ArrowRightOnRectangleIcon className="w-5 h-5 text-indigo-600" />
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;