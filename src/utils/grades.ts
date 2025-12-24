export function gradeFromScore(score: number) {
    if (score >= 80) return "A1";
    if (score >= 75) return "B2";
    if (score >= 70) return "B3";
    if (score >= 65) return "C4";
    if (score >= 60) return "C5";
    if (score >= 55) return "C6";
    if (score >= 50) return "D7";
    if (score >= 45) return "E8";
    return "F9";
  }