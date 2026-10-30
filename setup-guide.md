# The Strategic Dispatch — Blogger launch guide

## Brand and homepage

**Recommended name: The Strategic Dispatch.** It is distinctive, editorial in tone, and broad enough for reporting and analysis across foreign policy, security, economics, and technology. Check name, domain, and social-handle availability before adopting it; this guide does not establish trademark availability.

Other original name ideas:

1. The Strategic Dispatch
2. Meridian Brief
3. The World Ledger
4. The Global Affairs Review
5. Crosscurrent Journal
6. Frontline & Forum
7. The Diplomatic Compass
8. The International Desk
9. The Policy Signal
10. The Horizon Report

The homepage leads with the newest post as the featured story, then shows the rest of the current Blogger page as a latest-articles grid. Category links lead to Blogger label archives. The sidebar includes Blogger's Popular Posts and Labels gadgets and can be extended in **Layout**. This keeps publishing automatic: new posts appear through Blogger's native feed and pagination without editing the XML.

The mark is a simple original “SD” monogram; the theme uses a white background, dark navy typography, and restrained red accents. Rename the publication in the theme before launch if you choose a different name.

## Theme file

Upload [strategic-dispatch.xml](./strategic-dispatch.xml). It is designed for Blogger's XML theme system, not a WordPress or static-site theme. Blogger's template engine remains authoritative: the XML parser can validate document structure, but only Blogger's **Preview** and **Restore** workflow can confirm acceptance against your account's current widget data.

### Back up and install

1. Sign in at [Blogger](https://www.blogger.com/) and select the correct blog.
2. Open **Theme**. Use **Backup** / **Download** (the wording can vary) to save the current theme XML somewhere safe.
3. Select the theme menu and choose **Restore** or **Upload**. Upload `strategic-dispatch.xml`.
4. If Blogger reports an error, do not overwrite your backup. Note the exact error, restore the backup if needed, and resolve it before retrying.
5. Preview the blog at desktop and mobile widths. Test a post, a label archive, a static page, comments, and older/newer pagination.
6. Open **Layout** and confirm the Popular Posts and Labels gadgets. If Blogger did not retain a gadget, add it there; the sidebar section allows additional widgets.

## Customize the site

### Name and tagline

In Theme → **Edit HTML**, search for `The Strategic Dispatch`, the `SD` monogram, and `Independent reporting. Clear-eyed analysis.` Replace the text and monogram with your own. The logo is text and CSS, so no image editor or paid asset is needed.

### Colors and typography

In the `<b:skin>` section, edit the CSS variables near the top:

```css
:root {
  --ink: #17212b;
  --muted: #66717d;
  --navy: #142b45;
  --red: #b52e35;
  --line: #dce1e6;
  --paper: #fff;
}
```

Keep text/background contrast strong and recheck keyboard focus and mobile layouts after changes.

### Navigation, footer, and social

- The top navigation links are in `id='primary-navigation'`. Update their label names and URLs to match the labels you actually use. The default links expect labels named `India`, `World`, `Geopolitics`, `Defence`, `Economy`, `Explainers`, and `Science & Technology`.
- Create the footer pages under **Pages**. The links expect these page paths: `about.html`, `contact.html`, `editorial-policy.html`, `privacy-policy.html`, and `disclaimer.html`. If Blogger assigns a different URL, replace the corresponding link.
- The sitemap footer link points to Blogger's `sitemap.xml`. Blogger also serves its own sitemap at `/sitemap.xml`; check it after launch.
- Share controls appear on article pages and construct share links from the article URL and title. To add other social profile links, add ordinary links in the footer navigation with your profile URLs; do not use placeholder accounts.
- The theme includes an empty, full-width `topad` section visible in **Layout**. After AdSense approval, add an official AdSense gadget there or use AdSense's supported integration. It displays no fake ad or hidden placeholder text. Test placements to avoid interrupting reading.

## Publish without editing HTML

1. In Blogger, choose **New Post**. Write a descriptive title and a useful opening paragraph in the normal editor.
2. Add headings with the editor's heading styles, and use lists, links, quotations, and image captions where useful. Avoid pasting untrusted HTML.
3. Add a representative image and set meaningful alternative text in the image settings. Use images you own, have permission to publish, or can legally reuse; compress them before upload.
4. In **Post settings → Labels**, choose one or more exact labels. Recommended primary labels: `India`, `World`, `Geopolitics`, `Defence`, `Economy`, `Explainers`, and `Science & Technology`. Additional specific labels are fine, but keep the taxonomy controlled.
5. Add a custom search description in Post settings when Blogger offers it. Make it specific to the article and accurate, not a list of keywords.
6. Set the intended publication date/time, review preview on mobile and desktop, then publish. Comments follow the blog/post comments setting in Blogger.

The theme uses Blogger's post title, snippet, first available listing thumbnail, labels, author, timestamp, post body, and native page navigation. On an article page, the first image remains in the position you placed it in the post body rather than being repeated as a separate hero; use Blogger's image caption controls there. The article introduction is authored in the post body. The theme avoids a manually duplicated canonical tag and relies on Blogger's built-in head include for its canonical and feed metadata.

## Search Console and Blogger SEO

### Connect Search Console

1. Add your site in [Google Search Console](https://search.google.com/search-console/). A Blogger `blogspot.com` URL can usually be verified through the Google account that owns the blog; follow the current on-screen verification method.
2. For a custom domain, use a **Domain** property and verify ownership with the DNS TXT record from Search Console. Blogger's hosted setup does not remove this verification requirement.
3. In Search Console, open **Sitemaps** and submit `sitemap.xml` (use the full canonical site URL if requested). Blogger generates and updates its sitemap; do not create a hand-maintained sitemap.
4. Inspect the homepage and several article URLs with **URL Inspection**. A request to index is a request, not a guarantee or a substitute for crawlability.
5. Check **Settings → Crawling** and the Blogger **Settings → Crawlers and indexing** controls before changing robots directives. Do not block posts, label archives that you want indexed, CSS, or images needed to render pages.

### What this theme and Blogger can do

- Responsive CSS, semantic page regions, keyboard-usable menu, image alt attributes from post titles, lazy-loaded listing thumbnails, and a high-priority first/hero image.
- Blogger-generated post/page URLs, archives, labels, comments, navigation, canonical support, feeds, and XML sitemap facilities.
- Blogger-provided canonical/feed metadata, description, Open Graph, and Twitter metadata in the template; a small `WebSite` JSON-LD block; and Schema.org `BlogPosting` microdata on item pages.
- Category/label navigation and article metadata drawn from Blogger's own post data.

### Limitations and careful checks

- Blogger decides which built-in metadata is generated by `all-head-content`. Inspect the rendered page source and avoid adding duplicate canonical or description tags with third-party gadgets. If duplicates appear, retain one authoritative canonical and one accurate description.
- Metadata depends on Blogger post settings. Add a custom search description for each post. The theme's generic description is only a fallback.
- Structured data is not a guarantee of a Google rich result. The item page uses `BlogPosting` microdata rather than hand-assembling article JSON-LD from potentially unsafe title text. Do not mark general analysis as `NewsArticle` unless it genuinely meets the applicable definition. Validate rendered markup with Google's Rich Results Test and Schema Markup Validator.
- The theme cannot reliably infer reading time, construct a safe article-specific table of contents, or identify an image caption from arbitrary post HTML. Add a hand-written table of contents and caption in the post editor when they help readers. Do not rely on an estimated reading-time label.
- Blogger controls robots directives, sitemap generation, indexing behavior, and some head markup. Check Search Console and Blogger settings rather than assuming a template override.
- Blogger does not guarantee rankings, traffic, indexing, AdSense acceptance, or revenue. Search Essentials, content usefulness, technical quality, competition, and current Google policies all matter.

### Robots and sitemap

Start with Blogger's default robots configuration. If you enable a custom `robots.txt` in Blogger, keep it conservative and explicitly allow important public content. Do not copy a blanket `Disallow: /` rule or block `/search/` without considering whether label pages should be crawled. Use Blogger's sitemap endpoint, not a hard-coded list of posts.

## Per-article SEO and editorial checklist

- [ ] One clear reader need; answer it accurately and add original reporting, analysis, or useful synthesis.
- [ ] Specific, factual title that reads naturally; avoid clickbait and keyword repetition.
- [ ] Strong first paragraph; custom search description that accurately summarizes the article.
- [ ] One primary label from the site taxonomy, plus only genuinely useful secondary labels.
- [ ] Useful section headings, concise paragraphs, descriptive internal links, and linked primary sources.
- [ ] Verify names, dates, claims, figures, quotations, translations, and image rights. Distinguish fact, analysis, and uncertainty.
- [ ] Add a representative, appropriately sized image; descriptive alt text; and an accurate caption/credit where needed.
- [ ] Set and verify the author/byline, publication date, and corrections process.
- [ ] Preview on a narrow phone and desktop. Check image loading, links, headings, contrast, keyboard use, and no horizontal scrolling.
- [ ] Confirm the canonical article URL, page description, and rendered metadata; check the URL in Search Console after publication.
- [ ] Disclose conflicts, sponsorship, AI assistance where your policy requires it, and material corrections transparently.

## First 30 days: a realistic publishing plan

Prioritize accuracy and repeatable quality over volume. A practical goal is 12–16 substantial posts in the first month, adjusted to your time and reporting access.

| Days | Editorial work |
|---|---|
| 1–3 | Publish About, Contact, Editorial Policy, Privacy Policy, and Disclaimer pages. Define author credentials, sourcing/corrections standards, and the seven-label taxonomy. Test theme pages and mobile navigation. |
| 4–7 | Publish two India/foreign-policy explainers and one World briefing with primary-source links. Set up Search Console and sitemap submission. |
| 8–14 | Publish one geopolitical analysis, one defence/maritime explainer, and one global-trade/economy article. Add internal links among related posts. |
| 15–21 | Publish one science/technology policy explainer, one India-focused analysis, and one carefully sourced world-news analysis. Refresh any story whose facts changed. |
| 22–30 | Publish three to five additional original pieces based on reader questions and credible source material. Review Search Console query/page data, correct technical problems, and plan the next month. |

Use a mix of evergreen explainers and timely coverage. For a solo publisher, a sustainable cadence such as three strong pieces each week is preferable to thin daily rewrites. Clearly identify original analysis and cite primary material such as official documents, datasets, and attributable statements. Do not reproduce other outlets' articles or imply access you do not have.

## Measurement and iteration

- **Indexing:** Search Console → **Pages** shows indexing and exclusion reasons. URL Inspection checks an individual URL. Allow time for crawling; not every URL will be indexed.
- **Impressions and clicks:** Search Console → **Performance → Search results**. Compare date ranges and filter by query, page, country, device, and search appearance. Clicks and impressions are not the same as visits or guaranteed growth.
- **Queries:** Review queries that have meaningful impressions. Check that the page satisfies the intent and that its title/snippet is clear. Avoid rewriting solely to chase a single keyword.
- **Technical experience:** Search Console's Core Web Vitals and HTTPS reports, plus real-device testing, can reveal issues. Blogger hosting limits server-side performance controls; use reasonably sized images and avoid heavy third-party widgets.
- **Editorial review:** Track returning reader feedback, corrections, useful referrals, and whether articles answer the stated question. Search Console data is aggregated and can omit low-volume queries.

## AdSense readiness and future domain

AdSense approval and earnings are not guaranteed. Before applying, review Google's current eligibility and publisher policies. Publish original, substantive content; make ownership and authorship clear; provide working navigation and accurate About, Contact, Privacy, and Disclaimer pages; avoid copied content, misleading claims, prohibited material, and invalid traffic. Do not click your own ads or encourage clicks.

When budget permits, register a domain with a registrar and use Blogger **Settings → Publishing → Custom domain**. Enter the domain Blogger requests (typically a `www` host), create the exact DNS CNAME records Blogger provides, and add the root-domain redirects/records Blogger specifies. DNS values differ by setup; copy the current Blogger instructions rather than using generic IP values. Wait for DNS propagation, enable HTTPS and HTTPS redirect in Blogger once available, then update Search Console with the domain property. Blogger normally redirects the old Blogspot URL, but test homepage, posts, pages, feeds, and sitemap after the switch. Update social profiles and any external links you control.

## XML validation note

The theme uses Blogger's documented template namespaces, a native Blog widget, standard post fields, and Blogger's built-in Popular Posts and Labels widget types. Standard XML well-formedness is necessary but does not prove Blogger will accept a theme: Blogger may adapt widget settings or reject fields according to its current template schema. Always preserve the backup and test using Blogger's own upload and preview screens.
