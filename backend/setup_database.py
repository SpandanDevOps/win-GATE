#!/usr/bin/env python3
"""
Database setup script for Win GATE Study Tracker
This script creates the PostgreSQL database and sets up the initial tables.
"""

import os
import psycopg2 
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from sqlalchemy import create_engine
from database_models import Base, create_tables
from dotenv import load_dotenv

load_dotenv() 

def setup_database():
    """Setup the database and create tables"""
    
    # Database connection URL
    database_url = os.getenv("DATABASE_URL")
    
    try:
        # Create engine and tables
        engine = create_engine(database_url, echo=True)
        create_tables()
        
        print("Database tables created successfully!")
        return True
        
    except Exception as e:
        print(f"Error setting up database: {e}")
        return False

def main():
    """Main setup function"""
    print("Setting up Win GATE Study Tracker Database...")
    
    if setup_database():
        print("Database setup completed successfully!")
        print("\nYou can now start the FastAPI server with:")
        print("python main.py")
    else:
        print("Database setup failed!")

if __name__ == "__main__":
    main()
