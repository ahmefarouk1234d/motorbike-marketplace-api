import * as z from "zod";

const createListingSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    price: z.coerce.number().min(0, "Price cannot be negative"),
    brand: z.string().min(1, "Brand is required"),
    model: z.string().min(1, "Model is required"),
    year: z.coerce.number().min(1900).max(new Date().getFullYear()),
    mileage: z.coerce.number().min(0),
    engineCC: z.coerce.number().min(0),
    condition: z.enum(["new", "used"]),
    city: z.string().min(1, "City is required")
});

const updateListingSchema = z.object({
    title: z.string().min(3).optional(),
    description: z.string().min(10).optional(),
    price: z.coerce.number().min(0).optional(),
    model: z.string().min(1).optional(),
    year: z.coerce.number().min(1900).max(new Date().getFullYear()).optional(),
    mileage: z.coerce.number().min(0).optional(),
    engineCC: z.coerce.number().min(0).optional(),
    condition: z.enum(["new", "used"]).optional(),
    city: z.string().min(1).optional()
});

export { createListingSchema, updateListingSchema };
