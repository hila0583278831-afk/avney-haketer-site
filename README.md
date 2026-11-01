# אבני הכתר — Avney HaKeter landing page

A static single-page site in Hebrew (RTL). It has no build step and no dependencies.

```
index.html          page markup
css/style.css       all styles (fonts, animations, responsive rules)
js/main.js          filters/tabs + contact form submission
images/             renders, logos, LiaSgula + Ploni fonts, favicons, og-image.jpg
favicon.ico, site.webmanifest, robots.txt, sitemap.xml
netlify.toml / vercel.json   hosting config (use whichever host you pick)
```

## Design & motion

The page has no libraries or build step. The animations live in plain `css/style.css` and `js/main.js`:

- **Loader**: the logo fills in with a 0–100% counter, then the curtain splits open. It's shorter on repeat visits in the same session.
- **Hero**: a 5-second looping video of the towers (`videos/hero.mp4`, made in Magnific, 1280×720). `images/hero-poster.jpg` is its exact first frame, so nothing jumps when playback starts. If you replace the video, regenerate the poster from its first frame too. It plays only while the hero is on screen and stays paused with *reduce motion*. The headline appears word by word. While scrolling, the frame shrinks into a rounded window.
- **About**: the manifesto lights up word by word as you scroll. The images open with a curtain effect, and the statistics count up.
- **Flagship (מגדלי הכתר)**: a pinned scene. Scrolling moves through day → sunset → night (`tB1` / `tB0` / `tB2`) with a sun dial.
- **Projects**: on desktop, vertical scrolling moves a horizontal strip with 3D tilt cards. On mobile it's a native swipe carousel. Filtering still works.
- **Drawings**: the architectural lines draw themselves, and redraw on each tab switch.
- **Marketing services**: hovering a row darkens it, and a floating image follows the cursor.
- **Statement**: the render shows inside the giant letters. The full image then opens behind them.
- **Advantages**: a bronze spotlight follows the cursor. The audience panels widen on hover.
- **Contact**: a cream circle opens out of the dark ("נדבר?") into the form. The fields have floating labels.
- **Global**: a custom cursor (desktop), magnetic buttons, a reading-progress line, light film grain, a header that hides while scrolling down, and a full-screen mobile menu.

Everything respects the system's *reduce motion* setting: the heavy effects switch off, and the content stays fully readable.

Placeholder numbers in the statistics row (6 projects, 9 neighborhoods, 100%, 1 contact person) come from the site's own content. Replace them with real figures in `index.html` (`data-count="…"`).

## Accessibility, privacy, security, SEO

- **Accessibility widget** (`js/a11y.js` + `css/a11y.css`): side button or `Alt+A`. It offers text size, high and inverted contrast, grayscale, link highlighting, a readable font, text spacing, a large cursor and stop animations. Preferences are saved in localStorage (`akh-a11y`), and `window.akhA11y.get/set` lets other controls share them. The hero's "עצירת תנועה" button is one of those controls.
- **Code-level fixes:** a widget alone does not meet the Israeli regulations, so the code itself also includes:
  - a strong focus ring on every background, plus focus management for the menu, the dialog and the project strip;
  - headings that screen readers read whole, not word by word;
  - required fields that are marked, with inline errors that are announced;
  - live regions;
  - contrast-checked colors (`--bronze-btn` for white-on-bronze buttons).
- **Legal pages:** `accessibility.html` (הצהרת נגישות) and `privacy.html` (מדיניות פרטיות). **Fill in every highlighted `[placeholder]`** before launch: legal name, company number, accessibility coordinator, audit date, retention period and office accessibility.
- **Privacy:** a notice under the form links to the policy. The form sends only `origin + pathname`, never query strings. Personal data never goes to the console. The only third parties are Google Fonts and Formspree.
- **Security:**
  - A meta CSP plus a referrer policy is in place. The inline `<head>` script is allowed by its sha256 hash, so if you change that script, recompute the hash in the CSP.
  - The project panel builds its content with `textContent`, never HTML strings.
  - `netlify.toml` and `vercel.json` carry the full header set for when the site moves off GitHub Pages: CSP with `frame-ancestors`, HSTS, nosniff, Permissions-Policy.
  - In Formspree: restrict the form to your domain, and enable spam filtering and 2FA.
- **SEO:**
  - JSON-LD (RealEstateAgent, WebSite and an ItemList of the 6 projects) is in `<head>`.
  - The keyword title and description are set, and the sitemap covers all 3 pages.
  - Stat numbers are in the HTML itself.

## Before going live: 2 replacements

1. **Form endpoint**: in `js/main.js`, replace `YOUR_FORM_ID` (see "Contact form" below).
2. **Domain**: replace `https://YOUR-DOMAIN` with the real address (for example `https://avney-haketer.co.il`) in
   `index.html` (canonical, og:url, og:image), `robots.txt` and `sitemap.xml`.
   WhatsApp/Facebook previews need the absolute `og:image` URL, so the share preview only works after this step.

The footer and contact section still contain placeholders, such as `[טלפון]`, `[דוא״ל]` and `[כתובת המשרד]`. Fill those in too.

## Contact form (Formspree)

1. Sign up at https://formspree.io (the free tier allows 50 submissions/month) and create a form.
   Set the email address that should receive the leads.
2. Copy the form ID (the part after `/f/` in `https://formspree.io/f/abcdwxyz`) into `FORM_ENDPOINT` in `js/main.js`.
3. Deploy, send a test lead from the live site, and confirm the first submission in the email Formspree sends you.

Each lead includes: name, phone, email, message, topic (רכישת דירה / שיווק פרויקט / קרקע), and the page URL.
Validation requires a name plus a phone number or email. Error messages appear in the browser's own validation bubble, so the design is unchanged.
A hidden `_gotcha` field filters simple spam bots.

While the endpoint is not configured, the form shows the "thank you" message only on localhost, so the site still works as a preview.
On a live domain it shows an error instead, so a lead is never silently lost.

## Run locally

```bash
python -m http.server 8080
```
Then open http://localhost:8080/

## Deploy: Netlify (simplest)

**Drag & drop:** go to https://app.netlify.com/drop and drag this whole folder onto the page. You get a live URL in seconds.

**From GitHub (recommended for later edits):**
1. Push this folder to a GitHub repository.
2. In Netlify, go to *Add new site → Import an existing project* and pick the repo.
3. Leave the build command empty. The publish directory is `.` (already set in `netlify.toml`).
4. To add your domain, go to *Domain management → Add a domain* and follow the DNS instructions.

## Deploy: Vercel

1. Push this folder to a GitHub repository.
2. On https://vercel.com/new, import the repo. Framework preset: **Other**. No build command, and the output directory is the root.
3. To add your domain, go to *Project → Settings → Domains*.

Alternatively, use the CLI: `npx vercel` from this folder (requires Node.js).

## After launch

- Update the domain placeholders above and redeploy.
- Check the share preview at https://developers.facebook.com/tools/debug/
- Add the site to Google Search Console and submit `sitemap.xml`.
