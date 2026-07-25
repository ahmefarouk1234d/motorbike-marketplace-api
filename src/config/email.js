import nodemailer from 'nodemailer';
import AppError from '../utils/AppError.js';

const REQUIRED_VARS = ['EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_USER', 'EMAIL_PASS'];

let transporter = null;

// Built on first use rather than at startup, so the server still runs when no
// mail credentials are configured. Only the endpoints that send mail fail.
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
        // Port 465 is implicit TLS; 587 and 25 start plaintext and upgrade
        // with STARTTLS, which nodemailer negotiates when secure is false.
        secure: port === 465,
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });

    return transporter;
};

export default getTransporter;
