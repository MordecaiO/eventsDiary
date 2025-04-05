const confirmEvents = () => {
  // define types
  type SelectedCell = { event: string; row: number; col: number };

  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const pencilCalendar = spreadsheet.getSheetByName("Pencil Calendar");
  const logSheet = spreadsheet.getSheetByName("Logs");
  const confirmedEventsSheet = spreadsheet.getSheetByName("Confirmed Events");
  const confirmedEventsIndices = getColumnIndices(confirmedEventsSheet);
  const calendarIDIndex = confirmedEventsIndices["Calendar ID"];
  const eventNameIndex = confirmedEventsIndices["Event Name"];
  // Validate sheets
  [pencilCalendar, logSheet, confirmedEventsSheet].forEach((sheet, index) => {
    if (!sheet) {
      const sheetNames = ["Pencil Calendar", "Logs", "Confirmed Events"];
      throw new Error(`${sheetNames[index]} sheet does not exist`);
    }
  });

  // Get all values and background colors
  const allCalendarVals = pencilCalendar.getDataRange().getValues();
  const allBackgroundColors = pencilCalendar.getDataRange().getBackgrounds();

  // Filter rows with events and get yellow cells

  const selectedCellData: SelectedCell[] = allCalendarVals.reduce(
    (acc, row, rowIndex) => {
      if (row.slice(2).some((cell) => cell !== "")) {
        row.forEach((cell, colIdx) => {
          if (allBackgroundColors[rowIndex][colIdx] === "#ffff00") {
            acc.push({ event: cell, row: rowIndex + 1, col: colIdx });
          }
        });
      }
      return acc;
    },
    []
  );

  if (selectedCellData.length === 0) {
    spreadsheet.toast("No events selected", "Error", 5);
    return;
  }

  const eventsToConfirm = selectedCellData.map((cellData) => {
    const room = roomKey[cellData.col].room;
    const timeOfDay = roomKey[cellData.col].timeOfDay;
    const event = cellData.event;
    const date = pencilCalendar
      .getRange(cellData.row, 2)
      .getValue()
      .toLocaleDateString("en-GB");
    const dayOfWeek = pencilCalendar.getRange(cellData.row, 1).getValue();
    const calendarID = date + " " + dayOfWeek + " " + room + " " + timeOfDay;
    return [
      date,
      dayOfWeek,
      room,
      timeOfDay,
      calendarID,
      event,
      "",
      "Confirmed",
      "",
      "",
      "",
      false,
    ];
  });

  // show a dialog to confirm the events

  const confirmEventsDialog = SpreadsheetApp.getUi().alert(
    "Are you sure?",
    `Are you sure you want to confirm these events?
      ${eventsToConfirm.map((event) => event[4]).join("\n")}`,
    SpreadsheetApp.getUi().ButtonSet.YES_NO
  );

  // if the user confirms the events, add the events to the Confirmed Events sheet
  if (confirmEventsDialog == SpreadsheetApp.getUi().Button.YES) {
    const confirmedEventsSheetLastRow = confirmedEventsSheet.getLastRow();
    const eventsToConfirmRange = confirmedEventsSheet.getRange(
      confirmedEventsSheetLastRow + 1,
      1,
      eventsToConfirm.length,
      eventsToConfirm[0].length
    );
    const confirmedEvents = confirmedEventsSheet.getDataRange().getValues();

    // check if any of the events are already confirmed
    const alreadyConfirmedEvents = eventsToConfirm.filter((event) => {
      return confirmedEvents.some((confirmedEvent) => {
        return confirmedEvent[calendarIDIndex] == event[calendarIDIndex];
      });
    });

    if (alreadyConfirmedEvents.length > 0) {
      const confirmedEventIDs = alreadyConfirmedEvents
        .map((event) => event[calendarIDIndex])
        .join("/n");
      SpreadsheetApp.getUi().alert(
        "Error",
        `Events are already confirmed for these days: ${confirmedEventIDs}`,
        SpreadsheetApp.getUi().ButtonSet.OK
      );
      // add logs to log sheet
      logSheet.appendRow([
        new Date().toLocaleString("en-GB"),
        "Event Confirmation",
        "Failed",
        `Events already confirmed: ${confirmedEventIDs}`,
      ]);
    } else {
      // add new events to the Confirmed Events sheet
      eventsToConfirmRange.setValues(eventsToConfirm);
      // Add checkboxes to the last column of the range
      const checkboxRange = confirmedEventsSheet.getRange(
        confirmedEventsSheetLastRow + 1,
        eventsToConfirm[0].length,
        eventsToConfirm.length,
        1
      );
      checkboxRange.insertCheckboxes();

      // Change the background color of the selected cells to green
      selectedCellData.forEach((cellData) => {
        pencilCalendar
          .getRange(cellData.row, cellData.col + 1)
          .setBackground("#00ff00");
      });
      // add logs to log sheet
      logSheet.appendRow([
        new Date().toLocaleString("en-GB"),
        "Event Confirmation",
        "Success",
        `Events confirmed: ${eventsToConfirm
          .map((event) => event[eventNameIndex] + " " + event[calendarIDIndex])
          .join(", ")}`,
      ]);
      spreadsheet.toast("Events confirmed", "Success", 10);

      // // 🚨 TODO: add ability to create a booking straight after confirmed event
      // const createBookingDialog = SpreadsheetApp.getUi().alert(
      //   "Create Booking",
      //   "Would you like to create a booking for these events?",
      //   SpreadsheetApp.getUi().ButtonSet.YES_NO
      // );

      // if (createBookingDialog == SpreadsheetApp.getUi().Button.YES) {
      //   // select the events that have just been confirmed and check the checkboxes
      //   checkboxRange.check();
      //   createBooking();
      //   checkboxRange.uncheck();
      // }
    }
  }
};
