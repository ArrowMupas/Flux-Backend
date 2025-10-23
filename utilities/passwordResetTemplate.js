const generatePasswordResetEmail = (username, resetCode, expiryMinutes) => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Password Reset</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin:0; padding:0;">
    <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
            <td align="center">
                <table width="600" style="background:#fff; padding:20px; border-radius:8px; margin-top:50px;">
                    <tr>
                        <td align="center">
                            <h2>Password Reset Request</h2>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <p>Hello <strong>${username}</strong>,</p>
                            <p>You requested a password reset. Use the following code to reset your password (expires in ${expiryMinutes} minutes):</p>
                            <h3 style="text-align:center; background:#f59e0b; color:#fff; padding:10px 0; border-radius:8px;">${resetCode}</h3>
                            <p>If you did not request this, please ignore this email.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
};

module.exports = {
    generatePasswordResetEmail,
};