import { z } from "zod";

export const razorpayVerifySchema = z.object({
  body: z.object({
    razorpay_order_id: z.string().min(1),
    razorpay_payment_id: z.string().min(1),
    razorpay_signature: z.string().min(1),
    address: z.object({
      name: z.string().min(2),
      phone: z.string().regex(/^[6-9]\d{9}$/),
      altPhone: z.string().regex(/^[6-9]\d{9}$/).optional().or(z.literal("")),
      line1: z.string().min(3),
      city: z.string().min(2),
      state: z.string().min(2),
      pincode: z.string().regex(/^\d{6}$/),
    }),
    idempotencyKey: z.string().min(8).max(128).optional(),
  }),
  params: z.object({}),
  query: z.object({}),
});

export const orderIdParamSchema = z.object({
  body: z.object({}),
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  query: z.object({}),
});

export const returnRequestSchema = z.object({
  body: z.object({
    reason: z.string().min(2).max(1000),
  }),
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  query: z.object({}),
});

export const orderNoteSchema = z.object({
  body: z.object({
    type: z.enum(["NOTE", "FAILED_REASON", "RETURN_REASON"]).optional(),
    title: z.string().min(2).max(120),
    note: z.string().min(2).max(1000),
  }),
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  query: z.object({}),
});

export const trackQuerySchema = z.object({
  body: z.object({}),
  params: z.object({}),
  query: z
    .object({
      orderId: z.coerce.number().int().positive().optional(),
      mobile: z.string().optional(),
    })
    .refine((d) => d.orderId || (d.mobile && d.mobile.trim().length > 0), {
      message: "orderId or mobile is required",
      path: ["orderId"],
    }),
});
