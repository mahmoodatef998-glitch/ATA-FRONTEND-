-- Update Company Profile with Complete Information
-- Run this SQL script directly in Supabase SQL Editor
-- IMPORTANT: Run this in parts if you encounter issues

-- Step 1: First, let's see what company we're updating
SELECT id, name FROM companies LIMIT 1;

-- Step 2: Update the company (replace the ID if needed)
-- Get the company ID first
DO $$
DECLARE
    company_id INTEGER;
BEGIN
    -- Get the first company ID
    SELECT id INTO company_id FROM companies LIMIT 1;
    
    IF company_id IS NULL THEN
        RAISE EXCEPTION 'No company found in database!';
    END IF;
    
    -- Update the company
    UPDATE companies
    SET
        name = 'AL TAQA AL MALAWNA ELECTRICAL SWITCHGEAR LLC',
        description = 'ATA Switchgear Limited pioneers the manufacture and supply of a diverse range of electrical panels, including switchboards, low and medium voltage, motor control centers, capacitor banks, and more. With extensive experience in the switchgear industry, our team combines engineering expertise with a deep understanding of GCC standards and regulations, serving a wide client base across various industries.

Our core values as a prominent electrical switchboard manufacturer in the UAE include honesty, loyalty, integrity, and responsibility. Client satisfaction is paramount, and we strive to exceed expectations while fostering staff growth and leaving a positive legacy.',
        
        products = 'We offer a comprehensive range of products:
1. LV & MV switchgear panels
2. Generator synchronizing panels
3. Change over switches (Auto & Manual)
4. Capacitor banks (Power factor correction)
5. Generator control panels
6. PLC and intelligent control panels
7. Domestic and household panels
8. Resistive load and dummy load banks
9. Switchgear maintenance, modification and repair
10. Switchgear spare part supply
11. Containerized switchgear substations (LV & MV)
12. Motor starter panels (VFD, Y-D, Soft-Starter)
13. Generators (10KVA – 1600KVA)
14. Lighting towers',
        
        services = 'Switchgear Control Board Manufacturing & Design

Our Manufacturing Process and Procedures:
• Receive client requirements and specifications
• Optimize design for cost-effectiveness
• Coordinate with clients for design approval
• Submit quotation and finalize pricing
• Conduct factory acceptance test (FAT) as per standards
• Deliver products with as-built schematics and test reports

Our Targeted Markets:
• Residential: Economical power distribution panels for apartments and villas
• Commercial: Reliable switchboards for hospitals, offices, and schools
• Industrial: High-power solutions for various industries
• Water and Sewage Treatment plants
• Generator Packaging companies
• Oil and Gas industries
• Rental companies',
        
        specialties = 'Our Team:
• 8 highly qualified switchgear manufacturing technicians
• AutoCAD drafters
• Two electrical supervising engineers
• Qualified administrators and accountants
• Two dedicated sales and customer relation executives
• General Manager with an electrical engineering degree
• Electrical consultant and designer

Our Manufacturing Plant:
Located in Sharjah airport free zone (SAIF zone), our facility is strategically positioned for easy access and fast deliveries. Equipped with modern machinery and ample workspace, we prioritize both excellent relationships and high-quality products.

Tools and Equipment:
Our workshop is equipped with a range of tools and test equipment to ensure the quality and safety of our products, including bus bar forming machines, wire cutting and stripping machines, insulation testers, label engraving machine, primary injection test unit up to 3200A (3 phase), secondary injection set, and more.

Partners and Suppliers:
We partner with global companies to supply high-quality products and equipment, ensuring reliability and customer satisfaction.',
        
        "contactInfo" = 'AL TAQA AL MALAWNA ELECTRICAL SWITCHGEAR ASSEMBLY LLC

Address:
Central Region - Al Dhaid - Behind Wushah Street - New Industrial Area, Fenced Land No.1

Contact:
Landline: +971 6 5353462
Mobile: +971 50229 6962
Website: https://ataswg.com
Email: sales@ataswg.com / info@ataswg.com',
        
        "businessHours" = 'Business Hours:
Monday - Friday: 8:00 AM - 6:00 PM
Saturday: 8:00 AM - 1:00 PM
Sunday: Closed

Note: Contact us for urgent matters outside business hours.',
        "updatedAt" = NOW()
    WHERE id = company_id;
    
    RAISE NOTICE 'Company profile updated successfully! Company ID: %', company_id;
END $$;

-- Step 3: Verify the update
SELECT 
  id,
  name,
  CASE WHEN description IS NOT NULL THEN '✅' ELSE '❌' END as description,
  CASE WHEN products IS NOT NULL THEN '✅' ELSE '❌' END as products,
  CASE WHEN services IS NOT NULL THEN '✅' ELSE '❌' END as services,
  CASE WHEN specialties IS NOT NULL THEN '✅' ELSE '❌' END as specialties,
  CASE WHEN "contactInfo" IS NOT NULL THEN '✅' ELSE '❌' END as contact_info,
  CASE WHEN "businessHours" IS NOT NULL THEN '✅' ELSE '❌' END as business_hours,
  "updatedAt"
FROM companies
ORDER BY id
LIMIT 1;

