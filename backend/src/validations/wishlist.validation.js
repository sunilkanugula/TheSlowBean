import { z } from "zod";

export const wishlistBodySchema = z.object({
  body: z.object({
    productId: z.coerce.number().int().positive(),
  }),
  params: z.object({}),
  query: z.object({}),
});

export const wishlistParamSchema = z.object({
  body: z.object({}),
  params: z.object({
    productId: z.coerce.number().int().positive(),
  }),
  query: z.object({}),
});
