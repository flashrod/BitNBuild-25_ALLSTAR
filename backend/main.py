from fastapi import FastAPI
from app.services.debt_service import DebtService
from app.models.debt import Debt
from fastapi import APIRouter, UploadFile, File, Form
from typing import List

debt_service = DebtService()
debt_router = APIRouter()

# In-memory debt store for demo (replace with DB in production)
user_debts = {}

@debt_router.post('/debt/ingest')
async def ingest_debts(user_id: str = Form(...), file: UploadFile = File(...)):
    content = await file.read()
    debts = debt_service.ingest_debts(content, file.filename)
    user_debts[user_id] = debts
    return {'success': True, 'count': len(debts)}

@debt_router.get('/debt/list')
async def list_debts(user_id: str):
    debts = user_debts.get(user_id, [])
    return {'debts': [vars(d) for d in debts]}

@debt_router.post('/debt/simulate')
async def simulate_debt(user_id: str = Form(...), strategy: str = Form('snowball')):
    debts = user_debts.get(user_id, [])
    result = debt_service.simulate_repayment(debts, strategy)
    return result

from fastapi import File, UploadFile, HTTPException
from app.core.config import settings
from app.models.database import (
    User, UserCreate, UserLogin, Transaction, TaxData, 
    CIBILData, FileUpload, TaxRecommendation, CIBILRecommendation,
    Document, DocumentType, DocumentStatus, DocumentReminder, 
    ReminderType, ReminderFrequency
)
from app.services.tax_calculator import TaxCalculator
from app.services.cibil_advisor import CIBILAdvisor
from app.services.file_parser import FileParser
from app.services.document_vault_service import DocumentVaultService
from app.deps.auth import get_current_user
# Tax report endpoint (AIS/TIS + Capital Gains integration)
async def generate_tax_report_api(
    user_id: str,
    ais_file: UploadFile = File(None),
    broker_file: UploadFile = File(None),
    asset_type: str = "equity"
):
    """
    Generate comprehensive tax report for user, integrating AIS/TIS and capital gains data.
    """
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="User not found")

    # Get user transactions
    user_transactions = transactions_db.get(user_id, [])

    # Parse AIS/TIS transactions
    ais_transactions = []

    # Tax report endpoint (AIS/TIS + Capital Gains integration)
    @app.post("/api/tax-report/{user_id}")
    async def generate_tax_report_api(
        user_id: str,
        ais_file: UploadFile = File(None),
        broker_file: UploadFile = File(None),
        asset_type: str = "equity"
    ):
        """
        Generate comprehensive tax report for user, integrating AIS/TIS and capital gains data.
        """
        if user_id not in users_db:
            raise HTTPException(status_code=404, detail="User not found")

        # Get user transactions
        user_transactions = transactions_db.get(user_id, [])

        # Parse AIS/TIS transactions
        ais_transactions = []
        if ais_file:
            ext = ais_file.filename.split('.')[-1].lower()
            content = await ais_file.read()
            if ext == "json":
                ais_transactions = file_parser.parse_ais_json(content, ais_file.filename)
            elif ext == "csv":
                ais_transactions = file_parser.parse_ais_csv(content, ais_file.filename)
            # Add PDF support if needed

        # Parse broker capital gains transactions
        capital_gains = []
        if broker_file:
            ext = broker_file.filename.split('.')[-1].lower()
            content = await broker_file.read()
            capital_gains = file_parser.parse_broker_csv(content, broker_file.filename)

        # Generate tax report
        report = file_parser.generate_tax_report(
            user_transactions=user_transactions,
            ais_transactions=ais_transactions,
            capital_gains=capital_gains,
            asset_type=asset_type
        )
        return JSONResponse(content=report)
from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import List, Dict, Optional
import uuid
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
# Load environment variables
load_dotenv()
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")

# Initialize FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    debug=settings.DEBUG
)

# Register debt router on the final app instance
app.include_router(debt_router)

# Tax report endpoint (AIS/TIS + Capital Gains integration)
@app.post("/api/tax-report/{user_id}")
async def generate_tax_report_api(
    user_id: str,
    ais_file: UploadFile = File(None),
    broker_file: UploadFile = File(None),
    asset_type: str = "equity"
):
    """
    Generate comprehensive tax report for user, integrating AIS/TIS and capital gains data.
    """
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="User not found")

    # Get user transactions
    user_transactions = transactions_db.get(user_id, [])

    # Parse AIS/TIS transactions
    ais_transactions = []
    if ais_file:
        ext = ais_file.filename.split('.')[-1].lower()
        content = await ais_file.read()
        if ext == "json":
            ais_transactions = file_parser.parse_ais_json(content, ais_file.filename)
        elif ext == "csv":
            ais_transactions = file_parser.parse_ais_csv(content, ais_file.filename)
        # Add PDF support if needed

    # Parse broker capital gains transactions
    capital_gains = []
    if broker_file:
        ext = broker_file.filename.split('.')[-1].lower()
        content = await broker_file.read()
        capital_gains = file_parser.parse_broker_csv(content, broker_file.filename)

    # Generate tax report
    report = file_parser.generate_tax_report(
        user_transactions=user_transactions,
        ais_transactions=ais_transactions,
        capital_gains=capital_gains,
        asset_type=asset_type
    )
    return JSONResponse(content=report)

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
document_vault = DocumentVaultService()

# In-memory storage (replace with actual database in production)
users_db = {}
transactions_db = {}
tax_data_db = {}
cibil_data_db = {}
documents_db = {}  # Document vault storage
reminders_db = {}  # Document reminders storage

# Initialize mock user for development
mock_user_id = 'mock-user-id'
mock_user = User(
    id=mock_user_id,
    email='mock@user.com',
    name='Mock User',
    phone='1234567890',
    pan_number='MOCK12345P',
    created_at=datetime.now()
)
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
            "dashboard": "/dashboard",
            "vault": "/vault"
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

# Document Vault API Endpoints
@app.post("/vault/{user_id}/upload")
async def upload_document(
    user_id: str,
    file: UploadFile = File(...),
    document_type: DocumentType = Form(...),
    title: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),
    issue_date: Optional[str] = Form(None),
    expiry_date: Optional[str] = Form(None),
    document_number: Optional[str] = Form(None)
):
    """Upload a document to the secure vault"""
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="User not found")
    
    try:
        # Parse dates if provided
        parsed_issue_date = None
        parsed_expiry_date = None
        
        if issue_date:
            try:
                parsed_issue_date = datetime.fromisoformat(issue_date.replace('Z', '+00:00'))
            except ValueError:
                pass
        
        if expiry_date:
            try:
                parsed_expiry_date = datetime.fromisoformat(expiry_date.replace('Z', '+00:00'))
            except ValueError:
                pass
        
        # Parse tags
        parsed_tags = []
        if tags:
            parsed_tags = [tag.strip() for tag in tags.split(',') if tag.strip()]
        
        # Upload document
        document = await document_vault.upload_document(
            user_id=user_id,
            file=file,
            document_type=document_type,
            title=title,
            description=description,
            tags=parsed_tags,
            issue_date=parsed_issue_date,
            expiry_date=parsed_expiry_date,
            document_number=document_number
        )
        
        # Store in memory (in production, save to database)
        if user_id not in documents_db:
            documents_db[user_id] = []
        documents_db[user_id].append(document)
        
        return {
            "message": "Document uploaded successfully",
            "document_id": document.id,
            "document": {
                "id": document.id,
                "title": document.title,
                "document_type": document.document_type,
                "file_name": document.file_name,
                "file_size": document.file_size,
                "status": document.status,
                "created_at": document.created_at.isoformat() if document.created_at else None,
                "expiry_date": document.expiry_date.isoformat() if document.expiry_date else None
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/vault/{user_id}/documents")
async def list_documents(
    user_id: str,
    document_type: Optional[DocumentType] = None,
    status: Optional[DocumentStatus] = None,
    limit: int = 50,
    offset: int = 0
):
    """List user's documents with optional filtering"""
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_documents = documents_db.get(user_id, [])
    
    # Apply filters
    if document_type:
        user_documents = [doc for doc in user_documents if doc.document_type == document_type]
    if status:
        user_documents = [doc for doc in user_documents if doc.status == status]
    
    # Apply pagination
    total = len(user_documents)
    documents = user_documents[offset:offset + limit]
    
    # Format response
    formatted_docs = []
    for doc in documents:
        formatted_docs.append({
            "id": doc.id,
            "title": doc.title,
            "document_type": doc.document_type,
            "file_name": doc.file_name,
            "file_size": doc.file_size,
            "status": doc.status,
            "tags": doc.tags,
            "document_number": doc.document_number,
            "issue_date": doc.issue_date.isoformat() if doc.issue_date else None,
            "expiry_date": doc.expiry_date.isoformat() if doc.expiry_date else None,
            "created_at": doc.created_at.isoformat() if doc.created_at else None,
            "access_count": doc.access_count
        })
    
    return {
        "documents": formatted_docs,
        "total": total,
        "offset": offset,
        "limit": limit
    }

@app.get("/vault/{user_id}/documents/{document_id}")
async def get_document_details(user_id: str, document_id: str):
    """Get detailed information about a document"""
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_documents = documents_db.get(user_id, [])
    document = next((doc for doc in user_documents if doc.id == document_id), None)
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Get AI insights
    insights = await document_vault.get_document_insights(user_id, document_id)
    
    return {
        "id": document.id,
        "title": document.title,
        "document_type": document.document_type,
        "file_name": document.file_name,
        "file_size": document.file_size,
        "file_type": document.file_type,
        "status": document.status,
        "tags": document.tags,
        "description": document.description,
        "document_number": document.document_number,
        "issue_date": document.issue_date.isoformat() if document.issue_date else None,
        "expiry_date": document.expiry_date.isoformat() if document.expiry_date else None,
        "created_at": document.created_at.isoformat() if document.created_at else None,
        "updated_at": document.updated_at.isoformat() if document.updated_at else None,
        "access_count": document.access_count,
        "extracted_data": document.extracted_data,
        "insights": insights
    }

@app.get("/vault/{user_id}/documents/{document_id}/download")
async def download_document(user_id: str, document_id: str):
    """Download a document (returns file content)"""
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_documents = documents_db.get(user_id, [])
    document = next((doc for doc in user_documents if doc.id == document_id), None)
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    try:
        # Get document content
        content = await document_vault.get_document_content(user_id, document_id)
        
        # Update access count
        document.access_count += 1
        document.accessed_at = datetime.now()
        
        from fastapi.responses import StreamingResponse
        import io
        
        return StreamingResponse(
            io.BytesIO(content),
            media_type=document.file_type,
            headers={
                "Content-Disposition": f"attachment; filename={document.file_name}"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/vault/{user_id}/documents/{document_id}")
async def delete_document(user_id: str, document_id: str):
    """Delete a document permanently"""
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_documents = documents_db.get(user_id, [])
    document = next((doc for doc in user_documents if doc.id == document_id), None)
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    try:
        # Delete from storage
        await document_vault.delete_document(user_id, document_id)
        
        # Remove from memory
        documents_db[user_id].remove(document)
        
        return {"message": "Document deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/vault/{user_id}/search")
async def search_documents(
    user_id: str,
    query: Optional[str] = None,
    document_type: Optional[DocumentType] = None,
    tags: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None
):
    """Search documents with various filters"""
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_documents = documents_db.get(user_id, [])
    results = []
    
    for doc in user_documents:
        include = True
        
        # Text search in title, description, and extracted text
        if query:
            search_text = f"{doc.title} {doc.description or ''} {doc.extracted_text or ''}".lower()
            if query.lower() not in search_text:
                include = False
        
        # Document type filter
        if document_type and doc.document_type != document_type:
            include = False
        
        # Tags filter
        if tags:
            tag_list = [tag.strip() for tag in tags.split(',')]
            if not any(tag in doc.tags for tag in tag_list):
                include = False
        
        # Date range filter
        if date_from or date_to:
            doc_date = doc.created_at
            if doc_date:
                if date_from:
                    try:
                        from_date = datetime.fromisoformat(date_from.replace('Z', '+00:00'))
                        if doc_date < from_date:
                            include = False
                    except ValueError:
                        pass
                
                if date_to:
                    try:
                        to_date = datetime.fromisoformat(date_to.replace('Z', '+00:00'))
                        if doc_date > to_date:
                            include = False
                    except ValueError:
                        pass
        
        if include:
            results.append({
                "id": doc.id,
                "title": doc.title,
                "document_type": doc.document_type,
                "file_name": doc.file_name,
                "status": doc.status,
                "tags": doc.tags,
                "created_at": doc.created_at.isoformat() if doc.created_at else None,
                "expiry_date": doc.expiry_date.isoformat() if doc.expiry_date else None
            })
    
    return {
        "results": results,
        "total": len(results),
        "query": query
    }

@app.get("/vault/{user_id}/reminders")
async def get_document_reminders(user_id: str, active_only: bool = True):
    """Get document reminders for user"""
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_reminders = reminders_db.get(user_id, [])
    
    if active_only:
        user_reminders = [r for r in user_reminders if r.is_active and not r.is_completed]
    
    # Sort by reminder date
    user_reminders.sort(key=lambda r: r.reminder_date)
    
    formatted_reminders = []
    for reminder in user_reminders:
        formatted_reminders.append({
            "id": reminder.id,
            "title": reminder.title,
            "description": reminder.description,
            "reminder_type": reminder.reminder_type,
            "reminder_date": reminder.reminder_date.isoformat(),
            "frequency": reminder.frequency,
            "is_active": reminder.is_active,
            "is_completed": reminder.is_completed,
            "document_id": reminder.document_id,
            "ai_priority_score": reminder.ai_priority_score
        })
    
    return {
        "reminders": formatted_reminders,
        "total": len(formatted_reminders)
    }

@app.post("/vault/{user_id}/reminders")
async def create_custom_reminder(
    user_id: str,
    reminder_data: Dict
):
    """Create a custom reminder"""
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="User not found")
    
    try:
        reminder = DocumentReminder(
            id=str(uuid.uuid4()),
            user_id=user_id,
            title=reminder_data.get("title"),
            description=reminder_data.get("description"),
            reminder_type=ReminderType.CUSTOM,
            reminder_date=datetime.fromisoformat(reminder_data.get("reminder_date")),
            frequency=ReminderFrequency(reminder_data.get("frequency", "once")),
            is_active=True,
            created_at=datetime.now()
        )
        
        if user_id not in reminders_db:
            reminders_db[user_id] = []
        reminders_db[user_id].append(reminder)
        
        return {
            "message": "Reminder created successfully",
            "reminder_id": reminder.id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/vault/{user_id}/stats")
async def get_vault_statistics(user_id: str):
    """Get document vault statistics"""
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_documents = documents_db.get(user_id, [])
    user_reminders = reminders_db.get(user_id, [])
    
    # Storage stats
    storage_stats = await document_vault.get_storage_stats(user_id)
    
    # Document type breakdown
    type_breakdown = {}
    status_breakdown = {}
    
    for doc in user_documents:
        doc_type = doc.document_type.value
        doc_status = doc.status.value
        
        type_breakdown[doc_type] = type_breakdown.get(doc_type, 0) + 1
        status_breakdown[doc_status] = status_breakdown.get(doc_status, 0) + 1
    
    # Upcoming reminders
    upcoming_reminders = [
        r for r in user_reminders 
        if r.is_active and not r.is_completed and r.reminder_date > datetime.now()
    ]
    upcoming_reminders.sort(key=lambda r: r.reminder_date)
    
    # Expired documents
    expired_docs = [
        doc for doc in user_documents 
        if doc.expiry_date and doc.expiry_date < datetime.now()
    ]
    
    # Expiring soon (next 30 days)
    expiring_soon = [
        doc for doc in user_documents 
        if doc.expiry_date and 
           datetime.now() < doc.expiry_date <= (datetime.now() + timedelta(days=30))
    ]
    
    return {
        "storage": storage_stats,
        "document_counts": {
            "total": len(user_documents),
            "by_type": type_breakdown,
            "by_status": status_breakdown,
            "expired": len(expired_docs),
            "expiring_soon": len(expiring_soon)
        },
        "reminders": {
            "total": len(user_reminders),
            "active": len([r for r in user_reminders if r.is_active]),
            "upcoming": len(upcoming_reminders[:5])  # Next 5 reminders
        },
        "recent_activity": {
            "documents_uploaded_this_month": len([
                doc for doc in user_documents 
                if doc.created_at and doc.created_at >= (datetime.now() - timedelta(days=30))
            ]),
            "total_accesses_this_month": sum(
                doc.access_count for doc in user_documents 
                if doc.accessed_at and doc.accessed_at >= (datetime.now() - timedelta(days=30))
            )
        }
    }

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.get("/api/profile")
async def read_user_profile(current_user: dict = Depends(get_current_user)):
    # Example: Fetch user-specific data using current_user["id"]
    return {"message": "Authenticated!", "user_id": current_user["id"]}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)