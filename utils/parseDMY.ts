// Parse dates in "dd/MM/yy" format
function parseDMY(dateStr: string): Date {
  const [day, month, year] = dateStr.split("/").map(Number);
  // Assume year is two digits, e.g., "25" means 2025
  const fullYear = year < 100 ? 2000 + year : year;
  return new Date(fullYear, month - 1, day);
}
