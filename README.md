# Acceptable Usage Policy — reader (ISMS U02, v5.7)

An interactive React reader for Aitken Spence PLC's Acceptable Usage Policy, built to run on your own machine.

## What it does

- A "binder" of numbered tabs on the left, one per policy section, matching the document's own numbering.
- Scrolling through the document automatically marks each section as reviewed and fills a progress bar.
- Section 4.3 (Unacceptable and Prohibited Use) is styled as a flagged list, separate from the rest of the policy.
- The consent form at the end only unlocks once every section has been scrolled past, and asks for a typed signature that must match the name entered. Nothing is sent anywhere — the acknowledgement stays in the browser tab.

## Run it locally

You need [Node.js](https://nodejs.org) (v18 or newer) installed.

```bash
npm install
npm run dev
```

This starts a dev server, normally at **http://localhost:5173**, and opens it in your browser automatically.

To stop it, press `Ctrl+C` in the terminal.

## Editing the content

All policy text lives in `src/content.js` as plain data — edit the `sections` array to change wording, add clauses, or add a new numbered section without touching the layout code.
