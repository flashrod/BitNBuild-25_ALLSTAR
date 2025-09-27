import os
import uuid
import asyncio
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from dataclasses import dataclass

try:
    import openai
    HAS_OPENAI = True
except ImportError:
    HAS_OPENAI = False

from app.models.database import (
    Document, DocumentReminder, DocumentType, ReminderType, 
    ReminderFrequency, DocumentStatus
)


@dataclass
class ReminderInsight:
    """AI-generated insight about a reminder"""
    priority_score: int  # 1-10
    urgency_level: str  # low, medium, high, critical
    suggested_actions: List[str]
    estimated_cost: Optional[float]
    related_reminders: List[str]
    ai_reasoning: str


class AIReminderService:
    """
    AI-powered reminder system that intelligently manages document-related reminders,
    predicts renewal needs, and provides smart notifications.
    """
    
    def __init__(self):
        self.openai_api_key = os.getenv("OPENAI_API_KEY")
        if self.openai_api_key and HAS_OPENAI:
            openai.api_key = self.openai_api_key
        
        # Reminder priority weights for different document types
        self.priority_weights = {
            DocumentType.PAN_CARD: {
                "base_priority": 9,  # Critical for tax filing
                "expiry_multiplier": 1.2,
                "renewal_complexity": "high"
            },
            DocumentType.PASSPORT: {
                "base_priority": 8,
                "expiry_multiplier": 1.5,  # International travel impact
                "renewal_complexity": "high"
            },
            DocumentType.DRIVING_LICENSE: {
                "base_priority": 7,
                "expiry_multiplier": 1.1,
                "renewal_complexity": "medium"
            },
            DocumentType.INSURANCE_POLICY: {
                "base_priority": 8,
                "expiry_multiplier": 1.3,  # Financial protection
                "renewal_complexity": "medium"
            },
            DocumentType.LOAN_AGREEMENT: {
                "base_priority": 9,  # EMI payments are critical
                "expiry_multiplier": 1.4,
                "renewal_complexity": "low"
            }
        }
        
        # Seasonal and contextual factors
        self.seasonal_factors = {
            "tax_season": {"months": [1, 2, 3], "multiplier": 1.3},
            "festival_season": {"months": [10, 11, 12], "multiplier": 1.1},
            "travel_season": {"months": [4, 5, 6, 10, 11, 12], "multiplier": 1.2}
        }

    async def create_intelligent_reminders(
        self, 
        document: Document, 
        user_context: Optional[Dict[str, Any]] = None
    ) -> List[DocumentReminder]:
        """
        Create AI-powered reminders for a document based on type, expiry, and user context.
        """
        reminders = []
        
        if not document.expiry_date:
            return reminders
        
        # Get base reminder schedule
        base_schedule = self._get_base_reminder_schedule(document.document_type)
        
        # Apply AI insights to customize schedule
        ai_insights = await self._analyze_document_context(document, user_context)
        
        # Create reminders with AI-enhanced scheduling
        for days_before, reminder_config in base_schedule.items():
            reminder_date = document.expiry_date - timedelta(days=days_before)
            
            # Only create future reminders
            if reminder_date <= datetime.now():
                continue
            
            # Calculate AI priority score
            priority_score = self._calculate_ai_priority(
                document, days_before, ai_insights, user_context
            )
            
            # Generate AI-powered title and description
            title, description = await self._generate_ai_content(
                document, days_before, ai_insights
            )
            
            # Create reminder
            reminder = DocumentReminder(
                id=str(uuid.uuid4()),
                user_id=document.user_id,
                document_id=document.id,
                title=title,
                description=description,
                reminder_type=ReminderType.DOCUMENT_EXPIRY,
                reminder_date=reminder_date,
                frequency=ReminderFrequency.ONCE,
                advance_days=[days_before],
                is_active=True,
                ai_priority_score=priority_score,
                ai_suggested_actions=ai_insights.suggested_actions,
                created_at=datetime.now()
            )
            
            reminders.append(reminder)
        
        # Add special reminders (EMI, premium due, etc.)
        special_reminders = await self._create_special_reminders(document, ai_insights)
        reminders.extend(special_reminders)
        
        return reminders

    def _get_base_reminder_schedule(self, document_type: DocumentType) -> Dict[int, Dict]:
        """Get base reminder schedule for document type."""
        schedules = {
            DocumentType.PAN_CARD: {
                365: {"importance": "high", "type": "annual_check"},
                180: {"importance": "medium", "type": "preparation"},
                90: {"importance": "high", "type": "urgent"},
                30: {"importance": "critical", "type": "immediate"},
                7: {"importance": "critical", "type": "last_chance"}
            },
            DocumentType.PASSPORT: {
                365: {"importance": "high", "type": "early_renewal"},
                180: {"importance": "high", "type": "process_start"},
                90: {"importance": "high", "type": "urgent"},
                30: {"importance": "critical", "type": "emergency"},
                15: {"importance": "critical", "type": "expedite"}
            },
            DocumentType.INSURANCE_POLICY: {
                60: {"importance": "medium", "type": "review"},
                30: {"importance": "high", "type": "renewal"},
                15: {"importance": "high", "type": "payment_due"},
                7: {"importance": "critical", "type": "urgent"},
                3: {"importance": "critical", "type": "last_chance"}
            },
            DocumentType.DRIVING_LICENSE: {
                90: {"importance": "medium", "type": "preparation"},
                30: {"importance": "high", "type": "renewal"},
                15: {"importance": "high", "type": "urgent"},
                7: {"importance": "critical", "type": "immediate"}
            }
        }
        
        return schedules.get(document_type, {
            30: {"importance": "medium", "type": "renewal"},
            7: {"importance": "high", "type": "urgent"}
        })

    async def _analyze_document_context(
        self, 
        document: Document, 
        user_context: Optional[Dict[str, Any]] = None
    ) -> ReminderInsight:
        """Analyze document and user context to generate AI insights."""
        
        # Base analysis without AI
        base_insight = ReminderInsight(
            priority_score=self._calculate_base_priority(document),
            urgency_level=self._determine_urgency_level(document),
            suggested_actions=self._get_default_actions(document.document_type),
            estimated_cost=self._estimate_renewal_cost(document.document_type),
            related_reminders=[],
            ai_reasoning="Base analysis without AI enhancement"
        )
        
        if not self.openai_api_key or not HAS_OPENAI:
            return base_insight
        
        try:
            # Use AI for enhanced analysis
            ai_analysis = await self._get_ai_analysis(document, user_context)
            
            if ai_analysis:
                base_insight.priority_score = min(10, base_insight.priority_score + ai_analysis.get("priority_boost", 0))
                base_insight.suggested_actions.extend(ai_analysis.get("additional_actions", []))
                base_insight.ai_reasoning = ai_analysis.get("reasoning", base_insight.ai_reasoning)
            
        except Exception as e:
            print(f"AI analysis failed: {str(e)}")
        
        return base_insight

    async def _get_ai_analysis(
        self, 
        document: Document, 
        user_context: Optional[Dict[str, Any]] = None
    ) -> Optional[Dict[str, Any]]:
        """Get AI-powered analysis of document renewal needs."""
        
        prompt = f"""
        Analyze the following document renewal scenario and provide intelligent insights:
        
        Document Details:
        - Type: {document.document_type.value}
        - Expiry Date: {document.expiry_date.strftime('%Y-%m-%d') if document.expiry_date else 'Not set'}
        - Current Status: {document.status.value}
        - Document Number: {document.document_number or 'Not available'}
        
        User Context: {user_context or 'No additional context'}
        
        Please provide:
        1. Priority boost (0-3): How much to increase the base priority
        2. Additional suggested actions (beyond standard renewal)
        3. Reasoning for your recommendations
        4. Any seasonal or timing considerations
        
        Respond in a structured format.
        """
        
        try:
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert document management advisor. Provide practical, actionable insights for document renewals considering Indian regulatory requirements and user convenience."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.3,
                max_tokens=300
            )
            
            # Parse AI response (simplified parsing for demo)
            content = response.choices[0].message.content
            
            return {
                "priority_boost": 1,  # Simplified for demo
                "additional_actions": [
                    "Check for required documents before starting process",
                    "Consider online renewal options to save time"
                ],
                "reasoning": content[:200] + "..." if len(content) > 200 else content
            }
            
        except Exception as e:
            print(f"OpenAI API error: {str(e)}")
            return None

    def _calculate_base_priority(self, document: Document) -> int:
        """Calculate base priority score for a document."""
        config = self.priority_weights.get(document.document_type, {"base_priority": 5})
        base_priority = config["base_priority"]
        
        # Adjust based on expiry proximity
        if document.expiry_date:
            days_to_expiry = (document.expiry_date - datetime.now()).days
            
            if days_to_expiry < 0:
                return 10  # Expired - maximum priority
            elif days_to_expiry <= 7:
                return min(10, base_priority + 2)
            elif days_to_expiry <= 30:
                return min(10, base_priority + 1)
        
        # Apply seasonal factors
        current_month = datetime.now().month
        for season, config in self.seasonal_factors.items():
            if current_month in config["months"]:
                if document.document_type in [DocumentType.PAN_CARD, DocumentType.ITR] and season == "tax_season":
                    base_priority = min(10, int(base_priority * config["multiplier"]))
                elif document.document_type == DocumentType.PASSPORT and season == "travel_season":
                    base_priority = min(10, int(base_priority * config["multiplier"]))
        
        return base_priority

    def _determine_urgency_level(self, document: Document) -> str:
        """Determine urgency level based on document and expiry."""
        if not document.expiry_date:
            return "low"
        
        days_to_expiry = (document.expiry_date - datetime.now()).days
        
        if days_to_expiry < 0:
            return "critical"
        elif days_to_expiry <= 7:
            return "critical"
        elif days_to_expiry <= 30:
            return "high"
        elif days_to_expiry <= 90:
            return "medium"
        else:
            return "low"

    def _get_default_actions(self, document_type: DocumentType) -> List[str]:
        """Get default actions for document type."""
        action_map = {
            DocumentType.PAN_CARD: [
                "Visit NSDL or UTIITSL website",
                "Keep Aadhaar card ready",
                "Prepare passport size photo"
            ],
            DocumentType.PASSPORT: [
                "Book appointment on Passport Seva website",
                "Gather required documents",
                "Pay applicable fees online"
            ],
            DocumentType.DRIVING_LICENSE: [
                "Visit RTO website for online renewal",
                "Prepare medical certificate if required",
                "Keep existing license ready"
            ],
            DocumentType.INSURANCE_POLICY: [
                "Review current coverage",
                "Compare renewal with other providers",
                "Set up automatic payment if needed"
            ]
        }
        
        return action_map.get(document_type, ["Start renewal process"])

    def _estimate_renewal_cost(self, document_type: DocumentType) -> Optional[float]:
        """Estimate renewal cost for document type (in INR)."""
        cost_estimates = {
            DocumentType.PAN_CARD: 110.0,  # Re-issue fee
            DocumentType.PASSPORT: 1500.0,  # Normal processing
            DocumentType.DRIVING_LICENSE: 200.0,  # Renewal fee
            DocumentType.INSURANCE_POLICY: None,  # Varies too much
            DocumentType.LOAN_AGREEMENT: None  # Not applicable
        }
        
        return cost_estimates.get(document_type)

    async def _create_special_reminders(
        self, 
        document: Document, 
        insights: ReminderInsight
    ) -> List[DocumentReminder]:
        """Create special reminders like EMI due, premium payments, etc."""
        special_reminders = []
        
        if document.document_type == DocumentType.LOAN_AGREEMENT:
            # Create EMI reminders (assuming monthly)
            emi_reminders = await self._create_emi_reminders(document, insights)
            special_reminders.extend(emi_reminders)
        
        elif document.document_type in [
            DocumentType.INSURANCE_POLICY, 
            DocumentType.HEALTH_INSURANCE,
            DocumentType.LIFE_INSURANCE,
            DocumentType.VEHICLE_INSURANCE
        ]:
            # Create premium payment reminders
            premium_reminders = await self._create_premium_reminders(document, insights)
            special_reminders.extend(premium_reminders)
        
        return special_reminders

    async def _create_emi_reminders(
        self, 
        document: Document, 
        insights: ReminderInsight
    ) -> List[DocumentReminder]:
        """Create EMI payment reminders."""
        reminders = []
        
        # Extract EMI date from document data (if available)
        emi_day = self._extract_emi_day(document)
        if not emi_day:
            emi_day = 5  # Default to 5th of each month
        
        # Create next 6 months of EMI reminders
        current_date = datetime.now().replace(day=1)  # Start from beginning of current month
        
        for month_offset in range(6):
            emi_date = current_date + timedelta(days=32 * month_offset)  # Approximate month
            emi_date = emi_date.replace(day=emi_day)
            
            # Skip if date is in the past
            if emi_date <= datetime.now():
                continue
            
            # Create reminders 3 days and 1 day before EMI
            for days_before in [3, 1]:
                reminder_date = emi_date - timedelta(days=days_before)
                
                if reminder_date > datetime.now():
                    reminder = DocumentReminder(
                        id=str(uuid.uuid4()),
                        user_id=document.user_id,
                        document_id=document.id,
                        title=f"EMI Payment Due in {days_before} day{'s' if days_before > 1 else ''}",
                        description=f"Your loan EMI payment is due on {emi_date.strftime('%B %d, %Y')}",
                        reminder_type=ReminderType.EMI_DUE,
                        reminder_date=reminder_date,
                        frequency=ReminderFrequency.MONTHLY,
                        is_active=True,
                        ai_priority_score=9,  # EMI is high priority
                        ai_suggested_actions=[
                            "Check account balance",
                            "Ensure sufficient funds",
                            "Set up auto-debit if not already done"
                        ],
                        created_at=datetime.now()
                    )
                    reminders.append(reminder)
        
        return reminders

    async def _create_premium_reminders(
        self, 
        document: Document, 
        insights: ReminderInsight
    ) -> List[DocumentReminder]:
        """Create insurance premium payment reminders."""
        reminders = []
        
        if not document.expiry_date:
            return reminders
        
        # Premium is typically due at renewal
        premium_due_date = document.expiry_date
        
        # Create reminders before premium due
        for days_before in [45, 30, 15, 7, 1]:
            reminder_date = premium_due_date - timedelta(days=days_before)
            
            if reminder_date > datetime.now():
                reminder = DocumentReminder(
                    id=str(uuid.uuid4()),
                    user_id=document.user_id,
                    document_id=document.id,
                    title=f"Insurance Premium Due in {days_before} days",
                    description=f"Your {document.document_type.value} premium payment is due on {premium_due_date.strftime('%B %d, %Y')}",
                    reminder_type=ReminderType.PREMIUM_DUE,
                    reminder_date=reminder_date,
                    frequency=ReminderFrequency.YEARLY,
                    is_active=True,
                    ai_priority_score=8,
                    ai_suggested_actions=insights.suggested_actions + [
                        "Review policy terms before renewal",
                        "Compare with other insurance providers",
                        "Update nominee information if needed"
                    ],
                    created_at=datetime.now()
                )
                reminders.append(reminder)
        
        return reminders

    def _extract_emi_day(self, document: Document) -> Optional[int]:
        """Extract EMI day from document data."""
        if document.extracted_data:
            # Look for EMI date in extracted data
            for key, value in document.extracted_data.items():
                if 'emi' in key.lower() or 'due' in key.lower():
                    if isinstance(value, str) and value.isdigit():
                        day = int(value)
                        if 1 <= day <= 31:
                            return day
        
        return None

    async def _generate_ai_content(
        self, 
        document: Document, 
        days_before: int, 
        insights: ReminderInsight
    ) -> tuple[str, str]:
        """Generate AI-powered title and description for reminders."""
        
        # Fallback content
        doc_type_name = document.document_type.value.replace('_', ' ').title()
        default_title = f"{doc_type_name} expires in {days_before} days"
        default_description = f"Your {doc_type_name} will expire on {document.expiry_date.strftime('%B %d, %Y') if document.expiry_date else 'unknown date'}. Please start the renewal process."
        
        if not self.openai_api_key or not HAS_OPENAI:
            return default_title, default_description
        
        try:
            prompt = f"""
            Create a concise, actionable reminder for:
            Document: {doc_type_name}
            Days until expiry: {days_before}
            Urgency: {insights.urgency_level}
            
            Generate:
            1. A brief, clear title (max 60 characters)
            2. A helpful description with next steps (max 150 characters)
            
            Make it user-friendly and action-oriented.
            """
            
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[
                    {
                        "role": "system", 
                        "content": "Generate clear, concise reminder messages that motivate users to take action."
                    },
                    {
                        "role": "user", 
                        "content": prompt
                    }
                ],
                temperature=0.2,
                max_tokens=100
            )
            
            content = response.choices[0].message.content.strip()
            lines = content.split('\n')
            
            if len(lines) >= 2:
                title = lines[0].replace('1.', '').strip()[:60]
                description = lines[1].replace('2.', '').strip()[:150]
                return title, description
            
        except Exception as e:
            print(f"AI content generation failed: {str(e)}")
        
        return default_title, default_description

    def _calculate_ai_priority(
        self, 
        document: Document, 
        days_before: int, 
        insights: ReminderInsight, 
        user_context: Optional[Dict[str, Any]] = None
    ) -> int:
        """Calculate AI-enhanced priority score."""
        base_priority = insights.priority_score
        
        # Adjust based on days before expiry
        if days_before <= 7:
            priority_boost = 2
        elif days_before <= 30:
            priority_boost = 1
        else:
            priority_boost = 0
        
        # Apply user context adjustments
        if user_context:
            if user_context.get('travel_planned', False) and document.document_type == DocumentType.PASSPORT:
                priority_boost += 2
            
            if user_context.get('tax_filing_season', False) and document.document_type == DocumentType.PAN_CARD:
                priority_boost += 1
        
        return min(10, base_priority + priority_boost)

    async def get_smart_reminder_dashboard(
        self, 
        user_id: str, 
        user_documents: List[Document],
        user_reminders: List[DocumentReminder]
    ) -> Dict[str, Any]:
        """Generate intelligent reminder dashboard with AI insights."""
        
        now = datetime.now()
        
        # Categorize reminders
        urgent_reminders = [
            r for r in user_reminders 
            if r.is_active and not r.is_completed and r.reminder_date <= now + timedelta(days=7)
        ]
        
        upcoming_reminders = [
            r for r in user_reminders 
            if r.is_active and not r.is_completed and now + timedelta(days=7) < r.reminder_date <= now + timedelta(days=30)
        ]
        
        # Identify documents needing attention
        expired_docs = [
            doc for doc in user_documents 
            if doc.expiry_date and doc.expiry_date < now
        ]
        
        expiring_soon = [
            doc for doc in user_documents 
            if doc.expiry_date and now < doc.expiry_date <= now + timedelta(days=30)
        ]
        
        # Generate AI insights
        ai_insights = await self._generate_dashboard_insights(
            urgent_reminders, upcoming_reminders, expired_docs, expiring_soon
        )
        
        return {
            "summary": {
                "urgent_reminders": len(urgent_reminders),
                "upcoming_reminders": len(upcoming_reminders),
                "expired_documents": len(expired_docs),
                "expiring_soon": len(expiring_soon)
            },
            "urgent_reminders": [self._format_reminder(r) for r in urgent_reminders[:5]],
            "upcoming_reminders": [self._format_reminder(r) for r in upcoming_reminders[:10]],
            "expired_documents": [self._format_document_alert(doc, "expired") for doc in expired_docs],
            "expiring_soon": [self._format_document_alert(doc, "expiring") for doc in expiring_soon],
            "ai_insights": ai_insights,
            "recommended_actions": self._get_recommended_actions(urgent_reminders, expired_docs)
        }

    async def _generate_dashboard_insights(
        self,
        urgent_reminders: List[DocumentReminder],
        upcoming_reminders: List[DocumentReminder],
        expired_docs: List[Document],
        expiring_soon: List[Document]
    ) -> Dict[str, Any]:
        """Generate AI insights for the reminder dashboard."""
        
        total_issues = len(urgent_reminders) + len(expired_docs)
        
        if total_issues == 0:
            return {
                "overall_health": "excellent",
                "message": "All your documents are up to date! Great job managing your financial documents.",
                "priority_focus": None
            }
        elif total_issues <= 2:
            return {
                "overall_health": "good",
                "message": "You have a few items that need attention soon. Stay proactive!",
                "priority_focus": "upcoming_renewals"
            }
        elif total_issues <= 5:
            return {
                "overall_health": "needs_attention",
                "message": "Several documents need your immediate attention. Let's prioritize the most critical ones.",
                "priority_focus": "urgent_renewals"
            }
        else:
            return {
                "overall_health": "critical",
                "message": "Multiple documents require urgent action. Consider setting aside time this week to handle renewals.",
                "priority_focus": "immediate_action"
            }

    def _format_reminder(self, reminder: DocumentReminder) -> Dict[str, Any]:
        """Format reminder for display."""
        return {
            "id": reminder.id,
            "title": reminder.title,
            "description": reminder.description,
            "reminder_date": reminder.reminder_date.isoformat(),
            "type": reminder.reminder_type.value,
            "priority": reminder.ai_priority_score,
            "suggested_actions": reminder.ai_suggested_actions[:3]  # Top 3 actions
        }

    def _format_document_alert(self, document: Document, alert_type: str) -> Dict[str, Any]:
        """Format document alert for display."""
        return {
            "document_id": document.id,
            "title": document.title,
            "document_type": document.document_type.value,
            "alert_type": alert_type,
            "expiry_date": document.expiry_date.isoformat() if document.expiry_date else None,
            "days_until_expiry": (document.expiry_date - datetime.now()).days if document.expiry_date else None
        }

    def _get_recommended_actions(
        self, 
        urgent_reminders: List[DocumentReminder],
        expired_docs: List[Document]
    ) -> List[str]:
        """Get recommended actions based on current situation."""
        actions = []
        
        if expired_docs:
            actions.append(f"Immediately start renewal process for {len(expired_docs)} expired document(s)")
        
        if urgent_reminders:
            actions.append(f"Address {len(urgent_reminders)} urgent reminder(s) this week")
        
        if len(expired_docs) + len(urgent_reminders) > 3:
            actions.append("Consider setting up automatic renewals where possible")
            actions.append("Block calendar time this week for document management")
        
        if not actions:
            actions.append("Keep up the great work maintaining your documents!")
        
        return actions