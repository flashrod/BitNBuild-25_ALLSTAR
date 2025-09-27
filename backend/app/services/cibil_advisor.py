from typing import Dict, List, Optional, Tuple
from app.models.database import CIBILData, CIBILRecommendation, Transaction, TransactionCategory
from datetime import datetime, timedelta
import numpy as np

class CIBILAdvisor:
    """CIBIL Score Analysis and Advisory Service"""
    
    def __init__(self):
        # CIBIL Score Ranges
        self.score_ranges = {
            "Excellent": (750, 900),
            "Good": (700, 749),
            "Fair": (650, 699),
            "Poor": (550, 649),
            "Bad": (300, 549)
        }
        
        # Component Weights (as per CIBIL methodology)
        self.weights = {
            "payment_history": 0.35,
            "credit_utilization": 0.30,
            "credit_age": 0.15,
            "credit_mix": 0.10,
            "credit_inquiries": 0.10
        }
    
    def calculate_score(self, cibil_data: CIBILData) -> int:
        """Calculate CIBIL score based on various factors"""
        base_score = 300  # Minimum CIBIL score
        max_additional = 600  # Maximum additional points (300 + 600 = 900)
        
        # Payment History Score (35%)
        payment_score = self._calculate_payment_score(
            cibil_data.on_time_payments,
            cibil_data.late_payments,
            cibil_data.missed_payments
        )
        
        # Credit Utilization Score (30%)
        utilization_score = self._calculate_utilization_score(
            cibil_data.utilization_percentage
        )
        
        # Credit Age Score (15%)
        age_score = self._calculate_age_score(
            cibil_data.average_account_age_months,
            cibil_data.oldest_account_age_months
        )
        
        # Credit Mix Score (10%)
        mix_score = self._calculate_mix_score(
            cibil_data.number_of_loans,
            cibil_data.number_of_credit_cards
        )
        
        # Credit Inquiries Score (10%)
        inquiry_score = self._calculate_inquiry_score(
            cibil_data.recent_inquiries
        )
        
        # Calculate weighted score
        total_score = base_score + int(max_additional * (
            payment_score * self.weights["payment_history"] +
            utilization_score * self.weights["credit_utilization"] +
            age_score * self.weights["credit_age"] +
            mix_score * self.weights["credit_mix"] +
            inquiry_score * self.weights["credit_inquiries"]
        ))
        
        return min(900, max(300, total_score))
    
    def _calculate_payment_score(self, on_time: int, late: int, missed: int) -> float:
        """Calculate payment history score (0-1)"""
        total_payments = on_time + late + missed
        if total_payments == 0:
            return 0.5  # No history
        
        on_time_ratio = on_time / total_payments
        late_penalty = (late * 0.1 + missed * 0.3) / total_payments
        
        return max(0, min(1, on_time_ratio - late_penalty))
    
    def _calculate_utilization_score(self, utilization_percentage: float) -> float:
        """Calculate credit utilization score (0-1)"""
        if utilization_percentage <= 0:
            return 0.8  # No utilization is not ideal
        elif utilization_percentage <= 10:
            return 1.0  # Excellent
        elif utilization_percentage <= 30:
            return 0.9  # Very Good
        elif utilization_percentage <= 50:
            return 0.7  # Good
        elif utilization_percentage <= 70:
            return 0.5  # Fair
        elif utilization_percentage <= 90:
            return 0.3  # Poor
        else:
            return 0.1  # Very Poor
    
    def _calculate_age_score(self, avg_age_months: int, oldest_age_months: int) -> float:
        """Calculate credit age score (0-1)"""
        if oldest_age_months >= 84:  # 7+ years
            age_factor = 1.0
        elif oldest_age_months >= 60:  # 5+ years
            age_factor = 0.8
        elif oldest_age_months >= 36:  # 3+ years
            age_factor = 0.6
        elif oldest_age_months >= 24:  # 2+ years
            age_factor = 0.4
        else:
            age_factor = 0.2
        
        # Consider average age too
        if avg_age_months >= 36:
            avg_factor = 1.0
        elif avg_age_months >= 24:
            avg_factor = 0.7
        elif avg_age_months >= 12:
            avg_factor = 0.5
        else:
            avg_factor = 0.3
        
        return (age_factor * 0.6 + avg_factor * 0.4)
    
    def _calculate_mix_score(self, loans: int, cards: int) -> float:
        """Calculate credit mix score (0-1)"""
        total_accounts = loans + cards
        
        if total_accounts == 0:
            return 0.3  # No credit history
        elif total_accounts == 1:
            return 0.5  # Limited mix
        elif 2 <= total_accounts <= 4:
            # Good mix if balanced
            if loans > 0 and cards > 0:
                return 0.9
            else:
                return 0.7
        elif 5 <= total_accounts <= 7:
            return 0.8
        else:
            return 0.6  # Too many accounts might be risky
    
    def _calculate_inquiry_score(self, recent_inquiries: int) -> float:
        """Calculate credit inquiry score (0-1)"""
        if recent_inquiries == 0:
            return 1.0
        elif recent_inquiries == 1:
            return 0.9
        elif recent_inquiries == 2:
            return 0.7
        elif recent_inquiries == 3:
            return 0.5
        elif recent_inquiries == 4:
            return 0.3
        else:
            return 0.1  # Too many inquiries
    
    def analyze_credit_behavior(self, transactions: List[Transaction]) -> Dict:
        """Analyze credit behavior from transactions"""
        analysis = {
            "total_income": 0,
            "total_expenses": 0,
            "emi_payments": 0,
            "credit_card_payments": 0,
            "on_time_payments": 0,
            "late_payments": 0,
            "debt_to_income_ratio": 0
        }
        
        for transaction in transactions:
            if transaction.category == TransactionCategory.INCOME:
                analysis["total_income"] += transaction.amount
            elif transaction.category == TransactionCategory.EMI:
                analysis["emi_payments"] += transaction.amount
            elif "credit" in transaction.description.lower():
                analysis["credit_card_payments"] += transaction.amount
            else:
                analysis["total_expenses"] += transaction.amount
        
        # Calculate debt-to-income ratio
        if analysis["total_income"] > 0:
            analysis["debt_to_income_ratio"] = (
                (analysis["emi_payments"] + analysis["credit_card_payments"]) / 
                analysis["total_income"]
            ) * 100
        
        return analysis
    
    def simulate_score_change(self, cibil_data: CIBILData, 
                            changes: Dict[str, float]) -> Dict:
        """Simulate what-if scenarios for score improvement"""
        current_score = self.calculate_score(cibil_data)
        
        # Create modified CIBIL data
        modified_data = CIBILData(**cibil_data.dict())
        
        # Apply changes
        for key, value in changes.items():
            if hasattr(modified_data, key):
                setattr(modified_data, key, value)
        
        new_score = self.calculate_score(modified_data)
        
        return {
            "current_score": current_score,
            "projected_score": new_score,
            "score_improvement": new_score - current_score,
            "changes_applied": changes
        }
    
    def get_recommendations(self, cibil_data: CIBILData) -> List[CIBILRecommendation]:
        """Generate personalized CIBIL score improvement recommendations"""
        recommendations = []
        current_score = self.calculate_score(cibil_data)
        
        # Credit Utilization Recommendations
        if cibil_data.utilization_percentage > 30:
            improvement = self._estimate_utilization_improvement(
                cibil_data.utilization_percentage, 25
            )
            recommendations.append(CIBILRecommendation(
                category="Credit Utilization",
                title="Reduce Credit Card Utilization",
                current_impact="negative",
                recommendation=f"Lower your credit utilization from {cibil_data.utilization_percentage:.1f}% to below 30%",
                expected_score_improvement=improvement,
                timeframe_months=2
            ))
        
        # Payment History Recommendations
        if cibil_data.late_payments > 0 or cibil_data.missed_payments > 0:
            recommendations.append(CIBILRecommendation(
                category="Payment History",
                title="Improve Payment Consistency",
                current_impact="negative",
                recommendation="Set up automatic payments to avoid late/missed payments",
                expected_score_improvement=20,
                timeframe_months=6
            ))
        
        # Credit Age Recommendations
        if cibil_data.oldest_account_age_months < 36:
            recommendations.append(CIBILRecommendation(
                category="Credit Age",
                title="Keep Old Accounts Open",
                current_impact="neutral",
                recommendation="Don't close your oldest credit cards, even if unused",
                expected_score_improvement=10,
                timeframe_months=12
            ))
        
        # Credit Mix Recommendations
        if cibil_data.number_of_loans == 0 or cibil_data.number_of_credit_cards == 0:
            recommendations.append(CIBILRecommendation(
                category="Credit Mix",
                title="Diversify Credit Portfolio",
                current_impact="neutral",
                recommendation="Consider having both installment loans and revolving credit",
                expected_score_improvement=15,
                timeframe_months=6
            ))
        
        # Credit Inquiry Recommendations
        if cibil_data.recent_inquiries > 2:
            recommendations.append(CIBILRecommendation(
                category="Credit Inquiries",
                title="Limit New Credit Applications",
                current_impact="negative",
                recommendation="Avoid applying for new credit for the next 6 months",
                expected_score_improvement=10,
                timeframe_months=6
            ))
        
        # Additional recommendations based on score range
        if current_score < 650:
            recommendations.append(CIBILRecommendation(
                category="Credit Building",
                title="Consider a Secured Credit Card",
                current_impact="positive",
                recommendation="Build credit history with a secured credit card",
                expected_score_improvement=30,
                timeframe_months=12
            ))
        
        return sorted(recommendations, 
                     key=lambda x: x.expected_score_improvement, 
                     reverse=True)
    
    def _estimate_utilization_improvement(self, current: float, target: float) -> int:
        """Estimate score improvement from utilization change"""
        if current > 70 and target <= 30:
            return 40
        elif current > 50 and target <= 30:
            return 25
        elif current > 30 and target <= 30:
            return 10
        else:
            return 5
    
    def get_score_category(self, score: int) -> str:
        """Get score category description"""
        for category, (min_score, max_score) in self.score_ranges.items():
            if min_score <= score <= max_score:
                return category
        return "Unknown"
    
    def calculate_loan_eligibility(self, cibil_data: CIBILData, 
                                  monthly_income: float) -> Dict:
        """Calculate loan eligibility based on CIBIL score"""
        score = self.calculate_score(cibil_data)
        
        # Base eligibility on score
        if score >= 750:
            max_loan_multiplier = 60  # 60 times monthly income
            interest_rate = 8.5
        elif score >= 700:
            max_loan_multiplier = 48
            interest_rate = 9.5
        elif score >= 650:
            max_loan_multiplier = 36
            interest_rate = 11.0
        elif score >= 600:
            max_loan_multiplier = 24
            interest_rate = 13.0
        else:
            max_loan_multiplier = 0
            interest_rate = 0
        
        max_loan_amount = monthly_income * max_loan_multiplier
        
        return {
            "cibil_score": score,
            "score_category": self.get_score_category(score),
            "max_loan_amount": max_loan_amount,
            "estimated_interest_rate": interest_rate,
            "loan_approved": score >= 600
        }