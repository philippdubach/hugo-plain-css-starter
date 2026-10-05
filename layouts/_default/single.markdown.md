{{- /*
  Markdown variant of every page on the site. Served at <permalink>/index.md
  (or via Accept: text/markdown content negotiation rewriting through the
  security-headers Worker). v3.x audit — May 2026 — moves from the regex-
  strip-after-the-fact pattern to:

  - Output-format-aware sibling shortcodes (img.markdown.md,
    disclaimer.markdown.md, newsletter.markdown.md, readnext.markdown.md)
    so HTML pollution never enters the markdown stream
  - YAML preamble for AI/RAG ingestion (parseable by gray-matter,
    frontmatter.parse, and every major LLM tooling SDK)
  - Drop the eq .Section "posts" gate so /about/, /research/,
    /subscribe/, etc. now ship real markdown content
  - Structured footer with the canonical URL and author identity

  Hugo 0.161.1 audit (May 2026): the post-render pipeline previously
  ran nine regex passes over the body. Eight were dead or harmful:
  the HTML strips (lightbox anchors, asides, forms, dialogs, scripts,
  noscripts) no longer matched anything Goldmark or sibling shortcodes
  emit, and the math-delimiter conversions were false-matching URL-
  escaped parens. Only the blank-line collapse remains. Math
  passthrough is still configured in hugo.toml; Goldmark consumes
  $$...$$ delimiters natively before .RenderShortcodes sees the body.

  The HTML siblings keep all the lightbox + responsive-srcset machinery;
  this template gets the clean version.
*/ -}}
{{- $modified := partial "metadata/lastmod.html" . -}}
---
title: {{ .Title | jsonify }}
{{- with .Description }}
description: {{ . | jsonify }}
{{- end }}
{{- if not .Date.IsZero }}
date: {{ .Date.Format "2006-01-02" }}
{{- end }}
{{- if and (not $modified.IsZero) (or .Date.IsZero (ne ($modified.Format "2006-01-02") (.Date.Format "2006-01-02"))) }}
updated: {{ $modified.Format "2006-01-02" }}
{{- end }}
author: {{ .Site.Params.author | jsonify }}
{{- with .Params.categories }}
categories:
{{- range . }}
  - {{ . | jsonify }}
{{- end }}
{{- end }}
{{- with .Params.keywords }}
keywords:
{{- range . }}
  - {{ . | jsonify }}
{{- end }}
{{- end }}
{{- with .Params.type }}
type: {{ . | jsonify }}
{{- end }}
{{- with .Params.doi }}
doi: {{ . | jsonify }}
{{- end }}
canonical_url: {{ .Permalink | jsonify }}
source_url: {{ printf "%sindex.md" .Permalink | jsonify }}
---

# {{ .Title }}

{{ if not .Date.IsZero }}*{{ .Site.Params.author }} · Published {{ .Date.Format "January 2, 2006" }}{{ if and (not $modified.IsZero) (ne ($modified.Format "2006-01-02") (.Date.Format "2006-01-02")) }} · Updated {{ $modified.Format "January 2, 2006" }}{{ end }}*{{ else }}*{{ .Site.Params.author }}{{ if not $modified.IsZero }} · Updated {{ $modified.Format "January 2, 2006" }}{{ end }}*{{ end }}

{{ with .Params.takeaways }}
## Key Takeaways

{{ range . }}- {{ . }}
{{ end }}
{{ end }}
---

{{- /* Body. Sibling shortcodes emit clean markdown, so .RenderShortcodes
       is now safe to use directly. The remaining regex passes:
       - drop the lightbox-overlay anchor (Goldmark autolinker artifact)
       - drop the rendered .key-takeaways aside (we already emit takeaways
         from frontmatter above; the in-body aside is HTML scaffolding)
       - convert MathJax \(...\) inline → $...$ and \[...\] block → $$...$$
       - collapse 3+ consecutive blank lines to two
*/ -}}
{{- $body := .RenderShortcodes -}}
{{- /* Collapse 3+ consecutive blank lines (TOML +++ frontmatter in
       source files leaves bands of empty lines behind).

       Hugo 0.161.1 audit: the previous HTML-strip passes (lightbox
       anchors, asides, forms, dialogs, scripts, noscripts) became dead
       code — sibling shortcodes now handle output-format separation
       cleanly and Goldmark no longer emits those elements into the
       markdown stream. The MathJax \(...\) → $...$ and \[...\] → $$...$$
       passes were also removed: zero posts used that source syntax for
       math (passthrough handles $$...$$ natively), and the regex was
       false-matching URL-escaped parens like \(USB\), corrupting them
       to $USB$ in Wikipedia links. */ -}}
{{- $body = $body | replaceRE `\n{3,}` "\n\n" }}

{{ $body | safeHTML }}

{{- if eq .RelPermalink "/research/" -}}
{{ partial "markdown/research.html" . | htmlUnescape | safeHTML }}
{{- else if eq .Section "faq" -}}
{{ partial "markdown/faq.html" . | htmlUnescape | safeHTML }}
{{- end -}}


{{ with .Params.faq }}
---

## Frequently Asked Questions

{{ range . }}
### {{ .question }}

{{ .answer }}

{{ end }}
{{ end }}
---

Canonical: {{ .Permalink }}
This file is the canonical machine-readable variant of {{ .Permalink }}. Author: {{ .Site.Params.author }} ({{ .Site.BaseURL }}).
