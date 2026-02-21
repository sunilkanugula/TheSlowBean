import { z } from "zod";

export const updateOrderStatusSchema = z.object({
  body: z.object({
    status: z.enum(["CONFIRMED"]),
  }),
  params: z.object({
    orderId: z.coerce.number().int().positive(),
  }),
  query: z.object({}),
});

export const returnDecisionSchema = z.object({
  body: z.object({
    decision: z.enum(["ACCEPT", "REJECT"]),
    reason: z.string().min(2).max(1000),
  }),
  params: z.object({
    orderId: z.coerce.number().int().positive(),
  }),
  query: z.object({}),
});

export const adminOrderNoteSchema = z.object({
  body: z.object({
    type: z.enum(["NOTE", "FAILED_REASON", "RETURN_REASON"]).optional(),
    title: z.string().min(2).max(120),
    note: z.string().min(2).max(1000),
  }),
  params: z.object({
    orderId: z.coerce.number().int().positive(),
  }),
  query: z.object({}),
});
