import os
from typing import List, Type
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie, Document
from app.models.database import (
    User, Transaction, TaxData, CIBILData, 
    Document as VaultDocument, DocumentReminder, DocumentAuditLog
)

async def init_db():
    """
    Initializes the database connection and Beanie ODM.
    """
    mongo_uri = os.getenv("MONGO_URI")
    if not mongo_uri:
        raise ValueError("MONGO_URI not set in environment!")

    client = AsyncIOMotorClient(mongo_uri)
    database = client.get_database()  # The database name is part of the URI

    # List of all Beanie documents to be initialized
    document_models: List[Type[Document]] = [
        User,
        Transaction,
        TaxData,
        CIBILData,
        VaultDocument,
        DocumentReminder,
        DocumentAuditLog
    ]

    await init_beanie(
        database=database,
        document_models=document_models
    )
    print("Database and Beanie ODM initialized successfully.")

async def close_db():
    """
    Closes the database connection.
    """
    # Beanie doesn't require explicit connection closing with AsyncIOMotorClient
    # The client manages the connection pool.
    print("Database connection managed by client pool.")

