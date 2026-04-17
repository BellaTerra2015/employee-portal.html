# Team Directory — Structure & Protection Notes

## ⚠️ WARNING: DO NOT OVERWRITE THIS FEATURE

The Team Directory is embedded inside `bella_terra_portal_html.html`.
Any time you paste in a new version of `doGet`, `doPost`, or large sections of the portal,
**verify the Team Directory section is still present before saving.**

---

## Where it lives in the file

Search for this comment to find the Team Directory section:
```
/* ⚠️ TEAM DIRECTORY — DO NOT OVERWRITE. See TEAM_DIRECTORY_NOTES.md for structure. */
```

It appears in **three places**:

| Location | What's there |
|----------|-------------|
| `<style>` block | All `.td-*` CSS classes |
| HTML body (after `panel-nursery`) | `#panel-team` div + `#td-edit-modal` |
| `<script>` block | `TEAM_DATA` array + all JS functions |

---

## Data structure — TEAM_DATA array

Each employee object in `TEAM_DATA` has these fields:

```js
{
  name:   'Full Name',       // Exact name — used as localStorage key
  role:   'Title · Detail', // Role string shown on card
  phone:  '3601234567',     // 10-digit, no formatting — base phone number
  notes:  'Call notes…',    // Optional dispatcher note shown on card
  leader: true|false,       // true = gold border + "Leadership" badge
  active: true|false        // false = hidden from directory
}
```

**Leadership employees (leader: true):** Brydon Bellika, Rena Bellika, Garrett Booker, Robert Serna

---

## Employee self-edits (localStorage)

Employees can update their own card by clicking **✏️ Update My Info** on their card.
(Button appears only for the currently logged-in employee, matched by name.)

Editable fields:
- Phone number (overrides base phone in TEAM_DATA)
- Email address
- Emergency contact name
- Emergency contact phone

Storage key format: `bt4_td_[name_lowercased_with_underscores]`

Examples:
- `bt4_td_rena_bellika`
- `bt4_td_elizabeth__liz__p_`

After saving, an email is sent to `Payroll@1BellaTerra.com` via Apps Script POST
with `type: 'profile_update'`.

---

## First-login banner

On login, `checkTdProfileBanner()` checks:
1. Is `bt4_profile_banner_dismissed` set in localStorage? → skip
2. Does the employee already have an EC on file? → skip
3. Otherwise → show the orange banner: "📋 Please update your profile — add your emergency contact number"

Banner links directly to the employee's own card (scrolls to it).
Dismissed forever when employee saves a profile with an EC name or phone filled in,
or when they click ×.

---

## Key functions

| Function | What it does |
|----------|-------------|
| `showTeamDir(scrollToSelf)` | Hides main tiles, shows panel-team, calls buildTeamDir() |
| `hideTeamDir()` | Hides panel-team, shows main tiles |
| `buildTeamDir()` | Renders all active employee cards into `#td-cards` |
| `openTdEdit()` | Opens the edit modal pre-filled with current employee's data |
| `closeTdEdit()` | Closes the edit modal |
| `saveMyProfile()` | Saves profile to localStorage, fires email, dismisses banner if EC filled |
| `sendProfileUpdateEmail(name, profile)` | POST to Apps Script with `type: 'profile_update'` |
| `checkTdProfileBanner()` | Called from `doLogin()` — shows first-login banner if needed |
| `dismissProfileBanner()` | Permanently hides banner via localStorage flag |

---

## Apps Script handler needed

The email notification uses a POST to `APPS_SCRIPT` with:
```json
{
  "type": "profile_update",
  "employee": "Name",
  "phone": "...",
  "email": "...",
  "ecName": "...",
  "ecPhone": "...",
  "to": "Payroll@1BellaTerra.com",
  "subject": "Profile Updated — Name",
  "body": "..."
}
```

**This handler must be added to `Code.gs`** in the Apps Script `doPost` function
(not yet implemented — adds gracefully with no-cors fetch, so it fails silently until added).

---

## How to add or remove an employee

Edit the `TEAM_DATA` array in the `<script>` block of `bella_terra_portal_html.html`.
- To hide someone: change `active: true` → `active: false`
- To add someone: append a new object following the structure above
- Do NOT delete objects — set `active: false` to preserve localStorage history

---

## Employee list (as of 2026-04-17)

| Name | Role | Leadership |
|------|------|-----------|
| Brydon Bellika | VP · Co-Owner · Class A CDL | Yes |
| Rena Bellika | Owner · Class B CDL | Yes |
| Garrett Booker | Superintendent · Class A CDL | Yes |
| Robert Serna | Head Bark Blower · Class A CDL · Bilingual EN/ES | Yes |
| Elynn Alholinna | Nursery Lead · Field Crew | No |
| Juan Gonzalez | Field Crew · Bilingual EN/ES | No |
| Emily Greer | Payroll · Onboarding | No |
| Heather Hooper | Office/Admin · Wed–Fri | No |
| Joe Jumalon | Head Laborer · Bark Blowing | No |
| Ethan Kludt-Painter | Sales & Logistics | No |
| Evaristo Lopez | Field Crew · Operator in Training | No |
| Adriane North | Class A CDL · Wednesdays Only | No |
| Elizabeth (Liz) P. | Accounting & HR | No |
| Randy Schmeus | Class A CDL · Field Crew | No |
| Kevin Willbur | Lead Estimator | No |
