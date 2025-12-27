# Chatbot Enhancements - Detailed Guidance & Troubleshooting

## Overview

The chatbot has been significantly enhanced to provide more accurate, detailed, and actionable responses to users. It now includes comprehensive guidance on order placement, workflow explanation, and troubleshooting solutions.

## Key Improvements

### 1. Enhanced System Prompt

The chatbot now has a much more detailed system prompt that includes:

- **6 Primary Capabilities**: Product information, order management, order placement guidance, troubleshooting, portal usage, and company information
- **Detailed Response Guidelines**: Instructions to be detailed, specific, provide step-by-step instructions, use examples, and be proactive
- **Language Support**: Automatically responds in the same language the user is using (Arabic or English)

### 2. Order Workflow Information

The chatbot now understands and can explain all 15 order stages:

1. **RECEIVED** - Order request received and logged
2. **UNDER_REVIEW** - Company is reviewing requirements
3. **QUOTATION_PREPARATION** - Preparing quotation document
4. **QUOTATION_SENT** - Quotation sent to client for review
5. **QUOTATION_ACCEPTED** - Client approved the quotation
6. **PO_PREPARED** - Purchase order prepared
7. **AWAITING_DEPOSIT** - Waiting for deposit payment from client
8. **DEPOSIT_RECEIVED** - Deposit payment received
9. **IN_MANUFACTURING** - Product is being manufactured
10. **MANUFACTURING_COMPLETE** - Manufacturing finished
11. **READY_FOR_DELIVERY** - Product ready to be delivered
12. **DELIVERY_NOTE_SENT** - Delivery note issued
13. **AWAITING_FINAL_PAYMENT** - Waiting for final payment
14. **FINAL_PAYMENT_RECEIVED** - Final payment received
15. **COMPLETED_DELIVERED** - Order completed and delivered

The chatbot can explain:
- What each stage means
- What happens in each stage
- What the client should do next
- Expected timeline for each stage

### 3. Order Placement Guide

Step-by-step instructions for clients:

1. **Registration Process**
   - How to register
   - Required information
   - Approval process

2. **Login Process**
   - How to access the portal
   - Account management

3. **Creating Orders**
   - Step-by-step order creation
   - Required information
   - Uploading images

4. **Tracking Orders**
   - Viewing order status
   - Understanding stages
   - Monitoring progress

5. **Quotation Process**
   - How quotations work
   - Reviewing quotations
   - Accepting/rejecting

6. **Payment Process**
   - Deposit requirements
   - Final payment
   - Payment methods

7. **Delivery Process**
   - Tracking manufacturing
   - Delivery notes
   - Receiving orders

### 4. Troubleshooting Guide

Comprehensive solutions for common issues:

#### Login Issues
- Account approval status
- Password problems
- Account rejection reasons

#### Order Issues
- Orders not showing
- Status not updating
- Missing information

#### Quotation Issues
- Not receiving quotations
- Can't open quotation files
- Quotation delays

#### Payment Issues
- Payment verification
- Payment methods
- Deposit requirements

#### General Issues
- Account management
- Portal navigation
- Support contact

### 5. Enhanced Order History

The chatbot now provides more detailed information about client orders:

- **Payment Status**: Deposit paid, final payment received
- **Quotation Status**: Has quotation, quotation accepted/rejected
- **Order Details**: Amount, currency, creation date
- **Actionable Insights**: What the client should do next

### 6. Increased Response Length

- **Previous**: 500 tokens (short responses)
- **Current**: 1000 tokens (detailed, comprehensive responses)

This allows the chatbot to provide:
- More detailed explanations
- Step-by-step instructions
- Multiple solutions
- Examples and use cases

## Example Interactions

### Example 1: Order Status Question

**User**: "ما هي حالة طلبي رقم 123؟"

**Chatbot Response** (Enhanced):
```
طلبيتك رقم 123 حالياً في مرحلة "IN_MANUFACTURING" (قيد التصنيع).

هذا يعني:
✅ تم استلام الدفعة المقدمة
✅ تم قبول العرض
✅ المنتج قيد التصنيع حالياً

الخطوة التالية:
- سيتم إشعارك عند اكتمال التصنيع
- بعدها ستصبح جاهزة للتسليم
- ستحتاج لدفع المبلغ المتبقي قبل التسليم

يمكنك متابعة التحديثات من خلال:
1. فتح البوابة الخاصة بك
2. عرض تفاصيل الطلب
3. متابعة التحديثات في الوقت الفعلي

هل تريد معرفة المزيد عن أي مرحلة محددة؟
```

### Example 2: How to Place Order

**User**: "كيف أطلب منتج؟"

**Chatbot Response** (Enhanced):
```
إليك دليل خطوة بخطوة لطلب منتج:

**الخطوة 1: التسجيل**
- اذهب إلى صفحة التسجيل
- املأ بياناتك (الاسم، الهاتف، البريد الإلكتروني - مطلوب)
- أرسل الطلب
- انتظر موافقة الإدارة

**الخطوة 2: تسجيل الدخول**
- استخدم رقم الهاتف وكلمة المرور
- ادخل إلى البوابة الخاصة بك

**الخطوة 3: إنشاء طلب**
- اضغط "إنشاء طلب جديد"
- املأ تفاصيل الطلب:
  * مواصفات المنتج
  * الكمية
  * أي متطلبات خاصة
  * رفع صور إن أمكن
- أرسل الطلب

**الخطوة 4: متابعة الطلب**
- عرض جميع طلباتك في البوابة
- متابعة حالة الطلب والمرحلة
- مراجعة العروض عند إرسالها
- قبول/رفض العروض

هل تحتاج مساعدة في أي خطوة محددة؟
```

### Example 3: Troubleshooting

**User**: "لا أستطيع فتح ملف العرض"

**Chatbot Response** (Enhanced):
```
إليك حلول لمشكلة فتح ملف العرض:

**الحلول المقترحة:**

1. **تحقق من حالة الطلب**
   - تأكد أن الطلب في مرحلة "QUOTATION_SENT"
   - تحقق من الإشعارات في البوابة

2. **حاول التحميل بدلاً من الفتح**
   - اضغط زر التحميل
   - احفظ الملف على جهازك
   - افتحه من مجلد التحميلات

3. **تحقق من صلاحيات المتصفح**
   - تأكد أن المتصفح يسمح بفتح ملفات PDF
   - جرب متصفح آخر (Chrome, Firefox, Edge)

4. **تحقق من اتصال الإنترنت**
   - تأكد من اتصال مستقر
   - أعد تحميل الصفحة

5. **إذا استمرت المشكلة**
   - تواصل مع الدعم الفني
   - أو اطلب إعادة إرسال العرض

**نصائح إضافية:**
- استخدم متصفح محدث
- تأكد من وجود مساحة كافية على الجهاز
- جرب من جهاز آخر

هل جربت أي من هذه الحلول؟ يمكنني مساعدتك أكثر إذا استمرت المشكلة.
```

## Technical Details

### Files Modified

1. **`app/api/chat/route.ts`**
   - Enhanced system prompt
   - Added workflow, placement, and troubleshooting guides
   - Increased max_tokens to 1000

2. **`lib/chatbot/company-knowledge.ts`**
   - Added `getOrderWorkflowInfo()` function
   - Added `getOrderPlacementGuide()` function
   - Added `getTroubleshootingGuide()` function
   - Enhanced `getClientOrderHistory()` with payment and quotation details
   - Improved `formatClientOrderHistory()` with actionable insights

### Response Quality Improvements

- **Before**: Short, generic responses
- **After**: Detailed, specific, actionable responses with:
  - Step-by-step instructions
  - Multiple solutions
  - Examples
  - Next steps
  - Proactive guidance

## Best Practices for Users

1. **Be Specific**: Ask specific questions for better answers
2. **Provide Context**: Mention order numbers or specific issues
3. **Follow Steps**: The chatbot provides step-by-step guides - follow them
4. **Check Portal**: Always verify information in your portal
5. **Contact Support**: For urgent matters, contact support directly

## Future Enhancements

- [ ] Multi-language support for guides
- [ ] Interactive troubleshooting flow
- [ ] Order status predictions
- [ ] Proactive notifications
- [ ] Integration with support tickets
- [ ] Voice support
- [ ] Image recognition for product queries

## Testing

To test the enhanced chatbot:

1. **Order Status Questions**
   - Ask about specific order status
   - Verify detailed stage explanation

2. **How-to Questions**
   - Ask how to place an order
   - Verify step-by-step guide

3. **Troubleshooting**
   - Report common issues
   - Verify solution steps

4. **Product Questions**
   - Ask about products
   - Verify detailed information

5. **Workflow Questions**
   - Ask about order stages
   - Verify comprehensive explanation

## Support

If you encounter any issues with the chatbot:
- Check this documentation
- Contact technical support
- Report bugs through the portal

