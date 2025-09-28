
import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  XMarkIcon,
  SparklesIcon,
  ExclamationTriangleIcon
} from "@heroicons/react/24/outline";

const faqSuggestions = [
  "What documents do I need to file my ITR?",
  "What factors affect my CIBIL score?",
  "How can I plan my finances for tax efficiency next year?"
];

const palette = {
  primary: "#1f2937", // gray-800
  secondary: "#6b7280", // gray-500
  accent: "#6366f1", // indigo-500
  surface: "#ffffff",
  background: "#f9fafb", // gray-50
};

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text:
        "Welcome to TaxWise Assistant. Ask me anything about tax, CIBIL, or personal finance."
    }
  ]);
  const [input, setInput] = useState("");
  const [showFaqs, setShowFaqs] = useState(true);
  const [loading, setLoading] = useState(false);

  const sendMessage = async (questionText) => {
    const question = questionText || input;
    if (!question.trim()) return;
    const userMessage = { sender: "user", text: question };
    setMessages((prev) => [...prev, userMessage]);
    if (showFaqs) setShowFaqs(false);
    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: question })
      });
      const data = await res.json();
      const botMessage = { sender: "bot", text: data.reply };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "<span class='flex items-center gap-1 text-red-500'><ExclamationTriangleIcon class='w-4 h-4'/> Error contacting server</span>"
        }
      ]);
    } finally {
      setLoading(false);
    }
    setInput("");
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="w-full max-w-md md:max-w-lg h-[32rem] bg-white rounded-2xl shadow-2xl flex flex-col border border-gray-100"
            style={{ boxShadow: "0 8px 32px rgba(31,41,55,0.08)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 rounded-t-2xl border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100">
              <span className="font-semibold text-lg flex items-center gap-2 text-gray-800">
                <ChatBubbleLeftRightIcon className="w-6 h-6 text-indigo-500" />
                TaxWise Assistant
              </span>
              <button
                onClick={() => setIsOpen(false)}
                className="hover:bg-gray-200 rounded-full p-2 transition"
                aria-label="Close"
              >
                <XMarkIcon className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 px-6 py-4 overflow-y-auto bg-gray-50">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`my-2 flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`max-w-[80%] px-4 py-2 rounded-xl text-base shadow-sm prose prose-sm ${
                      msg.sender === "user"
                        ? "bg-indigo-500 text-white"
                        : "bg-white border border-gray-100 text-gray-800"
                    }`}
                    style={{
                      fontWeight: msg.sender === "bot" ? 400 : 500,
                      fontSize: "1rem"
                    }}
                  >
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                  </motion.div>
                </div>
              ))}
              {loading && (
                <div className="my-2 flex justify-start">
                  <div className="max-w-[80%] px-4 py-2 rounded-xl text-base shadow-sm bg-white border border-gray-100 text-gray-800 animate-pulse flex items-center gap-2">
                    <SparklesIcon className="w-4 h-4 text-indigo-400" /> Typing...
                  </div>
                </div>
              )}
            </div>

            {/* FAQ Suggestions */}
            {showFaqs && (
              <div className="px-6 py-3 border-t bg-gray-50 flex flex-wrap gap-2">
                {faqSuggestions.map((faq, idx) => (
                  <button
                    key={idx}
                    onClick={() => sendMessage(faq)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1 rounded-full text-sm font-medium transition flex items-center gap-1"
                  >
                    <SparklesIcon className="w-4 h-4 text-indigo-400" /> {faq}
                  </button>
                ))}
              </div>
            )}

            {/* Input box */}
            <div className="p-4 border-t bg-white flex gap-2">
              <input
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition text-gray-800 bg-gray-50"
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  if (showFaqs && e.target.value.trim()) setShowFaqs(false);
                }}
                placeholder="Ask something..."
                onKeyDown={e => e.key === "Enter" && sendMessage()}
              />
              <button
                onClick={() => sendMessage()}
                className="bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2 rounded-xl font-semibold transition flex items-center gap-1"
                aria-label="Send"
              >
                <PaperAirplaneIcon className="w-5 h-5" />
                Send
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-0 bg-white border border-gray-200 text-gray-800 rounded-l-2xl px-8 py-4 shadow-lg font-semibold text-lg hover:scale-105 transition flex items-center gap-2"
            style={{ boxShadow: "0 4px 16px rgba(31,41,55,0.08)" }}
            aria-label="Open Chatbot"
          >
            <ChatBubbleLeftRightIcon className="w-6 h-6 text-indigo-500" />
            Assistance
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Chatbot;