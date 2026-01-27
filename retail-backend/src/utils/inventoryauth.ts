import path from "path";
import { google } from "googleapis";
import { JWT } from "google-auth-library";

export const getGoogleSheetClient = async () => {
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: path.join(__dirname, "../config/creds.json"),
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
