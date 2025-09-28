import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { BarChart3, Menu, X, User, LogOut, ChevronRight } from 'lucide-react';

const 
Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  
  // Check for existing auth
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');
    if (token && userData) {
      setIsAuthenticated(true);
      setUser(JSON.parse(userData));
    }
  }, []);

  const navItems = [
    { name: "Features", link: "#features" },
    { name: "Testimonials", link: "#testimonials" },
    { name: "Contact", link: "#contact" }
  ];

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId) => {
    const element = document.querySelector(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setMobileMenuOpen(false);
  };

  const handleAuthAction = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    navigate('/');
  };

  const handleHomeClick = () => {
    navigate('/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const mobileMenuVariants = {
    hidden: { 
      opacity: 0, 
      height: 0,
      transition: {
        duration: 0.2,
        ease: "easeInOut"
      }
    },
    visible: { 
      opacity: 1, 
      height: 'auto',
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    }
  };

  const mobileItemVariants = {
    hidden: { x: -20, opacity: 0 },
    visible: (index) => ({
      x: 0,
      opacity: 1,
      transition: {
        delay: index * 0.1,
        duration: 0.3,
        ease: "easeOut"
      }
    })
  };

  return (
    <motion.nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm' : 'bg-transparent'
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Desktop Navbar */}
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <motion.div 
            className="flex items-center gap-2 cursor-pointer group"
            onClick={handleHomeClick}
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              whileHover={{ rotate: 10 }}
              transition={{ duration: 0.2 }}
            >
              <BarChart3 className="w-6 h-6 text-primary-600" />
            </motion.div>
            <span className="text-xl font-bold text-gray-900 font-montserrat">TaxWise</span>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item, index) => (
              <motion.button
                key={item.name}
                onClick={() => scrollToSection(item.link)}
                className="text-gray-700 hover:text-primary-600 transition-colors font-medium font-inter relative group"
                whileHover={{ y: -2 }}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * (index + 1), duration: 0.3 }}
              >
                {item.name}
                <motion.div
                  className="absolute -bottom-1 left-0 w-full h-0.5 bg-primary-600 origin-left"
                  initial={{ scaleX: 0 }}
                  whileHover={{ scaleX: 1 }}
                  transition={{ duration: 0.3 }}
                />
              </motion.button>
            ))}
          </div>

          {/* Desktop Auth */}
          <motion.div 
            className="hidden md:flex items-center space-x-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.3 }}
          >
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <motion.div 
                  className="flex items-center space-x-2"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-primary-600" />
                  </div>
                  <span className="font-medium text-gray-900 font-inter">
                    {user?.name || user?.email?.split('@')[0] || 'User'}
                  </span>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button onClick={handleAuthAction} variant="secondary" size="sm">
                    Dashboard
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button onClick={handleLogout} variant="ghost" size="sm">
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                </motion.div>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button onClick={() => navigate('/login')} variant="ghost" size="sm">
                    Login
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button onClick={() => navigate('/register')} size="sm">
                    Get Started
                  </Button>
                </motion.div>
              </div>
            )}
          </motion.div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <motion.div whileTap={{ scale: 0.95 }}>
              <Button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                variant="ghost"
                size="sm"
              >
                <AnimatePresence mode="wait">
                  {mobileMenuOpen ? (
                    <motion.div
                      key="close"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <X className="w-5 h-5" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="menu"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Menu className="w-5 h-5" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </Button>
            </motion.div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              variants={mobileMenuVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="md:hidden border-t border-gray-200 bg-white"
            >
              <div className="px-4 py-4 space-y-4">
                {/* Mobile Navigation */}
                {navItems.map((item, index) => (
                  <motion.button
                    key={item.name}
                    custom={index}
                    variants={mobileItemVariants}
                    initial="hidden"
                    animate="visible"
                    onClick={() => scrollToSection(item.link)}
                    className="flex items-center justify-between w-full text-left py-3 px-4 text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-lg transition-all duration-200 font-medium font-inter group"
                  >
                    <span>{item.name}</span>
                    <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transform group-hover:translate-x-1 transition-all duration-200" />
                  </motion.button>
                ))}

                <motion.div 
                  custom={navItems.length}
                  variants={mobileItemVariants}
                  initial="hidden"
                  animate="visible"
                  className="pt-4 border-t border-gray-200"
                >
                  {isAuthenticated ? (
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-primary-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 font-inter">
                            {user?.name || user?.email?.split('@')[0] || 'User'}
                          </p>
                        </div>
                      </div>
                      <Button onClick={handleAuthAction} variant="secondary" className="w-full">
                        Dashboard
                      </Button>
                      <Button onClick={handleLogout} variant="ghost" className="w-full">
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Button onClick={() => navigate('/login')} variant="ghost" className="w-full">
                        Login
                      </Button>
                      <Button onClick={() => navigate('/register')} className="w-full">
                        Get Started
                      </Button>
                    </div>
                  )}
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile Menu Backdrop */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/20 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
