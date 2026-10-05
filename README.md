# Hugo and plain CSS starter

A small Hugo site for writing, projects and research. The example author is John Appleseed. All posts, biographies, research entries and newsletter issues are fictional placeholders.

## Run locally

Install Hugo Extended 0.167.0 and Node.js 22 or later, then run:

```sh
npm run dev
```

Open the address printed by Hugo. There are no npm dependencies to install.

```sh
npm run check
```

This builds the site and checks identity isolation, internal links, local assets, feeds, metadata, security policy hashes and demo service settings. For template work, also use `hugo --templateMetrics --templateMetricsHints`.

## Included

- System fonts, plain CSS and a readable serif column.
- Desktop navigation rail, native mobile menu and light/dark preferences.
- Article contents, takeaways, tables, callouts, footnotes and Related reading with context lines.
- Image lightbox, optional image CDN, video and audio shortcodes, and conditional MathJax.
- Writing, projects, research, category, FAQ, About, Subscribe, archive, Links and contact pages.
- RSS, JSON Feed, Markdown pages, sitemap, structured data, posts API, API catalogue and text discovery files.
- A local example newsletter archive. Signup is a disabled demo, and tracking is off.
- A synthetic interactive frontier example. Its values are not real measurements.

## Make it yours

1. Set `baseURL`, title, author, initials, introduction and description in `hugo.toml`.
2. Replace `content/` and `data/research.yaml` with your own writing. The example policy pages are not legal templates.
3. Update `data/related-reading.json` after changing article paths. Targets must be published and must not link to the source itself.
4. Replace the local placeholder graphic and favicon. The `img` shortcode uses local `/images/` files by default. Set `params.image_cdn` to your own Cloudflare image domain to use responsive CDN transforms, and allow that origin in the image and media CSP directives.
5. For a real newsletter, set its endpoint, count endpoint and archive endpoint; turn preview off. Update the form note, the demo-only service checks and deploy a matching backend. Allow the API origin in the connect and form CSP directives. The backend is not included.
6. Set `podcast_audio` on a post and use the `podcast-player` shortcode for your own audio. Configure the cover in `params.podcast_artwork`.

Set `tableWidth = "80%"` on a post to center its tables at that width. Without this field, tables fill the reading column and wide tables scroll inside their own region.

## Publish

Run `npm run check`, then serve `public/` on any static host. Set the real base URL before building. `static/_headers` is supplied for hosts that understand that format; other servers need equivalent response headers. Keep its content security policy aligned with the meta policy in `layouts/partials/head.html`. If you change an inline script, update its SHA-256 allowlist after inspecting the minified output.

The generated HTML already contains the content and metadata. Dynamic rendering, analytics and a production newsletter service are not required. Lighthouse results depend on your content, hosting and test conditions; this starter does not guarantee a score.

The starter has a fresh Git history. It contains no original articles, screenshots, publication records, production configuration or service credentials.

## License

MIT. See [LICENSE](LICENSE).
