export interface SalesData {
    week: string;
    'Clothing and Accessories': number;
    'Cosmetics and Skincare': number;
    'Others': number;
  }
  
  export interface EarningsData {
    totalEarnings: number;
    fashionEarnings: number;
    beautyEarnings: number;
  }
  
  export interface ClientData {
    femalePercentage: number;
    malePercentage: number;
  }
  
  export interface InventoryData {
    productName: string;
    quantity: number;
  }
  
  export interface InventoryCosts {
    holdingCosts: number;
    orderingCosts: number;
    shortageCosts: number;
  }
  export interface CustomerMetrics {
    conversionRate: number;
    acquisitionCost: number;
    platformEngagement: {
      platform: string;
      engagement: number;
      month: string;
    }[];
  }
  
  export interface PredictiveMetrics {
    salesForecast: {
      period: string;
      predicted: number;
      actual: number | null;
    }[];
    demandForecast: {
      product: string;
      predictedDemand: number;
      confidence: number;
    }[];
    productCombinations: {
      products: string[];
      confidence: number;
      revenue: number;
    }[];
  }