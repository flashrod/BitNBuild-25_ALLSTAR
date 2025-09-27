from typing import Optional
from datetime import datetime

class Debt:
    def __init__(self, id: Optional[int], user_id: Optional[int], lender: str, principal: float, interest_rate: float, tenure_months: int, emi: float, start_date: datetime, type: str):
        self.id = id
        self.user_id = user_id
        self.lender = lender
        self.principal = principal
        self.interest_rate = interest_rate
        self.tenure_months = tenure_months
        self.emi = emi
        self.start_date = start_date
        self.type = type  # 'loan' or 'credit_card'