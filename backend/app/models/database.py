from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field
from enum import Enum

class UserRole(str, Enum):
    USER = "user"
    ADMIN = "admin"

class TaxRegime(str, Enum):
    OLD = "old"
    NEW = "new"

class TransactionCategory(str, Enum):
    INCOME = "income"
    EXPENSE = "expense"
    INVESTMENT = "investment"
    EMI = "emi"
    SIP = "sip"
    RENT = "rent"
    INSURANCE = "insurance"
    UTILITIES = "utilities"
    FOOD = "food"
    TRANSPORT = "transport"
    SHOPPING = "shopping"
    ENTERTAINMENT = "entertainment"
    HEALTHCARE = "healthcare"
    EDUCATION = "education"
    OTHER = "other"

class User(BaseModel):
    id: Optional[str] = None
    email: EmailStr
    name: str
    phone: Optional[str] = None
    pan_number: Optional[str] = None
    role: UserRole = UserRole.USER
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    phone: Optional[str] = None
    pan_number: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Transaction(BaseModel):
    id: Optional[str] = None
    user_id: Optional[str] = None
    date: datetime
    description: str
    amount: float
    category: TransactionCategory
    subcategory: Optional[str] = None
    is_recurring: bool = False
    tags: List[str] = []
    created_at: Optional[datetime] = None

class TaxData(BaseModel):
    id: Optional[str] = None
    user_id: str
    tax_year: int
    gross_income: float
    
    # Deductions under various sections
    deduction_80c: float = 0  # PPF, ELSS, LIC, etc. (max 1.5L)
    deduction_80d: float = 0  # Health Insurance Premium
    deduction_80g: float = 0  # Donations
    deduction_24b: float = 0  # Home Loan Interest
    deduction_80e: float = 0  # Education Loan Interest
    deduction_80tta: float = 0  # Savings Account Interest
    
    # Other deductions
    hra_exemption: float = 0
    lta_exemption: float = 0
    standard_deduction: float = 50000
    
    # Tax calculations
    taxable_income_old: Optional[float] = None
    taxable_income_new: Optional[float] = None
    tax_old_regime: Optional[float] = None
    tax_new_regime: Optional[float] = None
    recommended_regime: Optional[TaxRegime] = None
    
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class CIBILData(BaseModel):
    id: Optional[str] = None
    user_id: str
    
    # Credit Score Components
    current_score: int = 750
    payment_history_score: int = 35  # 35% weight
    credit_utilization_score: int = 30  # 30% weight
    credit_age_score: int = 15  # 15% weight
    credit_mix_score: int = 10  # 10% weight
    credit_inquiries_score: int = 10  # 10% weight
    
    # Detailed Metrics
    total_credit_limit: float = 0
    current_utilization: float = 0
    utilization_percentage: float = 0
    
    number_of_accounts: int = 0
    number_of_loans: int = 0
    number_of_credit_cards: int = 0
    
    on_time_payments: int = 0
    late_payments: int = 0
    missed_payments: int = 0
    
    average_account_age_months: int = 0
    oldest_account_age_months: int = 0
    
    recent_inquiries: int = 0
    
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class FileUpload(BaseModel):
    id: Optional[str] = None
    user_id: str
    filename: str
    file_type: str
    file_size: int
    processed: bool = False
    processing_errors: Optional[str] = None
    uploaded_at: Optional[datetime] = None
    processed_at: Optional[datetime] = None

class TaxRecommendation(BaseModel):
    category: str
    title: str
    description: str
    potential_savings: float
    priority: str  # high, medium, low
    action_required: str

class CIBILRecommendation(BaseModel):
    category: str
    title: str
    current_impact: str  # positive, negative, neutral
    recommendation: str
    expected_score_improvement: int
    timeframe_months: int