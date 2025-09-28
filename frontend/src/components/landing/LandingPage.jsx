import React, { useState, useEffect } from 'react';
import HeroSection from './HeroSection';
import FeaturesSection from './FeaturesSection';
import TestimonialsSection from './TestimonialsSection';
import ContactSection from './ContactSection';
import FooterSection from './FooterSection';

const LandingPage = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-inter text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-white text-gray-900 overflow-x-hidden font-inter relative">
      <main className="overflow-hidden relative z-10">
        <div id="home">
          <HeroSection />
        </div>
      </main>
      <FeaturesSection />
      <TestimonialsSection />
      <ContactSection />
      <FooterSection />
    </div>
  );
};

export default LandingPage;
