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
  await page.goto('http://127.0.0.1:8782/index.html', { waitUntil: 'networkidle0' });
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; });
  const homeNav = await page.$$eval('#site-nav a', (els) => els.map((el) => el.textContent.trim()));
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle0' }),
    page.click('#item-pricing .btn')
  ]);
  const demo = await page.evaluate(() => ({
    nav: [...document.querySelectorAll('#site-nav a')].map((el) => el.textContent.trim()),
    h1: document.querySelector('h1').innerText.replace(/\s+/g, ' '),
    demoTitle: document.getElementById('example-title').textContent,
    figures: [...document.querySelectorAll('.figure')].map((el) => el.textContent.trim()),
    form: Boolean(document.getElementById('pricingRequest')),
    cta: document.querySelector('.service-ask a').textContent.trim()
  }));
  await page.screenshot({ path: '.tmp-pricing-service.png' });
  await page.setViewport({ width: 390, height: 844 });
  await page.screenshot({ path: '.tmp-pricing-service-mobile.png' });
  await page.setViewport({ width: 1280, height: 900 });
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle0' }),
    page.click('.service-ask a')
  ]);
  const contact = await page.evaluate(() => ({
    url: location.href,
    type: document.getElementById('project-type')?.value || '',
    budget: document.getElementById('budget')?.value || '',
    message: document.getElementById('message')?.value || ''
  }));
  console.log(JSON.stringify({ homeNav, demo, contact, errors }, null, 2));
  await browser.close();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
