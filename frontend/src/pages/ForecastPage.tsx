import { useState, useEffect } from "react";
import { Navbar } from "../layout/Navbar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Download, Trash2, Network, Users, BarChart3 } from "lucide-react";
import { runForecast } from "../api/forecast";
import { getReports, deleteReport } from "../api/report"; 
import socket from "../socket";

export default function ForecastsPage() {
  const [loadingType, setLoadingType] = useState<"mba" | "demand" | "customer" | null>(null);
  const [reports, setReports] = useState<{ mba?: string | null; demand?: string | null; customer?: string | null }>({});

  const [dialogOpen, setDialogOpen] = useState(false);

  // Fetch reports from backend when page loads
  useEffect(() => {

    const fetchReports = async () => {
      console.log("Fetching reports...");
      try {
        const data = await getReports();
        const { reports } = data;
        console.log("Reports:", reports);
  
        const formatPdf = (pdfBase64: string | null) => {
          if (!pdfBase64) return undefined;
          const pdfBlob = new Blob([Uint8Array.from(atob(pdfBase64), c => c.charCodeAt(0))], {
            type: "application/pdf",
          });
          return URL.createObjectURL(pdfBlob);
        };
  
        setReports({
          mba: reports.mba ? formatPdf(reports.mba) : undefined,
          demand: reports.demand ? formatPdf(reports.demand) : undefined,
          customer: reports.segmentation ? formatPdf(reports.segmentation) : undefined,
        });
        console.log("Reports state:", reports);
      } catch (err) {
        console.error("❌ Failed to fetch reports:", err);
      }
    };
/*******  9f0880e5-ff48-4002-8758-f661372516ca  *******/
  
    fetchReports(); //  Fetch on initial page load
  
    // Also fetch whenever a reportGenerated event is received via socket
    socket.on("reportGenerated", fetchReports);
  
    return () => {
      socket.off("reportGenerated", fetchReports); // Cleanup listener
    };
  }, []);
  
  

  // Generate Report & Save
  const handleGenerateReport = async (type: "mba" | "demand" | "customer") => {
    try {
      setLoadingType(type);
      setDialogOpen(true);
      const forecastType = type === "customer" ? "segmentation" : type;

      const result = await runForecast(forecastType as "mba" | "demand" | "segmentation");

      // Decode PDF
      const pdfBlob = new Blob([Uint8Array.from(atob(result.pdf), (c) => c.charCodeAt(0))], {
        type: "application/pdf",
      });
      const pdfUrl = URL.createObjectURL(pdfBlob);

      setReports((prev) => ({
        ...prev,
        [type]: pdfUrl,
      }));

      // Auto-download
      const link = document.createElement("a");
      link.href = pdfUrl;
      link.download = `${forecastType}_report.pdf`;
      link.click();
    } catch (err) {
      console.error(` Error generating ${type} report:`, err);
    } finally {
      setDialogOpen(false);
      setLoadingType(null);
    }
  };

  //  Download Report
  const handleDownload = (type: "mba" | "demand" | "customer") => {
    const url = reports[type];
    if (url) {
      const link = document.createElement("a");
      link.href = url;
      link.download = `${type}_report.pdf`;
      link.click();
    }
  };

  //  Delete Report (calls backend)
  const handleDelete = async (type: "mba" | "demand" | "customer") => {
    try {
      const reportType = type === "customer" ? "segmentation" : type;
      await deleteReport(reportType as "mba" | "demand" | "segmentation");
      setReports((prev) => {
        const updated = { ...prev };
        delete updated[type];
        return updated;
      });
    } catch (err) {
      console.error(`Error deleting ${type} report:`, err);
    }
  };

  return (
    <div className="min-h-screen dark:bg-background">
      <Navbar />
      <div className="p-4 sm:p-8 lg:ml-52 xl:ml-72 max-w-5xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold mb-8 text-gray-800 dark:text-white text-center sm:text-left">
          Machine Learning Forecasts
        </h1>

        {/* Forecast Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {[
            { type: "mba", label: "Market Basket Analysis", icon: BarChart3 },
            { type: "demand", label: "Demand Segmentation", icon: Network },
            { type: "customer", label: "Customer Grouping", icon: Users },
          ].map(({ type, label, icon: Icon }) => (
            <Button
              key={type}
              disabled={!!reports[type as keyof typeof reports] || loadingType === type}
              onClick={() => handleGenerateReport(type as "mba" | "demand" | "customer")}
              className="flex items-center justify-center gap-3 px-4 py-4 text-sm sm:text-base whitespace-nowrap"
            >
              <Icon className="w-4 h-4" />
              {loadingType === type ? "Generating..." : label}
            </Button>
          ))}
        </div>

        {/* Reports Section */}
        <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-gray-700 dark:text-white">
          Generated Reports
        </h2>
        <div className="flex flex-col gap-6">
          {["mba", "demand", "customer"].map((type) =>
            reports[type as keyof typeof reports] ? (
              <div
                key={type}
                className="p-4 border rounded-lg shadow-md bg-white dark:bg-gray-800 flex flex-col justify-between"
              >
                <p className="font-semibold text-gray-800 dark:text-white mb-4 capitalize">
                  {type === "mba"
                    ? "MBA Report"
                    : type === "demand"
                    ? "Demand Segmentation Report"
                    : "Customer Grouping Report"}
                </p>
                <div className="flex justify-between gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleDownload(type as any)}
                    className="flex-1 flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" /> Download
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleDelete(type as any)}
                    className="flex-1 flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </Button>
                </div>
              </div>
            ) : (
              <div
                key={type}
                className="p-4 border rounded-lg shadow-sm bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 flex items-center justify-center text-center"
              >
                No {type === "mba" ? "MBA" : type === "demand" ? "Demand" : "Customer"} report generated yet.
              </div>
            )
          )}
        </div>
      </div>

      {/* ML Generating Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader className="flex flex-col items-center justify-center">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-3" />
            <DialogTitle className="text-center">ML Model Running...</DialogTitle>
          </DialogHeader>
          <p className="text-center text-gray-600 dark:text-gray-300">
            Please wait while we generate your report.
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
