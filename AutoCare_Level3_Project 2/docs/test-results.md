# AutoCare Test Results

Run: 2026-10-31T18:29:55.382Z  |  54/54 passed

| ID | Test case | Result |
|----|-----------|--------|
| T01 | Login with correct credentials succeeds | PASS |
| T02 | Login with wrong password is rejected (401) | PASS |
| T03 | SQL-injection style email is rejected (401) | PASS |
| T04 | Unauthenticated API call is rejected (401) | PASS |
| T05 | Passwords are stored as bcrypt hashes | PASS |
| T06 | Registration rejects weak password (400) | PASS |
| T07 | Customer registration succeeds (201) | PASS |
| T08 | Duplicate email registration returns 409 (UNIQUE) | PASS |
| T09 | Customer cannot read inventory API (403) | PASS |
| T10 | Customer cannot create staff (403) | PASS |
| T11 | Staff cannot create service types (403) | PASS |
| T12 | Customer cannot cancel another customer's appointment (403) | PASS |
| T13 | Customer sees only own appointments | PASS |
| T14 | CHECK constraint rejects vehicle year 1900 (400) | PASS |
| T15 | CHECK constraint rejects invalid fuel type (400) | PASS |
| T16 | UNIQUE constraint rejects duplicate registration (409) | PASS |
| T17 | Valid vehicle is accepted (201) | PASS |
| T18 | Direct SQL: negative price rejected by CHECK | PASS |
| T19 | Direct SQL: invalid role rejected by CHECK | PASS |
| T20 | Direct SQL: payment to missing appointment rejected by FK | PASS |
| T21 | Booking in the past is rejected by stored procedure (400) | PASS |
| T22 | Booking another customer's vehicle is forbidden (403) | PASS |
| T23 | Valid booking succeeds via sp_book_appointment (201) | PASS |
| T24 | Admin double-booking a mechanic is rejected (400) | PASS |
| T25 | Only admin can assign mechanics (403 for staff) | PASS |
| T26 | Admin assigns mechanic (200) | PASS |
| T27 | Assigned staff starts work (200) | PASS |
| T28 | Other mechanic cannot work on the job (403) | PASS |
| T29 | Completion with insufficient stock fails and rolls back (400) | PASS |
| T30 | Completion succeeds: record, parts, invoice created (200) | PASS |
| T31 | Trigger deducted stock for parts used | PASS |
| T32 | Trigger computed Total_Cost = labour + parts (300 + 1850 + 2x350 = 2850) | PASS |
| T33 | Invoice has 18% tax (Total 3363.00) | PASS |
| T34 | Appointment now Completed | PASS |
| T35 | Completed appointment cannot be re-completed (400) | PASS |
| T36 | Trigger blocks status change of a completed appointment (400) | PASS |
| T37 | Inventory log row written by trigger | PASS |
| T38 | Payment above balance is rejected (400) | PASS |
| T39 | Negative payment rejected (400) | PASS |
| T40 | Partial payment sets invoice Partially Paid | PASS |
| T41 | Remaining payment sets invoice Paid; fn_invoice_balance = 0 | PASS |
| T42 | Customer cannot pay someone else's invoice (403) | PASS |
| T43 | Deleting a service with appointments is blocked (409, FK RESTRICT) | PASS |
| T44 | Deleting a customer cascades to vehicles (ON DELETE CASCADE) | PASS |
| T45 | Full-text search finds brake problems | PASS |
| T46 | Restock procedure increases stock (admin) | PASS |
| T47 | Restock with zero quantity rejected (400) | PASS |
| P47 | Admin page /dashboard renders (200) | PASS |
| P48 | Admin page /reports renders (200) | PASS |
| P49 | Staff page /appointments renders (200) | PASS |
| P50 | Customer page /billing renders (200) | PASS |
| P51 | Customer page /vehicles renders (200) | PASS |
| T48 | Unauthenticated page request redirects to /login | PASS |
| T49 | Customer is redirected away from admin-only /reports | PASS |
