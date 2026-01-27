export interface ReportData {
  sales?: string;  // file path for Sales forecast
  mba?: string;    // file path for Market Basket Analysis
  demand?: string; // optional, more forecast types
  [forecastType: string]: string | undefined;
  key?:string | undefined
}
