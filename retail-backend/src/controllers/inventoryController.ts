import { Request, Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import { getGoogleSheetMeta } from "../utils/inventory";
import { Inventory } from "../models/Inventory";
import User from "../models/User";
import { google } from "googleapis";
import { JWT } from "google-auth-library";
import path from "path";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import { io } from "../server"; // Socket.IO instance
import cron from "node-cron";
import { v4 as uuidv4 } from "uuid";
import { createStockNotification } from "../utils/lowstocknotification";
import Notification from "../models/Notification";
import minMax from "dayjs/plugin/minMax";
import fs from "fs";
dayjs.extend(isoWeek);
dayjs.extend(minMax);
const insightsCache: Map<string, { data: any; timestamp: number }> = new Map();
const CACHE_DURATION = 60 * 1000; // 1 min

//  SUBSCRIBE TO GOOGLE SHEET CHANGES
const watchGoogleSheet = async (userId: string, sheetId: string) => {
  try {

    const keyFilePath = process.env.RENDER_SECRETS_PATH
  ? path.join(process.env.RENDER_SECRETS_PATH, "creds.json")
  : path.join(__dirname, "../config/creds.json"); // fallback for local dev

const auth = new google.auth.GoogleAuth({
  keyFile: keyFilePath,
  scopes: ["https://www.googleapis.com/auth/drive"],
});
   
    const drive = google.drive({ version: "v3", auth });

    // Ensure BASE_URL is HTTPS
    if (!process.env.BASE_URL || !process.env.BASE_URL.startsWith("https://")) {
      throw new Error("BASE_URL must be a valid HTTPS URL for Google webhook callback.");
    }

    const channelId = uuidv4();
    const webhookUrl = `${process.env.BASE_URL}/sheet-change-webhook`;

    //  Create Watch Subscription
    const watchRes = await drive.files.watch({
      fileId: sheetId,
      requestBody: {
        id: channelId,
        type: "web_hook",
        address: webhookUrl,
      },
    });

    // Save channel info in DB
    await Inventory.findOneAndUpdate(
      { userId },
      {
        watchChannel: {
          channelId,
          sheetId,
          expiration: watchRes.data.expiration || null,
        },
      },
      { new: true }
    );

    console.log(" Webhook subscribed successfully:", channelId);
  } catch (err) {
    console.error("Failed to subscribe webhook:", err);
    throw err;
  }
};

// AUTO-RENEW WEBHOOK EVERY HOUR
cron.schedule("0 * * * *", async () => {
  try {
    const inventories = await Inventory.find({ "watchChannel.expiration": { $exists: true } });

    for (const inv of inventories) {
      if (!inv.watchChannel?.expiration) continue;

      const expiry = Number(inv.watchChannel.expiration);
      // Renew if less than 1 hour left
      if (dayjs().isAfter(dayjs(expiry).subtract(1, "hour"))) {
        console.log(`🔄 Renewing webhook for user: ${inv.userId}`);
        await watchGoogleSheet(inv.userId.toString(), inv.sheetId);
      }
    }
  } catch (err) {
    console.error("Webhook auto-renew failed:", err);
  }
});


//  CONNECT INVENTORY SHEET 
export const connectInventorySheet = async (req: AuthRequest, res: Response) => {
  try {
    const { sheetUrl } = req.body;
    if (!sheetUrl) return res.status(400).json({ error: "Google Sheet URL is required." });
    if (!req.user?.id) return res.status(401).json({ error: "Unauthorized access." });

    const sheetMeta = await getGoogleSheetMeta(sheetUrl);
    if (!sheetMeta.length) return res.status(400).json({ error: "No sheets found." });

    await Inventory.deleteMany({ userId: req.user.id });

    const sheetIdMatch = sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!sheetIdMatch) return res.status(400).json({ error: "Invalid Google Sheet URL." });
    const sheetId = sheetIdMatch[1];

    await Inventory.create({ userId: req.user.id, sheetUrl, sheetId });
    await User.findByIdAndUpdate(req.user.id, { googleSheetUrl: sheetUrl });

    await watchGoogleSheet(req.user.id, sheetId); // Subscribe immediately

    res.status(200).json({ message: "Google Sheet connected & webhook subscribed.", sheetsAvailable: sheetMeta });
  } catch (error: any) {
    console.error(" Google Sheet connection failed:", error.message);
    res.status(500).json({ error: "Failed to connect to Google Sheet." });
  }
};
export const getConnectedInventorySheet = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.id) return res.status(401).json({ error: "Unauthorized access." });

    const inventory = await Inventory.findOne({ userId: req.user.id });
    if (!inventory) {
      return res.status(200).json({ message: "No inventory connected.", sheetUrl: null });
    }

    res.status(200).json({ sheetUrl: inventory.sheetUrl });
  } catch (error) {
    console.error("Error fetching connected inventory:", error);
    res.status(500).json({ error: "Failed to fetch connected inventory." });
  }
};

// WEBHOOK LISTENER: Real-time stock insights push
export const handleSheetWebhook = async (req: Request, res: Response) => {
  try {
    //  Verify required headers
    console.log("Webhook triggered! Headers:", req.headers); //  LOG HEADERS
    console.log(" Webhook body:", req.body);
    const resourceId = req.headers["x-goog-resource-id"] as string;
    const channelId = req.headers["x-goog-channel-id"] as string;
    const state = req.headers["x-goog-resource-state"] as string;

    if (!resourceId || !channelId) {
      console.warn(" Missing webhook headers.");
      return res.status(400).send("Invalid webhook request.");
    }

    //  Ignore "sync" notifications (Google sends initial sync pings)
    if (state === "sync") {
      console.log("Webhook sync event received. No action required.");
      return res.status(200).send("OK");
    }

    //  Find the inventory by matching the channel ID
    const inventory = await Inventory.findOne({ "watchChannel.channelId": channelId });
    if (!inventory) {
      console.warn(`No inventory found for channelId: ${channelId}`);
      return res.status(404).send("No matching inventory webhook.");
    }

    // Authenticate Google Sheets API
    const keyFilePath = process.env.RENDER_SECRETS_PATH
  ? path.join(process.env.RENDER_SECRETS_PATH, "creds.json")
  : path.join(__dirname, "../config/creds.json"); // fallback for local dev

const auth = new google.auth.GoogleAuth({
  keyFile: keyFilePath,
  scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
});

    const sheets = google.sheets({ version: "v4", auth: (await auth.getClient()) as JWT });

    //  Helper: Fetch Google Sheet tab data
    const fetchSheet = async (sheetName: string) => {
      const resp = await sheets.spreadsheets.values.get({
        spreadsheetId: inventory.sheetId,
        range: `${sheetName}!A1:Z1000`,
      });
      const rows = resp.data.values || [];
      if (rows.length < 2) return [];
      const headers = rows[0];
      return rows.slice(1).map((r) => Object.fromEntries(headers.map((h, i) => [h, r[i] || ""])));
    };

    //  Fetch necessary sheets
    const products = await fetchSheet("products");
    const sales = await fetchSheet("sales");

    if (!products.length || !sales.length) {
      console.warn(" Missing products or sales data.");
      return res.status(400).send("Sheet data incomplete.");
    }

    //  Compute stock summary
    const totalProducts = products.length;
    const outOfStock = products.filter((p) => Number(p.stock_quantity) === 0).length;
    const lowStock = products.filter((p) => {
      const qty = Number(p.stock_quantity);
      return qty > 0 && qty <= 10;
    }).length;

    // Compute top stock products (based on recent sales)
    const recentSales = sales.filter((s) => dayjs(s.sale_date).isAfter(dayjs().subtract(1, "month")));
    const salesByProduct: Record<string, number> = {};
    recentSales.forEach((s) => {
      salesByProduct[s.product_id] = (salesByProduct[s.product_id] || 0) + Number(s.total_price || 0);
    });

    const topStockProducts = Object.entries(salesByProduct)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([pid]) => ({
        product_name: products.find((p) => p.product_id === pid)?.product_name || "Unknown",
        stock_quantity: products.find((p) => p.product_id === pid)?.stock_quantity || "0",
      }));

    //  Emit real-time updates via Socket.IO
    io.emit(`inventory-updated-${inventory.userId}`, {
      stockSummary: { totalProducts, outOfStock, lowStock },
      topStockProducts,
    });

    console.log(` Real-time inventory update emitted for user ${inventory.userId}.`);
    return res.status(200).send("OK");
  } catch (err) {
    console.error(" Webhook handler failed:", err);
    return res.status(500).send("Webhook error");
  }
};
export const disconnectInventorySheet = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: "Unauthorized access." });
    }

    //  Delete the inventory document for this user
    const result = await Inventory.deleteOne({ userId: req.user.id });

    //  Also clear googleSheetUrl from User model (if stored there)
    await User.findByIdAndUpdate(req.user.id, { $unset: { googleSheetUrl: "" } });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "No connected inventory found for this user." });
    }

    res.status(200).json({ message: "Inventory disconnected successfully. All related data removed." });
  } catch (error: any) {
    console.error(" Failed to disconnect inventory:", error.message);
    res.status(500).json({ error: "Failed to disconnect inventory." });
  }
};

export const getInventoryInsights = async (req: AuthRequest, res: Response) => {
  try {
    // Verify authentication
    if (!req.user?.id) {
      return res.status(401).json({ error: "Unauthorized access. Please log in." });
    }

    const cacheKey = `insights_${req.user.id}`;
    const cached = insightsCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
      return res.json({ report: cached.data });
    }

    //  Get user's inventory
    const inventory = await Inventory.findOne({ userId: req.user.id });
    if (!inventory || !inventory.sheetUrl) {
      return res.status(404).json({ error: "No inventory linked for this user." });
    }

    //  Extract Sheet ID and setup Sheets API
    const sheetIdMatch = inventory.sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!sheetIdMatch) throw new Error("Invalid Google Sheet URL");
    const sheetId = sheetIdMatch[1];

    const keyFilePath = process.env.RENDER_SECRETS_PATH
  ? path.join(process.env.RENDER_SECRETS_PATH, "creds.json")
  : path.join(__dirname, "../config/creds.json"); // fallback for local dev

const auth = new google.auth.GoogleAuth({
  keyFile: keyFilePath,
  scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
});
 
    const sheets = google.sheets({ version: "v4", auth: await auth.getClient() as JWT });

    // Helper to fetch sheet data
    const fetchSheet = async (sheetName: string) => {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: `${sheetName}!A1:Z1000`,
      });
      const rows = response.data.values || [];
      if (rows.length < 2) return [];
      const headers = rows[0];
      return rows.slice(1).map((r) => Object.fromEntries(headers.map((h, i) => [h, r[i] || ""])));
    };

    // Fetch sheets
    const [products, sales, clients, socialMetrics, leads, leadProducts, procurements] =
      await Promise.all([
        fetchSheet("products"),
        fetchSheet("sales"),
        fetchSheet("clients"),
        fetchSheet("social_media_metrics"),
        fetchSheet("leads"),
        fetchSheet("lead_products"),
        fetchSheet("suppliers"), 
      ]);

    if (!products.length || !sales.length) {
      return res.status(400).json({ error: "Products or Sales sheet is missing or empty." });
    }

    // -------------------- INSIGHTS --------------------
    const totalProducts = products.length;
    const outOfStockProducts = products.filter(
      (p) => Number(p.stock_quantity) === 0
    );
    const lowStockProducts = products.filter(
      (p) => Number(p.stock_quantity) > 0 && Number(p.stock_quantity) <= 10
    );
    const outOfStock = outOfStockProducts.length;
    const lowStock = lowStockProducts.length;
    const oneMonthAgo = dayjs().subtract(1, "month");
    const recentSales = sales.filter((s) => dayjs(s.sale_date).isAfter(oneMonthAgo));

    const salesByProduct: Record<string, number> = {};
    recentSales.forEach((s) => (salesByProduct[s.product_id] = (salesByProduct[s.product_id] || 0) + Number(s.total_price || 0)));

    const topStockProducts = Object.entries(salesByProduct)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([pid]) => ({
        product_name: products.find((p) => p.product_id === pid)?.product_name || "Unknown",
        stock_quantity: products.find((p) => p.product_id === pid)?.stock_quantity || "0",
      }));

    const monthlyEarnings = recentSales.reduce((sum, s) => sum + Number(s.total_price || 0), 0);

    const revenueByProduct: Record<string, number> = {};
    recentSales.forEach((s) => (revenueByProduct[s.product_id] = (revenueByProduct[s.product_id] || 0) + Number(s.total_price || 0)));
    const topRevenueProducts = Object.entries(revenueByProduct)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([pid, revenue]) => ({
        product_name: products.find((p) => p.product_id === pid)?.product_name || "Unknown",
        revenue_generated: revenue,
      }));

    const genderCounts: Record<string, number> = {};
    clients.forEach((c) => (genderCounts[c.gender] = (genderCounts[c.gender] || 0) + 1));
    const totalClients = clients.length || 1;
    const genderDistribution = Object.entries(genderCounts).map(([gender, count]) => ({
      gender,
      percentage: ((count / totalClients) * 100).toFixed(2),
    }));

    // Step 1: Aggregate engagement per platform
const platformScores: Record<string, number> = {};

socialMetrics.forEach((m) => {
  const score = Number(m.likes || 0) + 2 * Number(m.shares || 0) + 3 * Number(m.comments || 0);
  platformScores[m.platform] = (platformScores[m.platform] || 0) + score;
});

// Step 2: Convert to array
const engagementScores = Object.entries(platformScores).map(([platform, total_score]) => ({
  platform,
  total_score,
}));

// Step 3: Scale scores and pick top platforms
const maxEngagement = Math.max(...engagementScores.map((e) => e.total_score), 1);

const socialEngagement = engagementScores
  .map((e) => ({
    platform: e.platform,
    total_score: e.total_score,
    scaled_score: ((e.total_score / maxEngagement) * 100).toFixed(2),
  }))
  .filter((e) => ['Facebook', 'Twitter', 'Instagram'].includes(e.platform)) // keep only required platforms
  .sort((a, b) => Number(b.scaled_score) - Number(a.scaled_score));


      const saleDates = sales
  .map((s) => dayjs(s.sale_date))
  .filter((d) => d.isValid());

//  Handle empty or invalid sales dates
if (saleDates.length === 0) {
  console.warn("No valid sales dates found.");
  return []; // or handle gracefully (e.g., return empty weeklySales)
}

//  Get the latest sale date safely
const latestSaleDate = dayjs.max(saleDates) as dayjs.Dayjs;

// Compute range for last 4 weeks (based on sheet dates, not current date)
const fourWeeksAgo = latestSaleDate.subtract(4, "week");

//  Aggregate weekly sales
const weeklySalesMap: Record<string, { total_units_sold: number; total_sales_amount: number }> = {};

sales
  .filter((s) => dayjs(s.sale_date).isValid() && dayjs(s.sale_date).isAfter(fourWeeksAgo))
  .forEach((s) => {
    const weekKey = `${dayjs(s.sale_date).year()}-W${dayjs(s.sale_date).isoWeek()}`;
    if (!weeklySalesMap[weekKey]) {
      weeklySalesMap[weekKey] = { total_units_sold: 0, total_sales_amount: 0 };
    }
    weeklySalesMap[weekKey].total_units_sold += Number(s.quantity || 0);
    weeklySalesMap[weekKey].total_sales_amount += Number(s.total_price || 0);
  });

// Convert map to array and sort chronologically
const weeklySales = Object.entries(weeklySalesMap)
  .map(([week, vals]) => ({ week, ...vals }))
  .sort((a, b) => {
    const [yearA, weekA] = a.week.split("-W").map(Number);
    const [yearB, weekB] = b.week.split("-W").map(Number);
    return yearA === yearB ? weekA - weekB : yearA - yearB;
  });

    const leadBreakdown = {
      lead: leads.filter((l) => !l.converted || l.converted === "").length,
      qualified: leads.filter((l) => l.converted === "0").length,
      converted: leads.filter((l) => l.converted === "1").length,
    };

    const topLeadCounts: Record<string, number> = {};
    leadProducts.forEach((lp) => (topLeadCounts[lp.product_id] = (topLeadCounts[lp.product_id] || 0) + 1));
    const top5LeadProducts = Object.entries(topLeadCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([pid]) => pid);

    const leadConversionTimes: { product_name: string; avg_conversion_time_days: number }[] = [];
    leadProducts.forEach((lp) => {
      const lead = leads.find((l) => l.lead_id === lp.lead_id && l.converted === "1");
      if (lead && top5LeadProducts.includes(lp.product_id)) {
        const product = products.find((p) => p.product_id === lp.product_id);
        const leadTime = dayjs().diff(dayjs(lead.created_at), "day");
        leadConversionTimes.push({ product_name: product?.product_name || "Unknown", avg_conversion_time_days: leadTime });
      }
    });

    const avgLeadConversion = Object.values(
      leadConversionTimes.reduce((acc: any, item) => {
        if (!acc[item.product_name]) acc[item.product_name] = { total: 0, count: 0 };
        acc[item.product_name].total += item.avg_conversion_time_days;
        acc[item.product_name].count += 1;
        return acc;
      }, {})
    ).map((val: any, idx) => ({
      product_name: Object.keys(topLeadCounts)[idx],
      avg_conversion_time_days: val.total / val.count,
    }));

    const stockoutProducts = products
      .map((p) => {
        const totalSales = sales.filter((s) => s.product_id === p.product_id).reduce((sum, s) => sum + Number(s.quantity), 0);
        const stockoutFlag = Number(p.stock_quantity) === 0 ? 1 : 0;
        const stockoutPercentage = totalSales > 0 ? (stockoutFlag / totalSales) * 100 : 0;
        return { product_name: p.product_name, stockout_percentage: stockoutPercentage };
      })
      .sort((a, b) => b.stockout_percentage - a.stockout_percentage)
      .slice(0, 5);

    const holdingCost = products.reduce((sum, p) => sum + Number(p.stock_quantity) * Number(p.cost_price || 0), 0);
    const orderingCost = procurements.reduce((sum, po) => {
      const product = products.find((p) => p.product_id === po.product_id);
      return sum + Number(po.quantity || 0) * Number(product?.cost_price || 0);
    }, 0);
    const shortageCost = products.reduce((sum, p) => sum + (Number(p.stock_quantity) <= 0 ? Number(p.cost_price || 0) * 10 : 0), 0);

    const inventoryCostDistribution = { holdingCost, orderingCost, shortageCost };
    for (const product of outOfStockProducts) {
      await createStockNotification({
        userId: inventory.userId.toString(),
        productName: product.product_name,
        stock: 0,
      });
    }
    
    for (const product of lowStockProducts) {
      await createStockNotification({
        userId: inventory.userId.toString(),
        productName: product.product_name,
        stock: Number(product.stock_quantity),
      });
    }
    
    
    const report = {
      stockSummary: { totalProducts,outOfStock, lowStock},
      topStockQuantityProducts: topStockProducts,
      monthlyEarnings,
      topRevenueProducts,
      genderDistribution,
      socialEngagement,
      weeklySales,
      leadBreakdown,
      topLeadConvertedProducts: avgLeadConversion,
      topStockoutRateProducts: stockoutProducts,
      inventoryCostDistribution,
    };
    
    insightsCache.set(cacheKey, { data: report, timestamp: Date.now() });
    return res.json({ report });
  } catch (error: any) {
    console.error(" Failed to extract inventory insights:", error.message);
    res.status(500).json({ error: "Failed to extract inventory insights." });
  }
};
export const updateProductStock = async (req: AuthRequest, res: Response) => {
  try {
    const { productName, newStockQuantity } = req.body;

    //  Validate input
    if (!req.user?.id) {
      return res.status(401).json({ error: "Unauthorized access. Please log in." });
    }
    if (!productName || newStockQuantity === undefined) {
      return res.status(400).json({ error: "Product name and new stock quantity are required." });
    }

    //  Get user's inventory
    const inventory = await Inventory.findOne({ userId: req.user.id });
    if (!inventory || !inventory.sheetUrl) {
      return res.status(404).json({ error: "No inventory linked for this user." });
    }

    //  Extract Sheet ID
    const sheetIdMatch = inventory.sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!sheetIdMatch) throw new Error("Invalid Google Sheet URL");
    const sheetId = sheetIdMatch[1];

    //  Setup Google Sheets API
    const keyFilePath = process.env.RENDER_SECRETS_PATH
  ? path.join(process.env.RENDER_SECRETS_PATH, "creds.json")
  : path.join(__dirname, "../config/creds.json"); // fallback for local dev

const auth = new google.auth.GoogleAuth({
  keyFile: keyFilePath,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

    const sheets = google.sheets({ version: "v4", auth: (await auth.getClient()) as JWT });

    //  Fetch the "products" tab data
    const range = `products!A1:Z1000`;
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range,
    });

    const rows = response.data.values || [];
    if (rows.length < 2) return res.status(404).json({ error: "Products sheet is empty or malformed." });

    const headers = rows[0];
    const productIndex = headers.findIndex((h) => h.toLowerCase() === "product_name" || h.toLowerCase() === "product");
    const stockIndex = headers.findIndex((h) => h.toLowerCase() === "stock_quantity" || h.toLowerCase() === "stock");

    if (productIndex === -1 || stockIndex === -1) {
      return res.status(400).json({ error: "Products sheet must have 'product_name' and 'stock_quantity' columns." });
    }

    //  Find the product row
    const productRowIndex = rows.findIndex((row, i) => i > 0 && row[productIndex]?.toLowerCase() === productName.toLowerCase());
    if (productRowIndex === -1) {
      return res.status(404).json({ error: `Product '${productName}' not found in sheet.` });
    }

    // Update the stock quantity
    const targetCell = `products!${String.fromCharCode(65 + stockIndex)}${productRowIndex + 1}`;
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: targetCell,
      valueInputOption: "RAW",
      requestBody: {
        values: [[newStockQuantity]],
      },
    });

    // Create notification after successful stock update
    await Notification.create({
      userId: req.user.id,
      type: "stock",
      productName,
      stock: newStockQuantity,
      message: `Stock updated for ${productName}. New stock: ${newStockQuantity}`,
      severity: "low",
    });

    return res.json({ message: `Stock for '${productName}' updated to ${newStockQuantity}. Notification created.` });

  } catch (error: any) {
    console.error("Error updating product stock:", error);
    return res.status(500).json({ error: "Failed to update stock quantity." });
  }
};