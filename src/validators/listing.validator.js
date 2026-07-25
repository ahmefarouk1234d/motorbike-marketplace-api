import * as z from "zod";

// These routes now accept multipart/form-data, where every text field arrives as
// a string. z.coerce.number() parses before validating - a plain z.number() would
// reject "45000" and fail every create request.
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

// `images` is deliberately absent from both schemas. Zod strips unknown keys, so
// a client that posts its own images array has it discarded - the controller
// builds that field from the uploaded files instead.
export { createListingSchema, updateListingSchema };
