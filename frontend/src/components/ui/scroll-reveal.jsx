"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { useScrollAnimation, scrollVariants, fadeInUp, slideInLeft, slideInRight, scaleIn } from '../../hooks/useScrollAnimation';

const animationVariants = {
  fadeInUp,
  slideInLeft, 
  slideInRight,
  scaleIn,
  default: scrollVariants
};

export const ScrollReveal = ({
  children,
  variant = 'default',
  delay = 0,
  duration = 0.4,
  className = '',
  ...props
}) => {
  const [ref, isInView] = useScrollAnimation();
  
  const selectedVariant = animationVariants[variant] || animationVariants.default;
  
  // Add delay to the animation
  const variantWithDelay = {
    ...selectedVariant,
    visible: {
      ...selectedVariant.visible,
      transition: {
        ...selectedVariant.visible.transition,
        delay: delay,
        duration: duration
      }
    }
  };

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={variantWithDelay}
      className={className}
      style={{ willChange: 'transform, opacity' }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export const ScrollStagger = ({
  children,
  className = '',
  staggerDelay = 0.06,
  ...props
}) => {
  const [ref, isInView] = useScrollAnimation();

  const containerVariant = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: 0.05
      }
    }
  };

  const itemVariant = {
    hidden: { 
      opacity: 0, 
      y: 15
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    }
  };

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={containerVariant}
      className={className}
      style={{ willChange: 'transform, opacity' }}
      {...props}
    >
      {React.Children.map(children, (child, index) => (
        <motion.div key={index} variants={itemVariant} style={{ willChange: 'transform, opacity' }}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
};
