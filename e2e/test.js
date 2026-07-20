const { chromium } = require('@playwright/test');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000');
  const title = await page.title();
  const h1 = await page.textContent('h1');
  console.log('Title:', title);
  console.log('H1:', h1);
  await browser.close();
  console.log('PASS');
})().catch(e => { console.error('FAIL:', e.message); process.exit(1); });
