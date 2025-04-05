const sendDealMemo = () => {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const bookingsSheet = spreadsheet.getSheetByName("Bookings");
  const logSheet = spreadsheet.getSheetByName("Logs");

  // Get selected bookings
  const selectedBookings = bookingsSheet
    .getDataRange()
    .getValues()
    .filter((row) => row[14] == true);

  // Check if there are no bookings selected
  if (selectedBookings.length == 0) {
    SpreadsheetApp.getUi().alert("No bookings selected");
    return;
  } else if (selectedBookings.length > 1) {
    SpreadsheetApp.getUi().alert("Please select only one booking");
    return;
  }

  // Prompt user for thread to deliver deal memo
  showEmailSearchDialog();
  SpreadsheetApp.getUi().alert("wait here ");
};
