const puppeteer = require('puppeteer-core');
const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: chrome,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu']
  });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (err) => errors.push(String(err)));
  await page.setViewport({ width: 1280, height: 900 });
  await page.goto('http://127.0.0.1:8781/index.html', { waitUntil: 'networkidle0' });
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; });

  const nav = await page.$$eval('#site-nav a', (els) => els.map((el) => el.textContent.trim()));
  const paths = await page.$$eval('.hero-path', (els) => els.map((el) => el.textContent.replace(/\s+/g, ' ').trim()));
  await page.screenshot({ path: '.tmp-home-desktop.png' });

  await page.click('.hero-path[href="#erp"]');
  await new Promise((r) => setTimeout(r, 400));
  const erp = await page.evaluate(() => {
    const el = document.getElementById('erp');
    const nav = document.querySelector('.navbar').getBoundingClientRect();
    const box = el.getBoundingClientRect();
    return { top: Math.round(box.top), navBottom: Math.round(nav.bottom), title: el.querySelector('h3').textContent };
  });

  await page.click('a[href="#websites"]');
  await new Promise((r) => setTimeout(r, 400));
  const sites = await page.evaluate(() => {
    const el = document.getElementById('websites');
    return { top: Math.round(el.getBoundingClientRect().top), title: el.querySelector('h3').textContent };
  });

  await page.click('a.btn[href="#pricing"]');
  await new Promise((r) => setTimeout(r, 400));
  const pricing = await page.evaluate(() => {
    const el = document.getElementById('pricing');
    return { top: Math.round(el.getBoundingClientRect().top), title: el.querySelector('h2').textContent };
  });

  await page.click('a[href="#work"]');
  await new Promise((r) => setTimeout(r, 500));
  const work = await page.evaluate(() => {
    const card = [...document.querySelectorAll('.portfolio-title')].map((el) => el.textContent.trim());
    const link = document.querySelector('a[href="https://acbaksurpriz.com/"]');
    const img = document.querySelector('img[src="assets/acbak-surpriz.jpg"]');
    return { card, hasLink: Boolean(link), img: img ? img.naturalWidth : 0 };
  });
  await page.screenshot({ path: '.tmp-home-work.png' });

  await page.setViewport({ width: 390, height: 844 });
  await page.goto('http://127.0.0.1:8781/index.html', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: '.tmp-home-mobile.png' });
  await page.click('.mobile-toggle');
  await new Promise((r) => setTimeout(r, 500));
  const menu = await page.evaluate(() => {
    const links = [...document.querySelectorAll('#site-nav a')].map((el) => {
      const box = el.getBoundingClientRect();
      return { text: el.textContent.trim(), top: Math.round(box.top), height: Math.round(box.height) };
    });
    return { open: document.querySelector('#site-nav').classList.contains('active'), links };
  });
  await page.screenshot({ path: '.tmp-home-menu.png' });

  console.log(JSON.stringify({ nav, paths, erp, sites, pricing, work, menu, errors }, null, 2));
  await browser.close();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
