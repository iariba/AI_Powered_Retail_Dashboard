import mongoose, { Schema, Document } from "mongoose";

export interface IReports extends Document {
  userId: mongoose.Types.ObjectId;
  mba_report?: Buffer;  // Store PDF as binary
  demand_report?: Buffer;
  segmentation_report?: Buffer;
}

const ReportsSchema = new Schema<IReports>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  mba_report: { type: Buffer },
  demand_report: { type: Buffer },
  segmentation_report: { type: Buffer },
}, { timestamps: true });

export const Reports = mongoose.model<IReports>("Reports", ReportsSchema);
