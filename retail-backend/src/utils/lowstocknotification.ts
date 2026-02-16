import Notification from "../models/Notification";

interface StockNotificationParams {
  userId: string;
  productName: string;
  stock: number;
}

export const createStockNotification = async ({
  userId,
  productName,
  stock,
}: StockNotificationParams) => {
  try {
    let type = "stock";
    let severity: "medium" | "high";
    let message: string;

    if (stock === 0) {
      severity = "high";
      message = `Out of stock alert: "${productName}" is now out of stock.`;
    } else if (stock > 0 && stock <= 10) {
      severity = "medium";
      message = `Low stock alert: "${productName}" has only ${stock} left in stock.`;
    } else {

      return;
    }


    const existing = await Notification.findOne({
      userId,
      type,
      productName,
      stock,
      message
    });

    if (existing) return;

    await Notification.create({
      userId,
      type,
      productName,
      stock,
      message,
      severity,
      read: false,
    });
  } catch (error) {
    console.error(`Notification failed for ${productName}:`, error);
  }
};
