import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: "bot", text: "Hi! I'm TaxWise Assistant 🤖. Ask me anything about tax or credit score." }
  ]);
  const [input, setInput] = useState("");

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { sender: "user", text: input };
    setMessages([...messages, userMessage]);

    // Call backend /chat endpoint
    try {
      const res = await fetch("http://127.0.0.1:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input })
      });
      const data = await res.json();
      const botMessage = { sender: "bot", text: data.reply };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      setMessages(prev => [...prev, { sender: "bot", text: "⚠️ Error contacting server" }]);
    }

    setInput("");
  };

  return (
    <div className="fixed bottom-8 right-8 z-50">
      {isOpen ? (
        <div className="w-[28rem] h-[34rem] bg-white rounded-2xl shadow-2xl flex flex-col border border-gray-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-400 text-white px-6 py-4 rounded-t-2xl flex items-center justify-between">
            <span className="font-semibold text-xl flex items-center gap-2">
              <span className="bg-blue-500 rounded-full p-2">💬</span>
              TaxWise Assistant
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-blue-500 rounded-full px-3 py-2 transition"
              aria-label="Close"
            >
              ✖
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 px-5 py-4 overflow-y-auto bg-gray-50">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`my-2 flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-2 rounded-xl text-base shadow prose prose-sm ${
                    msg.sender === "user"
                      ? "bg-blue-500 text-white"
                      : "bg-white border border-gray-200 text-gray-800"
                  }`}
                >
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.text}
                  </ReactMarkdown>
                </div>
              </div>
            ))}
          </div>

          {/* Input box */}
          <div className="p-4 border-t bg-white flex gap-2">
            <input
              className="flex-1 border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask something..."
              onKeyDown={e => e.key === "Enter" && sendMessage()}
            />
            <button
              onClick={sendMessage}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl font-semibold transition"
            >
              Send
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-8 right-0 bg-gradient-to-r from-blue-600 to-blue-400 text-white rounded-l-2xl px-8 py-4 shadow-lg font-semibold text-lg hover:scale-105 transition"
          style={{ transform: "translateX(0)" }}
          aria-label="Open Chatbot"
        >
          Click here for any Assistance
        </button>
      )}
    </div>
  );
};

export default Chatbot;