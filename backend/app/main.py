"""Unified FastAPI application entrypoint.

Secure Document Vault feature has been removed per current requirements.
Remaining routes cover financial features (debt, capital gains, tax, cibil, etc.).
"""

from dotenv import load_dotenv
load_dotenv()

import logging, os, uuid
from datetime import datetime
from typing import Optional, List, Dict

from fastapi import FastAPI, APIRouter, UploadFile, File, Form, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse

logging.basicConfig(level=logging.INFO)

# --- App & CORS ---
app = FastAPI(title="BitNBuild API")
app.add_middleware(
    CORSMiddleware,
    # For local development we can safely allow all. TODO: tighten in production.
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def unified_health():
    return {"status": "ok", "time": datetime.utcnow().isoformat()}

# (Secure vault router removed)

# --- Legacy / existing feature imports & setup ---
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.models.debt import Debt
from app.models.database import (
    User, UserCreate, UserLogin, Transaction, TaxData, 
    CIBILData, FileUpload, TaxRecommendation, CIBILRecommendation
)
from app.services.debt_service import DebtService
from app.services.tax_calculator import TaxCalculator
from app.services.cibil_advisor import CIBILAdvisor
from app.services.file_parser import FileParser
from app.deps.auth import get_current_user
from app.services.capital_gains_service import CapitalGainsService
from app.db import init_db, close_db


from app.services.chatbot import ask_gemini

# Load environment variables
load_dotenv()
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")

# MongoDB connected log for local dev clarity
print("MongoDB connected! (local dev stub)")

 # (App already created above)

# In-memory storage (replace with actual database in production)
user_debts: Dict = {}
users_db: Dict = {}
transactions_db: Dict = {}
tax_data_db: Dict = {}
cibil_data_db: Dict = {}
user_gains: Dict = {}

@app.on_event("startup")
async def on_startup():
    global users_db, transactions_db, tax_data_db, cibil_data_db
    await init_db()
    # Initialize mock user for development (only once)
    mock_user_id = 'mock-user-id'
    mock_user = {
        'id': mock_user_id,
        'email': 'mock@user.com',
        'name': 'Mock User',
        'phone': '1234567890',
        'pan_number': 'MOCK12345P',
        'created_at': datetime.now()
    }
    users_db[mock_user_id] = mock_user
    transactions_db[mock_user_id] = []
    tax_data_db[mock_user_id] = TaxData(
        id=str(uuid.uuid4()),
        user_id=mock_user_id,
        tax_year=settings.TAX_YEAR,
        gross_income=0
    )
    cibil_data_db[mock_user_id] = CIBILData(
        id=str(uuid.uuid4()),
        user_id=mock_user_id
    )

@app.on_event("shutdown")
async def on_shutdown():
    await close_db()

 # (CORS already configured above)

# Initialize services
debt_service = DebtService()
tax_calculator = TaxCalculator()
cibil_advisor = CIBILAdvisor()
file_parser = FileParser()
capital_gains_service = CapitalGainsService()
debt_router = APIRouter()
capital_gains_router = APIRouter()

# Analysis router (new)
from fastapi import APIRouter as _APIRouter
from fastapi.responses import JSONResponse as _JSONResponse
from app.services.file_parser import parse_transaction_file, parse_capital_gains_file
import pandas as _pd
from datetime import timedelta as _timedelta

analysis_router = _APIRouter(prefix="/analysis", tags=["Analysis"])

UPLOAD_DIR = "data/uploads"

def _get_latest_file(prefix: str, fallback: str = None):
    try:
        files = [f for f in os.listdir(UPLOAD_DIR) if f.startswith(prefix) and f.endswith('.csv')]
        if files:
            latest = max(files)
            return os.path.join(UPLOAD_DIR, latest)
        elif fallback and os.path.exists(fallback):
            return fallback
        else:
            return None
    except Exception:
        if fallback and os.path.exists(fallback):
            return fallback
        return None

# TODO: Implement debt ingestion logic here

# TODO: Implement debt ingestion logic here
def ingest_debts_for_user(user_id: str):
    # For demo/mock, load sample debts if no uploaded debts exist
    demo_debts = [
        Debt(
            id=str(uuid.uuid4()),
            user_id=user_id,
            type="Home Loan",
            principal=2500000,
            interest_rate=7.5,
            tenure_months=240,
            emi=22000,
            start_date=datetime(2022, 1, 1),
            remaining=2200000,
            interest_paid=120000
        ),
        Debt(
            id=str(uuid.uuid4()),
            user_id=user_id,
            type="Car Loan",
            principal=800000,
            interest_rate=9.0,
            tenure_months=60,
            emi=17000,
            start_date=datetime(2023, 6, 1),
            remaining=600000,
            interest_paid=40000
        ),
        Debt(
            id=str(uuid.uuid4()),
            user_id=user_id,
            type="Credit Card",
            principal=120000,
            interest_rate=18.0,
            tenure_months=12,
            emi=11000,
            start_date=datetime(2024, 3, 1),
            remaining=90000,
            interest_paid=8000
        )
    ]
    user_debts[user_id] = demo_debts
    return {'success': True, 'count': len(demo_debts)}

@debt_router.get('/debt/list')
async def list_debts(user_id: str):
    debts = user_debts.get(user_id, [])
    return {'debts': [vars(d) for d in debts]}

@debt_router.post('/debt/simulate')
async def simulate_debt(user_id: str = Form(...), strategy: str = Form('snowball')):
    debts = user_debts.get(user_id, [])
    result = debt_service.simulate_repayment(debts, strategy)
    return result

# Capital gains endpoints
@capital_gains_router.post('/capital_gains/ingest')
async def ingest_gains(user_id: str = Form(...), file: UploadFile = File(...)):
    content = await file.read()
    gains = capital_gains_service.ingest(user_id, content, file.filename)
    user_gains[user_id] = gains
    return {'success': True, 'count': len(gains)}

@capital_gains_router.get('/capital_gains/list')
async def list_gains(user_id: str):
    gains = user_gains.get(user_id, [])
    return {'gains': [vars(g) for g in gains]}

@capital_gains_router.post('/capital_gains/analyze')
async def analyze_gains(user_id: str = Form(...)):
    result = capital_gains_service.analyze(user_id)
    return result

# Register routers
app.include_router(debt_router)
app.include_router(capital_gains_router)
app.include_router(analysis_router)

# Reports router
from fastapi import APIRouter as __APIRouter
from app.services.tax_calculator import calculate_tax_impact

reports_router = __APIRouter(prefix="/reports", tags=["Reports"])


# New: /reports/{user_id} returns a list of report objects with AI insights

@reports_router.get("/{user_id}", response_model=dict)
async def get_reports(user_id: str):
    """Generate financial report(s) for user, using dashboard/tax logic and Gemini for insights. Uses sample files if user files missing."""
    sample_tx = "data/sample_transactions.csv"
    sample_cg = "data/sample_capital_gains.csv"
    try:
        transaction_file = _get_latest_file("transaction_", fallback=sample_tx)
        capital_file = _get_latest_file("capital_gains_", fallback=sample_cg)
        if not transaction_file or not capital_file:
            raise HTTPException(status_code=404, detail="No uploaded or sample files found.")
        tx_df = parse_transaction_file(transaction_file)
        gains_df = parse_capital_gains_file(capital_file)
        if tx_df.empty or gains_df.empty:
            raise HTTPException(status_code=400, detail="Uploaded/sample files are empty or invalid")
        # ...existing logic...
        if 'type' not in tx_df.columns:
            tx_df['type'] = 'credit'
        total_income = tx_df[tx_df['type']=='credit']['amount'].sum()
        total_expenses = tx_df[tx_df['type']=='debit']['amount'].sum()
        net_savings = total_income - total_expenses
        gains_df['date'] = _pd.to_datetime(gains_df['date'])
        total_capital_gains = gains_df['gain_amount'].sum()
        monthly_gains_series = gains_df.groupby(gains_df['date'].dt.to_period('M'))['gain_amount'].sum()
        avg_monthly_gain = monthly_gains_series.mean() if not monthly_gains_series.empty else 0
        chart_data = [
            {"month": str(period), "value": float(val)} for period, val in monthly_gains_series.items()
        ]
        projected = []
        last_val = monthly_gains_series.iloc[-1] if not monthly_gains_series.empty else 0
        for i in range(6):
            projected.append({"month": f"Future {i+1}", "value": float(last_val * (1.05 ** i))})
        tax_impact = calculate_tax_impact(total_capital_gains)

        # AI-powered insights using Gemini
        from app.services.chatbot import ask_gemini
        ai_prompt = (
            f"Here is a user's financial summary:\n"
            f"Total Income: ₹{total_income}\n"
            f"Total Expenses: ₹{total_expenses}\n"
            f"Net Savings: ₹{net_savings}\n"
            f"Capital Gains: ₹{total_capital_gains}\n"
            f"Tax Impact: ₹{tax_impact['estimated_tax']}\n"
            f"Please provide:\n"
            f"- 3 key insights about their financial health\n"
            f"- 2 risks or areas for improvement\n"
            f"- 2 actionable recommendations for next quarter\n"
            f"- 1 long-term goal suggestion\n"
            f"Format as markdown bullet points."
        )
        ai_response = ask_gemini(ai_prompt)
        # Parse AI response into sections (simple split)
        key_insights = []
        risk_factors = []
        action_items = []
        long_term_goals = ""
        if ai_response:
            lines = [l.strip('-• ') for l in ai_response.split('\n') if l.strip()]
            section = None
            for line in lines:
                if "insight" in line.lower():
                    section = "insights"
                elif "risk" in line.lower() or "improve" in line.lower():
                    section = "risks"
                elif "recommendation" in line.lower() or "action" in line.lower():
                    section = "actions"
                elif "goal" in line.lower():
                    section = "goal"
                elif section == "insights":
                    key_insights.append(line)
                elif section == "risks":
                    risk_factors.append(line)
                elif section == "actions":
                    action_items.append({"task": line, "priority": "medium"})
                elif section == "goal":
                    long_term_goals = line

        report_obj = {
            "id": f"report-{user_id}-{datetime.now().isoformat()}",
            "title": "Financial Report",
            "type": "General",
            "source": "Dashboard & Tax Aggregation",
            "created_at": datetime.now().isoformat(),
            "summary": {
                "financial_overview": {
                    "total_income": round(float(total_income),2),
                    "total_expenses": round(float(total_expenses),2),
                    "net_savings": round(float(net_savings),2),
                    "tax_liability": round(float(tax_impact['estimated_tax']),2)
                },
                "key_insights": key_insights,
                "risk_factors": risk_factors,
                "ai_summary": ai_response
            },
            "future_scope": {
                "action_items": action_items,
                "long_term_goals": long_term_goals
            },
            "chart_data": {"historical": chart_data, "projected": projected},
            "generated_at": datetime.now().isoformat(),
            "last_uploaded": {
                "transaction": os.path.basename(transaction_file),
                "capital_gains": os.path.basename(capital_file)
            }
        }
        return _JSONResponse(content={"reports": [report_obj]})
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating report: {str(e)}")

app.include_router(reports_router)

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "Welcome to TaxWise API",
        "version": settings.APP_VERSION,
        "endpoints": {
            "auth": "/auth",
            "upload": "/upload",
            "tax": "/tax",
            "cibil": "/cibil",
            "dashboard": "/dashboard"
        }
    }

# Authentication endpoints
@app.post("/auth/register")
async def register(user_data: UserCreate):
    """Register a new user"""
    # Check if user already exists
    if any(u.email == user_data.email for u in users_db.values()):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    user_id = str(uuid.uuid4())
    user = User(
        id=user_id,
        email=user_data.email,
        name=user_data.name,
        phone=user_data.phone,
        pan_number=user_data.pan_number,
        created_at=datetime.now()
    )
    
    users_db[user_id] = user
    transactions_db[user_id] = []
    
    # Initialize tax and CIBIL data
    tax_data_db[user_id] = TaxData(
        id=str(uuid.uuid4()),
        user_id=user_id,
        tax_year=settings.TAX_YEAR,
        gross_income=0
    )
    
    cibil_data_db[user_id] = CIBILData(
        id=str(uuid.uuid4()),
        user_id=user_id
    )
    
    return {"message": "User registered successfully", "user_id": user_id}

@app.post("/auth/login")
async def login(credentials: UserLogin):
    """Login user"""
    # Find user by email
    user = next((u for u in users_db.values() if u.email == credentials.email), None)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    return {
        "message": "Login successful",
        "user_id": user.id,
        "access_token": "mock_token_" + user.id  # In production, use proper JWT
    }

# File upload endpoint
@app.post("/upload/{user_id}")
async def upload_file(user_id: str, file: UploadFile = File(...)):
    """Upload and process financial statement file"""
    print(f"Upload request for user_id: {user_id}")
    print(f"Available users: {list(users_db.keys())}")
    
    if user_id not in users_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User {user_id} not found. Available users: {list(users_db.keys())}"
        )
    
    # Validate file extension
    file_ext = file.filename.split('.')[-1].lower()
    if f".{file_ext}" not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not allowed. Allowed types: {settings.ALLOWED_EXTENSIONS}"
        )
    
    # Read file content
    content = await file.read()
    
    # Parse file based on type
    try:
        print(f"Processing file: {file.filename}, type: {file_ext}")
        
        if file_ext == 'csv':
            transactions = file_parser.parse_csv(content, file.filename)
        elif file_ext == 'pdf':
            transactions = file_parser.parse_pdf(content, file.filename)
        else:
            transactions = file_parser.parse_csv(content, file.filename)  # Try CSV for Excel files
        
        print(f"Parsed {len(transactions)} transactions")
        
        # Store transactions
        if user_id not in transactions_db:
            transactions_db[user_id] = []
        
        for transaction in transactions:
            transaction.user_id = user_id
            transaction.id = str(uuid.uuid4())
            transactions_db[user_id].append(transaction)
        
        print(f"Stored transactions for user {user_id}, total: {len(transactions_db[user_id])}")
        
        # Analyze transactions
        analysis = file_parser.analyze_transactions(transactions)
        print(f"Analysis complete: {len(analysis)} keys")
        
        # Update tax data with income information
        if user_id in tax_data_db and 'income_analysis' in analysis:
            tax_data_db[user_id].gross_income = analysis['income_analysis']['total'] * 12  # Annualized
        
        return {
            "message": "File processed successfully",
            "transactions_count": len(transactions),
            "analysis": analysis
        }
        
    except Exception as e:
        print(f"Error processing file: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing file: {str(e)}"
        )

# Tax calculation endpoints
@app.get("/tax/{user_id}/calculate")
async def calculate_tax(user_id: str):
    """Calculate tax for user"""
    if user_id not in tax_data_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tax data not found for user"
        )
    
    tax_data = tax_data_db[user_id]
    
    # Calculate tax under both regimes
    taxable_old, tax_old = tax_calculator.calculate_old_regime_tax(tax_data)
    taxable_new, tax_new = tax_calculator.calculate_new_regime_tax(tax_data)
    
    # Update tax data
    tax_data.taxable_income_old = taxable_old
    tax_data.taxable_income_new = taxable_new
    tax_data.tax_old_regime = tax_old
    tax_data.tax_new_regime = tax_new
    tax_data.recommended_regime = tax_calculator.recommend_regime(tax_data)
    
    return {
        "gross_income": tax_data.gross_income,
        "old_regime": {
            "taxable_income": taxable_old,
            "tax_payable": tax_old,
            "deductions_claimed": (
                tax_data.deduction_80c + tax_data.deduction_80d + 
                tax_data.deduction_80g + tax_data.deduction_24b + 
                tax_data.deduction_80e + tax_data.deduction_80tta +
                tax_data.hra_exemption + tax_data.lta_exemption + 
                tax_data.standard_deduction
            )
        },
        "new_regime": {
            "taxable_income": taxable_new,
            "tax_payable": tax_new,
            "deductions_claimed": tax_data.standard_deduction
        },
        "recommended_regime": tax_data.recommended_regime,
        "savings_with_recommendation": abs(tax_old - tax_new),
        "advance_tax_schedule": tax_calculator.calculate_advance_tax(
            tax_old if tax_data.recommended_regime == "old" else tax_new
        )
    }

@app.post("/tax/{user_id}/deductions")
async def update_deductions(user_id: str, deductions: Dict):
    """Update tax deductions for user"""
    if user_id not in tax_data_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tax data not found for user"
        )
    
    tax_data = tax_data_db[user_id]
    
    # Update deductions
    for key, value in deductions.items():
        if hasattr(tax_data, f"deduction_{key}"):
            setattr(tax_data, f"deduction_{key}", value)
    
    return {"message": "Deductions updated successfully"}

@app.get("/tax/{user_id}/recommendations")
async def get_tax_recommendations(user_id: str):
    """Get tax saving recommendations"""
    if user_id not in tax_data_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tax data not found for user"
        )
    
    tax_data = tax_data_db[user_id]
    recommendations = tax_calculator.get_tax_saving_recommendations(tax_data)
    
    return {
        "recommendations": [rec.dict() for rec in recommendations],
        "total_potential_savings": sum(rec.potential_savings for rec in recommendations)
    }

# CIBIL score endpoints
@app.get("/cibil/{user_id}/score")
async def get_cibil_score(user_id: str):
    """Get CIBIL score and analysis"""
    if user_id not in cibil_data_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="CIBIL data not found for user"
        )
    
    cibil_data = cibil_data_db[user_id]
    
    # Analyze transactions if available
    if user_id in transactions_db and transactions_db[user_id]:
        credit_analysis = cibil_advisor.analyze_credit_behavior(transactions_db[user_id])
        
        # Update CIBIL data based on transaction analysis
        if credit_analysis.get('debt_to_income_ratio'):
            cibil_data.utilization_percentage = min(100, credit_analysis['debt_to_income_ratio'])
    
    score = cibil_advisor.calculate_score(cibil_data)
    category = cibil_advisor.get_score_category(score)
    
    return {
        "current_score": score,
        "score_category": category,
        "score_factors": {
            "payment_history": {
                "weight": "35%",
                "status": "Good" if cibil_data.late_payments == 0 else "Needs Improvement"
            },
            "credit_utilization": {
                "weight": "30%",
                "current": f"{cibil_data.utilization_percentage:.1f}%",
                "status": "Excellent" if cibil_data.utilization_percentage < 30 else "High"
            },
            "credit_age": {
                "weight": "15%",
                "average_age": f"{cibil_data.average_account_age_months} months"
            },
            "credit_mix": {
                "weight": "10%",
                "accounts": cibil_data.number_of_accounts
            },
            "credit_inquiries": {
                "weight": "10%",
                "recent": cibil_data.recent_inquiries
            }
        }
    }

@app.post("/cibil/{user_id}/simulate")
async def simulate_cibil_change(user_id: str, changes: Dict):
    """Simulate CIBIL score changes"""
    if user_id not in cibil_data_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="CIBIL data not found for user"
        )
    
    cibil_data = cibil_data_db[user_id]
    simulation = cibil_advisor.simulate_score_change(cibil_data, changes)
    
    return simulation

@app.get("/cibil/{user_id}/recommendations")
async def get_cibil_recommendations(user_id: str):
    """Get CIBIL improvement recommendations"""
    if user_id not in cibil_data_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="CIBIL data not found for user"
        )
    
    cibil_data = cibil_data_db[user_id]
    recommendations = cibil_advisor.get_recommendations(cibil_data)
    
    return {
        "recommendations": [rec.dict() for rec in recommendations],
        "total_score_improvement": sum(rec.expected_score_improvement for rec in recommendations)
    }

@app.post("/cibil/{user_id}/update")
async def update_cibil_data(user_id: str, cibil_update: Dict):
    """Update CIBIL data for simulation"""
    if user_id not in cibil_data_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="CIBIL data not found for user"
        )
    
    cibil_data = cibil_data_db[user_id]
    
    # Update CIBIL data
    for key, value in cibil_update.items():
        if hasattr(cibil_data, key):
            setattr(cibil_data, key, value)
    
    return {"message": "CIBIL data updated successfully"}

# Dashboard endpoint
@app.get("/dashboard/{user_id}")
async def get_dashboard(user_id: str):
    """Get comprehensive dashboard data"""
    if user_id not in users_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user = users_db[user_id]
    transactions = transactions_db.get(user_id, [])
    tax_data = tax_data_db.get(user_id)
    cibil_data = cibil_data_db.get(user_id)
    
    # Prepare dashboard data
    dashboard = {
        "user": {
            "name": user.name,
            "email": user.email
        },
        "summary": {
            "total_transactions": len(transactions),
            "tax_regime": tax_data.recommended_regime if tax_data else "new",
            "cibil_score": cibil_advisor.calculate_score(cibil_data) if cibil_data else 750
        },
        "quick_stats": {}
    }
    
    if transactions:
        analysis = file_parser.analyze_transactions(transactions)
        dashboard["financial_summary"] = {
            "monthly_income": analysis.get("income_analysis", {}).get("average", 0),
            "monthly_expense": analysis.get("expense_analysis", {}).get("average", 0),
            "savings_rate": (
                (analysis.get("income_analysis", {}).get("average", 0) - 
                 analysis.get("expense_analysis", {}).get("average", 0)) / 
                max(analysis.get("income_analysis", {}).get("average", 1), 1) * 100
            )
        }
        dashboard["monthly_trend"] = analysis.get("monthly_trend", {})
    
    if tax_data:
        dashboard["tax_summary"] = {
            "estimated_tax": tax_data.tax_old_regime if tax_data.recommended_regime == "old" else tax_data.tax_new_regime,
            "potential_savings": abs((tax_data.tax_old_regime or 0) - (tax_data.tax_new_regime or 0))
        }
    
    return dashboard

@app.get("/aggregate/{user_id}")
async def aggregate_financial_data(user_id: str):
    """Combined snapshot: analysis + tax + simple summary.
    Recomputes analysis from in-memory transactions and returns latest tax snapshot.
    """
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="User not found")
    txns = transactions_db.get(user_id, [])
    print(f"[AGGREGATE] user={user_id} txns={len(txns)} at {datetime.utcnow().isoformat()}Z")
    analysis = {}
    if txns:
        try:
            analysis = file_parser.analyze_transactions(txns)
        except Exception:
            logging.exception("Aggregate: analysis failed")
    tax_snapshot = None
    if user_id in tax_data_db:
        td = tax_data_db[user_id]
        try:
            taxable_old, tax_old = tax_calculator.calculate_old_regime_tax(td)
            taxable_new, tax_new = tax_calculator.calculate_new_regime_tax(td)
            td.taxable_income_old = taxable_old
            td.taxable_income_new = taxable_new
            td.tax_old_regime = tax_old
            td.tax_new_regime = tax_new
            td.recommended_regime = tax_calculator.recommend_regime(td)
            tax_snapshot = {
                "gross_income": td.gross_income,
                "old_regime": {"taxable_income": taxable_old, "tax_payable": tax_old},
                "new_regime": {"taxable_income": taxable_new, "tax_payable": tax_new},
                "recommended_regime": td.recommended_regime,
                "savings_with_recommendation": abs(tax_old - tax_new)
            }
        except Exception:
            logging.exception("Aggregate: tax snapshot failed")
    summary = {
        "total_transactions": len(txns),
        "monthly_income": analysis.get('income_analysis', {}).get('average'),
        "monthly_expense": analysis.get('expense_analysis', {}).get('average')
    }
    return {"analysis": analysis, "tax": tax_snapshot, "summary": summary}

# Health check endpoint
 # (Health endpoint unified above)

@app.get("/api/profile")
async def read_user_profile(current_user: dict = Depends(get_current_user)):
    # Example: Fetch user-specific data using current_user["id"]
    return {"message": "Authenticated!", "user_id": current_user["id"]}

 # (Removed legacy document vault endpoints in favor of unified /api/vault/* above)


# Chatbot endpoint for dashboard.
@app.post("/chat")
async def chat_with_ai(payload: dict):
    question = payload.get("message", "")
    if not question:
        return {"reply": "Please enter a message."}
    reply = ask_gemini(question)
    return {"reply": reply}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)