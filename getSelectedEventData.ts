/**
 * Retrieves data for selected events from a given list of confirmed events.
 *
 * @param {string[][]} confirmedEvents - A 2D array of confirmed events data.
 * @returns {{
 *   allSelectedEvents: string[][],
 *   selectedEventsIndexes: number[],
 *   latestEventDate: string
 *   latestEventDateAsNumber: number
 * }} - An object containing:
 *   - An array of selected events.
 *   - An array of indices of the selected events.
 *   - The latest event date as a string.
 *   - The latest event date as a number.
 */

const getSelectedEventData = (
  confirmedEvents: string[][]
): {
  allSelectedEvents: string[][];
  selectedEventsIndexes: number[];
  latestEventDate: string;
  latestEventDateAsNumber: number;
} => {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const confirmedEventsSheet = spreadsheet.getSheetByName("Confirmed Events");
  const confirmedEventIndices = getColumnIndices(confirmedEventsSheet);
  const selectIndex = confirmedEventIndices["Select"];

  // Filter for all confirmed events that have been selected
  let selectedEventsIndexes: number[] = [];
  const selectedEvents = confirmedEvents.filter((row, index: number) => {
    if (row[selectIndex] == "TRUE") {
      selectedEventsIndexes.push(index);
      return true;
    }
    return false;
  });

  // Check if there are no events selected
  if (selectedEvents.length == 0) {
    throw Error("No events selected");
  }

  // Get latest event date from selected events
  let latestEventDate = new Date(0);
  Logger.log(`Initial latestEventDate: ${latestEventDate}`);

  selectedEvents.forEach((event) => {
    Logger.log(`Event: ${event[0]}`);
    const eventDate = parseDMY(event[0]);
    Logger.log(`Processing event with date: ${eventDate}`);

    if (eventDate >= latestEventDate) {
      Logger.log(
        `Updating latestEventDate from ${latestEventDate} to ${eventDate}`
      );
      latestEventDate = eventDate;
    }
  });
  Logger.log(`Final latestEventDate: ${latestEventDate}`);

  return {
    allSelectedEvents: selectedEvents,
    selectedEventsIndexes: selectedEventsIndexes,
    latestEventDate: latestEventDate.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }),
    latestEventDateAsNumber: latestEventDate.valueOf(),
  };
};

function testGetSelectedEventData() {
  const testData = [
    [
      "04/01/2025",
      "Saturday",
      "BRUT",
      "DAY",
      "04/01/2025 Saturday BRUT DAY",
      "Test",
      "",
      "Confirmed",
      "Test6ba1ee",
      "14:00",
      "19:00",
      "TRUE",
    ],
    [
      "04/01/2025",
      "Saturday",
      "BRUT",
      "NIGHT",
      "04/01/2025 Saturday BRUT NIGHT",
      "Test",
      "",
      "Confirmed",
      "Test6ba1ee",
      "14:00",
      "19:00",
      "TRUE",
    ],
  ];

  getSelectedEventData(testData);
}
