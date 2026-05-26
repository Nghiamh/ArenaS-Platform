import { google } from "googleapis";

type EmailLocale = "vi" | "en";

type ResetPasswordEmailPayload = {
	toEmail: string;
	toName?: string;
	resetUrl: string;
	locale?: EmailLocale;
};

type ResetPasswordTemplate = {
	subject: string;
	preheader: string;
	headline: string;
	greeting: string;
	intro: string;
	action: string;
	expires: string;
	fallback: string;
	ignore: string;
	signOff: string;
	team: string;
};

function getRequiredEnv(name: string): string {
	const value = process.env[name]?.trim();
	if (!value) {
		throw new Error(`Missing ${name} in environment variables`);
	}
	return value;
}

function getOauthClientId(): string {
	const value = process.env.GMAIL_CLIENT_ID?.trim() || process.env.GOOGLE_CLIENT_ID?.trim();
	if (!value) {
		throw new Error("Missing GMAIL_CLIENT_ID (or GOOGLE_CLIENT_ID) in environment variables");
	}
	return value;
}

function getOauthClientSecret(): string {
	const value =
		process.env.GMAIL_CLIENT_SECRET?.trim() || process.env.GOOGLE_CLIENT_SECRET?.trim();
	if (!value) {
		throw new Error("Missing GMAIL_CLIENT_SECRET (or GOOGLE_CLIENT_SECRET) in environment variables");
	}
	return value;
}

function getTemplate(locale: EmailLocale, displayName: string): ResetPasswordTemplate {
	if (locale === "en") {
		return {
			subject: "ArenaS - Reset your password",
			preheader: "Password reset link valid for 15 minutes.",
			headline: "Reset Your ArenaS Password",
			greeting: `Hi ${displayName},`,
			intro: "We received a request to reset the password for your ArenaS account.",
			action: "Reset Password",
			expires: "This link will expire in 15 minutes.",
			fallback: "If the button does not work, copy and paste this link into your browser:",
			ignore: "If you did not request this, you can safely ignore this email.",
			signOff: "Best regards,",
			team: "ArenaS Team",
		};
	}

	return {
		subject: "ArenaS - ĐẶT LẠI MẬT KHẨU",
		preheader: "Liên kết đặt lại mật khẩu có hiệu lực trong 15 phút.",
		headline: "Đặt Lại Mật Khẩu ArenaS",
		greeting: `Xin chào ${displayName},`,
		intro: "Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản ArenaS của bạn.",
		action: "Đặt Lại Mật Khẩu",
		expires: "Liên kết này sẽ hết hạn trong 15 phút.",
		fallback: "Nếu nút bấm không hoạt động, hãy sao chép liên kết sau vào trình duyệt:",
		ignore: "Nếu bạn không thực hiện yêu cầu này, bạn có thể bỏ qua email này.",
		signOff: "Trân trọng,",
		team: "ArenaS Team",
	};
}

function encodeHeaderUtf8(value: string): string {
	const base64 = Buffer.from(value, "utf8").toString("base64");
	return `=?UTF-8?B?${base64}?=`;
}

function buildRawEmail(
	toEmail: string,
	subject: string,
	html: string,
	text: string
): string {
	const boundary = "arena-reset-boundary";
	const encodedSubject = encodeHeaderUtf8(subject);
	// Fallback to EMAIL_USER if GMAIL_SENDER_EMAIL is not set, since they have it in .env
	const senderEmail = process.env.GMAIL_SENDER_EMAIL?.trim() || process.env.EMAIL_USER?.trim();
	
	if (!senderEmail) {
		throw new Error("Missing GMAIL_SENDER_EMAIL or EMAIL_USER in environment variables");
	}

	const emailLines = [
		`From: ArenaS <${senderEmail}>`,
		`To: ${toEmail}`,
		`Subject: ${encodedSubject}`,
		"MIME-Version: 1.0",
		`Content-Type: multipart/alternative; boundary=\"${boundary}\"`,
		"",
		`--${boundary}`,
		"Content-Type: text/plain; charset=utf-8",
		"",
		text,
		"",
		`--${boundary}`,
		"Content-Type: text/html; charset=utf-8",
		"",
		html,
		"",
		`--${boundary}--`,
	];

	return Buffer.from(emailLines.join("\r\n")).toString("base64url");
}

export async function sendResetPasswordEmail({
	toEmail,
	toName,
	resetUrl,
	locale = "vi",
}: ResetPasswordEmailPayload): Promise<void> {
	const clientId = getOauthClientId();
	const clientSecret = getOauthClientSecret();
	
	// Fallback to check if they named it GOOGLE_REFRESH_TOKEN
	const refreshToken = process.env.GMAIL_REFRESH_TOKEN?.trim() || process.env.GOOGLE_REFRESH_TOKEN?.trim();
	
	if (!refreshToken) {
		throw new Error("Missing GMAIL_REFRESH_TOKEN in environment variables");
	}

	const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
	oauth2Client.setCredentials({
		refresh_token: refreshToken,
	});

	const gmail = google.gmail({ version: "v1", auth: oauth2Client });
	const displayName = toName?.trim() || "bạn";
	const template = getTemplate(locale, displayName);
	const text = [
		template.headline,
		"",
		template.greeting,
		template.intro,
		template.expires,
		"",
		`${template.action}: ${resetUrl}`,
		"",
		template.ignore,
		`${template.signOff} ${template.team}`,
	].join("\n");
	
	const html = `
		<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${template.preheader}</div>
		<div style="font-family:Verdana,Arial,sans-serif;background:#f1f5f9;padding:28px 12px;color:#0f172a;">
			<div style="max-width:620px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #dbeafe;">
				<div style="background:linear-gradient(135deg,#1d4ed8,#0ea5e9);padding:24px 28px;color:#ffffff;">
					<div style="font-size:22px;font-weight:800;letter-spacing:0.2px;">ArenaS</div>
					<div style="margin-top:8px;font-size:14px;opacity:0.92;">${template.preheader}</div>
				</div>
				<div style="padding:28px;line-height:1.7;">
					<h2 style="margin:0 0 12px;font-size:24px;line-height:1.3;color:#0f172a;">${template.headline}</h2>
					<p style="margin:0 0 10px;">${template.greeting}</p>
					<p style="margin:0 0 8px;">${template.intro}</p>
					<p style="margin:0 0 18px;color:#334155;">${template.expires}</p>
					<p style="margin:0 0 24px;">
						<a href="${resetUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:700;">${template.action}</a>
					</p>
					<p style="margin:0 0 8px;color:#475569;font-size:14px;">${template.fallback}</p>
					<p style="margin:0 0 16px;word-break:break-word;font-size:13px;background:#eff6ff;padding:10px;border-radius:8px;">${resetUrl}</p>
					<p style="margin:0 0 14px;color:#475569;font-size:14px;">${template.ignore}</p>
					<p style="margin:0;color:#0f172a;">${template.signOff}<br/>${template.team}</p>
				</div>
			</div>
			<div style="max-width:620px;margin:14px auto 0;text-align:center;font-size:12px;color:#64748b;">ArenaS Security Notification</div>
		</div>
	`;

	const raw = buildRawEmail(toEmail, template.subject, html, text);

	await gmail.users.messages.send({
		userId: "me",
		requestBody: {
			raw,
		},
	});
}
