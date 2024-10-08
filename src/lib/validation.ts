import { z } from "zod";

export const signUpSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Invalid email address"),
  username: z
    .string()
    .trim()
    .min(1, "Username is required")
    .regex(/^[a-zA-Z0-9_-]+$/, "Only letters, numbers, _ and - allowed"),
  password: z.string().trim().min(8, "Password must be atleast 8 characters"),
});

export type SignUpValues = z.infer<typeof signUpSchema>;

export const loginSchema = z.object({
  username: z.string().trim().min(1, "Username is required"),
  password: z.string().trim().min(8, "Must be atleast 8 characters"),
});

export type LoginValues = z.infer<typeof loginSchema>;
