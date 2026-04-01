export function buildEmailHtml({ name, subject, message, html, cta_url, cta_label }) {
  const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  const displayName = name || 'Team Member'
  const displayMessage = message || 'Please find below your update from the FACEPrep HR team.'
  const ctaLabel = cta_label || 'View Details'

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>${subject || 'FACEPrep HR'}</title>
</head>
<body style="margin:0;padding:0;background:#F0F0F0;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F0F0F0;">
  <tr><td align="center" style="padding:36px 12px;">
    <table width="600" cellpadding="0" cellspacing="0" border="0"
           style="width:600px;max-width:600px;background:#fff;border-radius:6px;
                  overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.09);">

      <!-- LOGO -->
      <tr>
        <td align="center" bgcolor="#ffffff"
            style="padding:30px 48px 26px;border-bottom:3px solid #f05136;">
          <img src="https://faceprep.in/wp-content/uploads/2025/01/FACE-Prep-Logo-Round-Black.png" alt="FACEPrep"
               width="160" style="display:block;width:160px;height:auto;border:0;"/>
        </td>
      </tr>

      <!-- HEADER -->
      <tr>
        <td bgcolor="#1A1A1A" style="padding:38px 48px 34px;">
          <p style="margin:0 0 12px;font-size:11px;font-weight:bold;
                    letter-spacing:.2em;text-transform:uppercase;color:#f05136;">
            HR Communication &nbsp;·&nbsp; ${subject || 'Update'}
          </p>
          <p style="margin:0 0 16px;font-family:Georgia,serif;font-size:28px;
                    font-weight:bold;line-height:1.3;color:#fff;">
            Your Update<br/><span style="color:#f05136;">from FACEPrep</span>
          </p>
          <table cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td bgcolor="#f05136" style="padding:6px 16px;border-radius:3px;">
                <span style="font-size:11px;font-weight:bold;letter-spacing:.12em;
                             text-transform:uppercase;color:#fff;">${today}</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- BODY -->
      <tr>
        <td bgcolor="#ffffff" style="padding:40px 48px 10px;">
          <p style="margin:0 0 18px;font-family:Georgia,serif;font-size:20px;
                    font-weight:bold;color:#1A1A1A;">Dear ${displayName},</p>
          <p style="margin:0 0 30px;font-size:15px;line-height:1.85;color:#555;">
            ${displayMessage}
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:30px;">
            <tr>
              <td width="48" height="3" bgcolor="#f05136" style="font-size:0;">&nbsp;</td>
              <td height="3" bgcolor="#EBEBEB" style="font-size:0;">&nbsp;</td>
            </tr>
          </table>
          ${html ? `
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:30px;">
            <tr>
              <td width="4" bgcolor="#f05136" style="font-size:0;">&nbsp;</td>
              <td bgcolor="#F8F8F8" style="padding:20px 24px;font-size:14px;line-height:1.8;color:#444;">
                ${html}
              </td>
            </tr>
          </table>` : ''}
          ${cta_url ? `
          <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:30px;">
            <tr>
              <td bgcolor="#f05136" style="padding:14px 32px;border-radius:3px;">
                <a href="${cta_url}" style="font-size:13px;font-weight:bold;
                   letter-spacing:.08em;text-transform:uppercase;
                   color:#fff;text-decoration:none;">${ctaLabel} &rarr;</a>
              </td>
            </tr>
          </table>` : ''}
        </td>
      </tr>

      <!-- SIGN-OFF -->
      <tr>
        <td bgcolor="#ffffff" style="padding:10px 48px 40px;">
          <p style="margin:0;font-size:14px;line-height:1.8;color:#555;">
            Warm regards,<br/>
            <strong style="font-size:15px;color:#1A1A1A;">FACEPrep HR Team</strong>
          </p>
        </td>
      </tr>

      <!-- FOOTER -->
      <tr>
        <td bgcolor="#1A1A1A" style="padding:22px 48px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="vertical-align:middle;">
                <img src="https://faceprep.in/wp-content/uploads/2023/10/Vector.png" alt="FACEPrep"
                     width="100" style="display:block;width:100px;height:auto;border:0;margin-bottom:8px;"/>
                <p style="margin:3px 0 0;font-size:10px;letter-spacing:.15em;
                          text-transform:uppercase;color:#666;">HR Communications</p>
              </td>
              <td align="right" style="vertical-align:middle;">
                <p style="margin:0;font-size:11px;color:#888;line-height:1.7;">
                  &copy; ${new Date().getFullYear()} FACEPrep &nbsp;&bull;&nbsp;
                  <a href="https://faceprep.in" style="color:#f05136;text-decoration:none;">faceprep.in</a>
                </p>
                <p style="margin:3px 0 0;font-size:11px;color:#606060;">Automated HR communication</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>`
}

export function stripHtml(html) {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}
