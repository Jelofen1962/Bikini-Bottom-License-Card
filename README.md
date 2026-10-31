# Bikini Bottom Friends License

A playful, responsive, client-side Bikini Bottom birthday and license-card generator. The form keeps the original Bikini Bottom artwork and the card now follows a classic printed driver-license layout, with a warm security-paper background, gold header bands, compact identity details, a portrait mat, and a handwritten-style signature.

## Run locally

Because the app uses browser storage while moving from the form to the license page, run it from a local web server instead of opening the HTML files directly.

For example, from this folder:

```bash
python -m http.server 8000
```

Then open <http://localhost:8000>.

You can also deploy the folder as a static website. The included GitHub Actions workflow publishes the repository to GitHub Pages when changes are pushed to `main`.

## Features

- Responsive application form and 1.58:1 printed license-card preview for desktop and mobile.
- License artwork styled after a classic printed ID card, with a subtle Bikini Bottom security-paper pattern.
- Personal details, a generated license number, portrait, and signature are rendered from the form data. Optional card fields include **Hair**, **Eyes**, **HT** (height), and **WT** (weight), alongside sex and date of birth. Long identity lines automatically shrink to fit.
- The printed card uses a high-contrast classic serif font stack inspired by the original reference card, with the original handwritten-style signature font.
- Birthday landing page with falling greeting cards, colorful themed card designs, and subtle entrance / hover animations. Effects respect reduced-motion preferences.
- Required-field validation and accessible form labels.
- JPG, PNG and WebP profile uploads, limited to 5 MB and resized/compressed in the browser.
- User details are stored in `sessionStorage` for the current tab only.
- High-resolution 1800 × 1140 PNG export using the native Canvas API. No screenshot CDN or runtime framework is required.
- Export is user-triggered, with progress and error feedback.

## Project structure

```text
index.html                    License application form
license.html                  Generated license preview
static/index.css              Form styles
static/license.css            License preview and card styles
static/js/form.js             Validation, photo processing and session storage
static/js/birthday.js         Falling birthday cards and landing-page animation
static/js/license.js          License rendering and PNG export
assets/license-paper.svg      Vector security-paper texture
assets/license-wave.svg       Wavy divider artwork
assets/                        Original project artwork and fonts
```

## Notes

- No account, backend or external JavaScript service is used.
- The generated license number is deterministic for the entered name, birthdate and city. It is a fictional design detail, not an official credential.
- The downloaded PNG is rendered separately at a fixed high resolution so the exported image remains sharp on retina and high-density displays.
