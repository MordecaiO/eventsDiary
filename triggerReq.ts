const triggerCreateDealMemo = (
  bookingID,
  signeeID,
  bookingSheetRowNumber,
  signeeSheetRowNumber,
  email,
  hireFee,
  barDeposit,
  depositReturnedOn,
  halfHireFeeReturnedOn,
  subject,
  latestEventDate
) => {
  const url = "https://hook.eu2.make.com/u3u7kxkxkcs9x4d17etv9byayvyaxn8c";

  const options = {
    method: "post" as GoogleAppsScript.URL_Fetch.HttpMethod, // Change to "get", "put", etc., as needed
    payload: {
      bookingID: bookingID,
      signeeID: signeeID,
      bookingSheetRowNumber: bookingSheetRowNumber,
      signeeSheetRowNumber: signeeSheetRowNumber,
      email: email,
      hireFee: hireFee,
      barDeposit: barDeposit,
      depositReturnedOn: depositReturnedOn,
      halfHireFeeReturnedOn: halfHireFeeReturnedOn,
      subject: subject,
      latestEventDate: latestEventDate,
    },
  };

  UrlFetchApp.fetch(url, options);
};
