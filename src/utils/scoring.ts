export function getDass21DepressionSeverity(score: number | null | undefined): string {
  if (score === null || score === undefined) return "";
  if (score <= 9) return "Normal";
  if (score <= 13) return "Mild";
  if (score <= 20) return "Moderate";
  if (score <= 27) return "Severe";
  return "Extremely Severe";
}

export function getDass21AnxietySeverity(score: number | null | undefined): string {
  if (score === null || score === undefined) return "";
  if (score <= 7) return "Normal";
  if (score <= 9) return "Mild";
  if (score <= 14) return "Moderate";
  if (score <= 19) return "Severe";
  return "Extremely Severe";
}

export function getDass21StressSeverity(score: number | null | undefined): string {
  if (score === null || score === undefined) return "";
  if (score <= 14) return "Normal";
  if (score <= 18) return "Mild";
  if (score <= 25) return "Moderate";
  if (score <= 33) return "Severe";
  return "Extremely Severe";
}

export function getPhq9Severity(score: number | null | undefined): string {
  if (score === null || score === undefined) return "";
  if (score <= 4) return "Minimal / Normal";
  if (score <= 9) return "Mild";
  if (score <= 14) return "Moderate";
  if (score <= 19) return "Moderately Severe";
  return "Severe";
}

export function getGad7Severity(score: number | null | undefined): string {
  if (score === null || score === undefined) return "";
  if (score <= 4) return "Minimal / Normal";
  if (score <= 9) return "Mild";
  if (score <= 14) return "Moderate";
  return "Severe";
}

export function getWho5Severity(score: number | null | undefined): string {
  if (score === null || score === undefined) return "";
  if (score < 13) return "Poor Well-being";
  return "Good Well-being";
}
