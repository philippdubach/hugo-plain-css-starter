import { readFile, readdir } from 'node:fs/promises';
import { resolve, join, extname } from 'node:path';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

const root = resolve('public');
const base = 'https://example.org';
const files = [];
async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) await walk(path);
    else files.push(path);
  }
}
await walk(root);
function attrs(tag) {
  const result = {};
  for (const match of tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) {
    result[match[1]] = match[2] ?? match[3] ?? match[4];
  }
  return result;
}
function decode(s) { return s.replaceAll('&amp;', '&').replaceAll('&#39;', "'").replaceAll('&quot;', '"'); }
const htmlFiles = files.filter(f => f.endsWith('.html'));
const html = new Map(await Promise.all(htmlFiles.map(async f => [f, await readFile(f, 'utf8')])));
const ids = new Map([...html].map(([f, s]) => [f, new Set([...s.matchAll(/\bid=(?:"([^"]+)"|'([^']+)'|([^\s>]+))/g)].map(m => m[1] ?? m[2] ?? m[3]))]));
const available = new Set(files);
let links = 0, scripts = 0;
for (const [file, text] of html) {
  assert(!text.includes('ZgotmplZ'), `${file}: unsafe template URL`);
  for (const tag of text.matchAll(/<(?:a|img|script|link|source)\b[^>]*>/g)) {
    const a = attrs(tag[0]);
    const raw = a.href ?? a.src;
    if (raw && !/^(?:data:|mailto:|tel:)/.test(raw)) {
      const rel = file.slice(root.length).replace(/index\.html$/, '');
      const url = new URL(decode(raw), base + rel);
      if (url.origin === base) {
        const pathname = decodeURIComponent(url.pathname);
        const target = join(root, pathname.endsWith('/') ? pathname + 'index.html' : pathname);
        assert(available.has(target), `${file}: missing local target ${raw}`);
        if (url.hash && html.has(target)) assert(ids.get(target).has(decodeURIComponent(url.hash.slice(1))), `${file}: missing anchor ${raw}`);
        links++;
      } else {
        assert(url.hostname === 'cdn.jsdelivr.net', `${file}: unexpected external service ${url.hostname}`);
      }
    }
    if (a.integrity && a.src?.startsWith('/')) {
      const [algorithm, digest] = a.integrity.split('-');
      assert.equal(createHash(algorithm).update(await readFile(join(root, a.src))).digest('base64'), digest, `${file}: SRI mismatch`);
    }
  }
  const cspTag = [...text.matchAll(/<meta\b[^>]*>/g)].find(m => attrs(m[0])['http-equiv']?.toLowerCase() === 'content-security-policy');
  const csp = cspTag ? attrs(cspTag[0]).content : '';
  for (const block of text.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
    const a = attrs(block[1]);
    if (a.type === 'application/ld+json') { JSON.parse(block[2]); continue; }
    if (a.src || !block[2].trim()) continue;
    const digest = createHash('sha256').update(block[2]).digest('base64');
    assert(csp.includes(`'sha256-${digest}'`), `${file}: inline script not covered by CSP (${digest})`);
    scripts++;
  }
  if (file.endsWith('/404.html') || file.includes('/newsletter/example/')) continue;
  assert(/<title>[^<]+<\/title>/.test(text), `${file}: title missing`);
  assert(text.includes('name=description') || text.includes('name="description"'), `${file}: description missing`);
  assert(text.includes('rel=canonical') || text.includes('rel="canonical"'), `${file}: canonical missing`);
  assert(text.includes('John Appleseed'), `${file}: demo author missing`);
}
for (const file of files.filter(f => extname(f) === '.json')) JSON.parse(await readFile(file, 'utf8'));
const feed = JSON.parse(await readFile(join(root, 'feed.json'), 'utf8'));
assert.equal(feed.items.length, 7);
assert(feed.items.every(item => item.authors?.[0]?.name === 'John Appleseed'));
assert((await readFile(join(root, 'index.xml'), 'utf8')).includes('<rss'));
assert((await readFile(join(root, 'sitemap.xml'), 'utf8')).includes('<urlset'));
assert((await readFile(join(root, 'llms.txt'), 'utf8')).includes('John Appleseed'));
assert(available.has(join(root, 'api/posts.json')));
assert(available.has(join(root, 'api-catalog.json')));
const config = await readFile('hugo.toml', 'utf8');
assert(config.includes('preview = true') && config.includes('endpoint = ""'), 'Newsletter must remain a disconnected demo');
assert(![...html.values()].some(s => s.includes('data-goatcounter')), 'Tracking must remain disabled');
assert(![...html.values()].some(s => s.includes('data-newsletter-endpoint')), 'Demo must not submit to a newsletter service');
const headers = await readFile('static/_headers', 'utf8');
const homepageCsp = attrs([...html.get(join(root, 'index.html')).matchAll(/<meta\b[^>]*>/g)].find(m => attrs(m[0])['http-equiv']?.toLowerCase() === 'content-security-policy')[0]).content;
assert(headers.includes(homepageCsp), 'Header and meta CSP must stay aligned');
console.log(`Checked ${htmlFiles.length} HTML pages, ${links} local targets, ${scripts} inline scripts, JSON outputs, feeds, metadata and disconnected demo services.`);
