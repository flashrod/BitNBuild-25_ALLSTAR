import pandas as pd
import pdfplumber
import pytesseract
from PIL import Image
import re
from io import BytesIO
from datetime import datetime
from app.models.database import Transaction, TransactionCategory
import numpy as np
from typing import List, Dict, Optional

# Import the new CapitalGainsParser
from app.services.capital_gains_parser import CapitalGainsParser

class FileParser:
    def generate_tax_report(
        self,
        user_transactions: List[Transaction],
        ais_transactions: List[Transaction],
        capital_gains: List[Dict],
        asset_type: str = "equity"
    ) -> Dict:
        """
        Integrate AIS/TIS and capital gains data for tax computation and reporting.
        Returns a comprehensive tax report.
        """
        # 1. Cross-verify user and AIS transactions
        verification = self.cross_verify_with_ais(user_transactions, ais_transactions)

        # 2. Aggregate verified income and expenses
        verified_income = sum(
            t['user'].amount for t in verification['matched'] if t['user'].category == 'income'
        )
        verified_expense = sum(
            t['user'].amount for t in verification['matched'] if t['user'].category != 'income'
        )

        # 3. Capital gains calculation
        cg_summary = self.calculate_capital_gains(capital_gains, asset_type)

        # 4. Total tax liability (income tax + capital gains tax)
        total_tax = cg_summary.get('total_tax', 0)
        # You can add more logic here for income tax computation based on slabs

        # 5. Build report
        report = {
            'verified_income': verified_income,
            'verified_expense': verified_expense,
            'capital_gains': cg_summary,
            'verification_summary': verification,
            'total_tax_liability': total_tax,
            'report_generated_at': datetime.now().isoformat()
        }
        return report
    def calculate_capital_gains(self, capital_gains: List[Dict], asset_type: str = "equity") -> Dict:
        """
        Calculate Short-Term and Long-Term Capital Gains (STCG/LTCG) and tax liability.
        asset_type: 'equity', 'mutual_fund', 'debt', 'crypto', etc.
        """
        from datetime import timedelta
        stcg = 0.0
        ltcg = 0.0
        stcg_count = 0
        ltcg_count = 0
        stcg_details = []
        ltcg_details = []

        # Define holding period thresholds (in days)
        holding_period_days = {
            "equity": 365,
            "mutual_fund": 365,
            "debt": 1095,  # 3 years
            "crypto": 1095
        }
        # Define tax rates (FY 2025-26)
        tax_rates = {
            "equity_stcg": 0.15,
            "equity_ltcg": 0.10,  # LTCG above Rs 1 lakh
            "mutual_fund_stcg": 0.15,
            "mutual_fund_ltcg": 0.10,
            "debt_stcg": "slab",
            "debt_ltcg": 0.20,
            "crypto_stcg": "slab",
            "crypto_ltcg": 0.30
        }

        threshold = holding_period_days.get(asset_type, 365)
        for txn in capital_gains:
            hp = txn.get('holding_period')
            gain = txn.get('gain_loss', 0)
            # Parse holding period (days)
            try:
                hp_days = int(hp) if hp is not None else 0
            except Exception:
                hp_days = 0
            if hp_days < threshold:
                stcg += gain
                stcg_count += 1
                stcg_details.append(txn)
            else:
                ltcg += gain
                ltcg_count += 1
                ltcg_details.append(txn)

        # Calculate tax liability
        stcg_tax = stcg * tax_rates.get(f"{asset_type}_stcg", 0.15) if isinstance(tax_rates.get(f"{asset_type}_stcg"), float) else None
        ltcg_tax = ltcg * tax_rates.get(f"{asset_type}_ltcg", 0.10) if isinstance(tax_rates.get(f"{asset_type}_ltcg"), float) else None

        # For equity LTCG, Rs 1 lakh exemption
        if asset_type == "equity" and ltcg > 100000:
            ltcg_tax = (ltcg - 100000) * tax_rates["equity_ltcg"]
        elif asset_type == "equity":
            ltcg_tax = 0.0

        summary = {
            "stcg_total": stcg,
            "ltcg_total": ltcg,
            "stcg_count": stcg_count,
            "ltcg_count": ltcg_count,
            "stcg_tax": stcg_tax,
            "ltcg_tax": ltcg_tax,
            "stcg_details": stcg_details,
            "ltcg_details": ltcg_details,
            "total_tax": (stcg_tax or 0) + (ltcg_tax or 0)
        }
        return summary
    def cross_verify_with_ais(self, user_transactions: List[Transaction], ais_transactions: List[Transaction]) -> Dict:
        """
        Cross-verify user-uploaded transactions with AIS/TIS transactions.
        Returns a summary with verification status and discrepancies.
        """
        from collections import defaultdict
        import difflib
        matched = []
        mismatched = []
        missing_in_ais = []
        missing_in_user = []

        # Build lookup for AIS transactions by (date, amount, description)
        ais_lookup = defaultdict(list)
        for txn in ais_transactions:
            key = (txn.date.date() if txn.date else None, round(txn.amount, 2), txn.category)
            ais_lookup[key].append(txn)

        # Match user transactions to AIS
        for utxn in user_transactions:
            key = (utxn.date.date() if utxn.date else None, round(utxn.amount, 2), utxn.category)
            candidates = ais_lookup.get(key, [])
            if candidates:
                # Use description similarity for best match
                best_match = max(candidates, key=lambda a: difflib.SequenceMatcher(None, utxn.description, a.description).ratio())
                similarity = difflib.SequenceMatcher(None, utxn.description, best_match.description).ratio()
                if similarity > 0.7:
                    matched.append({'user': utxn, 'ais': best_match, 'similarity': similarity})
                else:
                    mismatched.append({'user': utxn, 'ais_candidates': candidates, 'similarity': similarity})
            else:
                missing_in_ais.append(utxn)

        # Find AIS transactions missing in user data
        user_lookup = defaultdict(list)
        for txn in user_transactions:
            key = (txn.date.date() if txn.date else None, round(txn.amount, 2), txn.category)
            user_lookup[key].append(txn)
        for atxn in ais_transactions:
            key = (atxn.date.date() if atxn.date else None, round(atxn.amount, 2), atxn.category)
            if not user_lookup.get(key):
                missing_in_user.append(atxn)

        summary = {
            'matched': matched,
            'mismatched': mismatched,
            'missing_in_ais': missing_in_ais,
            'missing_in_user': missing_in_user,
            'match_count': len(matched),
            'mismatch_count': len(mismatched),
            'missing_in_ais_count': len(missing_in_ais),
            'missing_in_user_count': len(missing_in_user)
        }
        return summary
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
        self.last_pdf_analysis = {}
    
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
        """
        Parse PDF bank statement using both table and improved text extraction.
        Falls back to OCR if no text is found.
        """
        transactions = []
        with pdfplumber.open(BytesIO(file_content)) as pdf:
            for page_num, page in enumerate(pdf.pages):
                # 1. Try table extraction
                tables = page.extract_tables()
                for table in tables:
                    table_transactions = self._extract_from_pdf_table(table)
                    transactions.extend(table_transactions)

                # 2. Try improved text extraction
                text = page.extract_text()
                if text:
                    print(f"Extracted text from page {page_num+1}:\n{text[:500]}")
                    text_transactions = self._extract_transactions_from_text(text)
                    transactions.extend(text_transactions)
                else:
                    # 3. Fallback to OCR if no text
                    print(f"No text found on page {page_num+1}, using OCR.")
                    img = page.to_image(resolution=300).original
                    ocr_text = pytesseract.image_to_string(img)
                    print(f"OCR extracted text:\n{ocr_text[:500]}")
                    ocr_transactions = self._extract_transactions_from_text(ocr_text)
                    transactions.extend(ocr_transactions)

        print(f"Total transactions extracted from PDF: {len(transactions)}")
        self.last_pdf_analysis = self.analyze_transactions(transactions)
        return transactions

    def get_pdf_analysis(self) -> Dict:
        """
        Return the last PDF analysis (after parse_pdf).
        """
        return getattr(self, "last_pdf_analysis", {})
    
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
    
    def _extract_transactions_from_text(self, text: str, statement_year: Optional[int] = None) -> List[Transaction]:
        """
        Extract transactions from text for formats like:
        1 Feb  Description  100.00  0.00  40,100.00
        """
        transactions = []
        lines = text.split('\n')
        # Regex: day, month (abbrev), description, money out, money in, balance
        pattern = re.compile(
            r'^(\\d{1,2})\\s*([A-Za-z]{2,3})\\s+(.+?)\\s+([\\d,\\.]+)?\\s+([\\d,\\.]+)?\\s+([\\d,\\.]+)$'
        )
        month_map = {
            'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'May': 5, 'Jun': 6,
            'Jul': 7, 'Aug': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12
        }
        for line in lines:
            line = line.strip()
            match = pattern.match(line)
            if match:
                day, month_abbr, desc, money_out, money_in, balance = match.groups()
                month = month_map.get(month_abbr[:3].title())
                if not month or not statement_year:
                    continue
                try:
                    date_obj = datetime(statement_year, month, int(day))
                except Exception:
                    continue
                amount = 0.0
                if money_out and float(money_out.replace(',', '')) > 0:
                    amount = -float(money_out.replace(',', ''))
                elif money_in and float(money_in.replace(',', '')) > 0:
                    amount = float(money_in.replace(',', ''))
                transaction = Transaction(
                    date=date_obj,
                    amount=amount,
                    description=desc,
                    category=self._categorize_transaction(desc, amount)
                )
                transactions.append(transaction)
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

        # Explicit pattern breakdowns
        def pattern_df(pattern):
            return df[df['category'] == pattern]

        def pattern_summary(pattern):
            pdf = pattern_df(pattern)
            return {
                "count": int(pdf.shape[0]),
                "total": safe(pdf['amount'].sum()),
                "average": safe(pdf['amount'].mean()),
                "transactions": pdf.to_dict(orient='records')
            }

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
            "monthly_trend": self._calculate_monthly_trend(df),
            # Explicit pattern groups
            "emi": pattern_summary("emi"),
            "sip": pattern_summary("sip"),
            "rent": pattern_summary("rent"),
            "insurance": pattern_summary("insurance")
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

    def parse_ais_json(self, file_content: bytes, filename: str) -> List[Transaction]:
        """Parse AIS JSON file and normalize to Transaction model"""
        import json
        try:
            data = json.loads(file_content.decode('utf-8'))
            # TODO: Extract relevant transaction data from nested AIS JSON structure
            transactions = []
            # Example: Loop through AIS sections and extract transactions
            # for section in data.get('sections', []):
            #     for txn in section.get('transactions', []):
            #         transactions.append(self._normalize_ais_json_txn(txn))
            return transactions
        except Exception as e:
            raise ValueError(f"Error parsing AIS JSON file: {str(e)}")

    def parse_ais_csv(self, file_content: bytes, filename: str) -> List[Transaction]:
        """Parse AIS CSV file and normalize to Transaction model"""
        try:
            df = pd.read_csv(BytesIO(file_content))
            # TODO: Normalize columns and extract transactions
            transactions = []
            # for _, row in df.iterrows():
            #     transactions.append(self._normalize_ais_csv_row(row))
            return transactions
        except Exception as e:
            raise ValueError(f"Error parsing AIS CSV file: {str(e)}")

    def parse_broker_csv(self, file_content: bytes, filename: str) -> List[Dict]:
        """
        Use CapitalGainsParser to parse broker capital gains CSVs modularly.
        """
        parser = CapitalGainsParser()
        result = parser.parse(file_content, filename)
        return result.get('capital_gains', [])

    def parse_broker_excel(self, file_content: bytes, filename: str) -> List[Dict]:
        """
        Use CapitalGainsParser to parse broker capital gains Excel (.xlsx) files modularly.
        """
        parser = CapitalGainsParser()
        result = parser.parse_excel(file_content, filename)
        return result.get('capital_gains', [])

    def _normalize_ais_json_txn(self, txn: dict) -> Transaction:
        """Convert AIS JSON transaction dict to Transaction model"""
        # Typical AIS JSON keys: 'transactionDate', 'amount', 'description', 'category', 'tds', 'sft', etc.
        date_str = txn.get('transactionDate') or txn.get('date')
        date_obj = self._parse_date_string(date_str) if date_str else None
        amount = self._parse_amount_string(str(txn.get('amount', 0)))
        description = txn.get('description', '')
        category = txn.get('category', '') or self._categorize_transaction(description, amount)
        is_recurring = self._is_recurring_transaction(description)
        tags = self._extract_tags(description)
        return Transaction(
            id=None,
            user_id=None,
            date=date_obj,
            amount=abs(amount),
            description=description,
            category=category,
            is_recurring=is_recurring,
            tags=tags
        )

    def _normalize_ais_csv_row(self, row) -> Transaction:
        """Convert AIS CSV row to Transaction model"""
        # Typical AIS CSV columns: 'Transaction Date', 'Amount', 'Description', 'Category', etc.
        date_str = row.get('Transaction Date') or row.get('date')
        date_obj = self._parse_date_string(date_str) if date_str else None
        amount = self._parse_amount_string(str(row.get('Amount', 0)))
        description = row.get('Description', '')
        category = row.get('Category', '') or self._categorize_transaction(description, amount)
        is_recurring = self._is_recurring_transaction(description)
        tags = self._extract_tags(description)
        return Transaction(
            id=None,
            user_id=None,
            date=date_obj,
            amount=abs(amount),
            description=description,
            category=category,
            is_recurring=is_recurring,
            tags=tags
        )

    def _normalize_broker_csv_row(self, row) -> Dict:
        """Convert broker CSV row to CapitalGainTransaction dict (deprecated, use parse_broker_csv)"""
        # This method is now superseded by parse_broker_csv, which handles flexible mapping and calculations.
        return {}


# ---------------------------------------------------------------------------
# Lightweight helper functions for analysis endpoint
# These provide simple CSV -> DataFrame parsing for transactions and capital gains
# so the analysis router can operate directly on DataFrames without needing
# model objects. Keeping them here allows: from app.services.file_parser import parse_transaction_file
# ---------------------------------------------------------------------------

import os

def _standardize_columns(df: pd.DataFrame) -> pd.DataFrame:
    df.columns = [c.strip().lower().replace(' ', '_').replace('-', '_') for c in df.columns]
    return df

def parse_transaction_file(file_path: str) -> pd.DataFrame:
    """Parse a transactions CSV into a normalized DataFrame with columns:
    date (datetime), amount (positive float), type (credit|debit), category (str), optional description.

    Tries to detect common bank export schema variants:
      - Separate credit / debit columns
      - Signed amount column with or without an explicit type column
      - Alternate column names (transaction_date, value, withdrawal, deposit, description, particulars)
    """
    if not os.path.exists(file_path):
        return pd.DataFrame()
    try:
        df = pd.read_csv(file_path)
    except UnicodeDecodeError:
        df = pd.read_csv(file_path, encoding='iso-8859-1')
    except Exception:
        return pd.DataFrame()

    if df.empty:
        return df
    df = _standardize_columns(df)

    # Identify date column
    date_col_candidates = [c for c in df.columns if c in ['date','transaction_date','txn_date','value_date','posting_date']]
    if not date_col_candidates:
        # fallback: any column containing 'date'
        date_col_candidates = [c for c in df.columns if 'date' in c]
    if not date_col_candidates:
        return pd.DataFrame()  # cannot proceed
    date_col = date_col_candidates[0]
    df['date'] = pd.to_datetime(df[date_col], errors='coerce')
    df = df.dropna(subset=['date'])

    # Detect amount schema
    has_credit_col = any(c in df.columns for c in ['credit','cr','deposit'])
    has_debit_col = any(c in df.columns for c in ['debit','dr','withdrawal'])

    if has_credit_col or has_debit_col:
        credit_col = next((c for c in ['credit','cr','deposit'] if c in df.columns), None)
        debit_col = next((c for c in ['debit','dr','withdrawal'] if c in df.columns), None)
        credits = df[credit_col].fillna(0) if credit_col else 0
        debits = df[debit_col].fillna(0) if debit_col else 0
        # Ensure numeric
        credits = pd.to_numeric(credits, errors='coerce').fillna(0)
        debits = pd.to_numeric(debits, errors='coerce').fillna(0)
        credit_rows = df[credits > 0].copy()
        debit_rows = df[debits > 0].copy()
        credit_rows['amount'] = credits[credits > 0]
        credit_rows['type'] = 'credit'
        debit_rows['amount'] = debits[debits > 0]
        debit_rows['type'] = 'debit'
        norm_df = pd.concat([credit_rows, debit_rows], ignore_index=True)
    else:
        # Single amount column detection
        amount_col_candidates = [c for c in df.columns if c in ['amount','transaction_amount','amt','value']]
        if not amount_col_candidates:
            # fallback: first numeric-looking column excluding date
            numeric_cols = [c for c in df.columns if c != 'date' and pd.api.types.is_numeric_dtype(df[c])]
            if not numeric_cols:
                return pd.DataFrame()
            amount_col = numeric_cols[0]
        else:
            amount_col = amount_col_candidates[0]
        df['raw_amount'] = pd.to_numeric(df[amount_col], errors='coerce')
        df = df.dropna(subset=['raw_amount'])
        if 'type' in df.columns:
            df['type'] = df['type'].str.lower().replace({'cr':'credit','dr':'debit'})
            # Make amounts positive
            df['amount'] = df['raw_amount'].abs()
        else:
            df['type'] = df['raw_amount'].apply(lambda x: 'credit' if x >= 0 else 'debit')
            df['amount'] = df['raw_amount'].abs()
        norm_df = df

    # Category detection: use existing column or fallback
    category_col = next((c for c in ['category','cat','txn_category'] if c in norm_df.columns), None)
    if category_col:
        norm_df['category'] = norm_df[category_col].fillna('Uncategorized').astype(str)
    else:
        # Heuristic: if description exists, derive simple categories
        desc_col = next((c for c in ['description','narration','particulars','details'] if c in norm_df.columns), None)
        if desc_col:
            def derive(desc: str):
                d = str(desc).lower()
                if any(k in d for k in ['salary','payroll']): return 'Salary'
                if any(k in d for k in ['rent']): return 'Rent'
                if any(k in d for k in ['fuel','uber','ola']): return 'Transport'
                if any(k in d for k in ['grocery','supermarket','mart']): return 'Groceries'
                if any(k in d for k in ['emi','loan']): return 'EMI'
                return 'General'
            norm_df['category'] = norm_df[desc_col].apply(derive)
        else:
            norm_df['category'] = 'General'

    # Keep only required columns
    keep_cols = ['date','amount','type','category']
    optional_cols = [c for c in ['description','narration','particulars','details'] if c in norm_df.columns]
    keep_cols.extend(optional_cols)
    norm_df = norm_df[keep_cols].reset_index(drop=True)
    return norm_df

def parse_capital_gains_file(file_path: str) -> pd.DataFrame:
    """Parse capital gains CSV to DataFrame with columns: date, gain_amount.
    Supports various column name variants (gain_loss, capital_gain, profit_loss)."""
    if not os.path.exists(file_path):
        return pd.DataFrame()
    try:
        df = pd.read_csv(file_path)
    except UnicodeDecodeError:
        df = pd.read_csv(file_path, encoding='iso-8859-1')
    except Exception:
        return pd.DataFrame()
    if df.empty:
        return df
    df = _standardize_columns(df)
    # Date column candidates
    date_col = next((c for c in ['date','trade_date','transaction_date','sell_date'] if c in df.columns), None)
    if not date_col:
        return pd.DataFrame()
    df['date'] = pd.to_datetime(df[date_col], errors='coerce')
    df = df.dropna(subset=['date'])
    gain_col = next((c for c in ['gain_amount','gain_loss','capital_gain','profit_loss','gain'] if c in df.columns), None)
    if not gain_col:
        return pd.DataFrame()
    df['gain_amount'] = pd.to_numeric(df[gain_col], errors='coerce').fillna(0)
    return df[['date','gain_amount']].reset_index(drop=True)