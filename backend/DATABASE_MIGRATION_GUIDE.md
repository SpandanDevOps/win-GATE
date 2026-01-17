# Database Migration Guide - Add OTP Columns

## Quick Method (Recommended)

Run the migration script I created:

```bash
cd backend
python add_otp_columns.py
```

This script will:
- Connect to your PostgreSQL database
- Add the three new OTP columns if they don't exist
- Verify the columns were added successfully
- Handle errors gracefully

## Manual Method (Alternative)

If you prefer to do it manually, connect to your PostgreSQL database and run:

```sql
-- Add is_verified column
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;

-- Add otp_hash column  
ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_hash VARCHAR(200);

-- Add otp_expiry column
ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_expiry TIMESTAMP;
```

## Using psql

```bash
psql -h localhost -U postgres -d win_gate_db -c "
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_hash VARCHAR(200);  
ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_expiry TIMESTAMP;
"
```

## Verify Migration

After running the migration, verify the columns were added:

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name='users' 
AND column_name IN ('is_verified', 'otp_hash', 'otp_expiry')
ORDER BY column_name;
```

## New Columns Added

1. **is_verified** - BOOLEAN
   - Default: FALSE
   - Purpose: Track if user has verified their email

2. **otp_hash** - VARCHAR(200)
   - Nullable: YES
   - Purpose: Store hashed OTP codes

3. **otp_expiry** - TIMESTAMP
   - Nullable: YES
   - Purpose: Store OTP expiration time

## What Happens to Existing Users?

- Existing users will have `is_verified = FALSE` by default
- They'll need to go through OTP verification to login
- Or you can mark them as verified manually:

```sql
-- Mark existing users as verified (optional)
UPDATE users SET is_verified = TRUE WHERE created_at < NOW();
```

## Troubleshooting

### Permission Denied
Make sure your database user has ALTER TABLE permissions:
```sql
GRANT ALTER ON TABLE users TO postgres;
```

### Connection Issues
Check your DATABASE_URL in .env file:
```env
DATABASE_URL=postgresql://postgres:Samik19@localhost:5432/win_gate_db
```

### Column Already Exists
The script uses `IF NOT EXISTS` so it's safe to run multiple times.

## Next Steps

1. Run the migration
2. Start your backend server
3. Test the OTP signup flow
4. Verify existing users can still login (or mark them as verified)
