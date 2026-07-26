import nodemailer from 'nodemailer';
import AppError from '../utils/AppError.js';

const REQUIRED_VARS = ['EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_USER', 'EMAIL_PASS'];

let transporter = null;

const getTransporter = () => {
    if (transporter) return transporter;

    const missing = REQUIRED_VARS.filter((name) => !process.env[name]);
    if (missing.length) {
        throw new AppError(`Email is not configured. Missing: ${missing.join(', ')}`, 500);
    }

    const port = Number(process.env.EMAIL_PORT);
    transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port,
        secure: port === 465,
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });

    return transporter;
};

export default getTransporter;
