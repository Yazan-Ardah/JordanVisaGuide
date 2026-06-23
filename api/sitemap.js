/**
 * GET /sitemap.xml
 * Dynamically generated XML sitemap for all visa guide pages.
 * Submit to Google Search Console once deployed.
 */

const BASE_URL = 'https://visasjo.com';
const TODAY = new Date().toISOString().split('T')[0];

// All countries with a visa page — slug maps to the VISA_DATA key in visa-info.html
const VISA_PAGES = [
  { slug: 'germany',      name: 'Germany' },
  { slug: 'usa',          name: 'USA' },
  { slug: 'uae',          name: 'UAE' },
  { slug: 'japan',        name: 'Japan' },
  { slug: 'uk',           name: 'UK' },
  { slug: 'france',       name: 'France' },
  { slug: 'italy',        name: 'Italy' },
  { slug: 'spain',        name: 'Spain' },
  { slug: 'switzerland',  name: 'Switzerland' },
  { slug: 'netherlands',  name: 'Netherlands' },
  { slug: 'thailand',     name: 'Thailand' },
  { slug: 'indonesia',    name: 'Indonesia' },
  { slug: 'oman',         name: 'Oman' },
  { slug: 'saudi-arabia', name: 'Saudi Arabia' },
  { slug: 'tunisia',      name: 'Tunisia' },
  { slug: 'morocco',      name: 'Morocco' },
  { slug: 'turkey',       name: 'Turkey' },
  { slug: 'egypt',        name: 'Egypt' },
  { slug: 'kuwait',       name: 'Kuwait' },
  { slug: 'georgia',      name: 'Georgia' },
  { slug: 'bosnia',       name: 'Bosnia' },
  { slug: 'qatar',        name: 'Qatar' },
  { slug: 'greece',       name: 'Greece' },
  { slug: 'lebanon',      name: 'Lebanon' },
  { slug: 'cyprus',       name: 'Cyprus' },
];

const STATIC_PAGES = [
  { path: '/',               priority: '1.0', changefreq: 'weekly'  },
  { path: '/visa-map.html',  priority: '0.7', changefreq: 'monthly' },
];

function url(loc, priority = '0.8', changefreq = 'monthly') {
  return `  <url>\n    <loc>${BASE_URL}${loc}</loc>\n    <lastmod>${TODAY}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}

export default function handler(req, res) {
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...STATIC_PAGES.map(p => url(p.path, p.priority, p.changefreq)),
    ...VISA_PAGES.map(p => url(`/visa/${p.slug}`, '0.9', 'monthly')),
    '</urlset>',
  ].join('\n');

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.status(200).send(xml);
}
