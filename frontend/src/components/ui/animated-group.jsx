"use client";

import { motion } from "framer-motion";
import React from "react";
import { cn } from "../../lib/utils";

export function AnimatedGroup({
  children,
  className,
  variants,
  preset = "fade-in-blur",
  ...props
}) {
  const defaultVariants = {
    container: {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: 0.1,
          delayChildren: 0.1,
        },
      },
    },
    item: {
      hidden: { opacity: 0, y: 20 },
      visible: {
        opacity: 1,
        y: 0,
        transition: {
          type: "spring",
          bounce: 0.3,
          duration: 1.5,
        },
      },
    },
  };

  const selectedVariants = variants || defaultVariants;

  return (
    <motion.div
      className={cn("block", className)}
      initial="hidden"
      animate="visible"
      variants={selectedVariants}
      {...props}
    >
      {React.Children.map(children, (child, index) => (
        <motion.div key={index} variants={selectedVariants.item}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}
