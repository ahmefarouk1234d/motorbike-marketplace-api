import * as z from "zod";
const registerSchema = z.object({
    fullName: z.string().min(1, "Full name is required"),
    email: z.email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters long"),
    phone: z.string().optional(),
    city: z.string().optional(),
    // No avatar here - it is uploaded separately via PATCH /api/auth/me/avatar.
});

const loginSchema = z.object({
    email: z.email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
});
// Used by both forgot-password and resend-verification.
const emailOnlySchema = z.object({
    email: z.email("Invalid email address"),
});

const resetPasswordSchema = z.object({
    password: z.string().min(8, "Password must be at least 8 characters long"),
});

export { registerSchema, loginSchema, emailOnlySchema, resetPasswordSchema };