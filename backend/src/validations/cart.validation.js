import { z } from "zod";

export const addToCartSchema = z.object({
  body: z.object({
    productId: z.coerce.number().int().positive(),
    quantity: z.coerce.number().int().positive().max(100).optional(),
  }),
  params: z.object({}),
  query: z.object({}),
});

export const updateQtySchema = z.object({
  body: z.object({
    productId: z.coerce.number().int().positive(),
    quantity: z.coerce.number().int().positive().max(100),
  }),
  params: z.object({}),
  query: z.object({}),
});

export const cartProductParamSchema = z.object({
  body: z.object({}),
  params: z.object({
    productId: z.coerce.number().int().positive(),
  }),
  query: z.object({}),
});
