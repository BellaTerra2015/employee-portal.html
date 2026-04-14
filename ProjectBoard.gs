// ============================================================
// ProjectBoard.gs — reads/writes the Project Board Google Sheet
// Sheet ID: 1zHNv6aW44SzgQmJOYXZ1qnOMHisYd4bWJZOi4dbiSQk
// ============================================================

var PROJECT_SHEET_ID   = '1zHNv6aW44SzgQmJOYXZ1qnOMHisYd4bWJZOi4dbiSQk';
var PROJECT_SHEET_NAME = 'Projects';

// Column positions (1-indexed)
var COL = {
  PODIO_ID:       1,   // A
  NAME:           2,   // B
  PRIME_SUB:      3,   // C
  PROJECT_CLASS:  4,   // D
  PORTAL_STAGE:   5,   // E  ← Scheduled/Underway/Maintaining/Past
  SCOPE_JSON:     6,   // F
  SAFETY_JSON:    7,   // G
  DATE_ADDED:     8,   // H
  PODIO_STAGE:    9,   // I
  CONTRACT_NO:    10,  // J
  NOTES:          11   // K
};

var STAGES = ['Scheduled', 'Underway', 'Maintaining', 'Past Projects', 'Complete'];

// Users who can move projects between stages
var AUTHORIZED_EMAILS = [
  'rena@1bellaterra.com',
  'admin@1bellaterra.com',    // Heather
  'office@1bellaterra.com',   // Liz
  'brydon@1bellaterra.com'    // Brydon — confirm email if different
];

// ── SHEET SETUP ──────────────────────────────────────────────

function getProjectSheet() {
  var ss    = SpreadsheetApp.openById(PROJECT_SHEET_ID);
  var sheet = ss.getSheetByName(PROJECT_SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(PROJECT_SHEET_NAME);
    var headers = [
      'Podio Item ID', 'Project Name', 'Prime / Sub', 'Project Class',
      'Portal Stage', 'Scope Items (JSON)', 'Safety Plan (JSON)',
      'Date Added', 'Podio Stage', 'Contract Number', 'Notes'
    ];
    sheet.appendRow(headers);
    var hdr = sheet.getRange(1, 1, 1, headers.length);
    hdr.setBackground('#1a4b8c')
       .setFontColor('#ffffff')
       .setFontWeight('bold')
       .setFontSize(10);
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(COL.NAME,          280);
    sheet.setColumnWidth(COL.SCOPE_JSON,    60);
    sheet.setColumnWidth(COL.SAFETY_JSON,   60);
  }
  return sheet;
}

// ── READ ALL PROJECTS ────────────────────────────────────────

function getAllProjects() {
  var sheet = getProjectSheet();
  var rows  = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];

  var projects = [];
  for (var i = 1; i < rows.length; i++) {
    var row = rows[i];
    if (!row[COL.PODIO_ID - 1]) continue;
    try {
      var safetyRaw = row[COL.SAFETY_JSON - 1];
      var scopeRaw  = row[COL.SCOPE_JSON  - 1];
      projects.push({
        podioItemId:    row[COL.PODIO_ID      - 1].toString(),
        name:           row[COL.NAME          - 1] || '',
        primeSub:       row[COL.PRIME_SUB     - 1] || '',
        projectClass:   row[COL.PROJECT_CLASS - 1] || '',
        portalStage:    row[COL.PORTAL_STAGE  - 1] || 'Scheduled',
        scopeItems:     scopeRaw  ? JSON.parse(scopeRaw)  : [],
        safetyPlan:     safetyRaw ? JSON.parse(safetyRaw) : {},
        dateAdded:      row[COL.DATE_ADDED    - 1] || '',
        podioStage:     row[COL.PODIO_STAGE   - 1] || '',
        contractNumber: row[COL.CONTRACT_NO   - 1] || '',
        notes:          row[COL.NOTES         - 1] || '',
        rowIndex:       i + 1
      });
    } catch (e) {
      Logger.log('Parse error row ' + (i + 1) + ': ' + e.message);
    }
  }
  return projects;
}

// ── ADD NEW PROJECT ──────────────────────────────────────────

function addProject(projData) {
  // Prevent duplicates
  var existing = getAllProjects();
  for (var i = 0; i < existing.length; i++) {
    if (existing[i].podioItemId == projData.podioItemId) return false;
  }

  var sheet = getProjectSheet();
  sheet.appendRow([
    projData.podioItemId    || '',
    projData.name           || '',
    projData.primeSub       || '',
    projData.projectClass   || '',
    'Scheduled',
    JSON.stringify(projData.scopeItems || []),
    JSON.stringify({}),
    new Date().toLocaleDateString('en-US'),
    projData.podioStage     || '',
    projData.contractNumber || '',
    ''
  ]);

  // Alternate row shading
  var lastRow = sheet.getLastRow();
  var shade   = (lastRow % 2 === 0) ? '#f0f4ff' : '#ffffff';
  sheet.getRange(lastRow, 1, 1, Object.keys(COL).length).setBackground(shade);
  return true;
}

// ── MOVE PROJECT BETWEEN STAGES ──────────────────────────────

function moveProject(podioItemId, newStage) {
  if (STAGES.indexOf(newStage) === -1) return false;

  var sheet = getProjectSheet();
  var rows  = sheet.getDataRange().getValues();

  for (var i = 1; i < rows.length; i++) {
    if (rows[i][COL.PODIO_ID - 1].toString() === podioItemId.toString()) {
      sheet.getRange(i + 1, COL.PORTAL_STAGE).setValue(newStage);
      return true;
    }
  }
  return false;
}

// ── SAVE / UPDATE SAFETY PLAN ────────────────────────────────

function saveSafetyPlan(podioItemId, safetyData) {
  var sheet = getProjectSheet();
  var rows  = sheet.getDataRange().getValues();

  for (var i = 1; i < rows.length; i++) {
    if (rows[i][COL.PODIO_ID - 1].toString() === podioItemId.toString()) {
      sheet.getRange(i + 1, COL.SAFETY_JSON).setValue(JSON.stringify(safetyData));
      return true;
    }
  }
  return false;
}

// ── GET SINGLE PROJECT BY PODIO ITEM ID ─────────────────────

function getProjectById(podioItemId) {
  if (!podioItemId) return null;
  var projects = getAllProjects();
  for (var i = 0; i < projects.length; i++) {
    if (projects[i].podioItemId.toString() === podioItemId.toString()) {
      return projects[i];
    }
  }
  return null;
}

// ── SAVE FIELD REPORT TO REPORTS SHEET ──────────────────────

function saveReport(body) {
  var ss    = SpreadsheetApp.openById(PROJECT_SHEET_ID);
  var sheet = ss.getSheetByName('Reports');

  if (!sheet) {
    sheet = ss.insertSheet('Reports');
    var hdr = ['Timestamp', 'Project ID', 'Project Name', 'Report Type',
               'Submitted By', 'Date', 'Report Data (JSON)'];
    sheet.appendRow(hdr);
    var hdrRange = sheet.getRange(1, 1, 1, hdr.length);
    hdrRange.setBackground('#1a4b8c').setFontColor('#ffffff').setFontWeight('bold');
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(7, 400);
  }

  // Look up project name for readability
  var proj     = getProjectById(body.projectId);
  var projName = proj ? proj.name : (body.projectName || body.projectId || 'Unknown');

  sheet.appendRow([
    new Date(),
    body.projectId   || '',
    projName,
    body.reportType  || '',
    body.submittedBy || '',
    body.date        || '',
    JSON.stringify(body)
  ]);

  // ── Email Rena on every herbicide submission ──────────────────
  if (body.reportType === 'herbicide' && body.log) {
    var log  = body.log;
    var subj = '🧪 Herbicide Report — ' + projName + ' — ' + (log.appDate || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'MM/dd/yyyy'));
    var html =
      '<h2 style="color:#1a4b8c;">Herbicide Application Record</h2>' +
      '<h3 style="color:#2d5a27;">' + projName + '</h3>' +
      '<table style="border-collapse:collapse;width:100%;font-family:Arial,sans-serif;font-size:13px;">' +
      emailRow('Date',             log.appDate) +
      emailRow('SR / Route',       log.sr) +
      emailRow('Contract #',       log.contractNum) +
      emailRow('County',           log.county) +
      emailRow('Area / Location',  log.areaDesc) +
      emailRow('Start Time',       log.startTime) +
      emailRow('Finish Time',      log.finishTime) +
      emailRow('Material / Product', log.materialName) +
      emailRow('Manufacturer',     log.manufacturer) +
      emailRow('EPA Reg #',        log.epaReg) +
      emailRow('Lot Number',       log.lotNum) +
      emailRow('Rate per Acre',    log.ratePerAcre) +
      emailRow('Total Used',       (log.totalUsage || '') + ' ' + (log.unit || '')) +
      emailRow('Temp at Start',    log.tempStart) +
      emailRow('Temp at Finish',   log.tempFinish) +
      emailRow('Wind Direction',   log.windDir) +
      emailRow('Wind Speed',       log.windSpeed) +
      emailRow('Applicator',       log.applicator) +
      emailRow('Applicator Lic.',  log.applicatorLic) +
      emailRow('Operator',         log.operator) +
      emailRow('Operator Lic.',    log.operatorLic) +
      emailRow('Remarks',          log.remarks) +
      emailRow('Submitted By',     body.submittedBy) +
      '</table>' +
      '<p style="font-size:12px;color:#888;margin-top:16px;">Submitted via Bella Terra Employee Portal · Records retained 7 years per RCW 17.21</p>';

    MailApp.sendEmail({
      to:       'rena@1bellaterra.com',
      subject:  subj,
      htmlBody: html
    });
  }

  return true;
}

// ── EMAIL TABLE ROW HELPER ────────────────────────────────────
function emailRow(label, val) {
  if (!val || val.toString().trim() === '') return '';
  return '<tr>' +
    '<td style="padding:4px 8px;border:1px solid #ddd;font-weight:bold;background:#f5f5f2;width:35%;">' + label + '</td>' +
    '<td style="padding:4px 8px;border:1px solid #ddd;">' + val + '</td>' +
    '</tr>';
}

// ── CHECK AUTHORIZATION ──────────────────────────────────────

function isAuthorizedMover(email) {
  if (!email) return false;
  return AUTHORIZED_EMAILS.indexOf(email.trim().toLowerCase()) !== -1;
}

// ── COMPLETE A JOB (no auth required — field crew use) ───────

function completeJob(body) {
  // Move to Complete stage
  var moved = moveProject(body.podioItemId, 'Complete');

  // Log the completion in the Reports sheet
  var ss    = SpreadsheetApp.openById(PROJECT_SHEET_ID);
  var sheet = ss.getSheetByName('Reports');
  if (!sheet) {
    sheet = ss.insertSheet('Reports');
    var hdr = ['Timestamp', 'Project ID', 'Project Name', 'Report Type',
               'Submitted By', 'Date', 'Report Data (JSON)'];
    sheet.appendRow(hdr);
    var hdrRange = sheet.getRange(1, 1, 1, hdr.length);
    hdrRange.setBackground('#1a4b8c').setFontColor('#ffffff').setFontWeight('bold');
    sheet.setFrozenRows(1);
  }

  var projName = body.projectName || body.podioItemId || 'Unknown';
  var completedOn = body.completedOn
    ? Utilities.formatDate(new Date(body.completedOn), Session.getScriptTimeZone(), 'MM/dd/yyyy')
    : Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'MM/dd/yyyy');

  sheet.appendRow([
    new Date(),
    body.podioItemId   || '',
    projName,
    'Job Complete',
    body.crewLead      || '',
    completedOn,
    JSON.stringify(body)
  ]);

  // Email Rena
  var subj = '✅ Job Complete — ' + projName + ' — ' + completedOn;
  var html =
    '<h2 style="color:#1a4b8c;">Job Marked Complete</h2>' +
    '<h3 style="color:#2d5a27;">' + projName + '</h3>' +
    '<table style="border-collapse:collapse;width:100%;font-family:Arial,sans-serif;font-size:13px;">' +
    emailRow('Crew Lead',       body.crewLead) +
    emailRow('Completed On',    completedOn) +
    emailRow('Notes',           body.notes) +
    emailRow('Podio Item ID',   body.podioItemId) +
    '</table>' +
    '<p style="font-size:12px;color:#888;margin-top:16px;">Submitted via Bella Terra Employee Portal</p>';

  MailApp.sendEmail({
    to:       'rena@1bellaterra.com',
    subject:  subj,
    htmlBody: html
  });

  return moved;
}

// ── VERIFY REPORT PASSWORD ───────────────────────────────────

function checkReportPassword(password) {
  var stored = PropertiesService.getScriptProperties().getProperty('REPORT_PASSWORD');
  return password === stored;
}
