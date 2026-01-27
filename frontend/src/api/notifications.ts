// src/api/notifications.ts
import api from "./axios";

export const getNotifications = async () => {
  try {
    console.log("Fetching notifications...");
    const { data } = await api.get("/notify"); // ✅ uses axios middle & base URL

    return data;
    console.log(data) // assuming response is an array of notifications
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
    alert("Could not fetch notifications. Please try again.");
    return [];
  }
};
