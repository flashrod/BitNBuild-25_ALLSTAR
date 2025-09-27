import pandas as pd
from app.models.debt import Debt
from typing import List, Dict
from datetime import datetime

class DebtService:
    def ingest_debts(self, file_content: bytes, filename: str) -> List[Debt]:
        """
        Ingest debts from CSV or Excel file.
        """
        import io
        if filename.lower().endswith('.xlsx'):
            df = pd.read_excel(io.BytesIO(file_content))
        else:
            df = pd.read_csv(io.StringIO(file_content.decode('utf-8')))
        df.columns = [col.strip().lower().replace(' ', '_') for col in df.columns]
        debts = []
        for _, row in df.iterrows():
            debt = Debt(
                id=None,
                user_id=None,
                lender=row.get('lender', ''),
                principal=float(row.get('principal', 0)),
                interest_rate=float(row.get('interest_rate', 0)),
                tenure_months=int(row.get('tenure_months', 0)),
                emi=float(row.get('emi', 0)),
                start_date=pd.to_datetime(row.get('start_date', datetime.now())),
                type=row.get('type', 'loan')
            )
            debts.append(debt)
        return debts

    def simulate_repayment(self, debts: List[Debt], strategy: str = 'snowball') -> Dict:
        """
        Simulate repayment using Snowball or Avalanche strategy.
        Returns payoff timeline, total interest, and monthly breakdown.
        """
        # Sort debts by strategy
        if strategy == 'snowball':
            debts = sorted(debts, key=lambda d: d.principal)
        elif strategy == 'avalanche':
            debts = sorted(debts, key=lambda d: d.interest_rate, reverse=True)

        timeline = []
        total_interest = 0
        month = 0
        debts_copy = [Debt(**vars(d)) for d in debts]
        # Repayment logic: pay minimum EMI to all, extra goes to target debt
        while any(d.principal > 0 for d in debts_copy):
            month += 1
            month_interest = 0
            # Calculate interest for all debts
            for d in debts_copy:
                if d.principal <= 0:
                    continue
                interest = d.principal * (d.interest_rate / 12)
                d.principal += interest
                month_interest += interest
            # Find target debt (first with principal > 0)
            target = next((d for d in debts_copy if d.principal > 0), None)
            if not target:
                break
            # Calculate total available payment (sum of EMIs)
            total_payment = sum(d.emi for d in debts_copy if d.principal > 0)
            # Pay minimum EMI to all, extra to target debt
            for d in debts_copy:
                if d.principal <= 0:
                    continue
                payment = d.emi if d != target else total_payment
                d.principal = max(0, d.principal - payment)
            total_interest += month_interest
            timeline.append({'month': month, 'total_debt': sum(d.principal for d in debts_copy), 'interest_paid': month_interest})
        return {
            'strategy': strategy,
            'months': month,
            'total_interest': round(total_interest, 2),
            'timeline': timeline
        }