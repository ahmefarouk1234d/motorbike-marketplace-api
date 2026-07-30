import mongoose from 'mongoose';

const fileSchema = new mongoose.Schema({
    url: { type: String, required: true },
    path: { type: String, required: true }
}, { _id: false });

export default fileSchema;
