import axiosInstance from "./axios";

/**
 * Fetch all reports for the logged-in user
 */
export const getReports = async () => {
  try {
    const response = await axiosInstance.get("/reports/get");
    console.log(response)
    return response.data; // { message, reports: { mba, demand, segmentation } }
  } catch (error: any) {
    console.error("❌ Error fetching reports:", error.response?.data || error.message);
    throw error.response?.data || { error: "Failed to fetch reports." };
  }
};

/**
 * Delete a specific report for the logged-in user
 * @param reportType "mba" | "demand" | "segmentation"
 */
export const deleteReport = async (reportType: "mba" | "demand" | "segmentation") => {
  try {
    const response = await axiosInstance.delete("/reports/delete", {
      data: { reportType },
    });
    return response.data; // { message }
  } catch (error: any) {
    console.error("❌ Error deleting report:", error.response?.data || error.message);
    throw error.response?.data || { error: "Failed to delete report." };
  }
};
