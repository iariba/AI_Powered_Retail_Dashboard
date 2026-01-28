import path from "path";
import { google } from "googleapis";
import { JWT } from "google-auth-library";
import fs from "fs"
export const getGoogleSheetClient = async () => {
  try {

    const keyFilePath = process.env.RENDER_SECRETS_PATH
  ? path.join(process.env.RENDER_SECRETS_PATH, "creds.json")
  : path.join(__dirname, "../config/creds.json"); // fallback for local dev

const auth = new google.auth.GoogleAuth({
  keyFile: keyFilePath,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});
  

    const authClient = await auth.getClient() as JWT;

    const sheets = google.sheets({
      version: "v4",
      auth: authClient,
    });

    return sheets;
  } catch (error: any) {
    console.error("Failed to authenticate Google Sheets API:", error.message);
    throw new Error("Google Sheets authentication failed.");
  }
};
