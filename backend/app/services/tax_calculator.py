from typing import Dict, List, Tuple, Optional
from app.models.database import TaxData, TaxRegime, TaxRecommendation

class TaxCalculator:
    """Indian Tax Calculator for FY 2024-25 (AY 2025-26)"""
    
    def __init__(self):
        # Old Regime Tax Slabs for FY 2024-25
        self.old_regime_slabs = [
            (250000, 0.00),    # 0-2.5L: 0%
            (500000, 0.05),    # 2.5L-5L: 5%
            (1000000, 0.20),   # 5L-10L: 20%
            (float('inf'), 0.30)  # Above 10L: 30%
        ]
        
        # New Regime Tax Slabs for FY 2024-25
        self.new_regime_slabs = [
            (300000, 0.00),    # 0-3L: 0%
            (600000, 0.05),    # 3L-6L: 5%
            (900000, 0.10),    # 6L-9L: 10%
            (1200000, 0.15),   # 9L-12L: 15%
            (1500000, 0.20),   # 12L-15L: 20%
            (float('inf'), 0.30)  # Above 15L: 30%
        ]
        
        # Maximum deduction limits
        self.deduction_limits = {
            '80C': 150000,  # PPF, ELSS, LIC, etc.
            '80D': 100000,  # Health Insurance (25K self + 50K parents above 60)
            '80G': float('inf'),  # Donations (various limits)
            '24B': 200000,  # Home Loan Interest
            '80E': float('inf'),  # Education Loan Interest
            '80TTA': 10000,  # Savings Account Interest
            '80TTB': 50000,  # Senior Citizens Savings Interest
        }
    
    def calculate_tax(self, slabs: List[Tuple[float, float]], taxable_income: float) -> float:
        """Calculate tax based on slabs"""
        if taxable_income <= 0:
            return 0
            
        tax = 0
        prev_limit = 0
        
        for limit, rate in slabs:
            if taxable_income <= prev_limit:
                break
            
            taxable_in_slab = min(taxable_income - prev_limit, limit - prev_limit)
            tax += taxable_in_slab * rate
            prev_limit = limit
            
        return tax
    
    def calculate_old_regime_tax(self, tax_data: TaxData) -> Tuple[float, float]:
        """Calculate tax under old regime with all deductions"""
        # Apply all deductions
        total_deductions = (
            min(tax_data.deduction_80c, self.deduction_limits['80C']) +
            min(tax_data.deduction_80d, self.deduction_limits['80D']) +
            tax_data.deduction_80g +  # Various limits apply
            min(tax_data.deduction_24b, self.deduction_limits['24B']) +
            tax_data.deduction_80e +  # No limit
            min(tax_data.deduction_80tta, self.deduction_limits['80TTA']) +
            tax_data.hra_exemption +
            tax_data.lta_exemption +
            tax_data.standard_deduction
        )
        
        taxable_income = max(0, tax_data.gross_income - total_deductions)
        tax = self.calculate_tax(self.old_regime_slabs, taxable_income)
        
        # Add cess (4% on tax)
        if tax > 0:
            tax = tax * 1.04
            
        # Rebate under section 87A
        if taxable_income <= 500000:
            tax = max(0, tax - 12500)
            
        return taxable_income, tax
    
    def calculate_new_regime_tax(self, tax_data: TaxData) -> Tuple[float, float]:
        """Calculate tax under new regime (limited deductions)"""
        # Only standard deduction is allowed in new regime
        total_deductions = tax_data.standard_deduction
        
        taxable_income = max(0, tax_data.gross_income - total_deductions)
        tax = self.calculate_tax(self.new_regime_slabs, taxable_income)
        
        # Add cess (4% on tax)
        if tax > 0:
            tax = tax * 1.04
            
        # Rebate under section 87A
        if taxable_income <= 700000:
            tax = max(0, tax - 25000)
            
        return taxable_income, tax
    
    def recommend_regime(self, tax_data: TaxData) -> TaxRegime:
        """Recommend best tax regime"""
        _, old_tax = self.calculate_old_regime_tax(tax_data)
        _, new_tax = self.calculate_new_regime_tax(tax_data)
        
        return TaxRegime.OLD if old_tax <= new_tax else TaxRegime.NEW
    
    def get_tax_saving_recommendations(self, tax_data: TaxData) -> List[TaxRecommendation]:
        """Generate personalized tax saving recommendations"""
        recommendations = []
        
        # Check 80C utilization
        if tax_data.deduction_80c < self.deduction_limits['80C']:
            remaining = self.deduction_limits['80C'] - tax_data.deduction_80c
            recommendations.append(TaxRecommendation(
                category="Section 80C",
                title="Maximize 80C Deductions",
                description=f"You can save up to ₹{remaining:,.0f} more under Section 80C",
                potential_savings=remaining * 0.3,  # Assuming 30% tax bracket
                priority="high",
                action_required="Invest in PPF, ELSS, or pay LIC premiums"
            ))
        
        # Check 80D utilization
        if tax_data.deduction_80d < 25000:  # Basic health insurance limit
            recommendations.append(TaxRecommendation(
                category="Section 80D",
                title="Health Insurance Premium",
                description="Get health insurance to save taxes and secure your health",
                potential_savings=(25000 - tax_data.deduction_80d) * 0.3,
                priority="high",
                action_required="Purchase health insurance for self and family"
            ))
        
        # Home Loan benefits
        if tax_data.deduction_24b == 0:
            recommendations.append(TaxRecommendation(
                category="Section 24B",
                title="Home Loan Interest Deduction",
                description="Home loan interest up to ₹2L can be claimed",
                potential_savings=200000 * 0.3,
                priority="medium",
                action_required="Consider home loan for tax benefits if planning to buy property"
            ))
        
        # NPS additional deduction
        recommendations.append(TaxRecommendation(
            category="Section 80CCD(1B)",
            title="Additional NPS Deduction",
            description="Invest in NPS for additional ₹50,000 deduction",
            potential_savings=50000 * 0.3,
            priority="medium",
            action_required="Open NPS account and contribute"
        ))
        
        # HRA optimization
        if tax_data.hra_exemption == 0 and tax_data.gross_income > 500000:
            recommendations.append(TaxRecommendation(
                category="HRA",
                title="House Rent Allowance",
                description="Claim HRA exemption if paying rent",
                potential_savings=100000 * 0.3,  # Approximate
                priority="high",
                action_required="Submit rent receipts and landlord PAN if rent > ₹1L/year"
            ))
        
        return sorted(recommendations, key=lambda x: x.potential_savings, reverse=True)
    
    def calculate_advance_tax(self, tax_amount: float) -> Dict[str, float]:
        """Calculate advance tax installments"""
        return {
            "Q1 (15 June)": tax_amount * 0.15,
            "Q2 (15 Sept)": tax_amount * 0.45,
            "Q3 (15 Dec)": tax_amount * 0.75,
            "Q4 (15 March)": tax_amount * 1.00
        }
    
    def estimate_tds(self, gross_income: float, tax_regime: TaxRegime) -> float:
        """Estimate TDS based on income and regime"""
        # Simplified TDS calculation
        if gross_income <= 250000:
            return 0
        elif gross_income <= 500000:
            return gross_income * 0.05 * 0.9  # 90% of 5%
        elif gross_income <= 1000000:
            return gross_income * 0.20 * 0.9  # 90% of 20%
        else:
            return gross_income * 0.30 * 0.9  # 90% of 30%


# ---------------------------------------------------------------------------
# Helper function for reports endpoint (simple capital gains tax impact)
# ---------------------------------------------------------------------------
def calculate_tax_impact(total_capital_gains: float) -> dict:
    """Rudimentary tax impact estimation for capital gains summary.
    Assumptions:
      - Short-term taxed at 15%
      - Long-term taxed at 10% after 1L exemption (simplified) applied to total.
    Since we don't have ST/LT split here, we approximate 40% ST, 60% LT.
    """
    if total_capital_gains <= 0:
        return {"estimated_tax": 0.0, "effective_rate": 0.0}
    st_component = total_capital_gains * 0.4
    lt_component = total_capital_gains * 0.6
    lt_taxable = max(0, lt_component - 100000)  # 1L exemption
    tax = st_component * 0.15 + lt_taxable * 0.10
    effective_rate = tax / total_capital_gains * 100
    return {"estimated_tax": round(tax,2), "effective_rate": round(effective_rate,2)}