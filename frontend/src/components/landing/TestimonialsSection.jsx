import React from 'react';
import { Card, CardContent } from '../ui/card';
import { ScrollReveal, ScrollStagger } from '../ui/scroll-reveal';
import { Star, Quote } from 'lucide-react';

export function TestimonialsSection() {
  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Small Business Owner",
      company: "Johnson Consulting",
      content: "The tax calculator has been a game-changer for my business planning. I can now estimate my tax liability accurately and make informed financial decisions.",
      rating: 5,
      avatar: "SJ"
    },
    {
      name: "Michael Chen",
      role: "Investment Advisor",
      company: "Chen Financial",
      content: "Capital gains tracking feature is incredibly detailed. It helps my clients understand their investment performance and tax implications clearly.",
      rating: 5,
      avatar: "MC"
    },
    {
      name: "Priya Patel",
      role: "Personal Finance Blogger",
      company: "Money Matters",
      content: "The CIBIL analysis provided insights I never had before. The recommendations actually helped me improve my credit score by 50 points!",
      rating: 5,
      avatar: "PP"
    },
    {
      name: "David Rodriguez",
      role: "Debt Counselor",
      company: "Financial Freedom Inc",
      content: "The debt management tools are exceptional. I recommend this platform to all my clients struggling with debt consolidation.",
      rating: 5,
      avatar: "DR"
    },
    {
      name: "Lisa Wang",
      role: "Portfolio Manager",
      company: "Wang Capital",
      content: "AI-powered insights have revolutionized how I analyze client portfolios. The accuracy and depth of analysis is unmatched.",
      rating: 5,
      avatar: "LW"
    },
    {
      name: "Robert Kumar",
      role: "Tax Professional",
      company: "Kumar & Associates",
      content: "As a tax professional, I appreciate the accuracy and comprehensiveness of the tax calculations. It saves me hours of work.",
      rating: 5,
      avatar: "RK"
    }
  ];

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <section id="testimonials" className="py-16 md:py-32 bg-white">
      <div className="mx-auto max-w-3xl lg:max-w-6xl px-6">
        
        {/* Testimonials Header */}
        <ScrollReveal variant="fadeInUp" className="flex flex-col items-center gap-4 text-center mb-16 sm:gap-8">
          <h2 className="max-w-[720px] text-3xl font-semibold leading-tight sm:text-5xl sm:leading-tight text-gray-900 font-montserrat">
            What Our Users Say
          </h2>
          <p className="text-md max-w-[600px] font-medium text-gray-600 sm:text-xl font-inter">
            Join thousands of satisfied users who have transformed their financial management with our platform.
          </p>
        </ScrollReveal>
        
        <ScrollStagger 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          staggerDelay={0.08}
        >
          {testimonials.map((testimonial, index) => (
            <Card 
              key={index} 
              className="relative bg-white border border-gray-200 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-500 group"
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-1 mb-4 transform group-hover:scale-110 transition-transform duration-300">
                  {renderStars(testimonial.rating)}
                </div>
                
                <div className="relative mb-6">
                  <Quote className="w-6 h-6 text-gray-300 absolute -top-2 -left-2 transform group-hover:text-primary-400 transition-colors duration-300" />
                  <p className="text-gray-700 font-inter leading-relaxed pl-4">
                    "{testimonial.content}"
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-semibold text-sm transform group-hover:scale-110 transition-transform duration-300">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 font-montserrat">
                      {testimonial.name}
                    </h4>
                    <p className="text-sm text-gray-500 font-inter">
                      {testimonial.role}, {testimonial.company}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </ScrollStagger>
        
        {/* Trust badges */}
        <ScrollReveal variant="slideInLeft" delay={0.5} className="mt-16 text-center">
          <p className="text-sm text-gray-500 mb-4 font-inter">Trusted by over 10,000+ users worldwide</p>
          <div className="flex items-center justify-center gap-8 opacity-60">
            <div className="text-xs text-gray-400 transform hover:scale-105 transition-transform duration-200">★★★★★ 4.9/5 on Reviews</div>
            <div className="text-xs text-gray-400 transform hover:scale-105 transition-transform duration-200">99.9% Uptime</div>
            <div className="text-xs text-gray-400 transform hover:scale-105 transition-transform duration-200">Bank-level Security</div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

export default TestimonialsSection;
