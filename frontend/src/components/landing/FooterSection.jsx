import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ScrollReveal, ScrollStagger } from '../ui/scroll-reveal';
import { BarChart3, Mail, Phone, MapPin, Twitter, Linkedin, Facebook } from 'lucide-react';

const FooterSection = () => {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  const scrollToSection = (sectionId) => {
    const element = document.querySelector(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const socialLinks = [
    { icon: <Twitter className="w-5 h-5" />, label: "Twitter", href: "#" },
    { icon: <Linkedin className="w-5 h-5" />, label: "LinkedIn", href: "#" },
    { icon: <Facebook className="w-5 h-5" />, label: "Facebook", href: "#" }
  ];

  const quickLinks = [
    { name: "Features", action: () => scrollToSection('#features') },
    { name: "Testimonials", action: () => scrollToSection('#testimonials') },
    { name: "Contact", action: () => scrollToSection('#contact') },
    { name: "Login", action: () => navigate('/login') }
  ];

  const toolLinks = [
    { name: "Tax Calculator", action: () => navigate('/tax') },
    { name: "CIBIL Advisor", action: () => navigate('/cibil') },
    { name: "Capital Gains", action: () => navigate('/capital-gains') },
    { name: "Debt Management", action: () => navigate('/debt') }
  ];

  const contactInfo = [
    { icon: <Mail className="w-5 h-5 text-primary-400" />, content: "support@financialtools.com" },
    { icon: <Phone className="w-5 h-5 text-primary-400" />, content: "+1 (555) 123-4567" },
    { icon: <MapPin className="w-5 h-5 text-primary-400" />, content: "San Francisco, CA" }
  ];

  const legalLinks = [
    { name: "Privacy Policy", href: "#" },
    { name: "Terms of Service", href: "#" },
    { name: "Cookie Policy", href: "#" }
  ];

  return (
    <footer className="bg-gray-900 text-white py-16">
      <div className="mx-auto max-w-6xl px-6">
        <ScrollStagger className="grid grid-cols-1 md:grid-cols-4 gap-8" staggerDelay={0.06}>
          
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-2">
            <ScrollReveal variant="slideInLeft">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-8 h-8 text-primary-400" />
                <span className="text-2xl font-bold font-montserrat">FinanceTools</span>
              </div>
              <p className="text-gray-300 mb-6 max-w-md font-inter">
                Empowering individuals and businesses with comprehensive financial analytics and tools 
                for tax calculation, investment tracking, and debt management.
              </p>
              <div className="flex items-center gap-4">
                {socialLinks.map((social, index) => (
                  <ScrollReveal key={index} variant="scaleIn" delay={0.15 + index * 0.05}>
                    <a 
                      href={social.href} 
                      className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-primary-600 transition-all duration-300 transform hover:scale-110"
                      aria-label={social.label}
                    >
                      {social.icon}
                    </a>
                  </ScrollReveal>
                ))}
              </div>
            </ScrollReveal>
          </div>

          {/* Quick Links */}
          <ScrollReveal variant="slideInRight" delay={0.1}>
            <div>
              <h4 className="font-semibold text-lg mb-4 font-montserrat">Quick Links</h4>
              <div className="flex flex-col gap-2">
                {quickLinks.map((link, index) => (
                  <button
                    key={index}
                    onClick={link.action}
                    className="text-gray-300 hover:text-primary-400 transition-colors text-left font-inter transform hover:translate-x-1 duration-200"
                  >
                    {link.name}
                  </button>
                ))}
              </div>
            </div>
          </ScrollReveal>

          {/* Tools */}
          <ScrollReveal variant="slideInRight" delay={0.15}>
            <div>
              <h4 className="font-semibold text-lg mb-4 font-montserrat">Our Tools</h4>
              <div className="flex flex-col gap-2">
                {toolLinks.map((tool, index) => (
                  <button
                    key={index}
                    onClick={tool.action}
                    className="text-gray-300 hover:text-primary-400 transition-colors text-left font-inter transform hover:translate-x-1 duration-200"
                  >
                    {tool.name}
                  </button>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </ScrollStagger>

        {/* Contact Info */}
        <ScrollReveal variant="fadeInUp" delay={0.2} className="border-t border-gray-800 mt-12 pt-8">
          <ScrollStagger className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8" staggerDelay={0.06}>
            {contactInfo.map((contact, index) => (
              <div key={index} className="flex items-center gap-3 group">
                <div className="transform group-hover:scale-110 transition-transform duration-200">
                  {contact.icon}
                </div>
                <span className="text-gray-300 font-inter group-hover:text-white transition-colors duration-200">
                  {contact.content}
                </span>
              </div>
            ))}
          </ScrollStagger>
        </ScrollReveal>

        {/* Bottom */}
        <ScrollReveal variant="fadeInUp" delay={0.3} className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between">
          <p className="text-gray-400 text-sm font-inter">
            © {currentYear} FinanceTools. All rights reserved.
          </p>
          <ScrollStagger className="flex items-center gap-6 mt-4 md:mt-0" staggerDelay={0.06}>
            {legalLinks.map((link, index) => (
              <a 
                key={index}
                href={link.href} 
                className="text-gray-400 hover:text-primary-400 text-sm transition-colors font-inter transform hover:scale-105 duration-200"
              >
                {link.name}
              </a>
            ))}
          </ScrollStagger>
        </ScrollReveal>
      </div>
    </footer>
  );
};

export default FooterSection;
