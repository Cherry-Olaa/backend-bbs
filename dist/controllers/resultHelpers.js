"use strict";
// src/controllers/resultHelpers.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeTotals = exports.gradeComment = exports.gradeScore = void 0;
// -------------------- HELPERS --------------------
// Convert numeric score to grade
const gradeScore = (score) => {
    if (score >= 70)
        return "A";
    if (score >= 60)
        return "B";
    if (score >= 50)
        return "C";
    if (score >= 45)
        return "D";
    if (score >= 40)
        return "E";
    return "F";
};
exports.gradeScore = gradeScore;
// Convert grade to comment
const gradeComment = (grade) => {
    const mapping = {
        A: "Excellent",
        B: "Very Good",
        C: "Good",
        D: "Fair",
        E: "Pass",
        F: "Fail",
    };
    return mapping[grade] || "";
};
exports.gradeComment = gradeComment;
// Compute overall total and average for a list of results
const computeTotals = (results) => {
    const overall = results.reduce((sum, it) => sum + (it.total || 0), 0);
    return {
        overallTotal: overall,
        average: results.length ? Number((overall / results.length).toFixed(2)) : 0,
    };
};
exports.computeTotals = computeTotals;
