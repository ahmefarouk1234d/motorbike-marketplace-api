import mongoose from 'mongoose';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fileSchema from './file.schema.js';

const { Schema } = mongoose;
const SALT_ROUNDS = 12;
const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;

const userSchema = new Schema({
    fullName: { type: String, required: true, trim: true },
    email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false, minlength: 8 },
    phone:    String,
    city:     String,
    avatar:   { type: fileSchema, default: undefined },
    role:     { type: String, enum: ['buyer', 'seller', 'admin'], default: 'buyer' },
    isVerified: { type: Boolean, default: false },

    verificationToken:   { type: String, select: false },
    verificationExpires: { type: Date, select: false },
    passwordResetToken:   { type: String, select: false },
    passwordResetExpires: { type: Date, select: false }
}, { timestamps: true });

userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;

    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function (candidate) {
    return bcrypt.compare(candidate, this.password);
};

userSchema.methods.generateJWT = function () {
    return jwt.sign({ id: this._id, role: this.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
};

const issueToken = (doc, tokenField, expiryField, ttlMs) => {
    const raw = crypto.randomBytes(32).toString('hex');
    doc[tokenField] = crypto.createHash('sha256').update(raw).digest('hex');
    doc[expiryField] = new Date(Date.now() + ttlMs);
    return raw;
};

userSchema.methods.createVerificationToken = function () {
    return issueToken(this, 'verificationToken', 'verificationExpires', VERIFICATION_TTL_MS);
};

userSchema.methods.createPasswordResetToken = function () {
    return issueToken(this, 'passwordResetToken', 'passwordResetExpires', PASSWORD_RESET_TTL_MS);
};

userSchema.statics.hashToken = (raw) => crypto.createHash('sha256').update(raw).digest('hex');

const User = mongoose.model('User', userSchema);
export default User;
