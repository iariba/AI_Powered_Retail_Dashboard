const { getSheetIdFromUrl, getGoogleSheetClient, readSheet } = require('../utils/sheets');

exports.getInsights = async (sheetUrl) => {
  try {
    const sheetId = getSheetIdFromUrl(sheetUrl);
    const sheets = await getGoogleSheetClient();
    const meta = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
    const sheetTitles = meta.data.sheets.map(s => s.properties.title);

    const data = {};
    for (const title of sheetTitles) {
      data[title] = await readSheet(sheets, sheetId, title);
    }

    const sales = data["sales"] || [];
    const products = data["products"] || [];
    const clients = data["clients"] || [];
    const social = data["social_media_metrics"] || [];

    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const earnings = sales
      .filter(s => new Date(s.sale_date) >= lastMonth && new Date(s.sale_date) <= lastMonthEnd)
      .reduce((acc, s) => acc + parseFloat(s.total_price || 0), 0);

    const productSales = {};
    sales.forEach(s => {
      productSales[s.product_id] = (productSales[s.product_id] || 0) + parseFloat(s.total_price || 0);
    });

    const topProducts = Object.entries(productSales)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([id, total]) => {
        const prod = products.find(p => p.product_id === id);
        return { name: prod?.product_name || id, total };
      });

    const lowStock = products.filter(p => parseInt(p.quantity || 0) < 10);
    const outOfStock = products.filter(p => parseInt(p.quantity || 0) === 0);

    const genderCounts = clients.reduce((acc, c) => {
      const g = c.gender?.toLowerCase();
      if (g === "male" || g === "female") acc[g]++;
      return acc;
    }, { male: 0, female: 0 });

    const engagement = social.map(platform => ({
      platform: platform.platform,
      score: Math.round(
        (parseInt(platform.likes || 0) + parseInt(platform.comments || 0) * 2 + parseInt(platform.shares || 0) * 3) / 10
      )
    }));

    return {
      total_earnings_last_month: earnings,
      top_selling_products: topProducts,
      total_products: products.length,
      low_stock: lowStock.length,
      out_of_stock: outOfStock.length,
      gender_ratio: genderCounts,
      social_engagement: engagement
    };
  } catch (err) {
    console.error("Service error:", err);
    throw err;
  }
};