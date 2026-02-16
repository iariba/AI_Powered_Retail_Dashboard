import { Request, Response } from "express";
import { Reports } from "../models/Report";
import { AuthRequest } from "../middleware/authMiddleware";
export const getUserReports = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized access. Please log in." });
      }
  
      const reports = await Reports.findOne({ userId });
  
      if (!reports) {
        return res.status(404).json({ error: "No reports found for this user." });
      }
  
      const formatReport = (binaryField?: any) =>
        binaryField ? binaryField.toString("base64") : null;
  
      return res.json({
        message: "Reports fetched successfully.",
        reports: {
          mba: formatReport(reports.mba_report),
          demand: formatReport(reports.demand_report),
          segmentation: formatReport(reports.segmentation_report),
        },
      });
    } catch (err) {
      console.error(" Error fetching reports:", err);
      return res.status(500).json({ error: "Failed to fetch reports." });
    }
  };
  

export const deleteUserReport = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { reportType } = req.body; 

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized access. Please log in." });
    }

    const validTypes = ["mba", "demand", "segmentation"];
    if (!reportType || !validTypes.includes(reportType)) {
      return res.status(400).json({ error: "Invalid report type." });
    }

    const fieldToUnset = `${reportType}_report`;

    const result = await Reports.findOneAndUpdate(
      { userId },
      { $unset: { [fieldToUnset]: "" } },
      { new: true }
    );

    if (!result) {
      return res.status(404).json({ error: "Report not found for this user." });
    }

    return res.json({ message: `${reportType.toUpperCase()} report deleted successfully.` });
  } catch (err) {
    console.error(" Error deleting report:", err);
    return res.status(500).json({ error: "Failed to delete report." });
  }
};
