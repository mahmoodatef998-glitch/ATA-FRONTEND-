-- Add Company Knowledge Fields - Run this in Supabase SQL Editor
-- Copy and paste this entire file into Supabase SQL Editor and click Run

ALTER TABLE "companies" 
ADD COLUMN IF NOT EXISTS "description" TEXT,
ADD COLUMN IF NOT EXISTS "products" TEXT,
ADD COLUMN IF NOT EXISTS "services" TEXT,
ADD COLUMN IF NOT EXISTS "contactInfo" TEXT,
ADD COLUMN IF NOT EXISTS "businessHours" TEXT,
ADD COLUMN IF NOT EXISTS "specialties" TEXT;

-- Verify the columns were added
SELECT 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'companies' 
  AND column_name IN ('description', 'products', 'services', 'contactInfo', 'businessHours', 'specialties')
ORDER BY column_name;

