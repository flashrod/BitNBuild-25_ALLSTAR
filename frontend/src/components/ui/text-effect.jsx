"use client";

import { motion } from "framer-motion";
import React from "react";
import { cn } from "../../lib/utils";

const presets = {
  "fade-in-blur": {
    initial: { opacity: 0, filter: "blur(12px)" },
    animate: { opacity: 1, filter: "blur(0px)" },
  },
  "slide-down": {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
  },
  "slide-up": {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
  },
};

export function TextEffect({
  children,
  className,
  preset = "fade-in-blur",
  per = "word",
  as: Component = "p",
  variants,
  delay = 0,
  duration = 0.5,
  speedSegment = 0.1,
  ...props
}) {
  const words = children?.split(" ") || [];
  const chars = children?.split("") || [];
  const segments = per === "word" ? words : chars;

  const MotionComponent = motion[Component];
  const selectedVariants = variants || presets[preset];

  if (!selectedVariants) {
    console.warn(`Preset "${preset}" not found. Using default "fade-in-blur".`);
  }

  if (per === "line") {
    return (
      <MotionComponent
        className={cn("block", className)}
        initial={selectedVariants?.initial}
        animate={selectedVariants?.animate}
        transition={{
          duration,
          delay,
          ease: [0.25, 0.1, 0.25, 1],
        }}
        {...props}
      >
        {children}
      </MotionComponent>
    );
  }

  return (
    <MotionComponent className={cn("block", className)} {...props}>
      {segments.map((segment, i) => (
        <motion.span
          key={i}
          className="inline-block"
          initial={selectedVariants?.initial}
          animate={selectedVariants?.animate}
          transition={{
            duration,
            delay: delay + i * speedSegment,
            ease: [0.25, 0.1, 0.25, 1],
          }}
        >
          {segment}
          {per === "word" && i !== segments.length - 1 && " "}
        </motion.span>
      ))}
    </MotionComponent>
  );
}
