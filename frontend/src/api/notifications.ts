// src/api/notifications.ts
import api from "./axios";

export const getNotifications = async () => {
  try {
    console.log("Fetching notifications...");
    const { data } = await api.get("/notify"); 

    return data;
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
    alert("Could not fetch notifications. Please try again.");
    return [];
  }
};
