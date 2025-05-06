// Parse dates in "dd/MM/yy" format
function parseDMY(dateStr: string): Date {
  console.log("Parse Date Input: ", dateStr);

  let day: number, month: number, year: number;

  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    // Format: "YYYY-MM-DD"
    [year, month, day] = dateStr.split("-").map(Number);
  } else if (/^\d{2}\/\d{2}\/\d{2,4}$/.test(dateStr)) {
    // Format: "DD/MM/YY" or "DD/MM/YYYY"
    [day, month, year] = dateStr.split("/").map(Number);
    if (year < 100) {
      year += 2000;
    }
  } else {
    throw new Error("Unsupported date format: " + dateStr);
  }

  const date = new Date(year, month - 1, day);
  console.log("Parse Date Output: ", date);
  return date;
}
