const createBooking = () => {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const confirmedEventsSheet = spreadsheet.getSheetByName("Confirmed Events");
  const bookingsSheet = spreadsheet.getSheetByName("Bookings");
  const logSheet = spreadsheet.getSheetByName("Logs");
  const signeeSheet = spreadsheet.getSheetByName("Signees");
  const confirmedEventIndices = getColumnIndices(confirmedEventsSheet);
  const bookingIndices = getColumnIndices(bookingsSheet);
  const selectIndex = confirmedEventIndices["Select"];
  const bookingIDIndex = confirmedEventIndices["Booking ID"];
  const signeeIDIndex = bookingIndices["Signee ID"];

  // Validate sheets
  [bookingsSheet, logSheet, confirmedEventsSheet, signeeSheet].forEach(
    (sheet, index) => {
      if (!sheet) {
        const sheetNames = ["Bookings", "Logs", "Confirmed Events", "Signees"];
        throw new Error(`${sheetNames[index]} sheet does not exist`);
      }
    }
  );

  // Get deal memo recipient email address
  const ui = SpreadsheetApp.getUi();
  const recipientResponse = ui.prompt(
    "Enter the email address of the recipient of the deal memo."
  );

  // Check validity of email
  const email = recipientResponse.getResponseText();
  if (!validateEmail(email)) {
    ui.alert("Invalid email address");
    return;
  }

  // Get deal memo email subject
  const subjectResponse = ui.prompt("Enter a subject for the email.");

  const subject = subjectResponse.getResponseText();

  // Get all the values of the confirmed events sheet
  const allConfirmedEvents = confirmedEventsSheet
    .getDataRange()
    .getDisplayValues();

  // Get selected events
  let selectedEventData = getSelectedEventData(allConfirmedEvents);
  const selectedEvents = selectedEventData.allSelectedEvents;
  const selectedEventsIndexes = selectedEventData.selectedEventsIndexes;
  const latestEventDate = selectedEventData.latestEventDate;
  const latestEventDateAsNumber = selectedEventData.latestEventDateAsNumber;

  // Calculate hire fee for deal memo based on selected events
  const calculatedFees = calculateFees(selectedEvents);
  let hireFee = calculatedFees.totalCost.hireFee;
  let barDeposit = calculatedFees.totalCost.barDeposit;
  let depositReturnedOn = calculatedFees.totalCost.depositReturnedOn;
  let halfHireFeeReturnedOn = calculatedFees.totalCost.halfHireFeeReturnedOn;
  let explanation = calculatedFees.explanations.join("\n");

  // Provide option to input custom hire fees
  const customHireFeeResponse = ui.alert(
    `Would you like to enter a custom values for the hire fee, bar deposit and bar breaks?
    `,
    ui.ButtonSet.YES_NO
  );

  let customHireFee = null;
  let customBarDeposit = null;
  let customDepositReturnedOn = null;
  let customHalfHireFeeReturnedOn = null;

  // Get and validate custom hire fee response
  if (customHireFeeResponse == ui.Button.YES) {
    const hireFeeResponse = ui.prompt(
      "Custom Hire Fee - Enter a value in £ - e.g. 1000",
      ui.ButtonSet.OK_CANCEL
    );
    if (hireFeeResponse.getSelectedButton() == ui.Button.CANCEL) return;
    customHireFee = parseFloat(hireFeeResponse.getResponseText());
    if (isNaN(customHireFee)) {
      ui.alert("Invalid hire fee entered. Please enter a valid number.");
      return;
    }

    // Get and validate custom bar deposit response
    const barDepositResponse = ui.prompt(
      "Custom Bar Deposit - Enter a value in £ - e.g. 1000",
      ui.ButtonSet.OK_CANCEL
    );
    if (barDepositResponse.getSelectedButton() == ui.Button.CANCEL) return;
    customBarDeposit = parseFloat(barDepositResponse.getResponseText());
    if (isNaN(customBarDeposit)) {
      ui.alert("Invalid bar deposit entered. Please enter a valid number.");
      return;
    }

    // Get and validate custom deposit returned on response
    const depositReturnedOnResponse = ui.prompt(
      "Custom Deposit Returned On - Enter a value in £ - e.g. 1000",
      ui.ButtonSet.OK_CANCEL
    );
    if (depositReturnedOnResponse.getSelectedButton() == ui.Button.CANCEL)
      return;
    customDepositReturnedOn = parseFloat(
      depositReturnedOnResponse.getResponseText()
    );
    if (isNaN(customDepositReturnedOn)) {
      ui.alert(
        "Invalid deposit returned on value entered. Please enter a valid number."
      );
      return;
    }

    // Get and validate custom half hire fee returned on response
    const halfHireFeeReturnedOnResponse = ui.prompt(
      "Custom Half Hire Fee Returned On - Enter a value in £ - e.g. 1000",
      ui.ButtonSet.OK_CANCEL
    );
    if (halfHireFeeReturnedOnResponse.getSelectedButton() == ui.Button.CANCEL)
      return;
    customHalfHireFeeReturnedOn = parseFloat(
      halfHireFeeReturnedOnResponse.getResponseText()
    );
    if (isNaN(customHalfHireFeeReturnedOn)) {
      ui.alert(
        "Invalid half hire fee returned on value entered. Please enter a valid number."
      );
      return;
    }

    hireFee = customHireFee;
    barDeposit = customBarDeposit;
    depositReturnedOn = customDepositReturnedOn;
    halfHireFeeReturnedOn = customHalfHireFeeReturnedOn;
    explanation = "Custom Fees";
  }

  // Get user to confirm the hire fee
  const hireFeeResponse = ui.alert(
    `The hire fee for the selected events is £${hireFee}.
     
      ${explanation}

      The bar deposit is ${barDeposit}

      The value that the deposit is returned on is ${depositReturnedOn}

      The value that 50% of the hire fee is returned on is ${halfHireFeeReturnedOn}

      Please confirm the hire fee and other charges before proceeding with the booking.
      If you would like to change the hire fee, please click cancel and re-run the script.

     Do you want to proceed with this booking?`,
    ui.ButtonSet.YES_NO
  );
  if (hireFeeResponse == ui.Button.NO) {
    return;
  }

  // Create a booking
  const firstEventName = selectedEvents[0][5];
  const bookingID = firstEventName + Utilities.getUuid().substring(0, 6);
  const signeeID = "SIGN" + " " + Utilities.getUuid().substring(0, 6);
  const createdAt = new Date().toLocaleString("en-GB");

  // Add booking to bookings sheet
  const bookingRow = [
    bookingID,
    createdAt,
    signeeID,
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    latestEventDate,
    "",
    "",
    latestEventDateAsNumber,
  ];
  bookingsSheet.appendRow(bookingRow);
  const bookingSheetNewRowNumber = bookingsSheet.getLastRow();
  const bookingSheetLastColNumber = bookingsSheet.getLastColumn();

  // Add checkbox to new booking row
  bookingsSheet
    .getRange(bookingSheetNewRowNumber, bookingSheetLastColNumber)
    .insertCheckboxes();

  // Add signee to signees sheet
  const signeeRow = [signeeID, bookingID];
  signeeSheet.appendRow(signeeRow);
  const signeeSheetNewRowNumber = signeeSheet.getLastRow();

  // Log the booking
  const logRow = [createdAt, "Booking Created", "Success", bookingID];
  logSheet.appendRow(logRow);

  // Add Booking ID URL to selected events rows in the confirmed events sheet
  const bookingSheetURL =
    "https://docs.google.com/spreadsheets/d/1XDULDY3YK39JsBBjVmVcd5DPth8Zvd_C4YUoYjGWOnQ/edit?gid=1994503147#gid=1994503147";
  const bookingIDFormula = `=HYPERLINK("${bookingSheetURL}&range=A${bookingSheetNewRowNumber}:O${bookingSheetNewRowNumber}", "${bookingID}")`;
  selectedEventsIndexes.forEach((selectedEventsIndex) => {
    const rowNum = selectedEventsIndex + 1;
    confirmedEventsSheet
      .getRange(rowNum, bookingIDIndex + 1, 1, 1)
      .setFormula(bookingIDFormula);
  });

  // Add Signee ID URL to new booking row in bookings sheet
  const signeeSheetURL =
    "https://docs.google.com/spreadsheets/d/1XDULDY3YK39JsBBjVmVcd5DPth8Zvd_C4YUoYjGWOnQ/edit?gid=1251202822#gid=1251202822";
  const signeeIDFormula = `=HYPERLINK("${signeeSheetURL}&range=A${signeeSheetNewRowNumber}:O${signeeSheetNewRowNumber}", "${signeeID}")`;
  bookingsSheet
    .getRange(bookingSheetNewRowNumber, signeeIDIndex + 1, 1, 1)
    .setValue(signeeIDFormula);

  // Add Booking ID URL to new signee row in signee sheet
  signeeSheet
    .getRange(signeeSheetNewRowNumber, 2, 1, 1) // ⏰ TODO Change booking ID col reference to variable
    .setValue(bookingIDFormula);

  // Trigger the deal memo
  triggerCreateDealMemo(
    bookingID,
    signeeID,
    bookingSheetNewRowNumber,
    signeeSheetNewRowNumber,
    email,
    hireFee,
    barDeposit,
    depositReturnedOn,
    halfHireFeeReturnedOn,
    subject,
    latestEventDate
  );

  // Wait for 8 seconds to simulate loading
  Utilities.sleep(8000);
  spreadsheet.toast("Booking created", "Success", 5);
};
