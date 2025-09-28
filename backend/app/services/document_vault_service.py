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
    DocumentAuditLog, ReminderType, DocumentExtraction
)
from app.services.ai_document_processor import AIDocumentProcessor

import firebase_admin
from firebase_admin import credentials, storage
from beanie import Document as BeanieDocument


class DocumentVaultService:
    """
    Secure document storage service with encryption, AI processing, and reminder management.
    """
    
    def __init__(self, storage_path: str = "storage/documents", encryption_key: Optional[str] = None):
        # Firebase Initialization is now handled globally
        if not firebase_admin._apps:
            print("[DocumentVaultService] Warning: Firebase should be initialized globally.")
        
        self.bucket = storage.bucket()
        
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
        
        # Store encrypted file in Firebase Storage
        blob = self.bucket.blob(f"{user_id}/{document_id}.enc")
        blob.upload_from_string(encrypted_content, content_type="application/octet-stream")
        storage_path = blob.public_url

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
            storage_path=storage_path,
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
        
        # Save document to MongoDB using Beanie
        await document.insert()

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
        document = await Document.get(document_id)
        if not document or document.user_id != user_id:
            raise HTTPException(status_code=404, detail="Document not found")

        # Generate decryption key
        encryption_key = self._generate_encryption_key(user_id, document_id)
        
        # Download from Firebase Storage
        blob = self.bucket.blob(f"{user_id}/{document_id}.enc")
        encrypted_content = blob.download_as_bytes()

        decrypted_content = self._decrypt_content(encrypted_content, encryption_key)
        
        # Log access
        await document.update({"$inc": {"access_count": 1}})
        await self._log_document_action(document_id, user_id, "view")
        
        return decrypted_content

    async def delete_document(self, user_id: str, document_id: str) -> bool:
        """Securely delete a document and its metadata."""
        document = await Document.get(document_id)
        if not document or document.user_id != user_id:
            return False

        # Delete from Firebase Storage
        blob = self.bucket.blob(f"{user_id}/{document_id}.enc")
        if blob.exists():
            blob.delete()

        # Delete from MongoDB
        await document.delete()
            
        # Log deletion
        await self._log_document_action(document_id, user_id, "delete")
        return True

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
        """
        search_criteria = {"user_id": user_id}
        if query:
            search_criteria["$text"] = {"$search": query}
        if document_type:
            search_criteria["document_type"] = document_type
        if status:
            search_criteria["status"] = status
        if tags:
            search_criteria["tags"] = {"$in": tags}
        if date_from:
            search_criteria["created_at"] = {"$gte": date_from}
        if date_to:
            search_criteria.setdefault("created_at", {})["$lte"] = date_to
            
        return await Document.find(search_criteria).to_list()

    async def get_reminders(self, user_id: str) -> List[DocumentReminder]:
        """Get all active reminders for a user."""
        return await DocumentReminder.find(
            {"user_id": user_id, "is_active": True, "reminder_date": {"$gte": datetime.now()}}
        ).to_list()

    async def get_document_insights(self, user_id: str, document_id: str) -> Dict[str, Any]:
        """Get AI-powered insights about a document."""
        extraction = await DocumentExtraction.find_one({"document_id": document_id})
        if not extraction:
            return {}
        return extraction.insights

    async def _create_expiry_reminders(self, document: Document) -> List[DocumentReminder]:
        """Create automatic expiry reminders for a document."""
        if not document.expiry_date:
            return []
        
        config = self.document_configs.get(document.document_type, {})
        reminder_days = config.get("expiry_reminder_days", [30, 15, 7])
        
        reminders_to_create = []
        for days_before in reminder_days:
            reminder_date = document.expiry_date - timedelta(days=days_before)
            
            # Only create reminders for future dates
            if reminder_date > datetime.now():
                reminder = DocumentReminder(
                    user_id=document.user_id,
                    document_id=document.id,
                    title=f"{document.title} expires in {days_before} days",
                    description=f"Your {document.document_type.value} will expire on {document.expiry_date.strftime('%Y-%m-%d')}",
                    reminder_type=ReminderType.DOCUMENT_EXPIRY,
                    reminder_date=reminder_date,
                    is_active=True,
                )
                reminders_to_create.append(reminder)
        
        if reminders_to_create:
            await DocumentReminder.insert_many(reminders_to_create)
        
        return reminders_to_create

    async def _log_document_action(
        self, 
        document_id: str, 
        user_id: str, 
        action: str, 
        details: Optional[Dict[str, Any]] = None
    ) -> None:
        """Log document actions for audit trail."""
        log_entry = DocumentAuditLog(
            document_id=document_id,
            user_id=user_id,
            action=action,
            details=details or {},
        )
        await log_entry.insert()

    async def get_stats(self, user_id: str) -> Dict[str, Any]:
        """Get storage statistics for a user."""
        total_docs = await Document.find({"user_id": user_id}).count()
        
        # In a real app, you might aggregate size from the documents
        # For now, we'll just return the count
        
        return {
            "total_documents": total_docs,
            "total_size_bytes": 0, # Placeholder
            "total_size_mb": 0, # Placeholder
            "by_type": {}  # Placeholder
        }

    async def create_document_backup(self, user_id: str, document_id: str) -> str:
        """Create a backup of a document."""
        document = await Document.get(document_id)
        if not document or document.user_id != user_id:
            raise HTTPException(status_code=404, detail="Document not found")

        source_blob = self.bucket.blob(f"{user_id}/{document_id}.enc")
        backup_blob_name = f"backups/{user_id}/{document_id}_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.enc"
        
        self.bucket.copy_blob(source_blob, self.bucket, backup_blob_name)
        
        return backup_blob_name

    async def verify_document_integrity(self, user_id: str, document_id: str) -> bool:
        """Verify document integrity using hash comparison."""
        document = await Document.get(document_id)
        if not document:
            return False
            
        try:
            content = await self.get_document_content(user_id, document_id)
            actual_hash = self._calculate_file_hash(content)
            return actual_hash == document.file_hash
        except Exception:
            return False

    async def get_documents(self, user_id: str) -> List[Document]:
        """Get all documents for a user."""
        return await Document.find({"user_id": user_id}).to_list()

    async def get_document_details(self, user_id: str, doc_id: str) -> Optional[Document]:
        """Get details for a single document."""
        document = await Document.get(doc_id)
        if document and document.user_id == user_id:
            return document
        return None

    async def download_document(self, user_id: str, doc_id: str) -> Optional[BinaryIO]:
        """Download a document's content."""
        document = await Document.get(doc_id)
        if not document or document.user_id != user_id:
            return None
        
        blob = self.bucket.blob(f"{user_id}/{doc_id}.enc")
        if not blob.exists():
            return None
            
        # Generate decryption key
        encryption_key = self._generate_encryption_key(user_id, doc_id)
        
        encrypted_content = blob.download_as_bytes()
        decrypted_content = self._decrypt_content(encrypted_content, encryption_key)
        
        import io
        return io.BytesIO(decrypted_content)