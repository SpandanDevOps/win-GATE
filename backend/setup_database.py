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

def create_database():
    """Create the PostgreSQL database if it doesn't exist"""
    
    # Database connection parameters
    db_host = os.getenv("DB_HOST", "localhost")
    db_port = os.getenv("DB_PORT", "5432")
    db_user = os.getenv("DB_USER", "postgres")
    db_password = os.getenv("DB_PASSWORD", "password")
    db_name = os.getenv("DB_NAME", "win_gate_db")
    
    # Connect to PostgreSQL server (default database)
    try:
        conn = psycopg2.connect(
            host=db_host,
            port=db_port,
            user=db_user,
            password=db_password,
            database="postgres"
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        # Check if database exists
        cursor.execute("SELECT 1 FROM pg_database WHERE datname = %s", (db_name,))
        exists = cursor.fetchone()
        
        if not exists:
            cursor.execute(f'CREATE DATABASE "{db_name}"')
            print(f"Database '{db_name}' created successfully!")
        else:
            print(f"Database '{db_name}' already exists!")
            
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"Error creating database: {e}")
        return False
    
    return True

def setup_database():
    """Setup the database and create tables"""
    
    # Database connection URL
    database_url = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost:5432/win_gate_db")
    
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
    
    # Create database
    if create_database():
        print("Database creation completed!")
        
        # Setup database and tables
        if setup_database():
            print("Database setup completed successfully!")
            print("\nYou can now start the FastAPI server with:")
            print("python main.py")
        else:
            print("Database setup failed!")
    else:
        print("Database creation failed!")

if __name__ == "__main__":
    main()
