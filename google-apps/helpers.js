const DB_SHEET_ID = "17CjfpnlwCs6aKsXiT2DS-d8jX6Hk9tSPYcHhPP2nL2A";
const ERROR_EMAIL = "president@ecess.ca";

function reportSyncError(source, error) {
  const detail = error && error.stack ? error.stack : String(error && error.message ? error.message : error);
  Logger.log(source + " Failed: " + detail);
  try {
    MailApp.sendEmail(
      ERROR_EMAIL,
      "ECESS " + source + " Failed",
      source + " Failed.\n\n" + detail
    );
  } catch (mailError) {
    Logger.log("Could Not Email " + ERROR_EMAIL + ": " + mailError.message);
  }
}