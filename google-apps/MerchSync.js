/*
 * Google Apps Script for Syncing Private Merch Sheet to Public Sheet
 *
 * SETUP INSTRUCTIONS:
 * 1. Open `Summary` Sheet in Private Merch Management Spreadsheet.
 * 2. Go to Extensions → Apps Script and Update Code.
 * 3. Run testMerchSync() Once and Approve Permissions.
 * 4. (Optional) Run installMerchSyncTrigger() Once to Set Up Daily Sync.
 *
 * CONFIGURATION:
 * - MERCH_SHEET_ID: Detailed Merch Management Data, User-Editable.
 * - DB_SHEET_ID: Minimal Public Interface, Read-Only for Website.
 *
 * This Script Transforms Private Inventory Data Into a Minimal Public Interface:
 * Private Columns (Excluded): Original Stock, Quantity Sold, Percentage
 * Public Columns (Exposed): Stock
 */

const MERCH_SHEET_ID = "1w61XgoPvT5SU2_DRKaUubznXMIxu_4J6Bd4yov0663k";

/*
 * Syncs Merch Data from Private Management Sheet to Website Database
 *
 * Private Sheet Columns: [Item, Original Stock, Quantity Sold, Quantity Remaining, Percentage]
 * Public Sheet Columns: [Item, Price, Category, Sizes, Stock, Image, Show]
 */
function syncMerchToDB() {
  try {
    const privateDoc = SpreadsheetApp.openById(MERCH_SHEET_ID);
    const privateSheet = privateDoc.getSheetByName("Summary");
    if (!privateSheet) {
      throw new Error("Private Merch Spreadsheet Has No Sheet Named Summary.");
    }

    const range = privateSheet.getDataRange();
    const values = range.getValues();

    const headers = values[0];
    const itemIndex = headers.indexOf("Item");
    const remainingIndex = headers.indexOf("Quantity Remaining");

    if (itemIndex === -1 || remainingIndex === -1) {
      throw new Error("Private Merch Sheet Missing An Item or Quantity Remaining Column.");
    }

    const stockByItem = {};

    // Iterate Through Items and Calculate Stock
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      const summaryItem = row[itemIndex];
      const remaining = row[remainingIndex];

      if (!summaryItem || summaryItem === "") continue;

      const header = String(summaryItem).trim();
      const sizedMatch = header.match(/^(.+?)\s*\(([^)]+)\)$/);
      const count = Number(remaining);
      const stockCount = isNaN(count) ? 0 : count;

      if (sizedMatch) {
        const item = sizedMatch[1].trim();
        const size = sizedMatch[2].trim();

        if (!stockByItem[item]) stockByItem[item] = {};
        stockByItem[item][size] = stockCount;
      } else {
        stockByItem[header] = stockCount;
      }
    }

    const publicDoc = SpreadsheetApp.openById(DB_SHEET_ID);
    const publicSheet = publicDoc.getSheetByName("Merch");
    if (!publicSheet) {
      throw new Error("The website database has no sheet named Merch.");
    }

    const publicRange = publicSheet.getDataRange();
    const publicValues = publicRange.getValues();

    const publicHeaders = publicValues[0];
    const publicItemIndex = publicHeaders.indexOf("Item");
    const sizesIndex = publicHeaders.indexOf("Sizes");
    const stockIndex = publicHeaders.indexOf("Stock");

    if (publicItemIndex === -1 || stockIndex === -1) {
      throw new Error("Public Merch Sheet Missing An Item or Stock Column.");
    }

    const stockUpdates = [];
    let updatedCount = 0;

    for (let i = 1; i < publicValues.length; i++) {
      const row = publicValues[i];
      const item = row[publicItemIndex];
      const sizesText = row[sizesIndex];

      // Keep Existing Stock When Item Is Missing From Summary
      if (!item || item === "" || stockByItem[item] === undefined) {
        stockUpdates.push([row[stockIndex]]);
        continue;
      }

      const itemStock = stockByItem[item];
      let newStock = "";

      if (sizesText && sizesText !== "") {
        const sizes = String(sizesText).split(", ");
        const stockValues = [];

        for (let j = 0; j < sizes.length; j++) {
          const size = sizes[j].trim();
          if (typeof itemStock === "object" && itemStock[size] !== undefined) {
            stockValues.push(itemStock[size]);
          } else {
            stockValues.push(0);
          }
        }

        newStock = stockValues.join(", ");
      } else if (typeof itemStock === "number") {
        newStock = String(itemStock);
      } else {
        stockUpdates.push([row[stockIndex]]);
        continue;
      }

      if (String(row[stockIndex]) !== newStock) updatedCount++;
      stockUpdates.push([newStock]);
    }

    publicSheet.getRange(2, stockIndex + 1, stockUpdates.length, 1).setValues(stockUpdates);

    Logger.log(`✓ Sync Completed Successfully At ${new Date()}`);
    Logger.log(`✓ Updated ${updatedCount} Merch Items`);

  } catch (error) {
    reportSyncError("Merch Sync", error);
  }
}

/*
 * Installs Time-Based Trigger for Automatic Daily Sync.
 * Run to Set Up Automation. Removes Existing Triggers to Avoid Duplicates.
 */
function installMerchSyncTrigger() {
  try {
    // Remove Only This Script's Trigger (Locker / Calendar Triggers Share the Project)
    removeMerchSyncTrigger();

    // Create New Trigger: Runs Every 24 Hours
    ScriptApp.newTrigger("syncMerchToDB")
      .timeBased()
      .everyDays(1)
      .create();

    Logger.log("✓ Trigger Installed Successfully");
    Logger.log("✓ syncMerchToDB() Will Run Automatically Every 24 Hours");

  } catch (error) {
    reportSyncError("Merch Sync Trigger Setup", error);
  }
}

/*
 * Removes the Automatic Sync Trigger. Use This if You Want to Disable Automatic Syncing.
 */
function removeMerchSyncTrigger() {
  try {
    ScriptApp.getProjectTriggers().forEach(trigger => {
      if (trigger.getHandlerFunction() === "syncMerchToDB") {
        ScriptApp.deleteTrigger(trigger);
      }
    });

    Logger.log("✓ Trigger Removed - Automatic Sync Disabled");

  } catch (error) {
    reportSyncError("Merch Sync Trigger Removal", error);
  }
}

/*
 * Test Function - Runs Sync Once and Logs Results
 * Useful for Debugging Before Setting Up the Trigger
 */
function testMerchSync() {
  Logger.log("Starting Test Sync...");
  syncMerchToDB();
  Logger.log("Test Sync Completed - Check Logs Above");
}
