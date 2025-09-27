
# Sunhacks Landing Page Components

---

## 1. CTASection.jsx

```jsx
import React from "react";
import { useTheme } from "../../context/ThemeContext";
import { useNavigate } from "react-router-dom";

const CtaSection = React.forwardRef((props, ref) => {
	const { isDark } = useTheme();
	const navigate = useNavigate();

	return (
		<section
			ref={ref}
			className={`py-12 px-4 transition-colors duration-300 ${
				isDark ? "bg-[#080808]" : "bg-[#f8f8f8]"
			}`}
		>
			<div className="max-w-5xl mx-auto">
				<div
					className={`
						flex flex-row items-center justify-between gap-6
						rounded-xl border relative overflow-hidden transition-all duration-150
						${
							isDark
								? "bg-[#181818] border border-[#23234a] hover:border-[#a78bfa]/40"
								: "bg-white border border-[#e5e7eb] hover:border-[#7c3aed]/40"
						}
						px-6 py-8
					`}
				>
					<h2
						className={`
							text-lg md:text-xl font-semibold
							${isDark ? "text-[#f8f8f8]" : "text-[#080808]"}
						`}
					>
						Ready to Start Teaching?
					</h2>
					<button
						className={`
							px-5 py-2 rounded-full text-sm font-semibold shadow transition-all duration-150
							${
								isDark
									? "bg-[#4a4494] text-[#f8f8f8] hover:bg-[#3d3a7a]"
									: "bg-[#222052] text-[#f8f8f8] hover:bg-[#1a1840]"
							}
						`}
						onClick={() => navigate("/signup")}
					>
						Start Teaching
					</button>
				</div>
			</div>
		</section>
	);
});

export default CtaSection;
```

---

## 2. FeaturesGrid.jsx

```jsx
import React from "react";
import { motion } from "framer-motion";
import { useTheme } from "../../context/ThemeContext";
import {
	FaBrain,
	FaBook,
	FaChartBar,
	FaRobot,
	FaFilePdf,
	FaVideo,
	FaUsers,
	FaMedal,
} from "react-icons/fa";

const FeaturesGrid = () => {
	const { isDark } = useTheme();

	const features = [
		{
			key: "study-flow",
			title: "Personalized Study Flow",
			description:
				"Adaptive study schedules and task sequencing tailored to you.",
			Icon: FaBrain,
		},
		{
			key: "flashcards",
			title: "Smart Flashcards",
			description: "Auto-generated flashcards from notes, PDFs and textbooks.",
			Icon: FaBook,
		},
		{
			key: "quizzes",
			title: "Interactive Quizzes",
			description: "Short formative quizzes to reinforce retention and recall.",
			Icon: FaChartBar,
		},
		{
			key: "doubt-solver",
			title: "Doubt Solver",
			description: "Ask questions and get concise AI-guided answers and hints.",
			Icon: FaRobot,
		},
		{
			key: "pdf",
			title: "PDF & Notes",
			description: "Upload PDFs and get summaries, highlights and extracts.",
			Icon: FaFilePdf,
		},
		{
			key: "video-gen",
			title: "AI Video Generator",
			description: "Create short explainer videos from your content.",
			Icon: FaVideo,
		},
		{
			key: "community",
			title: "Community",
			description: "Study groups, peer help and shared resources.",
			Icon: FaUsers,
		},
		{
			key: "achievements",
			title: "Achievements",
			description: "Track progress, badges and milestones across courses.",
			Icon: FaMedal,
		},
	];

	const container = {
		hidden: { opacity: 0, y: 8 },
		visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.06 } },
	};

	const item = {
		hidden: { opacity: 0, y: 10 },
		visible: { opacity: 1, y: 0, transition: { duration: 0.36 } },
	};

	const cardBg = isDark
		? "bg-[#0b0b0b] border border-[#222]"
		: "bg-white border border-gray-100";
	const mutedText = isDark ? "text-[#f8f8f8]/75" : "text-[#080808]/70";
	const titleText = isDark ? "text-[#f8f8f8]" : "text-[#080808]";
	const iconBg = "bg-[#222052]";

	return (
		<section id="features" className="py-12 px-4 sm:py-16">
			<div className="max-w-5xl mx-auto">
				<motion.div
					initial={{ opacity: 0, y: 10 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.5 }}
					className="text-center mb-8 sm:mb-12"
				>
					<h2 className={`text-3xl sm:text-4xl md:text-5xl font-bold mb-4 md:mb-6  ${titleText}`}>
						Core Features
					</h2>
					<p className={`text-sm sm:text-base md:text-lg max-w-2xl mx-auto ${mutedText}`}>
						Practical tools you actually use  study flow, flashcards, quizzes,
						PDF tools and AI helpers. Optimized for phones; bento layout on
						laptops.
					</p>
				</motion.div>

				{/* MOBILE / SMALL SCREENS: stacked/grid */}
				<motion.div
					variants={container}
					initial="hidden"
					whileInView="visible"
					viewport={{ once: true }}
					className="grid grid-cols-1 sm:grid-cols-2 md:hidden gap-4"
				>
					{features.map((f) => {
						const Icon = f.Icon;
						return (
							<motion.article
								key={f.key}
								variants={item}
								whileHover={{ scale: 1.01 }}
								className={`p-4 rounded-lg ${cardBg} relative overflow-hidden`}
								aria-labelledby={`feature-${f.key}-title`}
							>
								<div className="flex items-start gap-4">
									<div
										className={`flex-shrink-0 w-11 h-11 rounded-md flex items-center justify-center ${iconBg} text-white text-lg`}
										aria-hidden
									>
										<Icon />
									</div>

									<div className="min-w-0">
										<h3
											id={`feature-${f.key}-title`}
											className={`text-sm sm:text-base font-semibold ${titleText} mb-1`}
										>
											{f.title}
										</h3>
										<p
											className={`text-xs sm:text-sm ${mutedText} leading-snug`}
										>
											{f.description}
										</p>
									</div>
								</div>
							</motion.article>
						);
					})}
				</motion.div>

				{/* DESKTOP / LAPTOP: Bento layout */}
				<div className="hidden md:block">
					<motion.div
						variants={container}
						initial="hidden"
						whileInView="visible"
						viewport={{ once: true }}
						className="grid grid-cols-4 grid-rows-2 gap-4 mb-4"
					>
						{/* Big tile: first feature */}
						{features[0] && (
							<motion.article
								variants={item}
								className={`p-6 rounded-lg ${cardBg} relative overflow-hidden md:col-span-2 md:row-span-2`}
								aria-labelledby={`feature-${features[0].key}-title`}
							>
								<div className="flex items-start gap-5 h-full">
									<div
										className={`flex-shrink-0 w-14 h-14 rounded-lg flex items-center justify-center ${iconBg} text-white text-2xl`}
										aria-hidden
									>
										{features[0] &&
											(() => {
												const Icon = features[0].Icon;
												return <Icon />;
											})()}
									</div>
									<div className="min-w-0">
										<h3
											id={`feature-${features[0].key}-title`}
											className={`text-lg font-bold ${titleText} mb-2`}
										>
											{features[0].title}
										</h3>
										<p className={`${mutedText} text-sm`}>
											{features[0].description}
										</p>
									</div>
								</div>
							</motion.article>
						)}

						{features.slice(1, 5).map((f, i) => {
							const Icon = f.Icon;
							const colStart = 3 + (i % 2);
							const rowStart = Math.floor(i / 2) + 1;
							return (
								<motion.article
									key={f.key}
									variants={item}
									className={`p-4 rounded-lg ${cardBg} relative overflow-hidden md:col-start-${colStart} md:row-start-${rowStart}`}
									aria-labelledby={`feature-${f.key}-title`}
								>
									<div className="flex items-start gap-3">
										<div
											className={`w-10 h-10 rounded-md flex items-center justify-center ${iconBg} text-white text-lg`}
										>
											<Icon />
										</div>
										<div>
											<h4 className={`text-sm font-semibold ${titleText}`}>
												{f.title}
											</h4>
											<p className={`text-xs ${mutedText}`}>{f.description}</p>
										</div>
									</div>
								</motion.article>
							);
						})}
					</motion.div>

					{/* remaining features (if any) shown in a compact row below the bento */}
					{features.length > 5 && (
						<motion.div
							variants={container}
							initial="hidden"
							whileInView="visible"
							viewport={{ once: true }}
							className="grid grid-cols-3 gap-4"
						>
							{features.slice(5).map((f) => {
								const Icon = f.Icon;
								return (
									<motion.article
										key={f.key}
										variants={item}
										className={`p-4 rounded-lg ${cardBg} relative overflow-hidden`}
										aria-labelledby={`feature-${f.key}-title`}
									>
										<div className="flex items-start gap-3">
											<div
												className={`w-10 h-10 rounded-md flex items-center justify-center ${iconBg} text-white text-lg`}
											>
												<Icon />
											</div>
											<div>
												<h4 className={`text-sm font-semibold ${titleText}`}>
													{f.title}
												</h4>
												<p className={`text-xs ${mutedText}`}>
													{f.description}
												</p>
											</div>
										</div>
									</motion.article>
								);
							})}
						</motion.div>
					)}
				</div>
			</div>
		</section>
	);
};

export default FeaturesGrid;
```

---

## 3. Footer.jsx

```jsx
import React from "react";
import { motion } from "framer-motion";
import { useTheme } from "../../context/ThemeContext";

const Footer = () => {
	const { isDark } = useTheme();

	return (
		<footer
			className={`relative py-8 ${isDark ? "bg-[#080808]" : "bg-[#f8f8f8]"}`}
		>
			<div className="max-w-5xl mx-auto px-4">
				{/* Horizontal line with fading edges - same width as content */}
				<div className="relative mb-8">
					<div
						className={`h-px w-full relative ${
							isDark ? "bg-[#f8f8f8]/20" : "bg-[#080808]/20"
						}`}
					>
						{/* Left fade */}
						<div
							className={`absolute left-0 top-0 h-full w-40 ${
								isDark
									? "bg-gradient-to-r from-[#080808] to-transparent"
									: "bg-gradient-to-r from-[#f8f8f8] to-transparent"
							}`}
						></div>
						{/* Right fade */}
						<div
							className={`absolute right-0 top-0 h-full w-40 ${
								isDark
									? "bg-gradient-to-l from-[#080808] to-transparent"
									: "bg-gradient-to-l from-[#f8f8f8] to-transparent"
							}`}
						></div>
					</div>
				</div>

				{/* Footer content */}
				<div className="flex flex-col md:flex-row justify-between items-center">
					<motion.p
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						className={`
							text-sm mb-4 md:mb-0
							${isDark ? "text-[#f8f8f8]/60" : "text-[#080808]/60"}
						`}
					>
						 2025 StudyAid. All rights reserved.
					</motion.p>

					<motion.p
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.1 }}
						className={`
							text-sm
							${isDark ? "text-[#f8f8f8]/60" : "text-[#080808]/60"}
						`}
					>
						crafted by{" "}
						<span
							className={`font-medium ${
								isDark ? "text-[#4a4494]" : "text-[#222052]"
							}`}
						>
							Team PONY
						</span>
					</motion.p>
				</div>
			</div>
		</footer>
	);
};

export default Footer;
```

---

## 4. HeroSection.jsx

```jsx
import React, { useState,useEffect } from "react";
import { motion } from "framer-motion";
import { useTheme } from "../../context/ThemeContext";
import { useNavigate } from "react-router-dom";

function InstallPWAButton() {
	const [deferredPrompt, setDeferredPrompt] = useState(null);
	const { isDark } = useTheme();

	useEffect(() => {
		const handler = (e) => {
			e.preventDefault();
			setDeferredPrompt(e);
		};
		window.addEventListener("beforeinstallprompt", handler);
		return () => window.removeEventListener("beforeinstallprompt", handler);
	}, []);

	const handleInstallClick = () => {
		if (deferredPrompt) {
			deferredPrompt.prompt();
			deferredPrompt.userChoice.then(() => setDeferredPrompt(null));
		}
	};

	if (!deferredPrompt) return null;

	return (
		<motion.button
			whileHover={{ translateY: -3 }}
			whileTap={{ translateY: 0 }}
			className="w-full sm:w-auto relative inline-flex items-center justify-center transition-transform duration-200 focus:outline-none"
			onClick={handleInstallClick}
		>
			<span
				className={`relative z-10 block w-full text-center px-12 py-3 text-sm font-medium
				rounded-md tracking-wider
				${isDark ? "bg-[#222052] text-white" : "bg-[#222052] text-white"}`}
				style={{
					boxShadow: isDark
						? "0 8px 22px rgba(28,24,72,0.55)"
						: "0 8px 22px rgba(34,34,60,0.12)",
				}}
			>
				Install App
			</span>
		</motion.button>
	);
}


const HeroSection = () => {
	const { isDark } = useTheme();
	const [activeTab, setActiveTab] = useState("study-flow");
	const navigate = useNavigate();

	const tabs = [
		{
			id: "study-flow",
			label: "Flow",
			image: "/StudyFlow.png",
		},
		{ id: "flashcards", label: "Cards  ", image: "/FlashCards.png" },
		{ id: "quizzes", label: "Quizzes", image: "/Quizzes.png" },
		{ id: "dashboard", label: "Dashboard", image: "/dashboard.png" },
	];

	return (
		<section className="pt-32 pb-20 px-4">
			<motion.div
				initial={{ opacity: 0, y: 30 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.8 }}
				className="text-center mb-16 mt-8"
			>
				<h1
					className={`
						text-3xl sm:text-4xl md:text-5xl font-bold mb-4 md:mb-6 leading-tight mx-auto
						max-w-3xl md:max-w-full md:whitespace-nowrap
						${isDark ? "text-[#f8f8f8]" : "text-[#080808]"}
					`}
				>
					Revolutionize{" "}
					<span
						className={`bg-clip-text text-transparent inline ${
							isDark
								? "bg-gradient-to-r from-[#4a4494] to-[#4a4494]/70"
								: "bg-gradient-to-r from-[#222052] to-[#222052]/70"
						}`}
					>
						Learning
					</span>{" "}
					with StudyAid
				</h1>
				<p
					className={`
						text-sm sm:text-base md:text-lg mb-6 max-w-2xl mx-auto leading-relaxed
						${isDark ? "text-[#f8f8f8]/70" : "text-[#080808]/70"}
					`}
				>
					Turn your notes, PDFs, and books into AI-powered study guides,
					flashcards, quizzes, and summaries. Personalized, multilingual, and
					interactive  all in one platform.
				</p>
				{/* CTA Buttons */}
				<div className="flex flex-col sm:flex-row gap-3 sm:gap-6 justify-center items-center mb-10 w-full px-2">
					{/* Primary: phone = full width + rounded-md, desktop = auto width + rounded-md */}
					<motion.button
						whileHover={{ translateY: -3 }}
						whileTap={{ translateY: 0 }}
						className="w-full sm:w-auto relative inline-flex items-center justify-center transition-transform duration-200 focus:outline-none"
						onClick={() => navigate("/signup")}
					>
						<span
							className={`relative z-10 block w-full text-center px-12 py-3 text-sm font-medium
				rounded-md tracking-wider
				${isDark ? "bg-[#222052] text-white" : "bg-[#222052] text-white"}`}
							style={{
								boxShadow: isDark
									? "0 8px 22px rgba(28,24,72,0.55)"
									: "0 8px 22px rgba(34,34,60,0.12)",
							}}
						>
							Get Started
						</span>
					</motion.button>

					<InstallPWAButton />
				</div>
			</motion.div>
			{/* Demo Container */}
			<div className="max-w-5xl mx-auto">
				<motion.div
					initial={{ opacity: 0, y: 50 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8, delay: 0.3 }}
					className="relative"
				>
					<div
						className={`absolute -inset-1 rounded-2xl ${
							isDark
								? "bg-gradient-to-r from-[#4a4494] via-[#4a4494]/50 to-[#4a4494] opacity-30"
								: "bg-gradient-to-r from-[#222052] via-[#222052]/50 to-[#222052] opacity-30"
						}`}
					></div>

					<div
						className={`
							relative rounded-2xl overflow-hidden
							${
								isDark
									? "bg-[#080808] border border-[#f8f8f8]/20"
									: "bg-[#f8f8f8] border border-[#080808]/20"
							}
						`}
					>
						{/* Tab Navigation */}
						<div
							className={`
								flex space-x-1 p-2 border-b
								${isDark ? "border-[#f8f8f8]/20" : "border-[#080808]/20"}
								relative justify-between px-2 md:px-10
							`}
						>
							{tabs.map((tab) => (
								<button
									key={tab.id}
									onClick={() => setActiveTab(tab.id)}
									className={`
				relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
				${
					activeTab === tab.id
						? isDark
							? "text-[#f8f8f8]"
							: "text-[#f8f8f8]"
						: isDark
						? "text-[#f8f8f8]/70 hover:text-[#f8f8f8] hover:bg-[#f8f8f8]/10"
						: "text-[#080808]/70 hover:text-[#080808] hover:bg-[#080808]/10"
				}
			`}
									style={{ zIndex: 1 }}
								>
									{activeTab === tab.id && (
										<motion.div
											layoutId="tab-highlight"
											className={`absolute inset-0 rounded-lg ${
												isDark ? "bg-[#4a4494]" : "bg-[#222052]"
											}`}
											style={{ zIndex: -1 }}
											transition={{
												type: "spring",
												stiffness: 400,
												damping: 30,
											}}
										/>
									)}
									{tab.label}
								</button>
							))}
						</div>

						{/* Tab Content */}
						<div className="p-2">
							<motion.div
								key={activeTab}
								layoutId="demo-tab-image"
								initial={{ opacity: 0, x: 20 }}
								animate={{ opacity: 1, x: 0 }}
								exit={{ opacity: 0, x: -20 }}
								transition={{ duration: 0.35, ease: "easeInOut" }}
								className={`aspect-video rounded-lg overflow-hidden ${
									isDark
										? "bg-gradient-to-br from-[#4a4494]/20 to-[#4a4494]/10"
										: "bg-gradient-to-br from-[#222052]/20 to-[#222052]/10"
								}`}
							>
								<img
									src={tabs.find((tab) => tab.id === activeTab)?.image}
									alt={`${activeTab} preview`}
									className="w-full h-full object-fill"
								/>
							</motion.div>
						</div>
					</div>
				</motion.div>
			</div>
		</section>
	);
};

export default HeroSection;
```

---

## 5. Landing.jsx

```jsx
import React, { useRef } from "react";
import { ThemeProvider } from "../../context/ThemeContext";
import Navbar from "./Navbar";
import HeroSection from "./HeroSection";
import FeaturesGrid from "./FeaturesGrid";
// import VideoSection from "./VideoSection";
import TestimonialsMarquee from "./TestimonialsMarquee";
// import CTASection from "./CTASection";
import Footer from "./Footer";

const Landing = () => {
	const ctaRef = useRef(null);

  
	return (
    
			<div className="min-h-screen transition-colors duration-300">
				<Navbar />
				<HeroSection />
				<FeaturesGrid />
				{/*<VideoSection />*/}
				<TestimonialsMarquee />
				{/* <CTASection ref={ctaRef} /> */}
				<Footer />
			</div>
    
	);
};

export default Landing;
```

---

## 6. Navbar.jsx

```jsx
import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ThemeToggle } from "./ThemeToggle";
import { useTheme } from "../../context/ThemeContext";
import { useNavigate } from "react-router-dom";
import { Toaster, toast } from "sonner";

const navItems = [
	{ name: "Home", href: "#" },
	{ name: "Features", href: "#features" },
	{ name: "Testimonials", href: "#testimonials" },
];

const Navbar = () => {
	const navigate = useNavigate();
	const { isDark } = useTheme();
	const [isScrolled, setIsScrolled] = useState(false);
	const [language, setLanguage] = useState(
		typeof window !== "undefined"
			? localStorage.getItem("language") || "en"
			: "en"
	);

	// dropdown state & ref for outside-click handling
	const [langOpen, setLangOpen] = useState(false);
	const langRef = useRef(null);

	useEffect(() => {
		const handleScroll = () => setIsScrolled(window.scrollY > 50);
		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	useEffect(() => {
		const stored = localStorage.getItem("language");
		if (stored) setLanguage(stored);
	}, []);

	// close language menu on outside click / escape
	useEffect(() => {
		const onDocClick = (e) => {
			if (langRef.current && !langRef.current.contains(e.target))
				setLangOpen(false);
		};
		const onEsc = (e) => {
			if (e.key === "Escape") setLangOpen(false);
		};
		document.addEventListener("click", onDocClick);
		document.addEventListener("keydown", onEsc);
		return () => {
			document.removeEventListener("click", onDocClick);
			document.removeEventListener("keydown", onEsc);
		};
	}, []);

	const showToast = (
		msg = "Feature paused to save API credits  translation disabled"
	) => {
		toast(msg, { duration: 3200 });
	};

	const onSelectLang = (lang) => {
		setLanguage(lang);
		try {
			localStorage.setItem("language", lang);
		} catch (e) {}
		setLangOpen(false);
		showToast();
	};

	return (
		<>
			<Toaster position="top-right" />
			<motion.nav
				initial={{ y: -100 }}
				animate={{ y: 0 }}
				className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ${
					isScrolled ? "w-11/12 max-w-4xl" : "w-11/12 max-w-5xl"
				}`}
			>
				<div
					className={`
						px-4 sm:px-6 py-3 rounded-full transition-all duration-300
						${
							isDark
								? "bg-[#080808]/80 border border-[#f8f8f8]/20"
								: "bg-[#f8f8f8]/80 border border-[#080808]/20"
						}
						backdrop-blur-md shadow-lg
					`}
				>
					<div className="flex items-center justify-between">
						{/* Logo + Name: always visible (phones + laptops) */}
						<motion.div
							whileHover={{ scale: 1.05 }}
							className="flex items-center space-x-2"
						>
							<div className="w-8 h-8 bg-gradient-to-br from-[#222052] to-[#222052]/70 rounded-lg flex items-center justify-center">
								<img className="w-6 h-6" src="/logo.png" alt="Logo" />
							</div>
							<span
								className={`text-xl font-bold ${
									isDark
										? "bg-gradient-to-r from-[#f8f8f8] to-[#f8f8f8]/80 bg-clip-text text-transparent"
										: "bg-gradient-to-r from-[#222052] to-[#222052]/80 bg-clip-text text-transparent"
								}`}
							>
								StudyAid
							</span>
						</motion.div>

						{/* Navigation - hidden on small screens (unchanged for laptop) */}
						<div className="hidden md:flex items-center space-x-8">
							{navItems.map((item, index) => (
								<motion.a
									key={item.name}
									href={item.href}
									initial={{ opacity: 0, y: -20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: index * 0.06 }}
									whileHover={{ y: -2 }}
									className={`text-sm font-medium transition-colors duration-200 ${
										isDark
											? "text-[#f8f8f8]/70 hover:text-[#f8f8f8]"
											: "text-[#080808]/70 hover:text-[#080808]"
									}`}
								>
									{item.name}
								</motion.a>
							))}
						</div>

						<div className="flex items-center space-x-3 sm:space-x-4">
							<ThemeToggle />

							{/* language dropdown - hidden on phones */}
							<div
								className="hidden sm:inline-block relative text-left mr-2 sm:mr-4"
								ref={langRef}
							>
								<button
									aria-haspopup="true"
									aria-expanded={langOpen}
									className="inline-flex items-center px-3 py-2 bg-white/5 border rounded-md text-sm font-medium hover:bg-white/10 transition touch-manipulation"
									onClick={() => setLangOpen((v) => !v)}
									type="button"
								>
									{language === "en"
										? "EN"
										: language === "mr"
										? "MR"
										: language.toUpperCase()}
									<svg
										className="ml-2 w-4 h-4"
										viewBox="0 0 20 20"
										fill="currentColor"
										aria-hidden="true"
									>
										<path
											fillRule="evenodd"
											d="M5.23 7.21a.75.75 0 011.06.02L10 11.584l3.71-4.354a.75.75 0 111.14.98l-4.25 5a.75.75 0 01-1.14 0l-4.25-5a.75.75 0 01.02-1.06z"
											clipRule="evenodd"
										/>
									</svg>
								</button>

								<div
									className={`${
										langOpen ? "" : "hidden"
									} origin-top-right absolute right-0 mt-2 w-44 rounded-md shadow-lg bg-white/90 dark:bg-[#0b0b0b]/95 z-50 max-w-[92vw]`}
									style={{ minWidth: 140 }}
								>
									<div className="py-1">
										<button
											className="w-full text-left px-4 py-3 text-sm touch-manipulation"
											onClick={() => onSelectLang("en")}
										>
											English
										</button>
										<button
											className="w-full text-left px-4 py-3 text-sm"
											onClick={() => onSelectLang("mr")}
										>
											Marathi
										</button>
										<button
											className="w-full text-left px-4 py-3 text-sm"
											onClick={() => onSelectLang("hi")}
										>
											Hindi
										</button>
									</div>
								</div>
							</div>

							{/* CTA - hidden on phones */}
							<div className="hidden sm:inline-flex">
								<motion.button
									whileHover={{ scale: 1.05 }}
									whileTap={{ scale: 0.95 }}
									className="px-3 sm:px-4 py-2 bg-[#222052] text-[#f8f8f8] rounded-full text-sm font-medium hover:bg-[#222052]/90 transition-colors duration-200"
									onClick={() => navigate("/login")}
									type="button"
								>
									Get Started
								</motion.button>
							</div>
						</div>
					</div>
				</div>
			</motion.nav>
		</>
	);
};

export default Navbar;
```

---

## 7. TestimonialsMarquee.jsx

```jsx
import React from "react";
import { motion } from "framer-motion";
import { useTheme } from "../../context/ThemeContext";

const TestimonialsMarquee = () => {
	const { isDark } = useTheme();

	const testimonials = [
		{
			name: "Dr. Priya Sharma",
			role: "Professor, Delhi University",
			content:
				"BharatAI has transformed how I teach. The Hindi language support makes complex concepts accessible to all my students.",
			rating: 5,
		},
		{
			name: "Rajesh Kumar",
			role: "High School Teacher",
			content:
				"The AI-powered content generation saves me hours of preparation time. My students are more engaged than ever.",
			rating: 5,
		},
		{
			name: "Meera Patel",
			role: "Online Educator",
			content:
				"Finally, a platform that understands the Indian education system. The multi-language support is phenomenal.",
			rating: 5,
		},
		{
			name: "Arjun Singh",
			role: "Training Institute Owner",
			content:
				"Our enrollment has increased by 200% since we started using BharatAI. The analytics help us improve constantly.",
			rating: 5,
		},
		{
			name: "Kavitha Nair",
			role: "Language Teacher",
			content:
				"Teaching Malayalam online has never been easier. The platform adapts to regional learning patterns beautifully.",
			rating: 5,
		},
		{
			name: "Suresh Gupta",
			role: "Vocational Trainer",
			content:
				"The mobile-first approach means my students can learn anywhere. Perfect for India's diverse learning environments.",
			rating: 5,
		},
		{
			name: "Anita Desai",
			role: "Primary School Principal",
			content:
				"Our teachers love how easy it is to create engaging lessons. Student participation has improved dramatically.",
			rating: 5,
		},
		{
			name: "Vikram Choudhary",
			role: "Engineering Professor",
			content:
				"The technical course creation tools are exceptional. Complex engineering concepts are now easier to explain.",
			rating: 5,
		},
		{
			name: "Ritu Agarwal",
			role: "Language Institute Director",
			content:
				"Perfect for teaching multiple Indian languages. The cultural context awareness is impressive.",
			rating: 5,
		},
		{
			name: "Deepak Mehta",
			role: "Skill Development Trainer",
			content:
				"Rural students can now access quality education. This platform is bridging the digital divide effectively.",
			rating: 5,
		},
		{
			name: "Sunita Roy",
			role: "Mathematics Teacher",
			content:
				"Complex mathematical concepts are now visual and interactive. Students actually enjoy math class now!",
			rating: 5,
		},
		{
			name: "Manish Pandey",
			role: "Corporate Trainer",
			content:
				"Training professionals across different languages has never been this smooth. Excellent platform!",
			rating: 5,
		},
	];

	// Create four columns
	const column1 = testimonials.slice(0, 3);
	const column2 = testimonials.slice(3, 6);
	const column3 = testimonials.slice(6, 9);
	const column4 = testimonials.slice(9, 12);

	const TestimonialCard = ({ testimonial }) => (
		<div
			className={`
			p-4 rounded-lg mb-3 max-w-xs mx-auto flex-shrink-0
			${
				isDark
					? "bg-[#080808] border border-[#f8f8f8]/20"
					: "bg-[#f8f8f8] border border-[#080808]/20"
			}
			shadow-sm hover:shadow-md transition-shadow duration-200
		`}
		>
			<div className="flex mb-2">
				{[...Array(testimonial.rating)].map((_, i) => (
					<span
						key={i}
						className={`text-xs ${
							isDark ? "text-[#4a4494]" : "text-[#222052]"
						}`}
					>
						
					</span>
				))}
			</div>
			<p
				className={`
				text-xs mb-3 leading-relaxed
				${isDark ? "text-[#f8f8f8]/80" : "text-[#080808]/80"}
			`}
			>
				"{testimonial.content}"
			</p>
			<div>
				<p
					className={`
					font-semibold text-xs
					${isDark ? "text-[#f8f8f8]" : "text-[#080808]"}
				`}
				>
					{testimonial.name}
				</p>
				<p
					className={`
					text-xs opacity-70
					${isDark ? "text-[#f8f8f8]/60" : "text-[#080808]/60"}
				`}
				>
					{testimonial.role}
				</p>
			</div>
		</div>
	);

	const MarqueeColumn = ({ testimonials, direction, columnIndex }) => {
		const animationName = direction === "up" ? "marquee-up" : "marquee-down";

		return (
			<div
				className="relative flex flex-col group"
				style={{
					overflow: "hidden",
					height: "320px",
				}}
			>
				<div
					className="flex flex-col will-change-transform"
					style={{
						animation: `${animationName} 20s linear infinite`,
						animationPlayState: "running",
					}}
				>
					{/* Create multiple sets for seamless infinite loop */}
					{[...testimonials, ...testimonials, ...testimonials].map(
						(testimonial, index) => (
							<TestimonialCard
								key={`${columnIndex}-${index}`}
								testimonial={testimonial}
							/>
						)
					)}
				</div>
			</div>
		);
	};

	return (
		<section id="testimonials" className="py-20 overflow-hidden">
			<div className="max-w-5xl mx-auto px-4 mb-16">
				<motion.div
					initial={{ opacity: 0, y: 30 }}
					whileInView={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6 }}
					className="text-center"
				>
					<h2
						className={`
						text-4xl md:text-5xl font-bold mb-6
						${isDark ? "text-[#f8f8f8]" : "text-[#080808]"}
					`}
					>
						Loved by Educators
					</h2>
					<p
						className={`
						text-sm sm:text-base md:text-lg max-w-2xl mx-auto
						${isDark ? "text-[#f8f8f8]/70" : "text-[#080808]/70"}
					`}
					>
						Thousands of teachers across India trust BharatAI for their
						educational needs
					</p>
				</motion.div>
			</div>

			{/* Four columns with tight spacing */}
			<div className="flex space-x-2 px-4 max-w-5xl mx-auto">
				<div className="flex-1">
					<MarqueeColumn
						testimonials={column1}
						direction="up"
						columnIndex={0}
					/>
				</div>
				<div className="flex-1">
					<MarqueeColumn
						testimonials={column2}
						direction="down"
						columnIndex={1}
					/>
				</div>
				<div className="flex-1">
					<MarqueeColumn
						testimonials={column3}
						direction="up"
						columnIndex={2}
					/>
				</div>
				<div className="flex-1">
					<MarqueeColumn
						testimonials={column4}
						direction="down"
						columnIndex={3}
					/>
				</div>
			</div>

			{/* Fixed CSS Animations */}
			<style>{`
				@keyframes marquee-up {
					0% {
						transform: translateY(0);
					}
					100% {
						transform: translateY(-33.33%);
					}
				}
				@keyframes marquee-down {
					0% {
						transform: translateY(-33.33%);
					}
					100% {
						transform: translateY(0);
					}
				}


				.group:hover .flex.flex-col.will-change-transform {
				animation-play-state: paused !important;
			`}</style>
		</section>
	);
};

export default TestimonialsMarquee;
```

---

## 8. ThemeToggle.jsx

```jsx
import React from "react";
import { useTheme } from "../../context/ThemeContext";

export function ThemeToggle({ className = "" }) {
	const { isDark, toggleTheme } = useTheme();

	return (
		<div
			className={`
				flex w-16 h-8 p-1 rounded-full cursor-pointer transition-all duration-300 relative
				${
					isDark
						? "bg-[#222052] border border-[#f8f8f8]/20"
						: "bg-[#f8f8f8] border border-[#080808]/20"
				}
				${className}
			`}
			onClick={toggleTheme}
			role="button"
			tabIndex={0}
			onKeyDown={(e) => e.key === "Enter" && toggleTheme()}
		>
			<div
				className={`
					flex justify-center items-center w-6 h-6 rounded-full transition-all duration-300 absolute
					${
						isDark
							? "transform translate-x-0 bg-[#f8f8f8]"
							: "transform translate-x-8 bg-[#080808]"
					}
				`}
			>
				{isDark ? (
					<svg
						className="w-3 h-3 text-[#080808]"
						fill="currentColor"
						viewBox="0 0 20 20"
					>
						<path
							fillRule="evenodd"
							d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
							clipRule="evenodd"
						/>
					</svg>
				) : (
					<svg
						className="w-3 h-3 text-[#f8f8f8]"
						fill="currentColor"
						viewBox="0 0 20 20"
					>
						<path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
					</svg>
				)}
			</div>
		</div>
	);
}
```

---

## 9. VideoSection.jsx

```jsx
import React from "react";
import { motion } from "framer-motion";
import { useTheme } from "../../context/ThemeContext";

const VideoSection = () => {
	const { isDark } = useTheme();

	return (
		<section
			id="demo-video"
			className={`py-20 px-4 transition-colors duration-300 ${
				isDark ? "bg-[#080808]" : "bg-[#f8f8f8]"
			}`}
		>
			<div className="max-w-5xl mx-auto text-center mb-10">
				<motion.h2
					initial={{ opacity: 0, y: 30 }}
					whileInView={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6 }}
					className={`text-4xl md:text-5xl font-bold mb-4 ${
						isDark ? "text-[#f8f8f8]" : "text-[#080808]"
					}`}
				>
					Watch Demo
				</motion.h2>
				<motion.p
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.7 }}
					className={`text-lg mb-8 ${
						isDark ? "text-[#f8f8f8]/70" : "text-[#080808]/70"}
					}`}
				>
					See E-Gurukul in action and discover how easy it is to teach and learn
					in your language.
				</motion.p>
			</div>
			<motion.div
				initial={{ opacity: 0, scale: 0.98 }}
				whileInView={{ opacity: 1, scale: 1 }}
				transition={{ duration: 0.5 }}
				className={`relative rounded-2xl overflow-hidden shadow-lg mx-auto max-w-4xl border ${
					isDark ? "bg-[#181818] border-[#23234a]" : "bg-white border-[#e5e7eb]"
				}`}
			>
				<div className="aspect-video w-full">
					<iframe
						className="w-full h-full"
						src="https://www.youtube.com/embed/5evUR-tcGFA?si=FuYXQXwAbG5RutoF"
						title="E-Gurukul Demo"
						allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
						referrerPolicy="strict-origin-when-cross-origin"
						allowFullScreen
						style={{ borderRadius: "1rem" }}
					/>
				</div>
			</motion.div>
		</section>
	);
};

export default VideoSection;
```

---