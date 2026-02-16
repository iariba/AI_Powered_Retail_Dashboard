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
import { useQueryClient } from "@tanstack/react-query";
import { connectSocket, getSocket } from "../socket";

export function Dashboard() {
  const queryClient = useQueryClient();
  const cached: any = queryClient.getQueryData(["inventory-insights"]);
  const {
    data: insights,
    isLoading,
    isError,
    error,
    status,
  } = useInventoryInsights();

  console.log("status:", status);
  console.log("isLoading:", isLoading);
  console.log("isError:", isError);
  console.log("error:", error);
  console.log("insights:", insights);

  const [showLoader, setShowLoader] = useState(false);


  const [stockSummary, setStockSummary] = useState({
    totalProducts: cached?.stockSummary?.totalProducts || 0,
    lowStock: cached?.stockSummary?.lowStock || 0,
    outOfStock: cached?.stockSummary?.outOfStock || 0,
  });

  const [topStockProducts, setTopStockProducts] = useState(
    cached?.topStockQuantityProducts?.map((p: any) => ({
      product_name: p.product_name,
      stock_quantity: Number(p.stock_quantity) || 0,
    })) || []
  );
  useEffect(() => {
  const cachedData = queryClient.getQueryData(["inventory-insights"]);

  if (!cachedData && isLoading) {
    setShowLoader(true);
  }

  if (cachedData || insights) {
    setShowLoader(false);
  }
}, [isLoading, insights, queryClient]);

  useEffect(() => {
    if (!insights) return;
    if (insights) {
  queryClient.setQueryData(["inventory-insights"], insights);
}


    if (insights.stockSummary) {
      setStockSummary({
        totalProducts: insights.stockSummary.totalProducts || 0,
        lowStock: insights.stockSummary.lowStock || 0,
        outOfStock: insights.stockSummary.outOfStock || 0,
      });
    }

    if (insights.topStockQuantityProducts) {
      setTopStockProducts(
        insights.topStockQuantityProducts.map((p: any) => ({
          product_name: p.product_name,
          stock_quantity: Number(p.stock_quantity) || 0,
        }))
      );
    }
  }, [insights, queryClient]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const socket = getSocket() || connectSocket(token || "");

    const handleStockUpdate = (data: any) => {
      console.log("[Dashboard] Stock update received:", data);

      if (data.stockSummary)
        setStockSummary({
          totalProducts: data.stockSummary.totalProducts || 0,
          lowStock: data.stockSummary.lowStock || 0,
          outOfStock: data.stockSummary.outOfStock || 0,
        });

      if (data.topStockQuantityProducts)
        setTopStockProducts(
          data.topStockQuantityProducts.map((p: any) => ({
            product_name: p.product_name,
            stock_quantity: Number(p.stock_quantity) || 0,
          }))
        );

      queryClient.setQueryData(["inventory-insights"], (oldData: any) => ({
        ...oldData,
        ...data,
      }));
    };

    socket.on("stock-update", handleStockUpdate);

    return () => {
      socket.off("stock-update", handleStockUpdate);
    };
  }, [queryClient]);

  return (
    <div className="min-h-screen bg-background">
   
   {showLoader && (
  <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-black/30">
    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl 
                    px-8 py-6 sm:px-10 sm:py-8 md:px-12 md:py-10
                    text-center w-[80%] max-w-md">

      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4" />

      <h2 className="text-lg sm:text-xl md:text-2xl font-semibold">
        Loading Insights
      </h2>

      <p className="text-sm sm:text-base text-muted-foreground mt-2">
        Preparing your real-time dashboard...
      </p>
    </div>
  </div>
)}

      <Navbar />
      <main className="p-4 lg:ml-52 xl:ml-72 lg:p-6 xl:p-8 overflow-x-hidden max-w-full">
        <div className="w-full mx-auto px-4">

          <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
            <EarningsOverview
              totalEarnings={parseFloat(insights?.monthlyEarnings?.toString() || "0")}
              topRevenueProducts={insights?.topRevenueProducts?.map((p: any) => ({
                product_name: p.product_name,
                revenue_generated: parseFloat(p.revenue_generated),
              }))}
            />
            <InventoryOverview data={stockSummary} />
          </div>

          <div className="grid gap-y-6 md:gap-6 grid-cols-1 md:grid-cols-2 my-6">
            <SalesChart weeklySalesLast4Weeks={insights?.weeklySales || []} />
            <InventoryLevel data={topStockProducts} />
          </div>

          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 my-10">
            <StockOut data={insights?.topStockoutRateProducts} />
            <InventoryCostDistribution
              data={{
                holdingCosts: parseFloat(insights?.inventoryCostDistribution?.holdingCost?.toString() || "0"),
                orderingCosts: parseFloat(insights?.inventoryCostDistribution?.orderingCost?.toString() || "0"),
                shortageCosts: parseFloat(insights?.inventoryCostDistribution?.shortageCost?.toString() || "0"),
              }}
            />
          </div>

          <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 my-10">
            <LeadTime data={insights?.topLeadConvertedProducts || []} />
            <ClientAnalysis
              genderDistribution={{
                male: parseFloat(
                  insights?.genderDistribution?.find((g: any) => g.gender === "Male")?.percentage?.toString() || "0"
                ),
                female: parseFloat(
                  insights?.genderDistribution?.find((g: any) => g.gender === "Female")?.percentage?.toString() || "0"
                ),
                others: parseFloat(
                  insights?.genderDistribution?.find((g: any) => g.gender === "Other")?.percentage?.toString() || "0"
                ),
              }}
            />
          </div>

          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 my-10">
            <LeadBreakdown leadBreakdown={insights?.leadBreakdown || { lead: 0, qualified: 0, converted: 0 }} />
            <SocialMediaEngagement socialEngagement={insights?.socialEngagement || []} />
          </div>

        </div>
      </main>
    </div>
  );
}
