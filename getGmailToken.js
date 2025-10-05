import { google } from "googleapis";
import readline from "readline";

const oAuth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  "http://localhost:3000/oauth2callback"
);

const authUrl = oAuth2Client.generateAuthUrl({
  access_type: "offline",
  scope: ["https://mail.google.com/"],
});

console.log("Authorize this app by visiting this URL:\n", authUrl);

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.question("\nEnter the code from that page here: ", async (code) => {
  try {
    const { tokens } = await oAuth2Client.getToken(code.trim());
    console.log("\n✅ Refresh token:", tokens.refresh_token);
  } catch (err) {
    console.error("❌ Error retrieving access token:", err);
  }
  rl.close();
});
