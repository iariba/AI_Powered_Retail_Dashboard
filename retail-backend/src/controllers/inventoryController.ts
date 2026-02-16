import { Request, Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import { getGoogleSheetMeta } from "../utils/inventory";
import { Inventory } from "../models/Inventory";
import User from "../models/User";
import { google } from "googleapis";
import { JWT } from "google-auth-library";
import path from "path";
import dayjs, { Dayjs } from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import { io } from "../server"; 
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

function buildTopStockProducts(products: any[], sales: any[]) {

  const latestSaleDate = dayjs.max(
    sales
      .map(s => dayjs(s.sale_date))
      .filter(d => d.isValid())
  );

  if (!latestSaleDate) return [];

  const oneMonthAgo = latestSaleDate.subtract(1, "month");

  const salesByProduct: Record<string, number> = {};

  sales
    .filter(s => {
      const d = dayjs(s.sale_date);
      return d.isValid() && d.isAfter(oneMonthAgo) && d.isBefore(latestSaleDate.add(1,"day"));
    })
    .forEach(s => {
      salesByProduct[s.product_id] =
        (salesByProduct[s.product_id] || 0) + Number(s.total_price || 0);
    });

  return Object.entries(salesByProduct)
    .sort((a, b) => {
      if (b[1] === a[1]) return a[0].localeCompare(b[0]); 
      return b[1] - a[1];
    })
    .slice(0, 5)
    .map(([pid]) => {
      const product = products.find(p => p.product_id === pid);
      return {
        product_id: pid,
        product_name: product?.product_name || "Unknown",
        stock_quantity: product?.stock_quantity || "0",
      };
    });
}

const watchGoogleSheet = async (userId: string, sheetId: string) => {
  try {

    const keyFilePath = process.env.RENDER_SECRETS_PATH
  ? path.join(process.env.RENDER_SECRETS_PATH, "creds.json")
  : path.join(process.cwd(), "config/creds.json");

const auth = new google.auth.GoogleAuth({
  keyFile: keyFilePath,
  scopes: ["https://www.googleapis.com/auth/drive"],
});
   
    const drive = google.drive({ version: "v3", auth });

    if (!process.env.BASE_URL || !process.env.BASE_URL.startsWith("https://")) {
      throw new Error("BASE_URL must be a valid HTTPS URL for Google webhook callback.");
    }

    const channelId = uuidv4();
    const webhookUrl = `${process.env.BASE_URL}/sheet-change-webhook`;

    const watchRes = await drive.files.watch({
      fileId: sheetId,
      requestBody: {
        id: channelId,
        type: "web_hook",
        address: webhookUrl,
      },
    });

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

    await watchGoogleSheet(req.user.id, sheetId); 

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

// WEBHOOK LISTENER
export const handleSheetWebhook = async (req: Request, res: Response) => {
  try {
    console.log("Webhook triggered! Headers:", req.headers); 
    console.log(" Webhook body:", req.body);
    const resourceId = req.headers["x-goog-resource-id"] as string;
    const channelId = req.headers["x-goog-channel-id"] as string;
    const state = req.headers["x-goog-resource-state"] as string;

    if (!resourceId || !channelId) {
      console.warn(" Missing webhook headers.");
      return res.status(400).send("Invalid webhook request.");
    }

    if (state === "sync") {
      console.log("Webhook sync event received. No action required.");
      return res.status(200).send("OK");
    }

    const inventory = await Inventory.findOne({ "watchChannel.channelId": channelId });
    if (!inventory) {
      console.warn(`No inventory found for channelId: ${channelId}`);
      return res.status(404).send("No matching inventory webhook.");
    }

    const keyFilePath = process.env.RENDER_SECRETS_PATH
  ? path.join(process.env.RENDER_SECRETS_PATH, "creds.json")
  : path.join(__dirname, "../config/creds.json"); 

const auth = new google.auth.GoogleAuth({
  keyFile: keyFilePath,
  scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
});

    const sheets = google.sheets({ version: "v4", auth: (await auth.getClient()) as JWT });

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

    const products = await fetchSheet("products");
    const sales = await fetchSheet("sales");

    if (!products.length || !sales.length) {
      console.warn(" Missing products or sales data.");
      return res.status(400).send("Sheet data incomplete.");
    }

    const totalProducts = products.length;
    const outOfStock = products.filter((p) => Number(p.stock_quantity) === 0).length;
    const lowStock = products.filter((p) => {
      const qty = Number(p.stock_quantity);
      return qty > 0 && qty <= 10;
    }).length;

    const recentSales = sales.filter((s) => dayjs(s.sale_date).isAfter(dayjs().subtract(1, "month")));
    const salesByProduct: Record<string, number> = {};
    recentSales.forEach((s) => {
      salesByProduct[s.product_id] = (salesByProduct[s.product_id] || 0) + Number(s.total_price || 0);
    });

 const topStockProducts = buildTopStockProducts(products, sales);

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

    const result = await Inventory.deleteOne({ userId: req.user.id });


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

    if (!req.user?.id) {
      return res.status(401).json({ error: "Unauthorized access. Please log in." });
    }

    const cacheKey = `insights_${req.user.id}`;
    const cached = insightsCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return res.json({ report: cached.data });
    }

    const inventory = await Inventory.findOne({ userId: req.user.id });
    if (!inventory || !inventory.sheetUrl) {
      return res.status(404).json({ error: "No inventory linked for this user." });
    }

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

 /////-----insights------////

    const totalProducts = products.length;

    const outOfStockProducts = products.filter(
      (p) => Number(p.stock_quantity) === 0
    );
    const lowStockProducts = products.filter(
      (p) => Number(p.stock_quantity) > 0 && Number(p.stock_quantity) <= 10
    );
    const outOfStock = outOfStockProducts.length;
    const lowStock = lowStockProducts.length;


const saleDates = sales
  .map((s) => dayjs(s.sale_date))
  .filter((d) => d.isValid());

const latestSaleDateOrNull = dayjs.max(saleDates); 
const latestSaleDate: Dayjs = latestSaleDateOrNull ?? dayjs();

const fourWeeksAgo: Dayjs = latestSaleDate.subtract(4, "week");

const oneMonthAgo = latestSaleDate
  ? latestSaleDate.subtract(1, "month")
  : dayjs().subtract(1, "month");

const recentSales = sales.filter(
  (s) =>
    dayjs(s.sale_date).isValid() &&
    (latestSaleDate ? dayjs(s.sale_date).isAfter(oneMonthAgo) : true)
);


    const salesByProduct: Record<string, number> = {};
    recentSales.forEach((s) => (salesByProduct[s.product_id] = (salesByProduct[s.product_id] || 0) + Number(s.total_price || 0)));

  const topStockProducts = buildTopStockProducts(products, sales);


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

const platformScores: Record<string, number> = {};

socialMetrics.forEach((m) => {
  const score = Number(m.likes || 0) + 2 * Number(m.shares || 0) + 3 * Number(m.comments || 0);
  platformScores[m.platform] = (platformScores[m.platform] || 0) + score;
});

const engagementScores = Object.entries(platformScores).map(([platform, total_score]) => ({
  platform,
  total_score,
}));

const maxEngagement = Math.max(...engagementScores.map((e) => e.total_score), 1);

const socialEngagement = engagementScores
  .map((e) => ({
    platform: e.platform,
    total_score: e.total_score,
    scaled_score: ((e.total_score / maxEngagement) * 100).toFixed(2),
  }))
  .filter((e) => ['Facebook', 'Twitter', 'Instagram'].includes(e.platform)) 
  .sort((a, b) => Number(b.scaled_score) - Number(a.scaled_score));



if (saleDates.length === 0) {
  console.warn("No valid sales dates found.");
  return []; 
}

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
export const getStockQuickUpdate = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const inventory = await Inventory.findOne({ userId: req.user.id });
    if (!inventory || !inventory.sheetUrl) {
      return res.status(404).json({ error: "No inventory linked" });
    }

    // extract sheet id
    const sheetIdMatch = inventory.sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!sheetIdMatch) throw new Error("Invalid sheet URL");
    const sheetId = sheetIdMatch[1];

    const keyFilePath = process.env.RENDER_SECRETS_PATH
      ? path.join(process.env.RENDER_SECRETS_PATH, "creds.json")
      : path.join(__dirname, "../config/creds.json");

    const auth = new google.auth.GoogleAuth({
      keyFile: keyFilePath,
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({
      version: "v4",
      auth: await auth.getClient() as JWT,
    });

    // fetch only products + sales
    const fetchSheet = async (name: string) => {
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: `${name}!A1:Z1000`,
      });

      const rows = res.data.values || [];
      if (rows.length < 2) return [];
      const headers = rows[0];

      return rows.slice(1).map(r =>
        Object.fromEntries(headers.map((h, i) => [h, r[i] || ""]))
      );
    };

    const [products, sales] = await Promise.all([
      fetchSheet("products"),
      fetchSheet("sales"),
    ]);

    // -------- STOCK SUMMARY --------
    const totalProducts = products.length;

    const outOfStock = products.filter(p => Number(p.stock_quantity) === 0).length;
    const lowStock = products.filter(
      p => Number(p.stock_quantity) > 0 && Number(p.stock_quantity) <= 10
    ).length;
  

    // -------- TOP STOCK PRODUCTS --------
    const salesByProduct: Record<string, number> = {};

    sales.forEach(s => {
      salesByProduct[s.product_id] =
        (salesByProduct[s.product_id] || 0) + Number(s.total_price || 0);
    });

 const topStockProducts = buildTopStockProducts(products, sales);


  return {
  stockSummary: { totalProducts, outOfStock, lowStock },
  topStockQuantityProducts: topStockProducts,
};

  } catch (err) {
    console.error("Quick stock fetch failed:", err);
    return{ error: "Failed to fetch quick stock update" };
  }
};

export const updateProductStock = async (req: AuthRequest, res: Response) => {
  try {
    const { productName, newStockQuantity } = req.body;

    if (!req.user?.id) {
      return res.status(401).json({ error: "Unauthorized access. Please log in." });
    }
    if (!productName || newStockQuantity === undefined) {
      return res.status(400).json({ error: "Product name and new stock quantity are required." });
    }

    const inventory = await Inventory.findOne({ userId: req.user.id });
    if (!inventory || !inventory.sheetUrl) {
      return res.status(404).json({ error: "No inventory linked for this user." });
    }

    const sheetIdMatch = inventory.sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!sheetIdMatch) throw new Error("Invalid Google Sheet URL");
    const sheetId = sheetIdMatch[1];

    const keyFilePath = process.env.RENDER_SECRETS_PATH
  ? path.join(process.env.RENDER_SECRETS_PATH, "creds.json")
  : path.join(__dirname, "../config/creds.json"); // fallback for local dev

const auth = new google.auth.GoogleAuth({
  keyFile: keyFilePath,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

    const sheets = google.sheets({ version: "v4", auth: (await auth.getClient()) as JWT });

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


    const productRowIndex = rows.findIndex((row, i) => i > 0 && row[productIndex]?.toLowerCase() === productName.toLowerCase());
    if (productRowIndex === -1) {
      return res.status(404).json({ error: `Product '${productName}' not found in sheet.` });
    }


    const targetCell = `products!${String.fromCharCode(65 + stockIndex)}${productRowIndex + 1}`;
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: targetCell,
      valueInputOption: "RAW",
      requestBody: {
        values: [[newStockQuantity]],
      },
    });
      console.log("stock updated in sheet")
    insightsCache.delete(`insights_${req.user.id}`);

    if (newStockQuantity <= 10) {

  await createStockNotification({
    userId: req.user.id,
    productName,
    stock: newStockQuantity,
  });
} else {

  await Notification.create({
    userId: req.user.id,
    type: "stock",
    productName,
    stock: newStockQuantity,
    message: `Stock updated for ${productName}. New stock: ${newStockQuantity}`,
    severity: "low",
  });
}

  
    
    try{
 const quickInsights: any = await getStockQuickUpdate(req, res);
 io.to(req.user.id).emit("stock-update", {
   stockSummary: quickInsights.stockSummary,
    topStockQuantityProducts: quickInsights.topStockQuantityProducts,
});
    }
   catch(err){
     console.error("Failed to emit real-time stock update:", err);
   }

    return res.json({ message: `Stock for '${productName}' updated to ${newStockQuantity}. Notification created.` });

  } catch (error: any) {
    console.error("Error updating product stock:", error);
    return res.status(500).json({ error: "Failed to update stock quantity." });
  }
};

