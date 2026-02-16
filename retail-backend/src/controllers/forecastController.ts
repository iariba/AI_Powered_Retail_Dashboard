import { Request, Response } from "express";
import { google } from "googleapis";
import axios from "axios";
import path from "path";
import { JWT } from "google-auth-library";
import { Inventory } from "../models/Inventory";
import { Reports } from "../models/Report";
import { AuthRequest } from "../middleware/authMiddleware";
import * as fs from "fs";
import FormData from "form-data";
import Notification from "../models/Notification";

export const generateForecastReport = async (req: AuthRequest, res: Response) => {
  try {
    const { forecastType } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized access. Please log in." });
    }

    const tempDir = path.join(__dirname, "../temp");
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    let csvPath: string | null = null;

    //  Check for existing dataset (last 6 days)
    const existingFile = fs
      .readdirSync(tempDir)
      .find((file) => file.startsWith(`sales_${userId}`) && file.endsWith(".csv"));

    if (existingFile) {
      const filePath = path.join(tempDir, existingFile);
      const stats = fs.statSync(filePath);
      const lastModified = new Date(stats.mtime);
      const sixDaysAgo = new Date();
      sixDaysAgo.setDate(sixDaysAgo.getDate() - 6);

      if (lastModified > sixDaysAgo) {
        console.log("Reusing existing dataset (last modified:", lastModified, ")");
        csvPath = filePath;
      }
    }

    //  If no valid file, fetch from Google Sheets
    if (!csvPath) {
      console.log(" Downloading fresh sales dataset...");
      const inventory = await Inventory.findOne({ userId });
      if (!inventory || !inventory.sheetUrl) {
        return res.status(404).json({ error: "No inventory linked for this user." });
      }

      const sheetIdMatch = inventory.sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (!sheetIdMatch) throw new Error("Invalid Google Sheet URL");
      const sheetId = sheetIdMatch[1];

      const keyFilePath = process.env.RENDER_SECRETS_PATH
  ? path.join(process.env.RENDER_SECRETS_PATH, "creds.json")
  : path.join(process.cwd(), "config/creds.json");

const auth = new google.auth.GoogleAuth({
  keyFile: keyFilePath,
  scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
});

      const sheets = google.sheets({ version: "v4", auth: (await auth.getClient()) as JWT });

      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: `sales`,
      });

      const rows = response.data.values || [];
      if (rows.length < 2) {
        return res.status(400).json({ error: "Sales sheet is empty." });
      }

      csvPath = path.join(tempDir, `sales_${userId}_${Date.now()}.csv`);
      const csvContent = rows.map((row) => row.join(",")).join("\n");
      fs.writeFileSync(csvPath, csvContent);
    }

    //  Prepare request to ML API
    const formData = new FormData();
    formData.append("file", fs.createReadStream(csvPath));

    const mlApiBase = process.env.ML_API;
    const mlRoute =
      forecastType === "mba"
        ? "mba"
        : forecastType === "demand"
        ? "demand"
        : forecastType === "segmentation"
        ? "segmentation"
        : null;

    if (!mlRoute) {
      return res.status(400).json({ error: "Invalid forecast type." });
    }

    console.log(` Sending dataset to ML API (${forecastType})...`);
    const mlResponse = await axios.post(`${mlApiBase}/${mlRoute}`, formData, {
      headers: { ...formData.getHeaders() },
      timeout: 900000, 
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });
    console.log(" ML API Response Keys:", Object.keys(mlResponse.data));
    console.log(" PDF Length:", mlResponse.data.pdf ? mlResponse.data.pdf.length : "No PDF returned");
    console.log(" Forecast Type:", forecastType);

    
    const pdfBase64 = mlResponse.data.pdf;
    if (!pdfBase64) throw new Error("ML API did not return a PDF");
    console.log(" PDF Base64 (first 100 chars):", pdfBase64.slice(0, 100));

    const pdfBuffer = Buffer.from(pdfBase64, "base64");
    console.log("PDF Buffer Size:", pdfBuffer.length);
    await Reports.findOneAndUpdate(
      { userId },
      { $set: { [`${forecastType}_report`]: pdfBuffer } },
      { upsert: true, new: true }
    );

const io = req.app.get("io"); 
io.to(userId.toString()).emit("reportGenerated", {
  type: forecastType,
  message: `${forecastType.toUpperCase()} report is ready`,
});


    await Notification.create({
      userId,
      type: "report",
      message: `${forecastType} report is generated`,
      severity: "low",
      read: false,
    });

    return res.json({
      message: `${forecastType.toUpperCase()} report generated and stored successfully.`,
    });
  } catch (err) {
    console.error(" Forecast Error:", err);
    return res.status(500).json({ error: "Failed to generate forecast report. Please try again later." });
  }
};
