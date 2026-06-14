const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('https://markdown-commenter.vercel.app/?id=dk6lnlnj', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000); 
  const body = await page.evaluate(() => document.body.innerHTML);
  console.log(body);
  await browser.close();
})();
