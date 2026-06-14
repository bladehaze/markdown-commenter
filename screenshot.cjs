const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 400, height: 800 }, // Mobile viewport
    isMobile: true
  });
  const page = await context.newPage();
  console.log("Loading page...");
  await page.goto('https://markdown-commenter.vercel.app/?id=p11xor33', { waitUntil: 'networkidle' });
  
  // Wait a moment for React to fetch from API and render
  await page.waitForTimeout(2000);
  
  const path = '/home/openclaw/.openclaw/media/outbound/dashboard-render.png';
  await page.screenshot({ path, fullPage: false });
  console.log("Screenshot saved to " + path);
  await browser.close();
})();
