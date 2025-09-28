import React from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../ui/button';
import { TextEffect } from '../ui/text-effect';
import { AnimatedGroup } from '../ui/animated-group';
import { 
  Calculator, 
  TrendingUp, 
  Shield, 
  BarChart3,
  ChevronRight
} from 'lucide-react';

const transitionVariants = {
  item: {
    hidden: {
      opacity: 0,
      filter: 'blur(12px)',
      y: 12,
    },
    visible: {
      opacity: 1,
      filter: 'blur(0px)',
      y: 0,
      transition: {
        type: 'spring',
        bounce: 0.3,
        duration: 1.5,
      },
    },
  },
};

export default function HeroSection() {
  // Removed navigate and handleGetStarted, using <Link> for navigation instead

  const handleLearnMore = () => {
    const element = document.querySelector('#features');
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="relative w-full h-full">
      
      <main className="overflow-hidden bg-transparent relative z-10">
        <section>
          <div className="relative pt-24 pb-16">
            <div className="absolute inset-0 -z-10 size-full bg-gradient-to-b from-transparent to-white"></div>
            <div className="mx-auto max-w-5xl px-6">
              <div className="sm:mx-auto lg:mr-auto lg:mt-0">
                <TextEffect
                  preset="fade-in-blur"
                  speedSegment={0.3}
                  as="h1"
                  className="mt-8 max-w-2xl text-balance text-5xl font-bold md:text-6xl lg:mt-16 text-gray-900 font-montserrat">
                  Master Your Financial Future with Smart Analytics
                </TextEffect>
                <TextEffect
                  per="line"
                  preset="fade-in-blur"
                  speedSegment={0.3}
                  delay={0.5}
                  as="p"
                  className="mt-8 max-w-2xl text-pretty text-lg text-gray-100 font-inter drop-shadow-lg">
                  Comprehensive financial tools for tax calculation, CIBIL score analysis, debt management, and capital gains tracking. Make informed decisions with AI-powered insights and real-time analytics.
                </TextEffect>
                <AnimatedGroup
                  variants={{
                    container: {
                      visible: {
                        transition: {
                          staggerChildren: 0.05,
                          delayChildren: 0.75,
                        },
                      },
                    },
                    ...transitionVariants,
                  }}
                  className="mt-12 flex items-center gap-2 flex-col sm:flex-row">
                  <div
                    key={1}
                    className="bg-gray-100 rounded-xl border p-0.5">
                    <Link to="/login" style={{ textDecoration: 'none' }}>
                      <Button
                        size="lg"
                        className="rounded-xl px-5 text-base bg-primary-600 hover:bg-primary-700">
                        <span className="text-nowrap">Get Started</span>
                        <ChevronRight className="ml-2 w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                  <Button
                    key={2}
                    size="lg"
                    variant="ghost"
                    onClick={handleLearnMore}
                    className="h-10.5 rounded-xl px-5 text-base">
                    <span className="text-nowrap">Learn More</span>
                  </Button>
                </AnimatedGroup>
                {/* Feature icons */}
                <motion.div 
                  className="mt-16 flex items-center justify-center gap-8 opacity-80"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 0.8, y: 0 }}
                  transition={{ delay: 1.2, duration: 0.8 }}
                >
                  <div className="flex items-center gap-2 text-sm text-white drop-shadow">
                    <Calculator className="w-5 h-5" />
                    Tax Calculator
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white drop-shadow">
                    <Shield className="w-5 h-5" />
                    CIBIL Analysis
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white drop-shadow">
                    <TrendingUp className="w-5 h-5" />
                    Capital Gains
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white drop-shadow">
                    <BarChart3 className="w-5 h-5" />
                    Debt Management
                  </div>
                </motion.div>
              </div>
            </div>
            <AnimatedGroup
              variants={{
                container: {
                  visible: {
                    transition: {
                      staggerChildren: 0.05,
                      delayChildren: 0.75,
                    },
                  },
                },
                ...transitionVariants,
              }}>
              <div className="mask-b-from-55% relative -mr-56 mt-16 overflow-hidden px-2 sm:mr-0 sm:mt-20 md:mt-24">
                <div className="relative mx-auto max-w-5xl overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 shadow-xl ring-1 ring-gray-200">
                  <div className="aspect-video bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl flex items-center justify-center">
                    <div className="text-center">
                      <BarChart3 className="w-16 h-16 text-primary-600 mx-auto mb-4" />
                      <p className="text-lg font-semibold text-gray-900">Financial Dashboard</p>
                      <p className="text-sm text-gray-600">Comprehensive analytics at your fingertips</p>
                    </div>
                  </div>
                </div>
              </div>
            </AnimatedGroup>
          </div>
        </section>
      </main>
    </div>
  );
}
