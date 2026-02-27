// // scripts/migrateSubjects.ts
// import mongoose from "mongoose";
// import dotenv from "dotenv";
// import Result from "../models/Result.js";
// import SubjectRegistration from "../models/SubjectRegistration.ts";
// import Student from "../models/Student.js";

// dotenv.config();

// interface ResultGroup {
//     _id: {
//         studentId: string;
//         session: string;
//         term: string;
//     };
//     subjectIds: string[];
// }

// async function migrateExistingResults(): Promise<void> {
//     try {
//         // Connect to database
//         await mongoose.connect(process.env.MONGODB_URI!);
//         console.log("✅ Connected to MongoDB");

//         // Get all unique combinations from existing results
//         const results = await Result.aggregate<ResultGroup>([
//             {
//                 $group: {
//                     _id: {
//                         studentId: "$studentId",
//                         session: "$session",
//                         term: "$term"
//                     },
//                     subjectIds: { $addToSet: "$results.subjectId" }
//                 }
//             }
//         ]);

//         console.log(`📊 Found ${results.length} result combinations to migrate`);

//         let migrated = 0;
//         let errors = 0;
//         let skipped = 0;

//         // Create registrations
//         for (const item of results) {
//             try {
//                 const student = await Student.findById(item._id.studentId);
                
//                 if (!student) {
//                     console.log(`⚠️ Student not found: ${item._id.studentId}`);
//                     skipped++;
//                     continue;
//                 }

//                 const className = student.admissionNumber.split('/').slice(0, 2).join('/');

//                 for (const subjectId of item.subjectIds) {
//                     if (!subjectId) continue;

//                     await SubjectRegistration.findOneAndUpdate(
//                         {
//                             studentId: item._id.studentId,
//                             subjectId,
//                             academicYear: item._id.session,
//                             term: item._id.term
//                         },
//                         {
//                             studentId: item._id.studentId,
//                             subjectId,
//                             academicYear: item._id.session,
//                             term: item._id.term,
//                             class: className,
//                             isActive: true,
//                             registeredAt: new Date()
//                         },
//                         { upsert: true }
//                     );
//                 }
                
//                 migrated++;
//                 if (migrated % 50 === 0) {
//                     console.log(`📈 Progress: ${migrated}/${results.length}`);
//                 }
//             } catch (err) {
//                 console.error(`❌ Error migrating item:`, err);
//                 errors++;
//             }
//         }

//         console.log("\n📋 === Migration Complete ===");
//         console.log(`✅ Successfully migrated: ${migrated}`);
//         console.log(`⚠️ Skipped: ${skipped}`);
//         console.log(`❌ Errors: ${errors}`);
//         console.log(`📊 Total processed: ${results.length}`);

//     } catch (error) {
//         console.error("❌ Migration failed:", error);
//     } finally {
//         await mongoose.disconnect();
//         console.log("🔌 Disconnected from MongoDB");
//     }
// }

// // Run migration
// migrateExistingResults();