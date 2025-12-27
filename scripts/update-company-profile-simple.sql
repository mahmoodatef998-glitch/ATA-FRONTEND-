-- SIMPLE VERSION - Update Company Profile
-- Run this in Supabase SQL Editor
-- This version is simpler and should work without issues

-- First, check your company ID
SELECT id, name FROM companies;

-- Then update using the ID (replace 1 with your actual company ID)
UPDATE companies
SET
  name = 'AL TAQA AL MALAWNA ELECTRICAL SWITCHGEAR LLC',
  description = 'ATA Switchgear Limited pioneers the manufacture and supply of a diverse range of electrical panels, including switchboards, low and medium voltage, motor control centers, capacitor banks, and more. With extensive experience in the switchgear industry, our team combines engineering expertise with a deep understanding of GCC standards and regulations, serving a wide client base across various industries. Our core values as a prominent electrical switchboard manufacturer in the UAE include honesty, loyalty, integrity, and responsibility. Client satisfaction is paramount, and we strive to exceed expectations while fostering staff growth and leaving a positive legacy.',
  products = 'We offer a comprehensive range of products: 1. LV & MV switchgear panels 2. Generator synchronizing panels 3. Change over switches (Auto & Manual) 4. Capacitor banks (Power factor correction) 5. Generator control panels 6. PLC and intelligent control panels 7. Domestic and household panels 8. Resistive load and dummy load banks 9. Switchgear maintenance, modification and repair 10. Switchgear spare part supply 11. Containerized switchgear substations (LV & MV) 12. Motor starter panels (VFD, Y-D, Soft-Starter) 13. Generators (10KVA – 1600KVA) 14. Lighting towers',
  services = 'Switchgear Control Board Manufacturing & Design. Our Manufacturing Process: Receive client requirements, Optimize design, Coordinate with clients, Submit quotation, Conduct factory acceptance test (FAT), Deliver products with schematics. Our Targeted Markets: Residential, Commercial, Industrial, Water and Sewage Treatment plants, Generator Packaging companies, Oil and Gas industries, Rental companies',
  specialties = 'Our Team: 8 highly qualified switchgear manufacturing technicians, AutoCAD drafters, Two electrical supervising engineers, Qualified administrators and accountants, Two dedicated sales executives, General Manager with electrical engineering degree, Electrical consultant and designer. Our Manufacturing Plant: Located in Sharjah airport free zone (SAIF zone). Tools and Equipment: Bus bar forming machines, wire cutting machines, insulation testers, label engraving machine, primary injection test unit up to 3200A, secondary injection set, and more. Partners: We partner with global companies for high-quality products.',
  "contactInfo" = 'AL TAQA AL MALAWNA ELECTRICAL SWITCHGEAR ASSEMBLY LLC. Address: Central Region - Al Dhaid - Behind Wushah Street - New Industrial Area, Fenced Land No.1. Landline: +971 6 5353462. Mobile: +971 50229 6962. Website: https://ataswg.com. Email: sales@ataswg.com / info@ataswg.com',
  "businessHours" = 'Monday - Friday: 8:00 AM - 6:00 PM. Saturday: 8:00 AM - 1:00 PM. Sunday: Closed. Contact us for urgent matters outside business hours.',
  "updatedAt" = NOW()
WHERE id = 1;  -- Change this to your company ID

-- Verify
SELECT id, name, 
  CASE WHEN description IS NOT NULL THEN '✅' ELSE '❌' END as description,
  CASE WHEN products IS NOT NULL THEN '✅' ELSE '❌' END as products,
  CASE WHEN services IS NOT NULL THEN '✅' ELSE '❌' END as services,
  CASE WHEN specialties IS NOT NULL THEN '✅' ELSE '❌' END as specialties,
  CASE WHEN "contactInfo" IS NOT NULL THEN '✅' ELSE '❌' END as contact_info,
  CASE WHEN "businessHours" IS NOT NULL THEN '✅' ELSE '❌' END as business_hours
FROM companies WHERE id = 1;

