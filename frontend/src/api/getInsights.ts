import { useQuery } from "@tanstack/react-query";
import api from "./axios";

export function useInventoryInsights() {
  const token = localStorage.getItem("token");

  return useQuery({
    queryKey: ["inventory-insights"],
    queryFn: async () => {
      const { data } = await api.get("/inventory/insights");
      if (!data?.report) throw new Error("No report data returned");
      return data.report;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
    enabled: !!token, 
  });
}
