import mongoose from 'mongoose';
import fileSchema from './file.schema.js';
const { Schema } = mongoose;
const listingSchema = new Schema({
    title: { type: String, required: true, trim: true },
    description : { type: String,required: true,  },
    price: { type: Number, required: true ,min: 0},
    brand : { type: Schema.Types.ObjectId, ref: 'Brand', required: true },
    model : { type: String, required: true, trim: true },
    year : { type: Number, required: true, min: 1900, max: new Date().getFullYear() },
    mileage : { type: Number, required: true, min: 0 },
    engineCC : { type: Number, required: true, min: 0 },
    condition : { type: String, enum: ['new', 'used'], required: true },
    images: { type: [fileSchema], default: [] },
    seller : { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status : { type: String, enum: ['pending','approved','rejected','sold'], default: 'pending' },
    viewsCount : { type: Number, default: 0 },
    city: { type: String, required: true, trim: true }
}, { timestamps: true });

const Listing = mongoose.model('Listing', listingSchema);
export default Listing;