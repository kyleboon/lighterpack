export function magicLinkHtml(url: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sign in to BaseWeight</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; background-color: #ffffff; border-radius: 8px; padding: 40px;">
                    <tr>
                        <td style="text-align: center; padding-bottom: 24px;">
                            <span style="font-size: 24px; font-weight: 700; color: #18181b;">BaseWeight</span>
                        </td>
                    </tr>
                    <tr>
                        <td style="text-align: center; padding-bottom: 16px;">
                            <h1 style="margin: 0; font-size: 20px; font-weight: 600; color: #18181b;">Sign in to BaseWeight</h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="text-align: center; padding-bottom: 32px;">
                            <p style="margin: 0; font-size: 15px; color: #52525b; line-height: 1.5;">Click the button below to sign in. This link expires in 5 minutes.</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="text-align: center; padding-bottom: 24px;">
                            <a href="${url}" style="display: inline-block; padding: 12px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; border-radius: 6px;">Sign in</a>
                        </td>
                    </tr>
                    <tr>
                        <td style="text-align: center; padding-bottom: 8px;">
                            <p style="margin: 0; font-size: 13px; color: #a1a1aa;">Or copy and paste this link into your browser:</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="text-align: center;">
                            <p style="margin: 0; font-size: 13px; color: #2563eb; word-break: break-all;">${url}</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
}

export function magicLinkText(url: string): string {
    return `Click the link below to sign in to BaseWeight. This link expires in 5 minutes.\n\n${url}`;
}
