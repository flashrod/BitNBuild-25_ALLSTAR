import React from "react";
import { QuestionMarkCircleIcon, ChatBubbleLeftRightIcon, DocumentTextIcon, ChartBarIcon, CalculatorIcon, BanknotesIcon, CreditCardIcon, ShieldCheckIcon, AcademicCapIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";

const faqs = [
  {
    question: "How do I upload my financial data?",
    answer: "Go to the Upload Files page, select your CSV/XLSX file, and click upload. Supported formats are shown on the page. For capital gains, use broker statements with columns like Trade Date, Instrument, Quantity, Buy/Sell Price, etc.",
    icon: DocumentTextIcon,
  },
  {
    question: "How does the Debt Simulator work?",
    answer: "Add debts manually or upload a CSV. Choose a repayment strategy (Snowball or Avalanche) and simulate your repayment timeline, interest paid, and monthly payments. Charts visualize your debt reduction over time.",
    icon: BanknotesIcon,
  },
  {
    question: "How do I analyze my capital gains?",
    answer: "Upload your broker statement in the Capital Gains Analyzer. The app will parse your trades, calculate short/long term gains, and visualize your results with charts. Click 'Analyze Gains' for a summary.",
    icon: ChartBarIcon,
  },
  {
    question: "What is the Tax Calculator?",
    answer: "Enter your annual income and deductions. The calculator compares old and new tax regimes, recommends the best option, and shows your advance tax schedule. AI-powered tips help you save more.",
    icon: CalculatorIcon,
  },
  {
    question: "How does the CIBIL Advisor work?",
    answer: "Upload your credit report or enter details manually. The advisor analyzes your credit health, gives actionable tips, and helps you improve your score.",
    icon: CreditCardIcon,
  },
  {
    question: "What does the Dashboard show?",
    answer: "The Dashboard gives you a snapshot of your finances: debts, capital gains, tax status, and more. Use it to track your progress and spot trends.",
    icon: AcademicCapIcon,
  },
  {
    question: "How do I use Analytics and Reports?",
    answer: "Analytics visualizes your financial data with charts and trends. Reports let you download summaries for tax filing or personal review.",
    icon: ShieldCheckIcon,
  },
  {
    question: "Troubleshooting: File upload errors, CORS, or chart issues?",
    answer: "Make sure your file format matches the sample templates. If you see CORS errors, check your browser and backend settings. For chart issues, refresh the page or re-upload your data.",
    icon: ChatBubbleLeftRightIcon,
  },
  {
    question: "Is my data secure?",
    answer: "Your data is processed locally and never shared. For cloud deployments, all sensitive info is encrypted and protected. See our privacy policy for details.",
    icon: ShieldCheckIcon,
  },
  {
    question: "How do I contact support?",
    answer: "Email support@taxwise.com or use the chat widget in the bottom left. We're here to help with any issues or questions.",
    icon: ChatBubbleLeftRightIcon,
  },
];

const HelpSupport = () => (
  <div className="min-h-screen bg-gray-50">
    <div className="max-w-3xl mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <QuestionMarkCircleIcon className="w-8 h-8 text-indigo-600" />
          <h1 className="text-3xl font-bold text-gray-900">Help & Support</h1>
        </div>
        <p className="text-gray-600">Find answers to common questions, troubleshooting tips, and contact info for support.</p>
      </motion.div>
      <div className="space-y-6">
        {faqs.map((faq, idx) => (
          <motion.div key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center mb-2">
              <faq.icon className="w-6 h-6 text-indigo-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">{faq.question}</h2>
            </div>
            <p className="text-gray-700">{faq.answer}</p>
          </motion.div>
        ))}
      </div>
      <div className="mt-10 text-center text-gray-500 text-sm">
        &copy; 2025 TaxWise. All rights reserved.
      </div>
    </div>
  </div>
);

export default HelpSupport;
