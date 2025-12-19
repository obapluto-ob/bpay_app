-- Email Verification System Database Migration
-- Run this SQL in your database management tool

-- Add email verification columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS verification_token TEXT,
ADD COLUMN IF NOT EXISTS reset_token TEXT,
ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMP;

-- Update existing users to be verified (optional)
UPDATE users 
SET email_verified = true 
WHERE email_verified IS NULL OR email_verified = false;

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('email_verified', 'verification_token', 'reset_token', 'reset_token_expires');