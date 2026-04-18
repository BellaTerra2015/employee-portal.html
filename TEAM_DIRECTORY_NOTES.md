# Team Directory — Structure & Protection Notes

## ⚠️ WARNING: DO NOT OVERWRITE THIS FEATURE

The Team Directory is embedded inside `bella_terra_portal_html.html`.
Any time you paste in a new version of any large section, verify the Team Directory
section is still present before saving.

---

## Single source of truth: Google Sheet

**The Employee Resources Google Sheet is the ONLY place employee data is managed.**
Sheet ID: `1dGIbtdw8BFX2lKeVT3C7Y4MxeWFABWO4g7IMUnqb0l4` — first tab.

| Column | Field | Notes |
|--------|-------|-------|
| A | Name | Must match exactly what the employee types at login |
| B | Role | Title shown on card |
| C | Phone | Base phone — updated when employee saves their profile |
| D | Notes | Dispatcher note (e.g. "Call Brydon before Rena") |
| E | Leadership | Yes/No — gold border + badge on card |
| F | Active | Yes/No — only Yes rows appear in directory |
| G | Emergency Contact Name | Filled in by employee via portal |
| H | Emergency Contact Number | Filled in by employee via portal |

**Name changes must be made in the sheet (col A). The portal reads names live from
the sheet — it does NOT use any hardcoded name list.**

---

## Where the code lives in the portal file

Search for this comment to find each section:
```
/* ⚠️ TEAM DIRECTORY — DO NOT OVERWRITE. See TEAM_DIRECTORY_NOTES.md */
```

| Location | What's there |
|----------|-------------|
| `<style>` block | All `.td-*` CSS classes |
| HTML body (after `panel-nursery`) | `#panel-team` div + `#td-edit-modal` |
| `<script>` block | `TEAM_DATA` array + all JS functions |

---

## How it works (data flow)

1. Employee taps **Team Directory** tile on main portal
2. Portal calls `NURSERY_URL?action=employeeProfiles` (Apps Script GET)
3. Apps Script reads the sheet and returns ALL active employees with:
   name, role, phone, notes, leader flag, ecName, ecPhone
4. Portal renders cards from the sheet data — **not from hardcoded TEAM_DATA**
5. TEAM_DATA in the JS is an offline fallback only (if sheet fails to load)

When an employee saves their profile:
- Phone → col C in sheet
- Emergency Contact Name → col G
- Emergency Contact Phone → col H
- Email notification → Payroll@1BellaTerra.com

---

## Key JS functions

| Function | What it does |
|----------|-------------|
| `showTeamDir(scrollToSelf)` | Hides main tiles, fetches sheet data, shows directory |
| `hideTeamDir()` | Back to main tiles |
| `loadTeamProfiles(cb)` | Fetches `?action=employeeProfiles` from Apps Script |
| `buildTeamDir()` | Renders cards from sheet data; leaders first, then alpha |
| `openTdEdit()` | Opens edit modal pre-filled from sheet data |
| `saveMyProfile()` | Saves to localStorage cache + POSTs to Apps Script |
| `checkTdProfileBanner()` | Shows first-login banner if no EC on file |

---

## Apps Script functions (Code.gs in Bella Terra Portal script)

| Function | Location | What it does |
|----------|----------|-------------|
| `getEmployeeProfiles()` | doGet `?action=employeeProfiles` | Returns all active employees with full data |
| `saveEmployeeProfile()` | doPost `body.type=profile_update` | Updates cols C, G, H for matching name |
| `getEmployeeProfilesSheet()` | helper | Opens Employee Resources sheet, first tab |
| `getDirectoryEmployees()` | doGet `?action=all` | Used by employee_resources.html Handbook tab |

---

## Employee self-edit

Employees tap **✏️ Update My Info** on their own card (matched by login name).
Editable fields:
- Phone number → col C
- Email address → email notification only (no sheet column currently)
- Emergency contact name → col G
- Emergency contact phone → col H

After saving, an email goes to `Payroll@1BellaTerra.com`.

---

## First-login banner

On login, `checkTdProfileBanner()` runs. If the employee has no EC in their
localStorage cache and hasn't dismissed the banner before, an orange banner
appears: "📋 Please update your profile — add your emergency contact number."
Banner links directly to their card.

---

## employee_resources.html — Team tab REMOVED

The "👷 Team" tab was removed from `employee_resources.html` on 2026-04-17.
All team/contact info now lives exclusively in the main portal's Team Directory.
The employee_resources.html file still has Overview, Contacts, Signatures,
and Handbook tabs — those were not changed.

---

## TEAM_DATA array — fallback only

`TEAM_DATA` in the portal JS still exists as an **offline fallback** in case
the sheet fails to load. It does NOT drive the live directory.
Do not rely on it for current names or contact info — update the sheet instead.

---

## How to add, remove, or rename an employee

All changes are made directly in the **Google Sheet** (col A–H):
- **Add**: Add a new row. Set col F (Active) = Yes.
- **Remove**: Change col F (Active) = No. Row is hidden immediately.
- **Rename**: Change col A. The new name appears in the portal on next load.
  ⚠️ Employee must log in with the new name for their Edit button to appear.

Do NOT edit TEAM_DATA in the JS for active roster management.

---

## Files changed (as of 2026-04-17)

| File | Change |
|------|--------|
| `bella_terra_portal_html.html` | Team Directory tile + panel + JS added; sheet is now primary data source |
| `employee_resources.html` | Team tab removed; Handbook tab still works |
| `Code.gs` | `employeeProfiles`, `profile_update`, `all`, `getDirectoryEmployees` handlers added |
| `TEAM_DIRECTORY_NOTES.md` | This file |
