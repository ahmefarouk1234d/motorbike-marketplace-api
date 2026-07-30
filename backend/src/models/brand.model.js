import mongoose from 'mongoose';
import fileSchema from './file.schema.js';
const { Schema } = mongoose;
const brandSchema = new Schema({
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, trim: true },
    logo: { type: fileSchema, default: undefined },
}, { timestamps: true });

const Brand = mongoose.model('Brand', brandSchema);
export default Brand;