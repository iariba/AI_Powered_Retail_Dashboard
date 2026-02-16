import api from "./axios"; 


export const runForecast = async (forecastType: "mba" | "segmentation" | "demand") => {
  try {
    const response = await api.post(`/forecast`, { forecastType });
    return response.data; // contains pdf (base64), message, and report data
  } catch (error) {
    console.error(`Error running ${forecastType} forecast:`, error);
    throw error;
  }
};
