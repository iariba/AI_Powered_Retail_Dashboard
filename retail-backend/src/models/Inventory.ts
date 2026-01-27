import mongoose, { Schema, Document } from "mongoose";

export interface IInventory extends Document {
  userId: mongoose.Types.ObjectId;  // Reference to User who connected this sheet
  sheetUrl: string;                 // Google Sheet link
  sheetId: string;                  // Extracted sheet ID for quick access
  watchChannel?: {
    channelId: string;              // Webhook channel ID
    sheetId: string;                // Sheet ID linked to webhook
    expiration: string;             // Expiration timestamp from Google API
  };
  connectedAt: Date;                // When the sheet was connected
}

const inventorySchema: Schema<IInventory> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    sheetUrl: { type: String, required: true },
    sheetId: { type: String, required: true },
    watchChannel: {
      channelId: { type: String },
      sheetId: { type: String },
      expiration: { type: String },
    },
    connectedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const Inventory = mongoose.model<IInventory>("Inventory", inventorySchema);
