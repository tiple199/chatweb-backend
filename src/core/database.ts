import mongoose from "mongoose";
import { logger } from "./logger";

export class Database {
  private static instance: Database;
  private isConnected: boolean = false;

  private constructor() {}

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public async connect(): Promise<void> {
    if (this.isConnected) {
      logger.info("Database is already connected.");
      return;
    }

    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error("Missing MONGODB_URI");
    }

    try {
      await mongoose.connect(uri);
      this.isConnected = true;
      logger.info("MongoDB connected successfully.");
    } catch (error) {
      logger.error("Failed to connect to MongoDB", error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.isConnected) return;
    
    await mongoose.disconnect();
    this.isConnected = false;
    logger.info("MongoDB disconnected.");
  }
}

export const database = Database.getInstance();
