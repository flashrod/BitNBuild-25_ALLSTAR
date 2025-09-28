import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { ScrollReveal, ScrollStagger } from '../ui/scroll-reveal';
import { Calculator, TrendingUp, ChevronRight, Mail, Phone, MapPin } from 'lucide-react';

const ContactSection = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/login');
  };

  const handleRegister = () => {
    navigate('/register');
  };

  const contactInfo = [
    {
      icon: <Mail className="w-6 h-6 text-primary-600" />,
      title: "Email Support",
      content: "support@financialtools.com"
    },
    {
      icon: <Phone className="w-6 h-6 text-primary-600" />,
      title: "Phone Support", 
      content: "+1 (555) 123-4567"
    },
    {
      icon: <MapPin className="w-6 h-6 text-primary-600" />,
      title: "Office",
      content: "San Francisco, CA"
    }
  ];

  const stats = [
    { number: "10k+", label: "Active Users" },
    { number: "99.9%", label: "Uptime" },
    { number: "24/7", label: "Support" },
    { number: "4.9★", label: "Rating" }
  ];

  return (
    <section id="contact" className="py-16 md:py-32 bg-gradient-to-br from-primary-50 to-indigo-50">
      <div className="mx-auto max-w-4xl px-6">
        <ScrollReveal variant="fadeInUp" className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6 font-montserrat">
            Ready to Transform Your Financial Future?
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8 font-inter">
            Join thousands of users who have already discovered the power of smart financial analytics. 
            Start your journey towards financial freedom today.
          </p>
          
          <ScrollStagger className="flex gap-4 justify-center flex-col sm:flex-row" staggerDelay={0.08}>
            <Button 
              onClick={handleGetStarted}
              size="lg"
              className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-lg font-medium text-lg transition-all duration-200 hover:scale-105 hover:shadow-lg flex items-center gap-2"
            >
              <Calculator className="w-5 h-5" />
              Get Started
              <ChevronRight className="w-4 h-4" />
            </Button>
            
            <Button 
              onClick={handleRegister}
              size="lg"
              variant="outline"
              className="border-2 border-primary-600 text-primary-700 hover:bg-primary-50 px-8 py-4 rounded-lg font-medium text-lg transition-all duration-200 hover:scale-105 hover:shadow-lg flex items-center gap-2"
            >
              <TrendingUp className="w-5 h-5" />
              Create Account
            </Button>
          </ScrollStagger>
        </ScrollReveal>

        {/* Contact Information */}
        <ScrollStagger className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16" staggerDelay={0.08}>
          {contactInfo.map((info, index) => (
            <div key={index} className="text-center p-6 bg-white rounded-lg shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                {info.icon}
              </div>
              <h3 className="font-semibold text-gray-900 mb-2 font-montserrat">{info.title}</h3>
              <p className="text-gray-600 font-inter">{info.content}</p>
            </div>
          ))}
        </ScrollStagger>

        {/* Features highlight */}
        <ScrollReveal variant="scaleIn" delay={0.6} className="mt-16 text-center">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
            {stats.map((stat, index) => (
              <ScrollReveal key={index} variant="fadeInUp" delay={0.8 + index * 0.1}>
                <div className="text-center p-4 rounded-lg hover:bg-white/50 transition-colors duration-300">
                  <div className="text-2xl font-bold text-primary-600 mb-1 transform hover:scale-110 transition-transform duration-200">
                    {stat.number}
                  </div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default ContactSection;
