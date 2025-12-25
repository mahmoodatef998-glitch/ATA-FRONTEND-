# Update Company Profile - Instructions

## Overview

This guide explains how to add the complete company profile information to the chatbot knowledge base.

## Company Information

**Company Name:** AL TAQA AL MALAWNA ELECTRICAL SWITCHGEAR LLC

**Industry:** Switchgear Control Board Manufacturing & Design

## Methods to Update Company Profile

### Method 1: Using SQL Script (Recommended for Quick Setup)

1. **Open Supabase SQL Editor**
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Create a new query

2. **Run the SQL Script**
   - Copy the contents of `scripts/update-company-profile.sql`
   - Paste into SQL Editor
   - Click "Run" or press `Ctrl+Enter`

3. **Verify Update**
   - The script includes a verification query
   - Check that all fields show ✅

### Method 2: Using TypeScript Script

1. **Ensure Database Connection**
   - Make sure your `.env` file has correct `DATABASE_URL`
   - Database server must be accessible

2. **Run the Script**
   ```bash
   UPDATE_COMPANY_PROFILE.bat
   ```
   
   Or manually:
   ```bash
   npx tsx scripts/update-company-profile.ts
   ```

3. **Check Output**
   - Script will show success message
   - Verify all fields are updated

### Method 3: Using Dashboard (Manual Entry)

1. **Login as Admin**
   - Go to `/dashboard/company-knowledge`

2. **Fill in Information**
   - Copy from `docs/COMPANY_PROFILE_DATA.json`
   - Paste into respective fields:
     - **Company Description**: Full company overview
     - **Products & Services**: List of products
     - **Services Description**: Services and processes
     - **Specialties & Expertise**: Team, plant, equipment
     - **Contact Information**: Address and contact details
     - **Business Hours**: Operating hours

3. **Save Changes**
   - Click "Save Changes" button
   - Wait for success confirmation

## Information Breakdown

### Description
- Company overview
- Core values
- Industry expertise
- Client base

### Products
- 14 main product categories
- Detailed product list
- Specifications where applicable

### Services
- Manufacturing process
- Design services
- Targeted markets
- Service procedures

### Specialties
- Team composition
- Manufacturing plant location
- Tools and equipment
- Partners and suppliers

### Contact Information
- Full company name
- Physical address
- Phone numbers
- Email addresses
- Website

### Business Hours
- Operating hours
- Days of operation
- Special notes

## Verification

After updating, test the chatbot with these questions:

1. **Company Overview**
   - "Tell me about ATA Switchgear"
   - "What does your company do?"

2. **Products**
   - "What products do you offer?"
   - "Do you make generator panels?"

3. **Services**
   - "What services do you provide?"
   - "How do you manufacture switchgear?"

4. **Contact**
   - "What is your address?"
   - "How can I contact you?"

5. **Business Hours**
   - "What are your business hours?"
   - "When are you open?"

## Expected Chatbot Responses

The chatbot should now provide:
- ✅ Accurate company information
- ✅ Detailed product descriptions
- ✅ Service explanations
- ✅ Contact details
- ✅ Business hours
- ✅ Team and capabilities information

## Troubleshooting

### Issue: Script fails with database connection error
**Solution:**
- Check `.env` file has correct `DATABASE_URL`
- Verify database server is accessible
- Use SQL script method instead

### Issue: Information not showing in chatbot
**Solution:**
- Verify data was saved in database
- Check company ID matches
- Restart the application
- Clear chatbot conversation history

### Issue: Some fields are empty
**Solution:**
- Check SQL script ran completely
- Verify all fields in database
- Use dashboard to manually fill missing fields

## Files Reference

- **SQL Script**: `scripts/update-company-profile.sql`
- **TypeScript Script**: `scripts/update-company-profile.ts`
- **Batch File**: `UPDATE_COMPANY_PROFILE.bat`
- **JSON Data**: `docs/COMPANY_PROFILE_DATA.json`
- **This Guide**: `docs/UPDATE_COMPANY_PROFILE_INSTRUCTIONS.md`

## Next Steps

1. ✅ Update company profile (choose one method above)
2. ✅ Verify information in database
3. ✅ Test chatbot responses
4. ✅ Update from dashboard if needed
5. ✅ Monitor chatbot accuracy

## Support

If you encounter issues:
- Check database connection
- Verify company exists in database
- Review error messages
- Contact technical support

