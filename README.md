# TaxWise - AI-Powered Personal Finance Platform

TaxWise is a comprehensive financial management platform designed specifically for Indian users. It simplifies tax filing, optimizes deductions, and provides intelligent CIBIL score management with a premium, minimalist interface.

## 🌟 Features

### 📊 Smart Financial Data Ingestion
- Upload bank statements (CSV, PDF, Excel)
- Automatic transaction categorization
- Pattern recognition for recurring expenses
- Intelligent data normalization

### 💰 AI-Powered Tax Optimization
- Old vs New tax regime comparison
- Automatic deduction calculation (80C, 80D, 80G, 24B, etc.)
- Personalized tax-saving recommendations
- Advance tax calculation
- Real-time tax liability projection

### 📈 CIBIL Score Advisor
- Credit score simulation and what-if scenarios
- Personalized improvement recommendations
- Credit utilization tracking
- Loan eligibility calculator
- Payment history analysis

### 📱 Premium User Interface
- Swiss spa-inspired minimalist design
- Real-time interactive dashboards
- Responsive charts and visualizations
- Smooth animations and transitions
- Professional icons (no emojis)

## 🚀 Quick Start

### Prerequisites

- Python 3.8+
- Node.js 16+
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd taxwise/backend
```

2. Create a virtual environment:
```bash
python -m venv venv
```

3. Activate the virtual environment:
   - Windows (PowerShell):
   ```powershell
   .\venv\Scripts\Activate
   ```
   - Windows (Command Prompt):
   ```cmd
   venv\Scripts\activate.bat
   ```
   - Linux/Mac:
   ```bash
   source venv/bin/activate
   ```

4. Install dependencies:
```bash
pip install -r requirements.txt
pip install email-validator
uvicorn main:app --reload
```

5. Create a `.env` file based on `.env.example`:
```bash
copy .env.example .env  # Windows
cp .env.example .env    # Linux/Mac
```

6. Update the `.env` file with your credentials (optional for demo):
```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
SECRET_KEY=your-secret-key-here
```

7. Run the FastAPI server:
```bash
python app/main.py
```

The backend will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd taxwise/frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

## 🎯 Demo Credentials

For quick testing without setting up a database:

- **Email:** demo@taxwise.com
- **Password:** demo123

## 📁 Sample Data

Sample transaction data is available in `taxwise/data/sample_transactions.csv` for testing the file upload functionality.

## 🏗️ Project Structure

```
taxwise/
├── backend/
│   ├── app/
│   │   ├── api/          # API routes
│   │   ├── core/         # Core configuration
│   │   ├── models/       # Data models
│   │   ├── services/     # Business logic
│   │   │   ├── tax_calculator.py
│   │   │   ├── cibil_advisor.py
│   │   │   └── file_parser.py
│   │   ├── utils/        # Utility functions
│   │   └── main.py       # FastAPI application
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/   # React components
│   │   │   ├── Navbar.jsx
│   │   │   └── Sidebar.jsx
│   │   ├── pages/        # Page components
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── TaxCalculator.jsx
│   │   │   ├── CIBILAdvisor.jsx
│   │   │   └── FileUpload.jsx
│   │   ├── services/     # API services
│   │   ├── utils/        # Utility functions
│   │   ├── App.jsx       # Main app component
│   │   ├── main.jsx      # Entry point
│   │   └── index.css     # Global styles
│   ├── tailwind.config.js
│   ├── package.json
│   └── vite.config.js
└── data/
    └── sample_transactions.csv

```

## 🛠️ Tech Stack

### Frontend
- **React** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Recharts** - Charts and visualizations
- **Framer Motion** - Animations
- **Heroicons** - Premium icons
- **Axios** - API client

### Backend
- **FastAPI** - Web framework
- **Pandas** - Data processing
- **PDFPlumber** - PDF parsing
- **OpenAI API** - AI insights (optional)
- **Supabase** - Database & Auth (optional)
- **Pydantic** - Data validation

## 📊 API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - User login

### File Upload
- `POST /upload/{user_id}` - Upload financial statement

### Tax Services
- `GET /tax/{user_id}/calculate` - Calculate tax
- `POST /tax/{user_id}/deductions` - Update deductions
- `GET /tax/{user_id}/recommendations` - Get tax recommendations

### CIBIL Services
- `GET /cibil/{user_id}/score` - Get CIBIL score
- `POST /cibil/{user_id}/simulate` - Simulate score changes
- `GET /cibil/{user_id}/recommendations` - Get improvement tips
- `POST /cibil/{user_id}/update` - Update CIBIL data

### Dashboard
- `GET /dashboard/{user_id}` - Get dashboard data

## 🧪 Testing

### Backend Testing
```bash
cd taxwise/backend
python -m pytest tests/
```

### Frontend Testing
```bash
cd taxwise/frontend
npm run test
```

## 🔧 Development

### Running Both Frontend and Backend

For Windows PowerShell:
```powershell
# Terminal 1 - Backend
cd taxwise\backend
python app\main.py

# Terminal 2 - Frontend
cd taxwise\frontend
npm run dev
```

### API Documentation

When the backend is running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## 📱 Features in Detail

### Tax Calculation Engine
- Supports FY 2024-25 tax slabs
- Automatic regime comparison
- Deduction optimization under sections:
  - 80C (PPF, ELSS, LIC) - up to ₹1.5L
  - 80D (Health Insurance) - up to ₹1L
  - 80G (Donations)
  - 24B (Home Loan Interest) - up to ₹2L
  - 80E (Education Loan Interest)
  - HRA & LTA exemptions

### CIBIL Score Analysis
- Score calculation based on:
  - Payment History (35%)
  - Credit Utilization (30%)
  - Credit Age (15%)
  - Credit Mix (10%)
  - Credit Inquiries (10%)
- What-if scenario simulations
- Loan eligibility calculator

### Data Security
- Secure authentication
- Encrypted data transmission
- Local data processing option
- No sensitive data stored in demo mode

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Troubleshooting

### Common Issues

1. **Port already in use:**
   - Change the port in `app/main.py` for backend
   - Use `npm run dev -- --port 3000` for frontend

2. **Module not found errors:**
   - Ensure virtual environment is activated
   - Reinstall dependencies

3. **CORS errors:**
   - Check that backend is running on port 8000
   - Verify CORS settings in `app/main.py`

## 📞 Support

For issues or questions, please create an issue in the GitHub repository.

---

**Built with ❤️ for Indian taxpayers**