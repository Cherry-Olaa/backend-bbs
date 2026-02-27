import mongoose from "mongoose";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function migrateAddIsActive() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log("✅ Connected to MongoDB");

    // Get the Student collection directly
    const db = mongoose.connection.db;
    const collection = db.collection("students");

    // Add isActive field to all existing students
    const result = await collection.updateMany(
      { isActive: { $exists: false } },
      { $set: { isActive: true } }
    );

    console.log(`✅ Updated ${result.modifiedCount} students with isActive: true`);
    console.log(`📊 Total students processed: ${result.matchedCount}`);

  } catch (error) {
    console.error("❌ Migration error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

// Run the migration
migrateAddIsActive();