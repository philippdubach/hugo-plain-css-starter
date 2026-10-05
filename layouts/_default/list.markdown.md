{{- /*
  Markdown variant of every section, taxonomy, and home list. v3.x audit —
  YAML preamble matches the single template; one-line summary surfaces the
  machine-readable feed alternates so AI consumers can switch from this
  human-readable list to the structured /api/posts.json or /feed.json.
*/ -}}
---
title: {{ .Title | jsonify }}
{{- with .Description }}
description: {{ . | jsonify }}
{{- end }}
type: index
canonical_url: {{ .Permalink | jsonify }}
source_url: {{ printf "%sindex.md" .Permalink | jsonify }}
---

# {{ .Title }}

{{ with .Description }}{{ . }}

{{ end -}}
{{ with .Content }}{{ . | plainify }}

{{ end -}}
{{- /* Synthetic indexes collect articles stored under /posts/. Native section
       and taxonomy indexes list the same child pages as their HTML templates.
       Markdown archives are complete; feed limits apply only to feeds. */ -}}
{{- $pages := .Pages.ByTitle -}}
{{- if .IsHome -}}
  {{- $pages = where (where site.RegularPages "Section" "posts") "Params.unlisted" "ne" true -}}
  {{- $pages = $pages.ByDate.Reverse -}}
{{- else if eq .Section "writing" -}}
  {{- $pages = where (where (where site.RegularPages "Section" "posts") "Params.unlisted" "ne" true) "Params.type" "ne" "Project" -}}
  {{- $pages = $pages.ByDate.Reverse -}}
{{- else if eq .Section "projects" -}}
  {{- $pages = where (where site.RegularPages "Params.type" "Project") "Params.unlisted" "ne" true -}}
  {{- $pages = $pages.ByDate.Reverse -}}
{{- end -}}
*{{ len $pages }} {{ if eq (len $pages) 1 }}entry{{ else }}entries{{ end }}. Machine-readable feeds: [/api/posts.json]({{ "/api/posts.json" | absURL }}) · [/feed.json]({{ "/feed.json" | absURL }}) · [/index.xml]({{ "/index.xml" | absURL }}) · [/llms.txt]({{ "/llms.txt" | absURL }}).*

---

{{ range $pages -}}
- **[{{ .Title }}]({{ .Permalink }})**{{ if not .Date.IsZero }} ({{ .Date.Format "2006-01-02" }}{{ if and (.Lastmod.After .Date) (ne (.Lastmod.Format "2006-01-02") (.Date.Format "2006-01-02")) }}, updated {{ .Lastmod.Format "2006-01-02" }}{{ end }}){{ end }}{{ with .Description }} — {{ . }}{{ end }}
{{ end }}

---

Canonical: {{ .Permalink }}
This file is the canonical machine-readable variant of {{ .Permalink }}. Author: {{ .Site.Params.author }} ({{ .Site.BaseURL }}).
