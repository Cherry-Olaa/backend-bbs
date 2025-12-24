// src/controllers/resultHelpers.ts

// -------------------- HELPERS --------------------

// Convert numeric score to grade
export const gradeScore = (score: number): string => {
    if (score >= 70) return "A";
    if (score >= 60) return "B";
    if (score >= 50) return "C";
    if (score >= 45) return "D";
    if (score >= 40) return "E";
    return "F";
  };
  
  // Convert grade to comment
  export const gradeComment = (grade: string): string => {
    const mapping: Record<string, string> = {
      A: "Excellent",
      B: "Very Good",
      C: "Good",
      D: "Fair",
      E: "Pass",
      F: "Fail",
    };
    return mapping[grade] || "";
  };
  
  // Compute overall total and average for a list of results
  export const computeTotals = (results: any[]) => {
    const overall = results.reduce((sum, it) => sum + (it.total || 0), 0);
    return {
      overallTotal: overall,
      average: results.length ? Number((overall / results.length).toFixed(2)) : 0,
    };
  };