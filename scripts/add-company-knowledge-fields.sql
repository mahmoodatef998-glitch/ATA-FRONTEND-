-- Add Company Knowledge Base fields to companies table
-- This migration adds fields for chatbot context and company information

-- Add new columns to companies table
ALTER TABLE "companies" 
ADD COLUMN IF NOT EXISTS "description" TEXT,
ADD COLUMN IF NOT EXISTS "products" TEXT,
ADD COLUMN IF NOT EXISTS "services" TEXT,
ADD COLUMN IF NOT EXISTS "contactInfo" TEXT,
ADD COLUMN IF NOT EXISTS "businessHours" TEXT,
ADD COLUMN IF NOT EXISTS "specialties" TEXT;

-- Add comments for documentation
COMMENT ON COLUMN "companies"."description" IS 'Company description/bio for chatbot';
COMMENT ON COLUMN "companies"."products" IS 'Products and services offered (for chatbot context)';
COMMENT ON COLUMN "companies"."services" IS 'Services description (for chatbot context)';
COMMENT ON COLUMN "companies"."contactInfo" IS 'Contact information (phone, email, address)';
COMMENT ON COLUMN "companies"."businessHours" IS 'Business hours information';
COMMENT ON COLUMN "companies"."specialties" IS 'Company specialties/expertise';

