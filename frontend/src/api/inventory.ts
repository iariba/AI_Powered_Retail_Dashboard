import api from "./axios"; 


// Fetch connected inventory
export const getConnectedInventory = async () => {
  const response = await api.get("/inventory/string");
  return response.data;
};

// Connect inventory
export const connectInventory = async (inventoryLink: string) => {
  const response = await api.post("/inventory/connect", { inventoryLink });
  return response.data;
};

// Disconnect inventory
export const disconnectInventory = async () => {
  const response = await api.post("/inventory/disconnect");
  return response.data;
};
