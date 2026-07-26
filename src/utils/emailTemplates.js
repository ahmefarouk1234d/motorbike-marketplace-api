const layout = (heading, body, actionUrl, actionLabel) => `
<div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#1a1a1a">
  <h2 style="margin:0 0 16px">${heading}</h2>
  <p style="margin:0 0 20px;line-height:1.6">${body}</p>
  <p style="margin:0 0 24px">
    <a href="${actionUrl}" style="background:#1a1a1a;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;display:inline-block">${actionLabel}</a>
  </p>
  <p style="margin:0;font-size:13px;color:#666;line-height:1.6">
    If the button does not work, paste this into your browser:<br>
    <span style="word-break:break-all">${actionUrl}</span>
  </p>
</div>`;

export const verificationEmail = (url) => ({
    subject: 'Confirm your email address',
    text: `Welcome to Motorbike Marketplace.\n\nConfirm your email address by opening this link:\n${url}\n\nThe link expires in 24 hours. If you did not create an account, ignore this message.`,
    html: layout(
        'Confirm your email address',
        'Welcome to Motorbike Marketplace. Confirm your address to finish setting up your account. This link expires in 24 hours.',
        url,
        'Confirm email'
    )
});

export const passwordResetEmail = (url) => ({
    subject: 'Reset your password',
    text: `Reset your Motorbike Marketplace password by opening this link:\n${url}\n\nThe link expires in 60 minutes. If you did not request a reset, ignore this message and your password will stay unchanged.`,
    html: layout(
        'Reset your password',
        'We received a request to reset your password. This link expires in 60 minutes. If you did not ask for this, you can ignore this email and nothing will change.',
        url,
        'Reset password'
    )
});
