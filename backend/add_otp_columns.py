"""
Script to add OTP columns to the users table
Run this script to update your database with the new OTP authentication fields
"""

import os
import sys
from sqlalchemy import create_engine, text
from database_models import Base, User

def add_otp_columns():
    """Add OTP-related columns to the users table"""
    
    # Get database URL from environment or use default
    DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:Samik19@localhost:5432/win_gate_db")
    
    # Create engine
    engine = create_engine(DATABASE_URL)
    
    # SQL statements to add new columns if they don't exist
    add_columns_sql = [
        # Check and add is_verified column
        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name='users' AND column_name='is_verified'
            ) THEN
                ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT FALSE;
            END IF;
        END $$;
        """,
        
        # Check and add otp_hash column
        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name='users' AND column_name='otp_hash'
            ) THEN
                ALTER TABLE users ADD COLUMN otp_hash VARCHAR(200);
            END IF;
        END $$;
        """,
        
        # Check and add otp_expiry column
        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name='users' AND column_name='otp_expiry'
            ) THEN
                ALTER TABLE users ADD COLUMN otp_expiry TIMESTAMP;
            END IF;
        END $$;
        """
    ]
    
    try:
        with engine.connect() as connection:
            print("Connecting to database...")
            
            # Execute each column addition
            for sql in add_columns_sql:
                print("Executing SQL to add column...")
                connection.execute(text(sql))
            
            connection.commit()
            print("✅ Successfully added OTP columns to users table!")
            
            # Verify columns were added
            result = connection.execute(text("""
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns 
                WHERE table_name='users' 
                AND column_name IN ('is_verified', 'otp_hash', 'otp_expiry')
                ORDER BY column_name;
            """))
            
            columns = result.fetchall()
            print("\n📋 Updated columns in users table:")
            for col in columns:
                print(f"  - {col[0]}: {col[1]} (nullable: {col[2]}, default: {col[3]})")
                
    except Exception as e:
        print(f"❌ Error adding columns: {e}")
        sys.exit(1)

if __name__ == "__main__":
    add_otp_columns()
