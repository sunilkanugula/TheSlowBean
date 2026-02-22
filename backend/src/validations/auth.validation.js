import { z } from "zod";

const email = z.string().email();
const password = z.string().min(6).max(100);

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(60),
    email,
    password,
  }),
  params: z.object({}),
  query: z.object({}),
});

export const loginSchema = z.object({
  body: z.object({
    email,
    password: z.string().min(1),
  }),
  params: z.object({}),
  query: z.object({}),
});

export const googleLoginSchema = z.object({
  body: z.object({
    idToken: z.string().min(1),
  }),
  params: z.object({}),
  query: z.object({}),
});

export const emailOtpSchema = z.object({
  body: z.object({
    email,
    otp: z.string().length(6),
  }),
  params: z.object({}),
  query: z.object({}),
});

export const resendEmailSchema = z.object({
  body: z.object({
    email,
  }),
  params: z.object({}),
  query: z.object({}),
});

export const forgotPasswordSchema = resendEmailSchema;

export const resetPasswordSchema = z.object({
  body: z.object({
    email,
    newPassword: password,
  }),
  params: z.object({}),
  query: z.object({}),
});

export const changePasswordSchema = z.object({
  body: z.object({
    oldPassword: z.string().min(1),
    newPassword: password,
  }),
  params: z.object({}),
  query: z.object({}),
});
