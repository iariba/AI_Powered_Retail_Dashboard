import api from "./axios"; // Adjust path if different

/**
 * Hits backend forecast endpoint for the given forecast type.
 * @param forecastType "mba" | "segmentation" | "demand"
 * @returns Response data with PDF buffer and additional info.
 */
export const runForecast = async (forecastType: "mba" | "segmentation" | "demand") => {
  try {
    const response = await api.post(`/forecast`, { forecastType });
    return response.data; // contains pdf (base64), message, and report data
  } catch (error) {
    console.error(`❌ Error running ${forecastType} forecast:`, error);
    throw error;
  }
};
