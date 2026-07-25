import mongoose from 'mongoose';
const { Schema } = mongoose;

const favoriteSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    listing: { type: Schema.Types.ObjectId, ref: 'Listing', required: true },
}, { timestamps: true });

favoriteSchema.index({ user: 1, listing: 1 }, { unique: true });

const Favorite = mongoose.model('Favorite', favoriteSchema);
export default Favorite;