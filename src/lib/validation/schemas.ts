import { z } from "zod";

export const emailSchema = z.string().email().max(255);
export const passwordSchema = z.string().min(8).max(128);

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128),
});

export const projectCreateSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(5000).optional(),
  cultureId: z.string().uuid().optional(),
  occasion: z.string().max(255).optional(),
  budget: z.number().positive().optional(),
  targetCompletionDate: z.string().optional(),
});

export const projectUpdateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(5000).nullable().optional(),
  status: z.string().max(50).optional(),
  assignedDesigner: z.string().uuid().nullable().optional(),
  targetCompletionDate: z.string().nullable().optional(),
});

export const briefSchema = z.object({
  cultureId: z.string().optional(),
  occasion: z.string().optional(),
  budget: z.number().positive().optional(),
});

// Keep legacy export name used by earlier stubs.
export const projectSchema = projectCreateSchema;
