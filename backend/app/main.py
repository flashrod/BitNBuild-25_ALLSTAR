from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import List, Dict, Optional
import uuid
from datetime import datetime

from app.core.config import settings
from app.models.database import (
    User, UserCreate, UserLogin, Transaction, TaxData, 
    CIBILData, FileUpload, TaxRecommendation, CIBILRecommendation
)
from app.services.tax_calculator import TaxCalculator
from app.services.cibil_advisor import CIBILAdvisor
from app.services.file_parser import FileParser

# Initialize FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    debug=settings.DEBUG
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
tax_calculator = TaxCalculator()
cibil_advisor = CIBILAdvisor()
file_parser = FileParser()

# In-memory storage (replace with actual database in production)
users_db = {}
transactions_db = {}
tax_data_db = {}
cibil_data_db = {}

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
    if user_id not in users_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
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
        if file_ext == 'csv':
            transactions = file_parser.parse_csv(content, file.filename)
        elif file_ext == 'pdf':
            transactions = file_parser.parse_pdf(content, file.filename)
        else:
            transactions = file_parser.parse_csv(content, file.filename)  # Try CSV for Excel files
        
        # Store transactions
        if user_id not in transactions_db:
            transactions_db[user_id] = []
        
        for transaction in transactions:
            transaction.user_id = user_id
            transaction.id = str(uuid.uuid4())
            transactions_db[user_id].append(transaction)
        
        # Analyze transactions
        analysis = file_parser.analyze_transactions(transactions)
        
        # Update tax data with income information
        if user_id in tax_data_db and 'income_analysis' in analysis:
            tax_data_db[user_id].gross_income = analysis['income_analysis']['total'] * 12  # Annualized
        
        return {
            "message": "File processed successfully",
            "transactions_count": len(transactions),
            "analysis": analysis
        }
        
    except Exception as e:
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

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)