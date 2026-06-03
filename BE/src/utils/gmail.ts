import { google } from "googleapis";

type EmailLocale = "vi" | "en";

type ResetPasswordEmailPayload = {
	toEmail: string;
	toName?: string;
	resetUrl: string;
	locale?: EmailLocale;
};

type VerificationEmailPayload = {
	toEmail: string;
	toName?: string;
	verificationUrl: string;
	locale?: EmailLocale;
};

type EmailTemplate = {
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

function getTemplate(locale: EmailLocale, displayName: string): EmailTemplate {
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

function getVerificationTemplate(locale: EmailLocale, displayName: string): EmailTemplate {
	if (locale === "en") {
		return {
			subject: "ArenaS - Verify your email address",
			preheader: "Please verify your email address to complete registration.",
			headline: "Verify Your Email Address",
			greeting: `Hi ${displayName},`,
			intro: "Welcome to ArenaS! Please verify your email address to get started.",
			action: "Verify Email",
			expires: "This link will expire in 24 hours.",
			fallback: "If the button does not work, copy and paste this link into your browser:",
			ignore: "If you did not create an account, you can safely ignore this email.",
			signOff: "Best regards,",
			team: "ArenaS Team",
		};
	}

	return {
		subject: "ArenaS - XÁC NHẬN ĐỊA CHỈ EMAIL",
		preheader: "Vui lòng xác nhận email để hoàn tất đăng ký.",
		headline: "Xác Nhận Email Của Bạn",
		greeting: `Xin chào ${displayName},`,
		intro: "Chào mừng bạn đến với ArenaS! Vui lòng xác nhận địa chỉ email của bạn để bắt đầu.",
		action: "Xác Nhận Email",
		expires: "Liên kết này sẽ hết hạn trong 24 giờ.",
		fallback: "Nếu nút bấm không hoạt động, hãy sao chép liên kết sau vào trình duyệt:",
		ignore: "Nếu bạn không tạo tài khoản, bạn có thể bỏ qua email này.",
		signOff: "Trân trọng,",
		team: "ArenaS Team",
	};
}

function buildHtmlEmail(template: EmailTemplate, actionUrl: string): string {
	return `
		<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${template.preheader}</div>
		<div style="font-family:'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;background-color:#0f172a;padding:40px 20px;color:#cbd5e1;line-height:1.6;">
			<div style="max-width:600px;margin:0 auto;background-color:#1e293b;border-radius:16px;overflow:hidden;box-shadow:0 10px 25px rgba(0,0,0,0.5);border:1px solid #334155;">
				
				<!-- Header Section -->
				<div style="text-align:center;padding:40px 20px 30px;border-bottom:1px solid #334155;background: radial-gradient(circle at top, #1e293b 0%, #0f172a 100%);">
					<h1 style="margin:0;font-size:36px;font-weight:900;letter-spacing:4px;color:#f8fafc;text-transform:uppercase;text-shadow: 0 0 20px rgba(34,197,94,0.3);">
						ARENA<span style="color:#84cc16;">S</span>
					</h1>
					<p style="margin:12px 0 0;font-size:12px;color:#94a3b8;letter-spacing:2px;text-transform:uppercase;font-weight:600;">Hệ thống đặt sân thể thao thông minh</p>
				</div>

				<!-- Body Section -->
				<div style="padding:40px 40px 30px;">
					<h2 style="margin:0 0 25px;font-size:22px;font-weight:700;color:#f8fafc;letter-spacing:-0.5px;">${template.headline}</h2>
					<p style="margin:0 0 15px;font-size:15px;color:#e2e8f0;">${template.greeting}</p>
					<p style="margin:0 0 20px;font-size:15px;">${template.intro}</p>
					
					<!-- Call to Action Button -->
					<div style="margin:40px 0;text-align:center;">
						<a href="${actionUrl}" style="display:inline-block;background-color:#84cc16;color:#0f172a;text-decoration:none;padding:16px 40px;border-radius:12px;font-weight:800;font-size:15px;text-transform:uppercase;letter-spacing:1px;box-shadow:0 8px 20px rgba(132, 204, 22, 0.25);border: 1px solid #a3e635;">
							${template.action}
						</a>
					</div>
					
					<p style="margin:0 0 30px;font-size:14px;color:#ef4444;font-weight:600;text-align:center;background:#ef444415;padding:10px;border-radius:8px;border: 1px dashed #ef444450;">
						 ${template.expires}
					</p>

					<!-- Fallback Link -->
					<div style="background-color:#0f172a;border-radius:12px;padding:20px;margin-bottom:30px;border:1px solid #334155;">
						<p style="margin:0 0 10px;font-size:12px;color:#94a3b8;font-weight:500;">${template.fallback}</p>
						<p style="margin:0;font-size:13px;color:#38bdf8;word-break:break-all;line-height:1.4;">${actionUrl}</p>
					</div>

					<p style="margin:0 0 15px;font-size:13px;color:#64748b;">${template.ignore}</p>
					
					<!-- Sign Off -->
					<div style="margin-top:40px;padding-top:25px;border-top:1px solid #334155;">
						<p style="margin:0;font-size:14px;color:#e2e8f0;">${template.signOff}</p>
						<p style="margin:6px 0 0;font-size:15px;font-weight:800;color:#84cc16;letter-spacing:0.5px;">${template.team}</p>
					</div>
				</div>
				
				<!-- Footer Section -->
				<div style="background-color:#0f172a;padding:24px;text-align:center;font-size:11px;color:#475569;">
					<p style="margin:0;font-weight:500;">© ${new Date().getFullYear()} ArenaS Platform. All rights reserved.</p>
					<p style="margin:6px 0 0;">Email được gửi tự động từ hệ thống bảo mật của ArenaS.</p>
				</div>

			</div>
		</div>
	`;
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

	const html = buildHtmlEmail(template, resetUrl);

	const raw = buildRawEmail(toEmail, template.subject, html, text);

	await gmail.users.messages.send({
		userId: "me",
		requestBody: {
			raw,
		},
	});
}

export async function sendVerificationEmail({
	toEmail,
	toName,
	verificationUrl,
	locale = "vi",
}: VerificationEmailPayload): Promise<void> {
	const clientId = getOauthClientId();
	const clientSecret = getOauthClientSecret();

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
	const template = getVerificationTemplate(locale, displayName);
	const text = [
		template.headline,
		"",
		template.greeting,
		template.intro,
		template.expires,
		"",
		`${template.action}: ${verificationUrl}`,
		"",
		template.ignore,
		`${template.signOff} ${template.team}`,
	].join("\n");

	const html = buildHtmlEmail(template, verificationUrl);

	const raw = buildRawEmail(toEmail, template.subject, html, text);

	await gmail.users.messages.send({
		userId: "me",
		requestBody: {
			raw,
		},
	});
}
