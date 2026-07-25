import * as z from "zod";

// `logo` is uploaded as a file, so it is not accepted from the request body.
const createBrandSchema = z.object({
    name: z.string().min(1, "Brand name is required"),
    description: z.string().optional()
});

const updateBrandSchema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional()
});

export { createBrandSchema, updateBrandSchema };
