import os
from dotenv import load_dotenv
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

import google.generativeai as genai

# Configure API key (from .env)
genai.configure(api_key=GEMINI_API_KEY)

def ask_gemini(question: str) -> str:
    try:
        model = genai.GenerativeModel(
            "gemini-2.0-flash",
            system_instruction=(
                "You are TaxWise Assistant 🤖. "
                "Always reply in concise bullet points using markdown formatting. "
                "Only answer questions about Indian taxes, CIBIL scores, and personal finance. "
                "Keep answers short and clear. Use lists, headings, and bold for important info."
            )
        )
        response = model.generate_content(question)
        return response.text if response else "Sorry, I couldn't generate a response."
    except Exception as e:
        return f"Error: {str(e)}"