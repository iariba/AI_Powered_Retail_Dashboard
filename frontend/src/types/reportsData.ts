export interface ReportData {
  sales?: string;  
  mba?: string;    
  demand?: string; 
  [forecastType: string]: string | undefined;
  key?:string | undefined
}
