export const dateToFyYear = (input: string | Date) => {
  const date = input instanceof Date ? input : new Date(input);

  // if (isNaN(date.getTime())) {
  //   throw new Error(`Invalid date provided to dateToFyYear: ${input}`);
  // }

  const year = date.getFullYear();
  const month = date.getMonth() + 1;

  return month >= 4 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
};

export async function dateToFyYearV2(qtrDate: string | Date): Promise<string> {
  if (qtrDate instanceof Date) {
    qtrDate = qtrDate.toISOString().slice(0, 10); // Convert to string
  }

  if (typeof qtrDate !== "string" || !qtrDate.trim()) {
    console.warn("Invalid input received:", qtrDate);
    throw new Error("Invalid input: qtrDate must be a non-empty string");
  }

  // Remove time if ISO datetime (e.g. "2026-03-31T00:00:00.000Z")
  qtrDate = qtrDate.split("T")[0];

  const parts = qtrDate.split("-");

  if (parts.length !== 3) {
    console.warn("Invalid date format:", qtrDate);
    throw new Error("Invalid date format: Expected YYYY-MM-DD or DD-MM-YYYY");
  }

  let year: number, month: number;

  if (parts[0].length === 4) {
    // Format: YYYY-MM-DD
    year = Number(parts[0]);
    month = Number(parts[1]);
  } else if (parts[2].length === 4) {
    // Format: DD-MM-YYYY
    year = Number(parts[2]);
    month = Number(parts[1]);
  } else {
    throw new Error("Invalid date format: Unrecognized format");
  }

  if (isNaN(year) || isNaN(month)) {
    throw new Error(
      "Invalid date components: Year or month is not a valid number"
    );
  }

  if (month < 1 || month > 12) {
    throw new Error("Invalid month: Month must be between 1 and 12");
  }

  const fy = month <= 3 ? `${year - 1}-${year}` : `${year}-${year + 1}`;

  return fy;
}
