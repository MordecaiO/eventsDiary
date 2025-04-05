const getColumnIndices = (sheet: GoogleAppsScript.Spreadsheet.Sheet) => {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheetName = sheet.getName();
  if (!sheet) {
    throw new Error(`${sheetName} sheet does not exist`);
  }
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const columnIndices = headers.reduce((acc, header, index) => {
    acc[header] = index;
    return acc;
  }, {});
  return columnIndices;
};
