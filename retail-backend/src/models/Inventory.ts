import mongoose, { Schema, Document } from "mongoose";

export interface IInventory extends Document {
  userId: mongoose.Types.ObjectId;  
  sheetUrl: string;              
  sheetId: string;                  
  watchChannel?: {
    channelId: string;          
    sheetId: string;               
    expiration: string;             
  };
  connectedAt: Date;                
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
