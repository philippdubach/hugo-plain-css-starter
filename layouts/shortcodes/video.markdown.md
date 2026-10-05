{{- $src := .Get "src" -}}
{{- $url := $src -}}
{{- if not (hasPrefix $src "http") -}}{{- $url = printf "%s/%s" (strings.TrimSuffix "/" site.BaseURL) (strings.TrimPrefix "/" $src) -}}{{- end -}}
{{- $label := .Get "alt" | default "Watch the video" -}}
{{- with .Get "poster" -}}
  {{- $poster := . -}}
  {{- if not (hasPrefix $poster "http") -}}{{- $poster = partial "media/url.html" (dict "src" $poster "width" 1200) -}}{{- end -}}
![{{ $label }}]({{ $poster }})

{{ end -}}
[{{ $label }}]({{ $url }})
{{ with .Get "srcMobile" }}{{ $mobile := . }}{{ if not (hasPrefix $mobile "http") }}{{ $mobile = printf "%s/%s" (strings.TrimSuffix "/" site.BaseURL) (strings.TrimPrefix "/" $mobile) }}{{ end }}
[Mobile video]({{ $mobile }})
{{ end -}}
