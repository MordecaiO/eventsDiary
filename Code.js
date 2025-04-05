function onOpen() {
  // Add a custom menu to the Google Sheets interface
  const ui = SpreadsheetApp.getUi();
  ui.createMenu("Automation") // Name of the custom menu
    .addItem("Confirm Events", "confirmEvents")
    .addItem("Create Booking", "createBooking")
    .addToUi();
}

// Opens email search dialog
function showEmailSearchDialog() {
  const html = HtmlService.createTemplateFromFile("EmailSearchUI").evaluate();
  SpreadsheetApp.getUi().showModalDialog(html, "Search Emails");
}

// Used to import html files
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}
