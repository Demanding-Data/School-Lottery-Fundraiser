# School Lottery Fundraiser

A browser-based school fundraiser lottery manager. Manage students, track donations, generate tickets, and run a fair auditable draw — all offline, no server required.

## Live App

**[https://demanding-data.github.io/School-Lottery-Fundraiser](https://demanding-data.github.io/School-Lottery-Fundraiser)**

Works best in Chrome or Edge. Can be installed as a desktop/mobile app via the browser's install prompt.

## Features

- Import student rosters and donation data from CSV or Excel
- Track online and cash donations per student
- Automatic ticket allocation (1 base + extras per donation threshold)
- Seeded, reproducible lottery draw with full audit trail
- Printable ticket PDFs (per student, stubs, or by class)
- Fully offline after first load (PWA)

## Usage

### Online
Visit the live URL above. On first load all files are cached — the app works offline from that point forward.

### Install as App
In Chrome or Edge, click the install icon in the address bar (or browser menu → "Install School Lottery Fundraiser"). The app will open in its own window with no browser UI.

### Offline / ZIP
Download the repository as a ZIP, extract to any folder, and open `index.html` in Chrome or Edge. All data is stored locally in your browser's IndexedDB.

## Data & Privacy

All data stays in your browser. Nothing is sent to any server. Use the **Export Full Session** button in Fundraiser Manager to back up your data.

## Browser Support

| Browser | Supported |
|---------|-----------|
| Chrome 90+ | ✅ Full support |
| Edge 90+ | ✅ Full support |
| Firefox | ✅ Supported |
| Safari (macOS) | ✅ Supported |
| iOS Safari | ⚠ Works but PDF printing not supported |
