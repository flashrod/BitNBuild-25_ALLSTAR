import pandas as pd
import pdfplumber
import re
from typing import List, Dict, Optional, Tuple
from datetime import datetime
from io import BytesIO
from app.models.database import Transaction, TransactionCategory
import numpy as np

class FileParser:
    """Service for parsing financial statements from various file formats"""
    
    def __init__(self):
        # Common transaction patterns
        self.patterns = {
            "income": [
                r"salary", r"credit", r"deposit", r"transfer.*in", r"interest.*credit",
                r"dividend", r"refund", r"cashback", r"reward"
            ],
            "emi": [
                r"emi", r"loan.*payment", r"mortgage", r"car.*loan", r"home.*loan",
                r"personal.*loan", r"education.*loan"
            ],
            "sip": [
                r"sip", r"mutual.*fund", r"systematic.*investment", r"mf.*purchase"
            ],
            "rent": [
                r"rent", r"house.*rent", r"flat.*rent", r"pg", r"accommodation"
            ],
            "insurance": [
                r"insurance", r"policy", r"premium", r"lic", r"health.*insurance",
                r"term.*insurance", r"life.*insurance"
            ],
            "utilities": [
                r"electricity", r"water", r"gas", r"internet", r"broadband",
                r"mobile", r"phone", r"dth", r"cable"
            ],
            "food": [
                r"restaurant", r"swiggy", r"zomato", r"uber.*eats", r"food",
                r"grocery", r"supermarket", r"bigbasket"
            ],
            "transport": [
                r"uber", r"ola", r"rapido", r"fuel", r"petrol", r"diesel",
                r"parking", r"toll", r"metro", r"bus"
            ],
            "shopping": [
                r"amazon", r"flipkart", r"myntra", r"shopping", r"mall",
                r"retail", r"store", r"purchase"
            ],
            "healthcare": [
                r"hospital", r"doctor", r"clinic", r"pharmacy", r"medical",
                r"diagnostic", r"lab", r"health"
            ],
            "education": [
                r"school", r"college", r"university", r"tuition", r"fees",
                r"course", r"training", r"books"
            ]
        }
    
    def parse_csv(self, file_content: bytes, filename: str) -> List[Transaction]:
        """Parse CSV file containing transaction data"""
        try:
            # Try to read CSV with different encodings
            for encoding in ['utf-8', 'iso-8859-1', 'cp1252']:
                try:
                    df = pd.read_csv(BytesIO(file_content), encoding=encoding)
                    break
                except UnicodeDecodeError:
                    continue
            else:
                df = pd.read_csv(BytesIO(file_content), encoding='utf-8', errors='ignore')
            
            # Clean and normalize column names
            df.columns = [col.strip().lower().replace(' ', '_') for col in df.columns]
            
            # Identify columns
            date_cols = self._find_date_column(df)
            amount_cols = self._find_amount_columns(df)
            desc_cols = self._find_description_columns(df)
            
            if not date_cols or not amount_cols or not desc_cols:
                raise ValueError("Could not identify required columns in CSV")
            
            # Process transactions
            transactions = []
            for _, row in df.iterrows():
                transaction = self._process_transaction_row(
                    row, date_cols[0], amount_cols[0], desc_cols[0]
                )
                if transaction:
                    transactions.append(transaction)
            
            return transactions
            
        except Exception as e:
            raise ValueError(f"Error parsing CSV file: {str(e)}")
    
    def parse_pdf(self, file_content: bytes, filename: str) -> List[Transaction]:
        """Parse PDF bank statement"""
        try:
            transactions = []
            
            with pdfplumber.open(BytesIO(file_content)) as pdf:
                for page in pdf.pages:
                    text = page.extract_text()
                    if text:
                        # Extract transactions from text
                        page_transactions = self._extract_transactions_from_text(text)
                        transactions.extend(page_transactions)
            
            return transactions
            
        except Exception as e:
            raise ValueError(f"Error parsing PDF file: {str(e)}")
    
    def _find_date_column(self, df: pd.DataFrame) -> List[str]:
        """Find columns that likely contain dates"""
        date_keywords = ['date', 'transaction_date', 'value_date', 'posting_date']
        date_cols = []
        
        for col in df.columns:
            if any(keyword in col for keyword in date_keywords):
                date_cols.append(col)
            elif self._is_date_column(df[col]):
                date_cols.append(col)
        
        return date_cols
    
    def _find_amount_columns(self, df: pd.DataFrame) -> List[str]:
        """Find columns that likely contain amounts"""
        amount_keywords = ['amount', 'debit', 'credit', 'withdrawal', 'deposit', 'balance']
        amount_cols = []
        
        for col in df.columns:
            if any(keyword in col for keyword in amount_keywords):
                # Try to convert to numeric
                try:
                    pd.to_numeric(df[col].astype(str).str.replace(',', '').str.replace('₹', ''))
                    amount_cols.append(col)
                except:
                    pass
        
        return amount_cols
    
    def _find_description_columns(self, df: pd.DataFrame) -> List[str]:
        """Find columns that likely contain transaction descriptions"""
        desc_keywords = ['description', 'narration', 'particulars', 'details', 'remarks']
        desc_cols = []
        
        for col in df.columns:
            if any(keyword in col for keyword in desc_keywords):
                desc_cols.append(col)
            elif df[col].dtype == 'object' and df[col].str.len().mean() > 10:
                desc_cols.append(col)
        
        return desc_cols
    
    def _is_date_column(self, series: pd.Series) -> bool:
        """Check if a column contains dates"""
        try:
            pd.to_datetime(series.dropna().head(10))
            return True
        except:
            return False
    
    def _process_transaction_row(self, row: pd.Series, date_col: str, 
                                amount_col: str, desc_col: str) -> Optional[Transaction]:
        """Process a single transaction row"""
        try:
            # Parse date
            date = pd.to_datetime(row[date_col])
            
            # Parse amount
            amount_str = str(row[amount_col]).replace(',', '').replace('₹', '')
            amount = float(amount_str) if amount_str and amount_str != 'nan' else 0
            
            # Get description
            description = str(row[desc_col]) if pd.notna(row[desc_col]) else ""
            
            if amount == 0 or not description:
                return None
            
            # Categorize transaction
            category = self._categorize_transaction(description, amount)
            
            # Determine if recurring
            is_recurring = self._is_recurring_transaction(description)
            
            return Transaction(
                date=date,
                amount=abs(amount),
                description=description,
                category=category,
                is_recurring=is_recurring,
                tags=self._extract_tags(description)
            )
            
        except Exception:
            return None
    
    def _categorize_transaction(self, description: str, amount: float) -> TransactionCategory:
        """Categorize transaction based on description"""
        desc_lower = description.lower()
        
        # Check for income patterns first
        if amount > 0 or any(re.search(pattern, desc_lower) for pattern in self.patterns["income"]):
            return TransactionCategory.INCOME
        
        # Check other categories
        for category, patterns in self.patterns.items():
            if category == "income":
                continue
            if any(re.search(pattern, desc_lower) for pattern in patterns):
                return TransactionCategory[category.upper()]
        
        # Default categories based on amount
        if amount > 0:
            return TransactionCategory.INCOME
        else:
            return TransactionCategory.EXPENSE
    
    def _is_recurring_transaction(self, description: str) -> bool:
        """Check if transaction appears to be recurring"""
        recurring_keywords = [
            "emi", "sip", "recurring", "monthly", "subscription",
            "rent", "insurance", "premium", "installment"
        ]
        desc_lower = description.lower()
        return any(keyword in desc_lower for keyword in recurring_keywords)
    
    def _extract_tags(self, description: str) -> List[str]:
        """Extract relevant tags from description"""
        tags = []
        
        # Extract merchant names
        merchants = ["amazon", "flipkart", "swiggy", "zomato", "uber", "ola"]
        for merchant in merchants:
            if merchant in description.lower():
                tags.append(merchant)
        
        # Extract payment methods
        if "upi" in description.lower():
            tags.append("upi")
        elif "neft" in description.lower():
            tags.append("neft")
        elif "imps" in description.lower():
            tags.append("imps")
        
        return tags
    
    def _extract_transactions_from_text(self, text: str) -> List[Transaction]:
        """Extract transactions from PDF text"""
        transactions = []
        lines = text.split('\n')
        
        # Common date patterns
        date_pattern = r'\d{1,2}[-/]\d{1,2}[-/]\d{2,4}'
        amount_pattern = r'₹?\s*[\d,]+\.?\d*'
        
        for line in lines:
            # Look for lines with dates and amounts
            date_match = re.search(date_pattern, line)
            amount_matches = re.findall(amount_pattern, line)
            
            if date_match and amount_matches:
                try:
                    date = pd.to_datetime(date_match.group())
                    amount = float(amount_matches[-1].replace('₹', '').replace(',', ''))
                    
                    # Extract description (text between date and amount)
                    description = line[date_match.end():].strip()
                    description = re.sub(amount_pattern, '', description).strip()
                    
                    if description and amount != 0:
                        category = self._categorize_transaction(description, amount)
                        transactions.append(Transaction(
                            date=date,
                            amount=abs(amount),
                            description=description,
                            category=category,
                            is_recurring=self._is_recurring_transaction(description),
                            tags=self._extract_tags(description)
                        ))
                except:
                    continue
        
        return transactions
    
    def analyze_transactions(self, transactions: List[Transaction]) -> Dict:
        """Analyze transaction patterns and provide insights"""
        if not transactions:
            return {}
        
        df = pd.DataFrame([t.dict() for t in transactions])
        
        analysis = {
            "total_transactions": len(transactions),
            "date_range": {
                "start": df['date'].min().isoformat(),
                "end": df['date'].max().isoformat()
            },
            "income_analysis": {
                "total": df[df['category'] == 'income']['amount'].sum(),
                "average": df[df['category'] == 'income']['amount'].mean(),
                "count": len(df[df['category'] == 'income'])
            },
            "expense_analysis": {
                "total": df[df['category'] != 'income']['amount'].sum(),
                "average": df[df['category'] != 'income']['amount'].mean(),
                "count": len(df[df['category'] != 'income'])
            },
            "category_breakdown": df.groupby('category')['amount'].agg(['sum', 'count', 'mean']).to_dict(),
            "recurring_transactions": {
                "count": len(df[df['is_recurring'] == True]),
                "total_amount": df[df['is_recurring'] == True]['amount'].sum()
            },
            "monthly_trend": self._calculate_monthly_trend(df)
        }
        
        return analysis
    
    def _calculate_monthly_trend(self, df: pd.DataFrame) -> Dict:
        """Calculate monthly income and expense trends"""
        df['month'] = pd.to_datetime(df['date']).dt.to_period('M')
        
        monthly_income = df[df['category'] == 'income'].groupby('month')['amount'].sum()
        monthly_expense = df[df['category'] != 'income'].groupby('month')['amount'].sum()
        
        trend = {}
        for month in df['month'].unique():
            trend[str(month)] = {
                "income": float(monthly_income.get(month, 0)),
                "expense": float(monthly_expense.get(month, 0)),
                "net": float(monthly_income.get(month, 0) - monthly_expense.get(month, 0))
            }
        
        return trend