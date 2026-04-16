// ============================================================
// SdsService.gs — Chemical SDS Product Database
//
// Data lives in: Bella Terra Employee Resources sheet
//   Sheet ID : 1dGIbtdw8BFX2lKeVT3C7Y4MxeWFABWO4g7IMUnqb0l4
//   Tab name : SDS Database
//
// SDS PDFs stored in Drive folder:
//   Folder ID: 0ABgS4WRbpDAxUk9PVA
//   Naming   : PDF filename must match the id column exactly
//              e.g.  aquamaster.pdf, roundupcustom.pdf,
//                    preference.pdf, dynamark-uv-blue.pdf
//
// To add a product: add a row in the Sheet (status = active).
//   Run syncSdsPdfs() once after uploading the PDF to Drive.
//
// Access control: any @1bellaterra.com address (case-insensitive).
// ============================================================

var SDS_SHEET_ID  = '1dGIbtdw8BFX2lKeVT3C7Y4MxeWFABWO4g7IMUnqb0l4';
var SDS_TAB_NAME  = 'SDS Database';
var SDS_FOLDER_ID = '1KAGwkZYAmX5YaxVflqmK2SJCMctHdz8V';

// Sheet column positions (1-indexed) — must match the header row exactly:
// id | category | name | manufacturer | epa_reg | drive_pdf_url | emergency_phone | status | notes
var SDS_COL = {
  ID:              1,  // A
  CATEGORY:        2,  // B
  NAME:            3,  // C
  MANUFACTURER:    4,  // D
  EPA_REG:         5,  // E
  DRIVE_PDF_URL:   6,  // F
  EMERGENCY_PHONE: 7,  // G
  STATUS:          8,  // H
  NOTES:           9   // I
};

// ── SHEET ACCESS ─────────────────────────────────────────────

function getSdsSheet() {
  return SpreadsheetApp.openById(SDS_SHEET_ID)
                       .getSheetByName(SDS_TAB_NAME);
}

// ── READ PRODUCTS ────────────────────────────────────────────
// Returns all active products.
// Pass category ('Herbicide', 'Adjuvant', 'Marker', …) to filter,
// or omit / pass '' for all active products.

function getSdsProducts(category) {
  var sheet = getSdsSheet();
  var rows  = sheet.getDataRange().getValues();
  var out   = [];

  for (var i = 1; i < rows.length; i++) {
    var row = rows[i];
    var id  = (row[SDS_COL.ID - 1] || '').toString().trim();
    if (!id) continue;

    var status = (row[SDS_COL.STATUS - 1] || '').toString().toLowerCase().trim();
    if (status !== 'active') continue;

    var cat = (row[SDS_COL.CATEGORY - 1] || '').toString().trim();
    if (category && cat.toLowerCase() !== category.toLowerCase()) continue;

    out.push({
      id:             id,
      category:       cat,
      name:           (row[SDS_COL.NAME          - 1] || '').toString().trim(),
      manufacturer:   (row[SDS_COL.MANUFACTURER  - 1] || '').toString().trim(),
      epaReg:         (row[SDS_COL.EPA_REG        - 1] || '').toString().trim(),
      drivePdfUrl:    (row[SDS_COL.DRIVE_PDF_URL  - 1] || '').toString().trim(),
      emergencyPhone: (row[SDS_COL.EMERGENCY_PHONE- 1] || '').toString().trim(),
      notes:          (row[SDS_COL.NOTES          - 1] || '').toString().trim()
    });
  }
  return out;
}

// ── AUTO-SYNC PDF LINKS FROM DRIVE ───────────────────────────
// Scans the SDS Drive folder for PDF files.
// Matches each file to a Sheet row using the id column
// (filename without .pdf must equal the id value exactly).
// Writes the Drive view URL into the drive_pdf_url column.
//
// Run this once after uploading a new PDF to Drive.
// No manual copy-pasting of links needed.

function syncSdsPdfs() {
  var folder = DriveApp.getFolderById(SDS_FOLDER_ID);
  var sheet  = getSdsSheet();
  var rows   = sheet.getDataRange().getValues();

  // Build map: cleaned filename (no .pdf) → Drive view URL
  var pdfMap = {};
  var files  = folder.getFilesByType(MimeType.PDF);
  while (files.hasNext()) {
    var file = files.next();
    var key  = file.getName().toLowerCase().replace(/\.pdf$/i, '').trim();
    pdfMap[key] = 'https://drive.google.com/file/d/' + file.getId() + '/view';
  }

  var updated = 0;
  for (var i = 1; i < rows.length; i++) {
    var id = (rows[i][SDS_COL.ID - 1] || '').toString().toLowerCase().trim();
    if (!id) continue;
    if (pdfMap[id]) {
      sheet.getRange(i + 1, SDS_COL.DRIVE_PDF_URL).setValue(pdfMap[id]);
      updated++;
    }
  }

  Logger.log('syncSdsPdfs: ' + updated + ' row(s) updated.');
  return updated + ' product(s) updated with Drive PDF links.';
}

// ── ACCESS CONTROL ───────────────────────────────────────────
// Any @1bellaterra.com address can edit SDS records.
// Case-insensitive — covers Rena@, rena@, RENA@, etc.

function isAuthorizedSdsEditor(email) {
  if (!email) return false;
  return email.trim().toLowerCase().endsWith('@1bellaterra.com');
}
