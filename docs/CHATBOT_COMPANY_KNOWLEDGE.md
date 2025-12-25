# Chatbot Company Knowledge Base

## Overview

The chatbot now has access to company information and client order history, allowing it to provide more accurate and personalized responses to client questions.

## Features

### 1. Company Knowledge Base
- **Company Description**: Brief overview of the company
- **Products & Services**: List of main products and services
- **Services Description**: Detailed services information
- **Specialties**: Company expertise and specialties
- **Contact Information**: Phone, email, and address
- **Business Hours**: Operating hours information

### 2. Client Order History
- **Total Orders**: Number of orders placed by the client
- **Recent Orders**: Last 10 orders with status and stage
- **Pending Orders**: Count of pending orders
- **Completed Orders**: Count of completed orders

## Setup Instructions

### Step 1: Run Database Migration

Execute the migration script to add new fields to the `companies` table:

```bash
ADD_COMPANY_KNOWLEDGE_FIELDS.bat
```

Or manually run:

```bash
# Run SQL migration
psql $DATABASE_URL -f scripts/add-company-knowledge-fields.sql

# Sync Prisma schema
npx prisma db push
```

### Step 2: Update Company Knowledge

1. Log in as **Admin**
2. Navigate to **Dashboard** → **Company Knowledge** (in the mobile menu or navigation)
3. Fill in the company information:
   - **Company Description**: Brief overview
   - **Products & Services**: Main offerings
   - **Services Description**: Detailed services
   - **Specialties**: Areas of expertise
   - **Contact Information**: Phone, email, address
   - **Business Hours**: Operating hours
4. Click **Save Changes**

### Step 3: Test the Chatbot

1. Open the chatbot on any page
2. Ask questions about:
   - Company products and services
   - Contact information
   - Business hours
   - Order status (if logged in as a client)

## How It Works

### For Regular Users (Not Logged In)
- Chatbot uses company knowledge base only
- Provides general information about the company

### For Clients (Logged In)
- Chatbot uses company knowledge base
- **PLUS** client's order history
- Can answer questions like:
  - "What's the status of my orders?"
  - "How many orders do I have?"
  - "Show me my recent orders"

### For Admin/Staff (Logged In)
- Chatbot uses company knowledge base
- Can answer questions about company information

## API Endpoints

### GET `/api/company/knowledge`
Get company knowledge base (requires authentication)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "ATA CRM",
    "description": "...",
    "products": "...",
    "services": "...",
    "contactInfo": "...",
    "businessHours": "...",
    "specialties": "..."
  }
}
```

### PATCH `/api/company/knowledge`
Update company knowledge base (Admin only)

**Request Body:**
```json
{
  "description": "Company description...",
  "products": "Products list...",
  "services": "Services description...",
  "contactInfo": "Contact information...",
  "businessHours": "Business hours...",
  "specialties": "Specialties..."
}
```

### GET `/api/chat/client-id`
Get client ID from session (used internally by chatbot)

## Technical Details

### Database Schema

New fields added to `companies` table:
- `description` (TEXT, nullable)
- `products` (TEXT, nullable)
- `services` (TEXT, nullable)
- `contactInfo` (TEXT, nullable)
- `businessHours` (TEXT, nullable)
- `specialties` (TEXT, nullable)

### Files Created/Modified

**New Files:**
- `lib/chatbot/company-knowledge.ts` - Utility functions
- `app/api/company/knowledge/route.ts` - API endpoint
- `app/api/chat/client-id/route.ts` - Client ID endpoint
- `app/(dashboard)/dashboard/company-knowledge/page.tsx` - Admin page
- `scripts/add-company-knowledge-fields.sql` - Migration script
- `ADD_COMPANY_KNOWLEDGE_FIELDS.bat` - Migration batch file

**Modified Files:**
- `prisma/schema.prisma` - Added new fields
- `app/api/chat/route.ts` - Enhanced with knowledge base
- `components/chat/chatbot.tsx` - Added clientId support
- `components/dashboard/navbar.tsx` - Added navigation link

## Best Practices

1. **Keep Information Updated**: Regularly update company knowledge as products/services change
2. **Be Specific**: Provide detailed information for better chatbot responses
3. **Use Clear Language**: Write in simple, clear language that clients can understand
4. **Include Examples**: Add examples of products/services for better context

## Troubleshooting

### Chatbot doesn't show company information
- Check if company knowledge is saved in the database
- Verify the migration script ran successfully
- Check browser console for errors

### Client order history not working
- Ensure client is logged in
- Check if `client-token` cookie exists
- Verify `/api/chat/client-id` endpoint is accessible

### Admin can't access Company Knowledge page
- Verify user role is `ADMIN`
- Check navigation menu for the link
- Try accessing `/dashboard/company-knowledge` directly

## Future Enhancements

- [ ] Support for multiple languages in company knowledge
- [ ] Rich text editor for company description
- [ ] File uploads for product images/catalogs
- [ ] Analytics on chatbot usage
- [ ] Custom prompts per company
- [ ] Integration with product catalog

