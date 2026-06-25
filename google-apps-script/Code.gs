const SPREADSHEET_ID = "1vWWUqkP_3Fe8wM9vHG484psDfs-ElGeEqZ6y2ipDwvA";
const SHEET_NAME = "Votes";

function doGet(event) {
  const callback = event.parameter.callback || "callback";
  const payload = JSON.stringify(getVotePayload());

  return ContentService
    .createTextOutput(`${callback}(${payload});`)
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function doPost(event) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const sheet = getVoteSheet();
    const name = cleanValue(event.parameter.name);
    const venue = cleanValue(event.parameter.venue).toLowerCase();

    if (!name || !["beige", "tropika"].includes(venue)) {
      return jsonResponse({ ok: false, error: "Invalid vote" });
    }

    upsertVote(sheet, name, venue);
    return jsonResponse({ ok: true });
  } finally {
    lock.releaseLock();
  }
}

function getVotePayload() {
  const sheet = getVoteSheet();
  const rows = sheet.getDataRange().getValues().slice(1);
  const votes = rows
    .filter((row) => row[0] && row[1])
    .map((row) => ({
      name: row[0],
      venue: row[1],
      createdAt: row[2],
      updatedAt: row[3]
    }));

  const summary = votes.reduce(
    (totals, vote) => {
      totals[vote.venue] += 1;
      return totals;
    },
    { beige: 0, tropika: 0 }
  );

  return {
    ok: true,
    summary,
    votes
  };
}

function getVoteSheet() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.insertSheet(SHEET_NAME);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["Name", "Venue", "Created At", "Updated At"]);
  }

  return sheet;
}

function upsertVote(sheet, name, venue) {
  const now = new Date();
  const normalizedName = name.toLowerCase();
  const rows = sheet.getDataRange().getValues();

  for (let index = 1; index < rows.length; index += 1) {
    if (String(rows[index][0]).trim().toLowerCase() === normalizedName) {
      sheet.getRange(index + 1, 2, 1, 3).setValues([[venue, rows[index][2] || now, now]]);
      return;
    }
  }

  sheet.appendRow([name, venue, now, now]);
}

function cleanValue(value) {
  return String(value || "").trim().slice(0, 80);
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
