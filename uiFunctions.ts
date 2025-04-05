/**
 * Searches Gmail for emails matching sender and subject.
 * @param {string} sender - The sender email to search for.
 * @param {string} subject - The subject to search for.
 * @param {number} page - The pagination index.
 * @return {Array} - Array of email details.
 */
function searchEmails(sender, subject, startIndex) {
  const query = [];
  if (sender) query.push(`from:${sender}`);
  if (subject) query.push(`subject:${subject}`);

  const threads = GmailApp.search(query.join(" "), startIndex, 5);
  const messages = threads.map((thread) => thread.getMessages()[0]); // Get first message of each thread

  const results = messages.map((msg) => ({
    subject: msg.getSubject(),
    sender: msg.getFrom(),
    date: msg.getDate().toLocaleString(), // Extract and format date
    rfc822msgid: msg.getHeader("Message-ID"),
  }));
  return results;
}

// Given an email object, sets the selected booking's Message-ID value
function returnEmailSelection(email) {
  Logger.log("Selected Email: ", email);
  // Get the active spreadsheet and the Message-ID Cache sheet
  // const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  // const messageIDSheet = spreadsheet.getSheetByName("Message-ID Cache");
  // const output = `${email.rfc822msgid} / ${email.subject}`;
  // messageIDSheet.getRange("A1").setValue(output);
  SpreadsheetApp.getActiveSpreadsheet().toast(
    `Email selected", ${email.subject}`,
    "Success",
    5
  );
}

const sleep = (milliseconds: number) => {
  Utilities.sleep(milliseconds);
};

const testEmail = {
  subject: "Test Subject",
  sender: "John Doe",
  date: "2025-03-02", // Extract and format date
  rfc822msgid: "<234324242>",
};

function testReturnEmailSelection() {
  Logger.log("Test Return Email Selection");
  Logger.log("Test Email: ", testEmail);
  returnEmailSelection(testEmail);
}
