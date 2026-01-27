import { useEffect, useState } from "react";
import { Navbar } from "../layout/Navbar";
import { SalesChart } from "../components/SalesChart";
import { ClientAnalysis } from "../components/ClientAnalysis";
import { EarningsOverview } from "../components/EarningsOverview";
import { InventoryOverview } from "../components/InventoryOverview";
import { InventoryLevel } from "@/components/InventoryLevel";
import StockOut from "@/components/StockOut";
import InventoryCostDistribution from "@/components/InventoryCostDistribution";
import LeadTime from "@/components/LeadTimeAnalysis";
import { LeadBreakdown } from "@/components/LeadBreakdown";
import { SocialMediaEngagement } from "@/components/SocialMediaEngagement";
import { useInventoryInsights } from "../api/getInsights";
import socket from "../socket";
import { useQueryClient } from "@tanstack/react-query";
 // ✅ Import the socket instance

export function Dashboard() {
  const { data: insights, isLoading } = useInventoryInsights();
  const queryClient = useQueryClient();

  const [stockSummary, setStockSummary] = useState<any>(null);
  const [topStockQuantityProducts, setTopStockQuantityProducts] = useState<any>([]);

  // ✅ Load cached stockUpdate on mount
  useEffect(() => {
    const cached = localStorage.getItem("stockUpdate");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setStockSummary(parsed.stockSummary || null);
        setTopStockQuantityProducts(parsed.topStockQuantityProducts || []);
      } catch {
        console.warn("Invalid cached stockUpdate");
      }
    }
  }, []);

  // ✅ Handle API response (initial insights load)
  useEffect(() => {
    if (insights) {
      setStockSummary(insights.stockSummary || null);
      setTopStockQuantityProducts(insights.topStockQuantityProducts || []);
    }
  }, [insights]);

  // ✅ Listen for real-time socket updates
  useEffect(() => {
    const handleStockUpdate = (data: any) => {
      console.log(" [Dashboard] Stock update received:", data);
      setStockSummary(data.stockSummary || null);
      setTopStockQuantityProducts(data.topStockQuantityProducts || []);

      localStorage.setItem("stockUpdate", JSON.stringify(data));

      // Optionally refetch insights for consistency
      queryClient.invalidateQueries({ queryKey: ["inventory-insights"], refetchType: "inactive" });
    };

    // Listen for updates
    socket.on("stock-update", handleStockUpdate);

    // Cleanup on unmount
    return () => {
      socket.off("stock-update", handleStockUpdate);
    };
  }, [queryClient]);


  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="p-4 lg:ml-52 xl:ml-72 lg:p-6 xl:p-8 overflow-x-hidden max-w-screen-xl mx-auto">
        <div className="w-full max-w-screen-xl mx-auto px-4 overflow-x-hidden">
          
          {/* Earnings + Inventory */}
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
            <EarningsOverview
              totalEarnings={parseFloat(insights?.monthlyEarnings || "0")}
              topRevenueProducts={insights?.topRevenueProducts?.map((p: any) => ({
                product_name: p.product_name,
                revenue_generated: parseFloat(p.revenue_generated),
              }))}
            />
            <InventoryOverview data={stockSummary} />
          </div>

          {/* Sales + Stock Level */}
          <div className="grid gap-y-6 md:gap-6 grid-cols-1 md:grid-cols-2 my-6">
            <SalesChart weeklySalesLast4Weeks={insights?.weeklySales || []} />
            <InventoryLevel data={topStockQuantityProducts} />
          </div>

          {/* Stockout + Cost Distribution */}
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 my-10">
            <StockOut
              data={insights?.topStockoutRateProducts?.map((p: any) => ({
                product_name: p.product_name,
                stockout_percentage: parseFloat(p.stockout_percentage),
              })) || []}
            />
            <InventoryCostDistribution
              data={{
                holdingCosts: parseFloat(insights?.inventoryCostDistribution?.holdingCost || "0"),
                orderingCosts: parseFloat(insights?.inventoryCostDistribution?.orderingCost || "0"),
                shortageCosts: parseFloat(insights?.inventoryCostDistribution?.shortageCost || "0"),
              }}
            />
          </div>

          {/* Lead Time + Client Analysis */}
          <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 my-10">
            <LeadTime data={insights?.topLeadConvertedProducts || []} />
            <ClientAnalysis
              genderDistribution={{
                male: parseFloat(
                  insights?.genderDistribution?.find((g: any) => g.gender === "Male")?.percentage || "0"
                ),
                female: parseFloat(
                  insights?.genderDistribution?.find((g: any) => g.gender === "Female")?.percentage || "0"
                ),
                others: parseFloat(
                  insights?.genderDistribution?.find((g: any) => g.gender === "Other")?.percentage || "0"
                ),
              }}
            />
          </div>

          {/* Lead Breakdown + Social Media */}
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 my-10">
            <LeadBreakdown leadBreakdown={insights?.leadBreakdown || []} />
            <SocialMediaEngagement socialEngagement={insights?.socialEngagement || []} />
          </div>
        </div>
      </main>
    </div>
  );
}
