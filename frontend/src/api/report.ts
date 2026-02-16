import axiosInstance from "./axios";

export const getReports = async () => {
  try {
    const response = await axiosInstance.get("/reports/get");
    console.log(response)
    return response.data; 
  } catch (error: any) {
    console.error(" Error fetching reports:", error.response?.data || error.message);
    throw error.response?.data || { error: "Failed to fetch reports." };
  }
};

export const deleteReport = async (reportType: "mba" | "demand" | "segmentation") => {
  try {
    const response = await axiosInstance.delete("/reports/delete", {
      data: { reportType },
    });
    return response.data; 
  } catch (error: any) {
    console.error("Error deleting report:", error.response?.data || error.message);
    throw error.response?.data || { error: "Failed to delete report." };
  }
};
