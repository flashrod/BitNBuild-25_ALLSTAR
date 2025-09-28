import os
import io
import re
from typing import Dict, Any, Optional, List
from datetime import datetime
import base64

try:
    import openai
    HAS_OPENAI = True
except ImportError:
    HAS_OPENAI = False

try:
    import pdfplumber
    HAS_PDF = True
except ImportError:
    HAS_PDF = False

try:
    from PIL import Image
    HAS_PIL = True
except ImportError:
    HAS_PIL = False

from app.models.database import DocumentType


class AIDocumentProcessor:
    """
    AI-powered document processing service for text extraction, 
    data extraction, and intelligent insights.
    """
    
    def __init__(self):
        self.openai_api_key = os.getenv("OPENAI_API_KEY")
        if self.openai_api_key and HAS_OPENAI:
            openai.api_key = self.openai_api_key
        
        # Document type specific extraction patterns
        self.extraction_patterns = {
            DocumentType.PAN_CARD: {
                "document_number": r"[A-Z]{5}[0-9]{4}[A-Z]{1}",
                "name": r"Name\s*:\s*([A-Z\s]+)",
                "father_name": r"Father's Name\s*:\s*([A-Z\s]+)",
                "date_of_birth": r"(\d{2}\/\d{2}\/\d{4})"
            },
            DocumentType.AADHAAR: {
                "document_number": r"\d{4}\s\d{4}\s\d{4}",
                "name": r"([A-Z\s]+)",
                "date_of_birth": r"DOB\s*:\s*(\d{2}\/\d{2}\/\d{4})",
                "gender": r"(MALE|FEMALE)"
            },
            DocumentType.PASSPORT: {
                "document_number": r"[A-Z]\d{7}",
                "expiry_date": r"(\d{2}\/\d{2}\/\d{4})",
                "issue_date": r"(\d{2}\/\d{2}\/\d{4})",
                "nationality": r"IND"
            },
            DocumentType.DRIVING_LICENSE: {
                "document_number": r"[A-Z]{2}\d{13}",
                "expiry_date": r"(\d{2}-\d{2}-\d{4})",
                "issue_date": r"(\d{2}-\d{2}-\d{4})"
            },
            DocumentType.INSURANCE_POLICY: {
                "policy_number": r"Policy\s*No\s*:?\s*([A-Z0-9\/\-]+)",
                "premium_amount": r"Premium\s*:?\s*₹?\s*([\d,]+)",
                "expiry_date": r"(\d{2}\/\d{2}\/\d{4})",
                "sum_assured": r"Sum\s*Assured\s*:?\s*₹?\s*([\d,]+)"
            }
        }

    async def extract_document_data(
        self, 
        content: bytes, 
        file_type: str, 
        document_type: DocumentType
    ) -> Optional[Dict[str, Any]]:
        """
        Extract structured data from document using OCR and AI.
        """
        try:
            # Extract text from document
            raw_text = await self._extract_text(content, file_type)
            
            if not raw_text:
                return None
            
            # Apply regex patterns for basic extraction
            basic_extraction = self._apply_regex_patterns(raw_text, document_type)
            
            # Use AI for advanced extraction if available
            ai_extraction = await self._ai_extract_data(raw_text, document_type)
            
            # Combine and clean data
            combined_data = {**basic_extraction, **ai_extraction}
            
            # Generate insights and suggestions
            insights = await self._generate_insights(combined_data, document_type)
            
            return {
                "raw_text": raw_text,
                "structured_data": combined_data,
                "insights": insights,
                "confidence_score": self._calculate_confidence(combined_data),
                "extraction_method": "ai+regex" if ai_extraction else "regex"
            }
            
        except Exception as e:
            print(f"Document processing error: {str(e)}")
            return None

    async def _extract_text(self, content: bytes, file_type: str) -> Optional[str]:
        """Extract raw text from different file types."""
        try:
            if file_type == "application/pdf" and HAS_PDF:
                return self._extract_pdf_text(content)
            elif file_type.startswith("image/") and HAS_PIL:
                return await self._extract_image_text(content)
            else:
                # For other file types, try to decode as text
                try:
                    return content.decode('utf-8')
                except:
                    return content.decode('latin-1', errors='ignore')
        except Exception as e:
            print(f"Text extraction error: {str(e)}")
            return None

    def _extract_pdf_text(self, content: bytes) -> str:
        """Extract text from PDF using pdfplumber."""
        text_content = []
        
        with pdfplumber.open(io.BytesIO(content)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text_content.append(page_text)
        
        return "\n".join(text_content)

    async def _extract_image_text(self, content: bytes) -> str:
        """Extract text from image using OCR (placeholder for production OCR)."""
        # In production, you would use services like:
        # - Google Cloud Vision API
        # - Azure Cognitive Services
        # - AWS Textract
        # - Tesseract OCR
        
        # For demo purposes, return placeholder
        return "OCR text extraction would happen here in production"

    def _apply_regex_patterns(self, text: str, document_type: DocumentType) -> Dict[str, Any]:
        """Apply regex patterns to extract structured data."""
        patterns = self.extraction_patterns.get(document_type, {})
        extracted = {}
        
        for field, pattern in patterns.items():
            matches = re.findall(pattern, text, re.IGNORECASE | re.MULTILINE)
            if matches:
                value = matches[0] if isinstance(matches[0], str) else matches[0][0]
                extracted[field] = self._clean_extracted_value(field, value)
        
        # Parse dates
        for field in ["expiry_date", "issue_date", "date_of_birth"]:
            if field in extracted:
                extracted[field] = self._parse_date(extracted[field])
        
        return extracted

    def _clean_extracted_value(self, field: str, value: str) -> str:
        """Clean and normalize extracted values."""
        value = value.strip()
        
        if field == "document_number":
            # Remove spaces and normalize
            return re.sub(r'\s+', '', value.upper())
        elif field in ["premium_amount", "sum_assured"]:
            # Remove currency symbols and commas
            return re.sub(r'[₹,]', '', value).strip()
        elif field == "name":
            # Title case for names
            return ' '.join(word.capitalize() for word in value.split())
        
        return value

    def _parse_date(self, date_str: str) -> Optional[datetime]:
        """Parse date string into datetime object."""
        date_formats = [
            "%d/%m/%Y", "%d-%m-%Y", "%Y-%m-%d",
            "%d/%m/%y", "%d-%m-%y", "%y-%m-%d"
        ]
        
        for fmt in date_formats:
            try:
                return datetime.strptime(date_str, fmt)
            except ValueError:
                continue
        
        return None

    async def _ai_extract_data(self, text: str, document_type: DocumentType) -> Dict[str, Any]:
        """Use OpenAI to extract structured data from text."""
        if not self.openai_api_key or not HAS_OPENAI:
            return {}
        
        try:
            prompt = self._create_extraction_prompt(text, document_type)
            
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert document analyzer. Extract structured data from documents accurately."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.1,
                max_tokens=500
            )
            
            # Parse AI response (would need proper JSON parsing in production)
            ai_data = self._parse_ai_response(response.choices[0].message.content)
            return ai_data
            
        except Exception as e:
            print(f"AI extraction error: {str(e)}")
            return {}

    def _create_extraction_prompt(self, text: str, document_type: DocumentType) -> str:
        """Create extraction prompt based on document type."""
        base_prompt = f"""
        Analyze the following {document_type.value} document text and extract key information.
        Return the data in a structured format.
        
        Document Text:
        {text[:2000]}  # Limit text to avoid token limits
        
        Extract the following if available:
        """
        
        type_specific_fields = {
            DocumentType.PAN_CARD: [
                "- PAN number (format: AAAAA9999A)",
                "- Full name",
                "- Father's name",
                "- Date of birth"
            ],
            DocumentType.AADHAAR: [
                "- Aadhaar number (12 digits)",
                "- Full name", 
                "- Date of birth",
                "- Gender",
                "- Address"
            ],
            DocumentType.PASSPORT: [
                "- Passport number",
                "- Full name",
                "- Date of birth",
                "- Issue date",
                "- Expiry date",
                "- Nationality"
            ],
            DocumentType.INSURANCE_POLICY: [
                "- Policy number",
                "- Policy holder name",
                "- Premium amount",
                "- Sum assured",
                "- Policy start date",
                "- Policy end date",
                "- Next premium due date"
            ]
        }
        
        fields = type_specific_fields.get(document_type, ["- Key document information"])
        base_prompt += "\n".join(fields)
        
        return base_prompt

    def _parse_ai_response(self, response: str) -> Dict[str, Any]:
        """Parse AI response into structured data."""
        # Placeholder for AI response parsing
        # In production, you'd parse the structured response properly
        return {}

    async def _generate_insights(self, extracted_data: Dict[str, Any], document_type: DocumentType) -> Dict[str, Any]:
        """Generate insights and recommendations based on extracted data."""
        insights = {
            "urgency_level": "low",
            "recommendations": [],
            "potential_issues": []
        }
        
        # Check for expiry dates
        if "expiry_date" in extracted_data and extracted_data["expiry_date"]:
            expiry_date = extracted_data["expiry_date"]
            if isinstance(expiry_date, datetime):
                days_to_expiry = (expiry_date - datetime.now()).days
                
                if days_to_expiry < 0:
                    insights["urgency_level"] = "critical"
                    insights["recommendations"].append("Document has expired. Immediate renewal required.")
                elif days_to_expiry <= 30:
                    insights["urgency_level"] = "high"
                    insights["recommendations"].append("Document expires soon. Start renewal process.")
                elif days_to_expiry <= 90:
                    insights["urgency_level"] = "medium"
                    insights["recommendations"].append("Document expires in 3 months. Plan for renewal.")
        
        # Document-specific insights
        if document_type == DocumentType.INSURANCE_POLICY:
            insights["recommendations"].extend([
                "Set up automatic premium payment",
                "Review coverage annually",
                "Keep beneficiary information updated"
            ])
        elif document_type == DocumentType.LOAN_AGREEMENT:
            insights["recommendations"].extend([
                "Set up EMI reminders",
                "Track interest rate changes",
                "Monitor prepayment options"
            ])
        
        return insights

    def _calculate_confidence(self, extracted_data: Dict[str, Any]) -> float:
        """Calculate confidence score for extracted data."""
        if not extracted_data:
            return 0.0
        
        # Simple confidence calculation based on number of fields extracted
        total_possible_fields = 5  # Average expected fields
        extracted_fields = len(extracted_data)
        
        base_confidence = min(extracted_fields / total_possible_fields, 1.0)
        
        # Boost confidence if critical fields are present
        critical_fields = ["document_number", "expiry_date", "name"]
        critical_found = sum(1 for field in critical_fields if field in extracted_data)
        critical_boost = critical_found / len(critical_fields) * 0.3
        
        return min(base_confidence + critical_boost, 1.0)

    async def extract_renewal_reminders(self, extracted_data: Dict[str, Any], document_type: DocumentType) -> List[Dict[str, Any]]:
        """Generate renewal reminders based on extracted data."""
        reminders = []
        
        if "expiry_date" in extracted_data and extracted_data["expiry_date"]:
            expiry_date = extracted_data["expiry_date"]
            if isinstance(expiry_date, datetime):
                # Create reminders at different intervals
                reminder_intervals = [90, 60, 30, 15, 7, 1]  # days before expiry
                
                for days_before in reminder_intervals:
                    reminder_date = expiry_date - timedelta(days=days_before)
                    if reminder_date > datetime.now():
                        reminders.append({
                            "reminder_date": reminder_date,
                            "title": f"{document_type.value} expires in {days_before} days",
                            "description": f"Your {document_type.value} will expire on {expiry_date.strftime('%Y-%m-%d')}",
                            "urgency": "high" if days_before <= 30 else "medium"
                        })
        
        return reminders

    async def suggest_related_documents(self, document_type: DocumentType, extracted_data: Dict[str, Any]) -> List[str]:
        """Suggest related documents that user might need."""
        suggestions = []
        
        related_docs = {
            DocumentType.PAN_CARD: [
                "Form 16", "ITR", "Bank Statements", "Salary Slips"
            ],
            DocumentType.AADHAAR: [
                "PAN Card", "Passport", "Voter ID", "Driving License"
            ],
            DocumentType.INSURANCE_POLICY: [
                "Medical Records", "Nominee KYC", "Previous Policy Documents"
            ],
            DocumentType.LOAN_AGREEMENT: [
                "Property Papers", "Income Documents", "Bank Statements", "Insurance Policy"
            ]
        }
        
        return related_docs.get(document_type, [])

from datetime import timedelta