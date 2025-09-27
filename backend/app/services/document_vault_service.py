import os
import uuid
import hashlib
import mimetypes
from typing import List, Optional, Dict, Any, BinaryIO
from datetime import datetime, timedelta
from pathlib import Path

import aiofiles
from fastapi import UploadFile, HTTPException
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import base64

from app.models.database import (
    Document, DocumentType, DocumentStatus, DocumentReminder, 
    DocumentExtraction, DocumentAuditLog, ReminderType
)
from app.services.ai_document_processor import AIDocumentProcessor


class DocumentVaultService:
    """
    Secure document storage service with encryption, AI processing, and reminder management.
    """
    
    def __init__(self, storage_path: str = "storage/documents", encryption_key: Optional[str] = None):
        self.storage_path = Path(storage_path)
        self.storage_path.mkdir(parents=True, exist_ok=True)
        
        # Initialize encryption
        if encryption_key:
            self.master_key = encryption_key.encode()
        else:
            self.master_key = os.getenv("DOCUMENT_ENCRYPTION_KEY", "default-key-change-in-production").encode()
        
        self.ai_processor = AIDocumentProcessor()
        
        # Document type configurations
        self.document_configs = {
            DocumentType.PAN_CARD: {
                "max_size": 5 * 1024 * 1024,  # 5MB
                "allowed_types": ["image/jpeg", "image/png", "application/pdf"],
                "expiry_reminder_days": [90, 30, 15]  # Days before expiry
            },
            DocumentType.AADHAAR: {
                "max_size": 5 * 1024 * 1024,
                "allowed_types": ["image/jpeg", "image/png", "application/pdf"],
                "expiry_reminder_days": [365, 180, 90]
            },
            DocumentType.PASSPORT: {
                "max_size": 10 * 1024 * 1024,
                "allowed_types": ["image/jpeg", "image/png", "application/pdf"],
                "expiry_reminder_days": [365, 180, 90, 30]
            },
            DocumentType.INSURANCE_POLICY: {
                "max_size": 10 * 1024 * 1024,
                "allowed_types": ["application/pdf", "image/jpeg", "image/png"],
                "expiry_reminder_days": [90, 60, 30, 15, 7]
            },
            DocumentType.LOAN_AGREEMENT: {
                "max_size": 20 * 1024 * 1024,
                "allowed_types": ["application/pdf"],
                "emi_reminder_days": [7, 3, 1]  # Days before EMI due
            }
        }

    def _generate_encryption_key(self, user_id: str, document_id: str) -> bytes:
        """Generate a unique encryption key for each document."""
        salt = f"{user_id}:{document_id}".encode()
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        return base64.urlsafe_b64encode(kdf.derive(self.master_key))

    def _encrypt_content(self, content: bytes, encryption_key: bytes) -> bytes:
        """Encrypt document content."""
        fernet = Fernet(encryption_key)
        return fernet.encrypt(content)

    def _decrypt_content(self, encrypted_content: bytes, encryption_key: bytes) -> bytes:
        """Decrypt document content."""
        fernet = Fernet(encryption_key)
        return fernet.decrypt(encrypted_content)

    def _calculate_file_hash(self, content: bytes) -> str:
        """Calculate SHA-256 hash of file content."""
        return hashlib.sha256(content).hexdigest()

    def _get_storage_path(self, user_id: str, document_id: str) -> Path:
        """Get the storage path for a document."""
        user_path = self.storage_path / user_id
        user_path.mkdir(exist_ok=True)
        return user_path / f"{document_id}.enc"

    def _validate_document_upload(self, file: UploadFile, document_type: DocumentType) -> None:
        """Validate document upload against type-specific rules."""
        config = self.document_configs.get(document_type, {})
        
        # Check file size
        max_size = config.get("max_size", 50 * 1024 * 1024)  # Default 50MB
        if file.size and file.size > max_size:
            raise HTTPException(
                status_code=413,
                detail=f"File size exceeds maximum allowed size of {max_size / (1024*1024):.1f}MB"
            )
        
        # Check MIME type
        allowed_types = config.get("allowed_types", [])
        if allowed_types and file.content_type not in allowed_types:
            raise HTTPException(
                status_code=415,
                detail=f"File type {file.content_type} not allowed for {document_type.value}"
            )

    async def upload_document(
        self, 
        user_id: str, 
        file: UploadFile, 
        document_type: DocumentType,
        title: Optional[str] = None,
        description: Optional[str] = None,
        tags: List[str] = None,
        issue_date: Optional[datetime] = None,
        expiry_date: Optional[datetime] = None,
        document_number: Optional[str] = None
    ) -> Document:
        """
        Upload and securely store a document with encryption and AI processing.
        """
        # Validate upload
        self._validate_document_upload(file, document_type)
        
        # Generate document ID and encryption key
        document_id = str(uuid.uuid4())
        encryption_key = self._generate_encryption_key(user_id, document_id)
        
        # Read file content
        content = await file.read()
        file_hash = self._calculate_file_hash(content)
        
        # Encrypt content
        encrypted_content = self._encrypt_content(content, encryption_key)
        
        # Store encrypted file
        storage_path = self._get_storage_path(user_id, document_id)
        async with aiofiles.open(storage_path, 'wb') as f:
            await f.write(encrypted_content)
        
        # Determine MIME type
        file_type = file.content_type or mimetypes.guess_type(file.filename)[0] or "application/octet-stream"
        
        # Create document record
        document = Document(
            id=document_id,
            user_id=user_id,
            title=title or file.filename,
            document_type=document_type,
            file_name=file.filename,
            file_size=len(content),
            file_type=file_type,
            document_number=document_number,
            issue_date=issue_date,
            expiry_date=expiry_date,
            status=DocumentStatus.ACTIVE,
            tags=tags or [],
            description=description,
            is_encrypted=True,
            encryption_key_id=document_id,  # Use document_id as key identifier
            file_hash=file_hash,
            storage_path=str(storage_path),
            created_at=datetime.now(),
            updated_at=datetime.now(),
            access_count=0
        )
        
        # Process document with AI (asynchronous)
        try:
            extraction = await self.ai_processor.extract_document_data(
                content, file_type, document_type
            )
            
            # Update document with extracted data
            if extraction:
                document.extracted_text = extraction.get("raw_text")
                document.extracted_data = extraction.get("structured_data", {})
                
                # Auto-populate fields if AI extracted them
                if not document.expiry_date and "expiry_date" in extraction.get("structured_data", {}):
                    document.expiry_date = extraction["structured_data"]["expiry_date"]
                
                if not document.document_number and "document_number" in extraction.get("structured_data", {}):
                    document.document_number = extraction["structured_data"]["document_number"]
                    
                if not document.issue_date and "issue_date" in extraction.get("structured_data", {}):
                    document.issue_date = extraction["structured_data"]["issue_date"]
        except Exception as e:
            print(f"AI processing failed for document {document_id}: {str(e)}")
            # Continue without AI processing
        
        # Create automatic reminders based on document type and expiry
        if document.expiry_date:
            await self._create_expiry_reminders(document)
        
        # Log the upload action
        await self._log_document_action(
            document_id, user_id, "upload", 
            {"file_name": file.filename, "file_size": len(content)}
        )
        
        return document

    async def get_document_content(self, user_id: str, document_id: str) -> bytes:
        """Retrieve and decrypt document content."""
        # Get storage path
        storage_path = self._get_storage_path(user_id, document_id)
        
        if not storage_path.exists():
            raise HTTPException(status_code=404, detail="Document not found")
        
        # Generate decryption key
        encryption_key = self._generate_encryption_key(user_id, document_id)
        
        # Read and decrypt content
        async with aiofiles.open(storage_path, 'rb') as f:
            encrypted_content = await f.read()
        
        decrypted_content = self._decrypt_content(encrypted_content, encryption_key)
        
        # Log access
        await self._log_document_action(document_id, user_id, "view")
        
        return decrypted_content

    async def delete_document(self, user_id: str, document_id: str) -> bool:
        """Securely delete a document and its metadata."""
        storage_path = self._get_storage_path(user_id, document_id)
        
        if storage_path.exists():
            # Securely overwrite file before deletion
            async with aiofiles.open(storage_path, 'wb') as f:
                await f.write(b'\x00' * storage_path.stat().st_size)
            
            storage_path.unlink()
            
            # Log deletion
            await self._log_document_action(document_id, user_id, "delete")
            return True
        
        return False

    async def search_documents(
        self, 
        user_id: str, 
        query: Optional[str] = None,
        document_type: Optional[DocumentType] = None,
        status: Optional[DocumentStatus] = None,
        tags: Optional[List[str]] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None
    ) -> List[Document]:
        """
        Search documents with various filters.
        This is a placeholder - in production, you'd query from database.
        """
        # This would typically query from your database
        # For now, returning empty list as placeholder
        return []

    async def get_document_insights(self, user_id: str, document_id: str) -> Dict[str, Any]:
        """Get AI-powered insights about a document."""
        # This would fetch from DocumentExtraction table
        return {
            "expiry_alerts": [],
            "renewal_suggestions": [],
            "related_documents": [],
            "compliance_status": "compliant"
        }

    async def _create_expiry_reminders(self, document: Document) -> List[DocumentReminder]:
        """Create automatic expiry reminders for a document."""
        if not document.expiry_date:
            return []
        
        config = self.document_configs.get(document.document_type, {})
        reminder_days = config.get("expiry_reminder_days", [30, 15, 7])
        
        reminders = []
        for days_before in reminder_days:
            reminder_date = document.expiry_date - timedelta(days=days_before)
            
            # Only create reminders for future dates
            if reminder_date > datetime.now():
                reminder = DocumentReminder(
                    id=str(uuid.uuid4()),
                    user_id=document.user_id,
                    document_id=document.id,
                    title=f"{document.title} expires in {days_before} days",
                    description=f"Your {document.document_type.value} will expire on {document.expiry_date.strftime('%Y-%m-%d')}",
                    reminder_type=ReminderType.DOCUMENT_EXPIRY,
                    reminder_date=reminder_date,
                    is_active=True,
                    created_at=datetime.now()
                )
                reminders.append(reminder)
        
        return reminders

    async def _log_document_action(
        self, 
        document_id: str, 
        user_id: str, 
        action: str, 
        details: Optional[Dict[str, Any]] = None
    ) -> None:
        """Log document actions for audit trail."""
        log_entry = DocumentAuditLog(
            id=str(uuid.uuid4()),
            document_id=document_id,
            user_id=user_id,
            action=action,
            details=details or {},
            timestamp=datetime.now()
        )
        # In production, save to database
        print(f"Audit log: {action} on document {document_id} by user {user_id}")

    async def get_storage_stats(self, user_id: str) -> Dict[str, Any]:
        """Get storage statistics for a user."""
        user_path = self.storage_path / user_id
        
        if not user_path.exists():
            return {
                "total_documents": 0,
                "total_size_bytes": 0,
                "total_size_mb": 0,
                "by_type": {}
            }
        
        total_size = sum(f.stat().st_size for f in user_path.glob("*.enc"))
        file_count = len(list(user_path.glob("*.enc")))
        
        return {
            "total_documents": file_count,
            "total_size_bytes": total_size,
            "total_size_mb": round(total_size / (1024 * 1024), 2),
            "storage_path": str(user_path),
            "by_type": {}  # Would be populated from database in production
        }

    async def create_document_backup(self, user_id: str, document_id: str) -> str:
        """Create a backup of a document."""
        source_path = self._get_storage_path(user_id, document_id)
        backup_path = self.storage_path / "backups" / user_id / f"{document_id}_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.enc"
        
        backup_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Copy encrypted file
        async with aiofiles.open(source_path, 'rb') as source:
            content = await source.read()
            async with aiofiles.open(backup_path, 'wb') as backup:
                await backup.write(content)
        
        return str(backup_path)

    async def verify_document_integrity(self, user_id: str, document_id: str, expected_hash: str) -> bool:
        """Verify document integrity using hash comparison."""
        try:
            content = await self.get_document_content(user_id, document_id)
            actual_hash = self._calculate_file_hash(content)
            return actual_hash == expected_hash
        except Exception:
            return False