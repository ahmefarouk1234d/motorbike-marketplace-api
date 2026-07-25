import mongoose from 'mongoose';

// Shared shape for anything living in Firebase Storage. `path` is the object's
// location inside the bucket - storing it is what makes deletion possible later,
// so it is kept alongside the url rather than parsed back out of it.
const fileSchema = new mongoose.Schema({
    url: { type: String, required: true },
    path: { type: String, required: true }
}, { _id: false });

export default fileSchema;
