import React from 'react';
import { Card, CardContent } from '../ui/card';
import { ScrollReveal, ScrollStagger } from '../ui/scroll-reveal';
import { 
  Calculator, 
  TrendingUp, 
  Shield, 
  BarChart3,
  FileText,
  Brain,
  PieChart,
  DollarSign
} from 'lucide-react';

export function FeaturesSection() {
  const features = [
    {
      icon: <Calculator className="w-8 h-8 text-blue-600" />,
      title: "Tax Calculator",
      description: "Advanced tax calculations with real-time updates and detailed breakdowns for optimal tax planning."
    },
    {
      icon: <Shield className="w-8 h-8 text-green-600" />,
      title: "CIBIL Score Analysis",
      description: "Comprehensive credit score analysis with personalized recommendations to improve your creditworthiness."
    },
    {
      icon: <TrendingUp className="w-8 h-8 text-purple-600" />,
      title: "Capital Gains Tracking",
      description: "Monitor your investments and track capital gains with detailed analytics and tax implications."
    },
    {
      icon: <BarChart3 className="w-8 h-8 text-orange-600" />,
      title: "Debt Management",
      description: "Smart debt consolidation strategies and payment optimization to achieve financial freedom faster."
    },
    {
      icon: <Brain className="w-8 h-8 text-indigo-600" />,
      title: "AI-Powered Insights",
      description: "Intelligent financial recommendations powered by machine learning algorithms and market analysis."
    },
    {
      icon: <PieChart className="w-8 h-8 text-red-600" />,
      title: "Portfolio Analytics",
      description: "Detailed portfolio analysis with risk assessment and diversification recommendations."
    }
  ];

  return (
    <section id="features" className="bg-gray-50 py-16 md:py-32">
      <div className="mx-auto max-w-3xl lg:max-w-6xl px-6">
        
        {/* Features Header */}
        <ScrollReveal variant="fadeInUp" className="flex flex-col items-center gap-4 text-center mb-16 sm:gap-8">
          <h2 className="max-w-[720px] text-3xl font-semibold leading-tight sm:text-5xl sm:leading-tight text-gray-900 font-montserrat">
            Powerful Financial Tools
          </h2>
          <p className="text-md max-w-[600px] font-medium text-gray-600 sm:text-xl font-inter">
            Comprehensive suite of financial tools designed to help you make informed decisions and achieve your financial goals.
          </p>
        </ScrollReveal>
        
        <ScrollStagger 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          staggerDelay={0.08}
        >
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="relative bg-white border border-gray-200 shadow-sm hover:shadow-lg hover:-translate-y-2 transition-all duration-300"
            >
              <CardContent className="p-8 text-center">
                <div className="mb-6 flex justify-center">
                  <div className="p-3 bg-gray-50 rounded-full transform transition-transform hover:scale-110 duration-200">
                    {feature.icon}
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3 font-montserrat">
                  {feature.title}
                </h3>
                <p className="text-gray-600 font-inter leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </ScrollStagger>
        
        {/* Additional Info */}
        <ScrollReveal variant="scaleIn" delay={0.4} className="mt-16 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 rounded-full text-primary-700 text-sm font-medium">
            <FileText className="w-4 h-4" />
            All calculations are based on current tax regulations and market data
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

export default FeaturesSection;
