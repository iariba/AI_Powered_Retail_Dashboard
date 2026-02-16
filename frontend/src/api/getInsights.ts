import { useQuery } from "@tanstack/react-query";
import api from "./axios";
import { InventoryReport } from "../types/inventoryInsights";

export function useInventoryInsights() {
  return useQuery<InventoryReport, Error>({
    queryKey: ["inventory-insights"],

    queryFn: async () => {
      const { data } = await api.get("/inventory/insights");
      if (!data?.report) throw new Error("No report data returned");
      return data.report;
    },

    // ALWAYS refetch when page mounts
    staleTime: Infinity,
 
    // force refetch on refresh
    refetchOnMount: false,

    // refetch when tab focus returns
    refetchOnWindowFocus: false,
    gcTime: 1000 * 60 * 60,

    retry: 1,
  });
}

export function useStockSummary() {
  return useQuery({
    queryKey: ["stock-summary"],
    queryFn: async () => {
      const { data } = await api.get("/inventory/quick-insights", {
        withCredentials: true,
      });
      return data.stockSummary;
    },
    staleTime: Infinity,
  });
}
