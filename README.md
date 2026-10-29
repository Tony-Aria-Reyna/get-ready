# Family Ready

An offline emergency app for our family: what to do in an earthquake, tsunami, eruption, storm, long outage, comms outage, unrest or supply-chain collapse; step-by-step guides for our own home equipment; maps that work with no signal; our plan, contacts, supplies and suppliers.

**Everything you type stays on your own phone.** Nothing personal is stored in this repository.

## Install on a phone
1. Open the site address in **Safari** (iPhone) or **Chrome** (Android).
2. iPhone: Share → **Add to Home Screen**. Android: ⋮ → **Install app**.
3. Open it once from the home screen.
4. ⚙️ → **Restore from file** → choose the family backup file (sent separately — not stored here).
5. Map → **⬇️ Save maps** (on Wi-Fi), and ⚙️ → **Download emergency map data**.
6. Turn on airplane mode and open it again to check it works offline.

## Without the internet at all
`index.html` is completely self-contained. Copy it to a laptop or USB stick and open it in any browser.

## Editing content
- **In the app:** every guide has ✏️ edit buttons, "Add to this section", "Add a note" and "New guide". Edits are saved on the phone and travel with the backup file.
- **For everyone (in the code):** guides live in `src/guides/*.js` in a simple text format (see the top of `src/guides/00_base.js`).

## Excel
`family-ready-template.xlsx` — fill in Family, Contacts, Suppliers, Supplies and Places, then import it in the app (⚙️ → Excel).

## Updating
Edit files in `src/`, then `npm install && npm run build`, commit and push.

Maps: Toitū Te Whenua LINZ (CC BY 4.0). Places: © OpenStreetMap contributors (ODbL). Tsunami zones: Auckland Council. Guidance: NEMA / Get Ready, Auckland Emergency Management, Te Whatu Ora, MPI, SafeTravel, Smartraveller. Always follow official instructions in a real emergency.
