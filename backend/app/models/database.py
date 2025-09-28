from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field
from beanie import Document
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

class User(Document):
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

class Transaction(Document):
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

    class Settings:
        name = "transactions"

class TaxData(Document):
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

    class Settings:
        name = "tax_data"

class CIBILData(Document):
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

    class Settings:
        name = "cibil_data"

class FileUpload(Document):
    id: Optional[str] = None
    user_id: str
    filename: str
    file_type: str
    file_size: int
    processed: bool = False
    processing_errors: Optional[str] = None
    uploaded_at: Optional[datetime] = None
    processed_at: Optional[datetime] = None

    class Settings:
        name = "file_uploads"

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

# Document Vault Models
class DocumentType(str, Enum):
    PAN_CARD = "pan_card"
    AADHAAR = "aadhaar"
    PASSPORT = "passport"
    DRIVING_LICENSE = "driving_license"
    VOTER_ID = "voter_id"
    INSURANCE_POLICY = "insurance_policy"
    HEALTH_INSURANCE = "health_insurance"
    LIFE_INSURANCE = "life_insurance"
    VEHICLE_INSURANCE = "vehicle_insurance"
    LOAN_AGREEMENT = "loan_agreement"
    HOME_LOAN = "home_loan"
    PERSONAL_LOAN = "personal_loan"
    EDUCATION_LOAN = "education_loan"
    VEHICLE_LOAN = "vehicle_loan"
    PROPERTY_PAPERS = "property_papers"
    SALE_DEED = "sale_deed"
    RENT_AGREEMENT = "rent_agreement"
    BANK_STATEMENTS = "bank_statements"
    TAX_DOCUMENTS = "tax_documents"
    ITR = "itr"
    FORM_16 = "form_16"
    TDS_CERTIFICATE = "tds_certificate"
    INVESTMENT_DOCUMENTS = "investment_documents"
    MUTUAL_FUND = "mutual_fund"
    STOCK_CERTIFICATE = "stock_certificate"
    FD_RECEIPT = "fd_receipt"
    PPF_PASSBOOK = "ppf_passbook"
    EPF_STATEMENT = "epf_statement"
    SALARY_SLIPS = "salary_slips"
    MEDICAL_RECORDS = "medical_records"
    EDUCATION_CERTIFICATES = "education_certificates"
    OTHER = "other"

class DocumentStatus(str, Enum):
    ACTIVE = "active"
    EXPIRED = "expired"
    EXPIRING_SOON = "expiring_soon"
    PENDING_RENEWAL = "pending_renewal"
    ARCHIVED = "archived"

class ReminderType(str, Enum):
    DOCUMENT_EXPIRY = "document_expiry"
    POLICY_RENEWAL = "policy_renewal"
    EMI_DUE = "emi_due"
    PREMIUM_DUE = "premium_due"
    TAX_FILING = "tax_filing"
    INVESTMENT_MATURITY = "investment_maturity"
    CUSTOM = "custom"

class ReminderFrequency(str, Enum):
    ONCE = "once"
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    YEARLY = "yearly"

class Document(Document):
    id: Optional[str] = None
    user_id: str
    title: str
    document_type: DocumentType
    file_name: str
    file_size: int
    file_type: str  # MIME type
    
    # Document metadata
    document_number: Optional[str] = None  # e.g., PAN number, Aadhaar number
    issue_date: Optional[datetime] = None
    expiry_date: Optional[datetime] = None
    issuing_authority: Optional[str] = None
    
    # Status and categorization
    status: DocumentStatus = DocumentStatus.ACTIVE
    tags: List[str] = []
    description: Optional[str] = None
    
    # Security and encryption
    is_encrypted: bool = True
    encryption_key_id: Optional[str] = None
    file_hash: Optional[str] = None  # For integrity verification
    
    # Storage information
    storage_path: str
    backup_path: Optional[str] = None
    
    # AI extraction data
    extracted_text: Optional[str] = None
    extracted_data: Optional[Dict[str, Any]] = {}  # Structured data from OCR/AI
    
    # Audit fields
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    accessed_at: Optional[datetime] = None
    access_count: int = 0

class DocumentReminder(Document):
    id: Optional[str] = None
    user_id: str
    document_id: Optional[str] = None  # Can be null for custom reminders
    
    title: str
    description: Optional[str] = None
    reminder_type: ReminderType
    
    # Timing
    reminder_date: datetime
    frequency: ReminderFrequency = ReminderFrequency.ONCE
    
    # Advance notification settings
    advance_days: List[int] = [30, 15, 7, 1]  # Days before to send reminders
    
    # Status
    is_active: bool = True
    is_completed: bool = False
    
    # AI-generated insights
    ai_priority_score: Optional[int] = None  # 1-10 priority score
    ai_suggested_actions: List[str] = []
    
    # Notification history
    last_notified: Optional[datetime] = None
    notification_count: int = 0
    
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class DocumentShare(Document):
    id: Optional[str] = None
    document_id: str
    shared_by_user_id: str
    
    # Sharing options
    share_token: str
    expires_at: datetime
    password_protected: bool = False
    download_allowed: bool = True
    view_count_limit: Optional[int] = None
    
    # Access tracking
    access_count: int = 0
    last_accessed: Optional[datetime] = None
    accessed_ips: List[str] = []
    
    created_at: Optional[datetime] = None

    class Settings:
        name = "document_shares"

class DocumentCategory(Document):
    id: Optional[str] = None
    user_id: str
    name: str
    description: Optional[str] = None
    color: str = "#3B82F6"  # Hex color for UI
    icon: Optional[str] = None  # Icon name
    
    # Auto-categorization rules
    auto_rules: Dict[str, Any] = {}  # AI rules for auto-categorization
    
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Settings:
        name = "document_categories"

class DocumentAuditLog(Document):
    id: Optional[str] = None
    document_id: str
    user_id: str
    
    action: str  # upload, view, download, share, delete, etc.
    details: Optional[Dict[str, Any]] = {}
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    
    timestamp: Optional[datetime] = None

    class Settings:
        name = "document_audit_logs"

class DocumentExtraction(Document):
    """AI-powered document data extraction results"""
    id: Optional[str] = None
    document_id: str
    
    # Extracted structured data
    extracted_fields: Dict[str, Any] = {}
    confidence_scores: Dict[str, float] = {}
    
    # Text extraction
    raw_text: Optional[str] = None
    processed_text: Optional[str] = None
    
    # Document insights
    document_insights: Dict[str, Any] = {}
    suggested_reminders: List[Dict[str, Any]] = []
    
    # Processing metadata
    extraction_engine: str = "ai"  # ai, ocr, manual
    processing_time_ms: Optional[int] = None
    
    created_at: Optional[datetime] = None

    class Settings:
        name = "document_extractions"
