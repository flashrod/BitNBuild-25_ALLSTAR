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
                r"dividend", r"refund", r"cashback", r"reward", r"bonus"
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
                r"grocery", r"supermarket", r"bigbasket", r"dmart"
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
        
        # Enhanced date patterns for Indian banks
        self.date_patterns = [
            r'\d{1,2}[-/\.]\d{1,2}[-/\.]\d{2,4}',  # DD-MM-YYYY, DD/MM/YYYY, DD.MM.YYYY
            r'\d{2,4}[-/\.]\d{1,2}[-/\.]\d{1,2}',  # YYYY-MM-DD
            r'\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{2,4}',  # DD MMM YYYY
            r'(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},?\s+\d{2,4}'  # MMM DD, YYYY
        ]
        
        # Enhanced amount patterns
        self.amount_patterns = [
            r'₹\s*[\d,]+\.?\d*',  # ₹1,234.56
            r'Rs\.?\s*[\d,]+\.?\d*',  # Rs. 1234.56
            r'INR\s*[\d,]+\.?\d*',  # INR 1234.56
            r'[\d,]+\.?\d*\s*(?:CR|DR|C|D)?',  # 1234.56 CR/DR
            r'\(\s*[\d,]+\.?\d*\s*\)'  # (1234.56) for negative amounts
        ]
    
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
            print(f"CSV columns after normalization: {list(df.columns)}")
            print(f"CSV shape: {df.shape}")
            print(f"First few rows:\n{df.head()}")
            
            # Identify columns
            date_cols = self._find_date_column(df)
            amount_cols = self._find_amount_columns(df)
            desc_cols = self._find_description_columns(df)
            
            print(f"Detected date columns: {date_cols}")
            print(f"Detected amount columns: {amount_cols}")
            print(f"Detected description columns: {desc_cols}")
            
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
        """Parse PDF bank statement - FIXED VERSION"""
        try:
            print(f"Starting PDF parsing for: {filename}")
            transactions = []
            
            with pdfplumber.open(BytesIO(file_content)) as pdf:
                print(f"PDF has {len(pdf.pages)} pages")
                
                for page_num, page in enumerate(pdf.pages):
                    print(f"Processing page {page_num + 1}")
                    
                    # Try table extraction first
                    tables = page.extract_tables()
                    page_transactions = []
                    
                    if tables:
                        print(f"Found {len(tables)} tables on page {page_num + 1}")
                        for table_idx, table in enumerate(tables):
                            if table and len(table) > 1:  # Has header + data
                                table_transactions = self._extract_from_pdf_table(table)
                                page_transactions.extend(table_transactions)
                                print(f"Extracted {len(table_transactions)} transactions from table {table_idx + 1}")
                    
                    # If no transactions from tables, try text extraction
                    if not page_transactions:
                        print(f"No table transactions found, trying text extraction on page {page_num + 1}")
                        text = page.extract_text()
                        if text:
                            page_transactions = self._extract_transactions_from_text(text)
                            print(f"Extracted {len(page_transactions)} transactions from text on page {page_num + 1}")
                    
                    transactions.extend(page_transactions)
            
            print(f"Total transactions extracted from PDF: {len(transactions)}")
            return transactions
            
        except Exception as e:
            print(f"Error parsing PDF file: {str(e)}")
            # Return empty list instead of recursing
            return []
    
    def _extract_from_pdf_table(self, table):
        """Extract transactions from a PDF table"""
        transactions = []
        
        if not table or len(table) < 2:
            return transactions
        
        print(f"Processing table with {len(table)} rows")
        
        # Simple approach: assume first row is header, find date/amount/desc columns
        header = table[0] if table else []
        data_rows = table[1:]
        
        # Find columns (simple keyword matching)
        date_col = None
        amount_cols = []
        desc_col = None
        
        for i, header_cell in enumerate(header):
            if header_cell and isinstance(header_cell, str):
                lower_header = header_cell.lower().strip()
                if any(word in lower_header for word in ['date', 'txn', 'transaction']) and date_col is None:
                    date_col = i
                    print(f"Found date column at index {i}: {header_cell}")
                elif any(word in lower_header for word in ['amount', 'debit', 'credit', 'withdrawal', 'deposit']) and i not in amount_cols:
                    amount_cols.append(i)
                    print(f"Found amount column at index {i}: {header_cell}")
                elif any(word in lower_header for word in ['description', 'particulars', 'details', 'narration']) and desc_col is None:
                    desc_col = i
                    print(f"Found description column at index {i}: {header_cell}")
        
        # If we couldn't find columns by header, try data analysis
        if date_col is None or not amount_cols or desc_col is None:
            print("Could not identify all columns by header, analyzing data...")
            for col_idx in range(len(header)):
                col_data = [row[col_idx] if col_idx < len(row) else "" for row in data_rows[:5]]  # Check first 5 rows
                
                # Check if column contains dates
                if date_col is None and self._column_contains_dates(col_data):
                    date_col = col_idx
                    print(f"Found date column by data analysis at index {col_idx}")
                
                # Check if column contains amounts
                if col_idx not in amount_cols and self._column_contains_amounts_simple(col_data):
                    amount_cols.append(col_idx)
                    print(f"Found amount column by data analysis at index {col_idx}")
                
                # Check if column contains descriptions (longest text)
                if desc_col is None and self._column_contains_descriptions(col_data):
                    desc_col = col_idx
                    print(f"Found description column by data analysis at index {col_idx}")
        
        print(f"Final column mapping - Date: {date_col}, Amount: {amount_cols}, Description: {desc_col}")
        
        if date_col is not None and amount_cols and desc_col is not None:
            for row_idx, row in enumerate(data_rows):
                if len(row) <= max(date_col, max(amount_cols), desc_col):
                    continue
                
                try:
                    date_str = row[date_col] if date_col < len(row) else ""
                    desc_str = row[desc_col] if desc_col < len(row) else ""
                    
                    # Try each amount column until we find a valid amount
                    amount = 0
                    for amt_col in amount_cols:
                        if amt_col < len(row) and row[amt_col]:
                            amount = self._parse_amount_string(str(row[amt_col]))
                            if amount != 0:
                                break
                    
                    if date_str and desc_str and amount != 0:
                        # Parse date
                        date_obj = self._parse_date_string(date_str)
                        if date_obj:
                            transaction = Transaction(
                                id=None,
                                user_id=None,
                                date=date_obj,
                                amount=abs(amount),
                                description=str(desc_str).strip(),
                                category=self._categorize_transaction(desc_str, amount),
                                is_recurring=self._is_recurring_transaction(desc_str),
                                tags=self._extract_tags(desc_str)
                            )
                            transactions.append(transaction)
                            print(f"Extracted transaction: {date_obj.strftime('%Y-%m-%d')}, {amount}, {str(desc_str)[:30]}...")
                
                except Exception as e:
                    print(f"Error processing row {row_idx}: {e}")
                    continue
        
        return transactions
    
    def _column_contains_dates(self, col_data: List[str]) -> bool:
        """Check if column contains date-like data"""
        date_count = 0
        for cell in col_data:
            if cell and self._is_valid_date_string(str(cell)):
                date_count += 1
        return date_count >= len(col_data) * 0.5  # At least 50% should be dates
    
    def _column_contains_amounts_simple(self, col_data: List[str]) -> bool:
        """Check if column contains amount-like data"""
        amount_count = 0
        for cell in col_data:
            if cell and self._parse_amount_string(str(cell)) != 0:
                amount_count += 1
        return amount_count >= len(col_data) * 0.5  # At least 50% should be amounts
    
    def _column_contains_descriptions(self, col_data: List[str]) -> bool:
        """Check if column contains description-like data"""
        desc_count = 0
        for cell in col_data:
            if cell and isinstance(cell, str) and len(str(cell).strip()) > 5:
                # Not a date, not an amount
                if not self._is_valid_date_string(str(cell)) and self._parse_amount_string(str(cell)) == 0:
                    desc_count += 1
        return desc_count >= len(col_data) * 0.5  # At least 50% should be descriptions
    
    def _extract_transactions_from_text(self, text: str) -> List[Transaction]:
        """Extract transactions from plain text"""
        transactions = []
        lines = text.split('\n')
        
        print(f"Analyzing {len(lines)} lines of text")
        
        for line_num, line in enumerate(lines):
            line = line.strip()
            if not line or len(line) < 10:  # Skip short lines
                continue
            
            # Look for lines that contain both date and amount patterns
            has_date = any(re.search(pattern, line, re.IGNORECASE) for pattern in self.date_patterns)
            has_amount = any(re.search(pattern, line, re.IGNORECASE) for pattern in self.amount_patterns)
            
            if has_date and has_amount:
                transaction = self._parse_transaction_line(line)
                if transaction:
                    transactions.append(transaction)
                    print(f"Extracted from line {line_num}: {transaction.date.strftime('%Y-%m-%d')}, {transaction.amount}, {transaction.description[:30]}...")
        
        return transactions
    
    def _parse_transaction_line(self, line: str) -> Optional[Transaction]:
        """Parse a single line that contains a transaction"""
        # Extract date
        date_obj = None
        for pattern in self.date_patterns:
            match = re.search(pattern, line, re.IGNORECASE)
            if match:
                date_obj = self._parse_date_string(match.group())
                if date_obj:
                    break
        
        if not date_obj:
            return None
        
        # Extract amount
        amount = 0
        for pattern in self.amount_patterns:
            match = re.search(pattern, line, re.IGNORECASE)
            if match:
                amount = self._parse_amount_string(match.group())
                if amount != 0:
                    break
        
        if amount == 0:
            return None
        
        # Extract description (remove date and amount from line)
        description = line
        for pattern in self.date_patterns:
            description = re.sub(pattern, '', description, flags=re.IGNORECASE)
        for pattern in self.amount_patterns:
            description = re.sub(pattern, '', description, flags=re.IGNORECASE)
        
        description = ' '.join(description.split())  # Clean up whitespace
        
        if not description or len(description) < 3:
            description = "Transaction"  # Default description
        
        return Transaction(
            id=None,
            user_id=None,
            date=date_obj,
            amount=abs(amount),
            description=description.strip(),
            category=self._categorize_transaction(description, amount),
            is_recurring=self._is_recurring_transaction(description),
            tags=self._extract_tags(description)
        )
    
    def _is_valid_date_string(self, text: str) -> bool:
        """Check if text contains a valid date"""
        if not text:
            return False
        
        for pattern in self.date_patterns:
            if re.search(pattern, text, re.IGNORECASE):
                return True
        return False
    
    def _parse_date_string(self, date_str: str) -> Optional[datetime]:
        """Parse date string using multiple formats"""
        if not date_str:
            return None
        
        # Common date formats for Indian banks
        date_formats = [
            '%d-%m-%Y', '%d/%m/%Y', '%d.%m.%Y',
            '%d-%m-%y', '%d/%m/%y', '%d.%m.%y',
            '%Y-%m-%d', '%Y/%m/%d',
            '%d %b %Y', '%d %B %Y',
            '%b %d, %Y', '%B %d, %Y'
        ]
        
        # Extract date from string using regex
        for pattern in self.date_patterns:
            match = re.search(pattern, date_str, re.IGNORECASE)
            if match:
                date_text = match.group()
                
                for fmt in date_formats:
                    try:
                        return datetime.strptime(date_text, fmt)
                    except ValueError:
                        continue
        
        # Fallback to pandas date parser
        try:
            return pd.to_datetime(date_str, dayfirst=True)
        except:
            return None
    
    def _parse_amount_string(self, amount_str: str) -> float:
        """Parse amount string handling various formats"""
        if not amount_str:
            return 0
        
        if isinstance(amount_str, (int, float)):
            return float(amount_str)
        
        # Remove common currency symbols and spaces
        cleaned = str(amount_str).replace('₹', '').replace('Rs.', '').replace('Rs', '').replace('INR', '')
        cleaned = cleaned.replace(',', '').strip()
        
        # Handle negative amounts in parentheses
        is_negative = False
        if cleaned.startswith('(') and cleaned.endswith(')'):
            cleaned = cleaned[1:-1]
            is_negative = True
        
        # Handle CR/DR indicators
        if cleaned.endswith(' CR') or cleaned.endswith(' C'):
            cleaned = cleaned[:-2].strip()
        elif cleaned.endswith(' DR') or cleaned.endswith(' D'):
            cleaned = cleaned[:-2].strip()
            is_negative = True
        
        # Try to convert to float
        try:
            # Remove any non-numeric characters except decimal point
            cleaned = re.sub(r'[^\d\.]', '', cleaned)
            if cleaned:
                amount = float(cleaned)
                return -amount if is_negative else amount
        except (ValueError, TypeError):
            pass
        
        return 0

    # Add missing methods from your working CSV logic
    def _find_date_column(self, df):
        """Find date columns in DataFrame"""
        date_cols = []
        for col in df.columns:
            if any(keyword in col.lower() for keyword in ['date', 'time', 'day']):
                date_cols.append(col)
        
        # If no date column found by name, check data
        if not date_cols:
            for col in df.columns:
                try:
                    pd.to_datetime(df[col].dropna().head(10))
                    date_cols.append(col)
                    break
                except:
                    continue
        
        return date_cols

    def _find_amount_columns(self, df):
        """Find amount columns in DataFrame"""
        amount_cols = []
        
        for col in df.columns:
            if any(keyword in col.lower() for keyword in ['amount', 'balance', 'debit', 'credit', 'withdrawal', 'deposit']):
                amount_cols.append(col)
                print(f"Added amount column: {col}")
        
        return amount_cols

    def _find_description_columns(self, df):
        """Find description columns in DataFrame"""
        desc_cols = []
        
        for col in df.columns:
            if any(keyword in col.lower() for keyword in ['description', 'particular', 'detail', 'narration', 'remark']):
                desc_cols.append(col)
                print(f"Added description column: {col}")
        
        return desc_cols

    def _process_transaction_row(self, row, date_col, amount_col, desc_col):
        """Process a single transaction row"""
        try:
            # Parse date
            date_obj = pd.to_datetime(row[date_col])
            
            # Parse amount
            amount = float(row[amount_col])
            
            # Get description
            description = str(row[desc_col])
            
            print(f"Processing transaction: date={date_obj}, amount={amount}, desc={description[:30]}...")
            
            # Create transaction
            transaction = Transaction(
                id=None,
                user_id=None,
                date=date_obj,
                amount=abs(amount),
                description=description,
                category=self._categorize_transaction(description, amount),
                is_recurring=self._is_recurring_transaction(description),
                tags=self._extract_tags(description)
            )
            
            return transaction
        except Exception as e:
            print(f"Error processing transaction row: {e}")
            return None

    def _categorize_transaction(self, description: str, amount: float) -> str:
        """Categorize transaction based on description and amount"""
        desc_lower = description.lower()
        
        # Check if it's income (positive amount or specific keywords)
        if amount > 0 or any(re.search(pattern, desc_lower, re.IGNORECASE) for pattern in self.patterns["income"]):
            return "income"
        
        # Check other categories
        for category, patterns in self.patterns.items():
            if category != "income":
                for pattern in patterns:
                    if re.search(pattern, desc_lower, re.IGNORECASE):
                        return category
        
        # Default category for expenses
        return "expense"

    def _is_recurring_transaction(self, description: str) -> bool:
        """Check if transaction is likely recurring"""
        recurring_patterns = [
            r"emi", r"sip", r"rent", r"salary", r"insurance", r"premium", 
            r"subscription", r"monthly", r"recurring"
        ]
        
        desc_lower = description.lower()
        return any(re.search(pattern, desc_lower, re.IGNORECASE) for pattern in recurring_patterns)

    def _extract_tags(self, description: str) -> List[str]:
        """Extract tags from transaction description"""
        tags = []
        desc_lower = description.lower()
        
        # Common service/brand tags
        tag_patterns = {
            'swiggy': r'swiggy',
            'zomato': r'zomato',
            'uber': r'uber',
            'ola': r'ola',
            'amazon': r'amazon',
            'flipkart': r'flipkart',
            'netflix': r'netflix'
        }
        
        for tag, pattern in tag_patterns.items():
            if re.search(pattern, desc_lower, re.IGNORECASE):
                tags.append(tag)
        
        return tags

    def analyze_transactions(self, transactions: List[Transaction]) -> Dict:
        """Analyze transaction patterns and provide insights"""
        import math
        if not transactions:
            return {}
        df = pd.DataFrame([t.dict() for t in transactions])
        def safe(val):
            if isinstance(val, float) and (math.isnan(val) or math.isinf(val)):
                return 0
            return val
        analysis = {
            "total_transactions": len(transactions),
            "date_range": {
                "start": safe(df['date'].min().isoformat()) if not df.empty else None,
                "end": safe(df['date'].max().isoformat()) if not df.empty else None
            },
            "income_analysis": {
                "total": safe(df[df['category'] == 'income']['amount'].sum()),
                "average": safe(df[df['category'] == 'income']['amount'].mean()),
                "count": len(df[df['category'] == 'income'])
            },
            "expense_analysis": {
                "total": safe(df[df['category'] != 'income']['amount'].sum()),
                "average": safe(df[df['category'] != 'income']['amount'].mean()),
                "count": len(df[df['category'] != 'income'])
            },
            "category_breakdown": {
                "sum": {k: safe(v) for k, v in df.groupby('category')['amount'].sum().to_dict().items()},
                "count": {k: safe(v) for k, v in df.groupby('category')['amount'].count().to_dict().items()},
                "mean": {k: safe(v) for k, v in df.groupby('category')['amount'].mean().to_dict().items()},
            },
            "recurring_transactions": {
                "count": int(df[df['is_recurring'] == True]['amount'].count()),
                "total_amount": safe(df[df['is_recurring'] == True]['amount'].sum())
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

    def parse_excel(self, file_content: bytes, filename: str) -> List[Transaction]:
        """Parse Excel file containing transaction data"""
        try:
            df = pd.read_excel(BytesIO(file_content))
            # Use same logic as CSV
            df.columns = [col.strip().lower().replace(' ', '_') for col in df.columns]
            
            date_cols = self._find_date_column(df)
            amount_cols = self._find_amount_columns(df)
            desc_cols = self._find_description_columns(df)
            
            if not date_cols or not amount_cols or not desc_cols:
                raise ValueError("Could not identify required columns in Excel")
            
            transactions = []
            for _, row in df.iterrows():
                transaction = self._process_transaction_row(
                    row, date_cols[0], amount_cols[0], desc_cols[0]
                )
                if transaction:
                    transactions.append(transaction)
            
            return transactions
            
        except Exception as e:
            raise ValueError(f"Error parsing Excel file: {str(e)}")