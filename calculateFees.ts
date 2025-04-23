// calculate hire fee for deal memo based on selected events
// return fee and show explanation of how fee was calculated

function calculateFees(selectedEvents) {
  const summerHireFeesSheet =
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Hire Fees May-Sep");
  const winterHireFeesSheet =
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Hire Fees Oct-Apr");

  // Find the last event date from selectedEvents

  const allDates = selectedEvents.map((e) => parseDMY(e[0]));
  const lastEventDate = new Date(
    Math.max.apply(
      null,
      allDates.map((d) => d.getTime())
    )
  );
  const month = lastEventDate.getMonth(); // 0 = Jan, 4 = May, 8 = Sep

  // May (4) to Sep (8) inclusive is summer, otherwise winter
  const sheet =
    month >= 4 && month <= 8 ? summerHireFeesSheet : winterHireFeesSheet;

  const pricingTable = sheet.getDataRange().getValues().slice(1); // Remove headers

  console.log("Extracted Pricing Table:", pricingTable);

  // Step 1: Organize pricing data by time period
  const pricingMap = { DAY: {}, NIGHT: {} };
  for (let row of pricingTable) {
    let [
      timing,
      locations,
      ,
      ,
      ,
      hireFee,
      ,
      barDeposit,
      depositReturnedOn,
      halfHireFeeReturnedOn,
      discountedHire,
    ] = row;
    if (timing && locations && hireFee) {
      let rooms = locations.split(", ").sort();
      pricingMap[timing][rooms.join(",")] = {
        hireFee,
        barDeposit,
        depositReturnedOn,
        halfHireFeeReturnedOn,
        discountedHire,
      };
    }
  }
  console.log("Organized Pricing Map:", pricingMap);

  // Step 2: Group user selection by time period, preserving multiple occurrences
  const groupedSelection = { DAY: [], NIGHT: [] };
  for (let entry of selectedEvents) {
    let [, , room, timing] = entry;
    groupedSelection[timing].push(room);
  }
  console.log("Grouped Selection:", groupedSelection);

  // Step 3: Compute the cheapest price for each time period
  let totalCost = {
    hireFee: 0,
    barDeposit: 0,
    depositReturnedOn: 0,
    halfHireFeeReturnedOn: 0,
    discountedHire: 0,
  };
  let explanations = [];

  for (let timing of Object.keys(groupedSelection)) {
    let rooms = groupedSelection[timing].sort();
    let {
      hireFee,
      barDeposit,
      depositReturnedOn,
      halfHireFeeReturnedOn,
      discountedHire,
      explanation,
    } = findCheapestBundle(rooms, pricingMap[timing]);
    totalCost.hireFee += hireFee;
    totalCost.barDeposit += barDeposit;
    totalCost.depositReturnedOn += depositReturnedOn;
    totalCost.halfHireFeeReturnedOn += halfHireFeeReturnedOn;
    totalCost.discountedHire += discountedHire;
    explanations.push(
      `For ${timing}, selected rooms ${rooms.join(", ")} resulted in: 
      ${explanation}`
    );
  }

  console.log("Final Total Cost:", totalCost);
  console.log("Explanations:", explanations);

  return { totalCost, explanations };
}

function findCheapestBundle(rooms, pricingMap) {
  if (rooms.length === 0)
    return {
      hireFee: 0,
      barDeposit: 0,
      depositReturnedOn: 0,
      halfHireFeeReturnedOn: 0,
      discountedHire: 0,
      explanation: "No rooms selected",
    };

  let bestCost = {
    hireFee: Infinity,
    barDeposit: Infinity,
    depositReturnedOn: Infinity,
    halfHireFeeReturnedOn: Infinity,
    discountedHire: Infinity,
    explanation: "",
  };
  let bestBundle = null;

  // Try to find the largest possible bundle first
  for (let bundle in pricingMap) {
    let bundleRooms = bundle.split(",");
    let remainingRooms = [...rooms];

    // Ensure all bundle rooms exist in the selection (with correct counts)
    if (
      bundleRooms.every((room) => {
        let countInSelection = rooms.filter((r) => r === room).length;
        let countInBundle = bundleRooms.filter((r) => r === room).length;
        return countInSelection >= countInBundle;
      })
    ) {
      // Remove bundle rooms from remaining selection
      for (let room of bundleRooms) {
        let index = remainingRooms.indexOf(room);
        if (index > -1) remainingRooms.splice(index, 1);
      }

      let remainingCosts = findCheapestBundle(remainingRooms, pricingMap);
      let totalCost = {
        hireFee: pricingMap[bundle].hireFee + remainingCosts.hireFee,
        barDeposit: pricingMap[bundle].barDeposit + remainingCosts.barDeposit,
        depositReturnedOn:
          pricingMap[bundle].depositReturnedOn +
          remainingCosts.depositReturnedOn,
        halfHireFeeReturnedOn:
          pricingMap[bundle].halfHireFeeReturnedOn +
          remainingCosts.halfHireFeeReturnedOn,
        discountedHire:
          pricingMap[bundle].discountedHire + remainingCosts.discountedHire,
        explanation: `Pricing used -> ${bundle} for ${pricingMap[bundle].hireFee} + remaining ${remainingCosts.explanation}`,
      };
      if (totalCost.hireFee < bestCost.hireFee) {
        bestCost = totalCost;
        bestBundle = bundle;
      }
    }
  }

  // If no bundle found, sum individual room prices
  if (bestCost.hireFee === Infinity) {
    let explanation = "Summed individual room prices: ";
    return rooms.reduce(
      (sum, room) => {
        let costs = pricingMap[room] || {
          hireFee: 0,
          barDeposit: 0,
          depositReturnedOn: 0,
          halfHireFeeReturnedOn: 0,
          discountedHire: 0,
        };
        explanation += `${room} (${costs.hireFee}), `;
        return {
          hireFee: sum.hireFee + costs.hireFee,
          barDeposit: sum.barDeposit + costs.barDeposit,
          depositReturnedOn: sum.depositReturnedOn + costs.depositReturnedOn,
          halfHireFeeReturnedOn:
            sum.halfHireFeeReturnedOn + costs.halfHireFeeReturnedOn,
          discountedHire: sum.discountedHire + costs.discountedHire,
          explanation: explanation.slice(0, -2),
        };
      },
      {
        hireFee: 0,
        barDeposit: 0,
        depositReturnedOn: 0,
        halfHireFeeReturnedOn: 0,
        discountedHire: 0,
        explanation: "",
      }
    );
  }

  return bestCost;
}

// Test Function
function testCalculateTotalHireDetails() {
  const selectedEvents = [
    // Case 1: Single-room booking (Exists in pricing)
    //Date 	Day	Room	Night/Day	Calendar ID	Event Name	Notes	Status	Booking ID	Start Time	End Time	Select
    [
      [
        "2025-04-10",
        "Thursday",
        "TERRACE",
        "DAY",
        "ID001",
        "Event X",
        "",
        "Confirmed",
        "",
        "",
        "",
        false,
      ],
    ],

    // Case 2: Multi-room booking (Exists in pricing)
    [
      [
        "2025-04-15",
        "Tuesday",
        "WAREHOUSE",
        "NIGHT",
        "ID002",
        "Event Y",
        "",
        "Confirmed",
        "",
        "",
        "",
        false,
      ],
      [
        "2025-04-15",
        "Tuesday",
        "BRUT",
        "NIGHT",
        "ID002",
        "Event Y",
        "",
        "Confirmed",
        "",
        "",
        "",
        false,
      ],
    ],

    // Case 3: Multi-room booking (Not in pricing, should sum individual prices)
    [
      [
        "2025-04-20",
        "Saturday",
        "TERRACE",
        "DAY",
        "ID003",
        "Event Z",
        "",
        "Confirmed",
        "",
        "",
        "",
        false,
      ],
      [
        "2025-04-20",
        "Saturday",
        "HOTHOUSE",
        "DAY",
        "ID003",
        "Event Z",
        "",
        "Confirmed",
        "",
        "",
        "",
        false,
      ],
    ],

    // Case 4: Bookings across different days (Ensure they are processed separately)
    [
      [
        "2025-05-01",
        "Thursday",
        "GALLERY",
        "DAY",
        "ID004",
        "Event A",
        "",
        "Confirmed",
        "",
        "",
        "",
        false,
      ],
      [
        "2025-05-02",
        "Friday",
        "WAREHOUSE",
        "NIGHT",
        "ID005",
        "Event B",
        "",
        "Confirmed",
        false,
        "",
        "",
        "",
      ],
      [
        "2025-05-02",
        "Friday",
        "BRUT",
        "NIGHT",
        "ID005",
        "Event B",
        "",
        "Confirmed",
        "",
        "",
        "",
        false,
      ],
      [
        "2025-05-01",
        "Thursday",
        "GALLERY",
        "DAY",
        "ID004",
        "Event A",
        "",
        "Confirmed",
        "",
        "",
        "",
        false,
      ],
    ],
  ];

  const result = calculateFees(selectedEvents[3]);
  // Logger.log(
  //   `Total Hire Fee: ${result.totalHireFee}, Total Bar Deposit: ${result.totalBarDeposit}, Total Discounted Hire Fee: ${result.totalDiscountedHireFee}`
  // );
  // result.details.forEach((detail) => Logger.log(detail));
}
