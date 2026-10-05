{{- $matched := partial "links/readnext-target.html" . -}}
{{- range $matched }}
*Related: [{{ .Title }}]({{ .Permalink }})*
{{- end }}
