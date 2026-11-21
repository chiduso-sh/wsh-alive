import "server-only";

// Plain HTML + text emails. Email clients ignore stylesheets and Tailwind, so
// styles are inline and use the brand hex values directly (the one place the
// "no hard-coded hex" convention can't apply).

const C = { sage: "#6B7F5E", cream: "#F9F6F0", bark: "#3D2E1E", muted: "#6A5A4A", mist: "#D4DDD0" };

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function layout(body: string, footer: string) {
  return `<!doctype html><html><body style="margin:0;background:${C.cream};font-family:Georgia,serif;color:${C.bark}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#fff;border:1px solid ${C.mist};border-radius:16px">
<tr><td style="padding:32px">
<p style="margin:0 0 24px;font-size:22px">WSH <em style="color:${C.sage}">Alive</em></p>
${body}
</td></tr></table>
<p style="max-width:520px;margin:16px auto 0;font-family:Arial,sans-serif;font-size:12px;color:${C.muted}">${footer}</p>
</td></tr></table></body></html>`;
}

function button(href: string, label: string) {
  return `<a href="${escapeHtml(href)}" style="display:inline-block;background:${C.sage};color:#fff;text-decoration:none;font-family:Arial,sans-serif;font-size:14px;padding:12px 28px;border-radius:999px">${label}</a>`;
}

const p = (text: string) => `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:${C.muted}">${text}</p>`;

export function confirmEmail(name: string, confirmUrl: string) {
  const safe = escapeHtml(name);
  return {
    subject: "Confirm your WSH Alive subscription",
    html: layout(
      `<h1 style="margin:0 0 16px;font-size:26px;font-weight:normal">One click and you're in, ${safe}.</h1>
${p("Confirm your email to get the weekly wellness letter: one workout tip, one seasonal recipe and something good to carry into your week.")}
<p style="margin:24px 0">${button(confirmUrl, "Confirm subscription")}</p>
${p("This link expires in 48 hours.")}`,
      "You received this because someone entered this address at WSH Alive. If it wasn't you, ignore this email and you won't be subscribed.",
    ),
    text: `Hi ${name},\n\nConfirm your WSH Alive subscription:\n${confirmUrl}\n\nThis link expires in 48 hours. If you didn't sign up, ignore this email and you won't be subscribed.`,
  };
}

export function welcomeEmail(name: string, siteUrl: string, unsubscribeUrl: string) {
  const safe = escapeHtml(name);
  return {
    subject: "Welcome to WSH Alive 🌿",
    html: layout(
      `<h1 style="margin:0 0 16px;font-size:26px;font-weight:normal">Welcome, ${safe}.</h1>
${p("You're subscribed. The first letter lands on Sunday.")}
${p("While you wait, the journal has a few slow reads to start with.")}
<p style="margin:24px 0">${button(`${siteUrl}/blog`, "Read the journal")}</p>`,
      `Don't want these emails? <a href="${escapeHtml(unsubscribeUrl)}" style="color:${C.muted}">Unsubscribe</a>.`,
    ),
    text: `Welcome, ${name}.\n\nYou're subscribed to WSH Alive. The first letter lands on Sunday.\n\nRead the journal: ${siteUrl}/blog\n\nUnsubscribe: ${unsubscribeUrl}`,
  };
}
