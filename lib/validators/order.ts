import { z } from "zod";

// Phone validation - flexible format
export const phoneSchema = z
  .string()
  .min(8, "Phone number must be at least 8 digits")
  .max(20, "Phone number too long")
  .regex(/^[\d\s\+\-\(\)]+$/, "Invalid phone number format");

// Create Order Schema (Public)
export const createOrderSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  phone: phoneSchema,
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  details: z.string().max(5000, "Details too long").optional(),
  items: z
    .array(
      z.object({
        name: z.string().min(1, "Item name required"),
        quantity: z.number().positive("Quantity must be positive"),
        specs: z.string().optional(),
      })
    )
    .optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

// Update Order Status Schema
export const updateOrderStatusSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "QUOTATION_SENT", "COMPLETED", "CANCELLED"]),
  note: z.string().max(1000).optional(),
});

export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;

// Create Quotation Schema
export const createQuotationSchema = z.object({
  items: z
    .array(
      z.object({
        name: z.string().min(1, "Item name required"),
        quantity: z.number().positive("Quantity must be positive"),
        price: z.number().positive("Price must be positive"),
        total: z.number().positive("Total must be positive"),
      })
    )
    .min(1, "At least one item required"),
  total: z.number().positive("Total must be positive"),
  notes: z.string().max(2000).optional(),
  currency: z.string().default("AED"),
});

export type CreateQuotationInput = z.infer<typeof createQuotationSchema>;

// Query Parameters Schema
export const ordersQuerySchema = z.object({
  page: z.string().optional().default("1"),
  limit: z.string().optional().default("20"),
  status: z.string().optional(),
  search: z.string().optional(),
  companyId: z.string().optional(),
});

export type OrdersQueryInput = z.infer<typeof ordersQuerySchema>;

