<!DOCTYPE html>
<html>
<body style="margin:0; padding:0; background-color:#FAF8F4; font-family: Arial, Helvetica, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding: 32px 16px;">
        <tr>
            <td align="center">
                <table width="100%" style="max-width: 480px; background-color:#FFFFFF; border-radius: 12px; overflow: hidden; border: 1px solid #E7E3D9;">
                    <tr>
                        <td style="background-color:#2F6F4E; padding: 24px; text-align:center;">
                            <span style="color:#FFFFFF; font-size: 20px; font-weight: bold;">StoreFlow</span>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 32px 28px;">
                            <p style="font-size: 15px; color:#2B2A27; margin: 0 0 8px;">Hi {{ $name }},</p>
                            <p style="font-size: 14px; color:#6B6A63; margin: 0 0 24px; line-height: 1.5;">
                                We received a request to reset your StoreFlow password. Use the code below to continue.
                            </p>
                            <div style="text-align:center; margin-bottom: 24px;">
                                <span style="display:inline-block; background-color:#E7F3EC; color:#1F4D36; font-size: 32px; font-weight: bold; letter-spacing: 8px; padding: 16px 24px; border-radius: 10px;">
                                    {{ $code }}
                                </span>
                            </div>
                            <p style="font-size: 13px; color:#9B9A91; margin: 0; line-height: 1.5;">
                                This code expires in 15 minutes. If you didn't request a password reset, you can safely ignore this email — your password won't be changed.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
