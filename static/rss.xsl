<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:atom="http://www.w3.org/2005/Atom">
  <xsl:output method="html" encoding="UTF-8" indent="yes"/>

  <xsl:template match="/">
    <html lang="en">
      <head>
        <meta charset="UTF-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title><xsl:value-of select="/rss/channel/title"/> - RSS Feed</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: "Helvetica Neue", Helvetica, Arial, "Segoe UI", sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #fff;
            padding: 2rem;
            max-width: 800px;
            margin: 0 auto;
            overflow-wrap: anywhere;
          }
          .feed-header {
            margin-bottom: 2rem;
            padding-bottom: 1.5rem;
            border-bottom: 1px solid #e0e0e0;
          }
          .feed-badge {
            display: inline-block;
            background: #f97316;
            color: #fff;
            font-size: 0.75rem;
            font-weight: 600;
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 1rem;
          }
          h1 {
            font-size: 1.75rem;
            font-weight: 600;
            margin-bottom: 0.5rem;
            color: #333;
          }
          .feed-description {
            color: #595959;
            font-size: 1rem;
            margin-bottom: 1rem;
          }
          .feed-meta {
            font-size: 0.875rem;
            color: #666;
          }
          .feed-meta a {
            color: #007acc;
            text-decoration: none;
          }
          .feed-meta a:hover {
            text-decoration: underline;
          }
          .subscribe-info {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 1rem;
            margin-bottom: 2rem;
            font-size: 0.9rem;
            color: #595959;
          }
          .subscribe-info strong {
            color: #333;
          }
          .subscribe-info code {
            background: #e9ecef;
            padding: 0.2rem 0.4rem;
            border-radius: 3px;
            font-family: monospace;
            font-size: 0.85em;
          }
          h2 {
            font-size: 1.25rem;
            font-weight: 600;
            margin-bottom: 1rem;
            color: #333;
          }
          .items-list {
            list-style: none;
          }
          .item {
            padding: 1rem 0;
            border-bottom: 1px solid #e0e0e0;
          }
          .item:last-child {
            border-bottom: none;
          }
          .item-title {
            font-size: 1.1rem;
            font-weight: 500;
            margin-bottom: 0.25rem;
          }
          .item-title a {
            color: #333;
            text-decoration: none;
          }
          .item-title a:hover {
            color: #007acc;
          }
          .item-date {
            font-size: 0.85rem;
            color: #666;
            margin-bottom: 0.5rem;
          }
          .item-description {
            font-size: 0.95rem;
            color: #595959;
            line-height: 1.5;
          }
          /* Feed entries contain full article HTML, but do not load the site
             stylesheet. Constrain media here as well as in the main site. */
          img, video, picture, figure {
            max-width: 100%;
          }
          img, video {
            display: block;
            height: auto;
          }
          .img-trigger, .img-lightbox {
            display: block;
            width: 100%;
          }
          .img-trigger {
            padding: 0;
            border: 0;
            background: transparent;
          }
          .img-trigger img {
            width: 100%;
          }
          pre, .table-scroll {
            max-width: 100%;
            overflow-x: auto;
            overscroll-behavior-inline: contain;
            margin: 1rem 0;
          }
          pre {
            padding: 0.75rem;
            background: #f8f9fa;
            overflow-wrap: normal;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th, td {
            padding: 0.5rem;
            border-bottom: 1px solid #e0e0e0;
          }
          @media (max-width: 600px) {
            body {
              padding: 1rem;
            }
            h1 {
              font-size: 1.5rem;
            }
          }
        </style>
      </head>
      <body>
        <header class="feed-header">
          <span class="feed-badge">RSS Feed</span>
          <h1><xsl:value-of select="/rss/channel/title"/></h1>
          <p class="feed-description"><xsl:value-of select="/rss/channel/description"/></p>
          <p class="feed-meta">
            <a href="{/rss/channel/link}">Visit Website</a>
          </p>
        </header>

        <div class="subscribe-info">
          <strong>Subscribe to this feed</strong><br/>
          Copy this URL into your RSS reader: <code><xsl:value-of select="/rss/channel/atom:link[@rel='self']/@href"/></code>
        </div>

        <section>
          <h2>Recent Posts</h2>
          <ul class="items-list">
            <xsl:for-each select="/rss/channel/item">
              <li class="item">
                <h3 class="item-title">
                  <a href="{link}"><xsl:value-of select="title"/></a>
                </h3>
                <p class="item-date"><xsl:value-of select="substring(pubDate, 6, 11)"/></p>
                <div class="item-description"><xsl:value-of select="description" disable-output-escaping="yes"/></div>
              </li>
            </xsl:for-each>
          </ul>
        </section>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
