{{- with .Page.Params.podcast_audio -}}
{{- $url := partial "feed/shortcodes/url.html" (dict "page" $.Page "url" .) -}}
### Lorem ipsum · Episode 01

![Lorem ipsum podcast cover]({{ site.Params.podcast_artwork | absURL }})

[Listen to {{ $.Get "title" | default "the podcast episode" }}]({{ $url }}){{ with $.Get "duration" }} ({{ . }}){{ end }}.
{{- end -}}
