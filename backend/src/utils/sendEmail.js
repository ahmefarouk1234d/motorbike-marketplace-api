import getTransporter from '../config/email.js';

const DEFAULT_FROM = 'Motorbike Marketplace <no-reply@motorbike-marketplace.local>';

const sendEmail = async ({ to, subject, text, html }) => {
    await getTransporter().sendMail({
        from: process.env.EMAIL_FROM || DEFAULT_FROM,
        to,
        subject,
        text,
        html
    });
};

export default sendEmail;
