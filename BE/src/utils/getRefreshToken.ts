import "dotenv/config";
import { google } from "googleapis";
import * as readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function run() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = "https://developers.google.com/oauthplayground";

  if (!clientId || !clientSecret) {
    console.error("Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in .env");
    process.exit(1);
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri
  );

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://mail.google.com/"],
    prompt: "consent", // Force to get a refresh token
  });

  console.log("\n==================================================");
  console.log("BƯỚC 1: Hãy thêm đường link sau vào phần 'Authorized redirect URIs' của OAuth Client ID trên Google Cloud Console rồi lưu lại:");
  console.log(redirectUri);
  console.log("==================================================\n");

  console.log("BƯỚC 2: Mở đường link dưới đây trên trình duyệt để cấp quyền Gmail:");
  console.log(authUrl);
  console.log("\n==================================================");

  console.log("Sau khi cấp quyền, trình duyệt sẽ chuyển hướng bạn về oauthplayground kèm theo một đoạn code trên URL (ví dụ: ?code=4/0AeaY...&scope=...).");
  console.log("Hãy copy ĐOẠN CODE đó và dán vào đây.");

  rl.question("\nNhập code của bạn: ", async (code) => {
    try {
      const { tokens } = await oauth2Client.getToken(code.trim());
      console.log("\n🎉 THÀNH CÔNG! Đây là Refresh Token của bạn:");
      console.log("==================================================");
      console.log(tokens.refresh_token);
      console.log("==================================================\n");
      console.log("Hãy copy dòng trên và dán vào GMAIL_REFRESH_TOKEN trong file .env nhé!");
    } catch (error) {
      console.error("\n❌ Lỗi khi lấy token:", error instanceof Error ? error.message : String(error));
    } finally {
      rl.close();
    }
  });
}

run();
