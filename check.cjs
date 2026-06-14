const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 } // Mobile
  });
  const page = await context.newPage();
  
  console.log("Navigating to PDF link...");
  await page.goto('https://markdown-commenter.vercel.app/?id=dk6lnlnj', { waitUntil: 'networkidle' });
  
  console.log("Waiting for PDF to render...");
  // Wait for the canvas and text layer
  await page.waitForSelector('.react-pdf__Page__canvas', { timeout: 15000 }).catch(() => console.log("Canvas not found"));
  await page.waitForSelector('.react-pdf__Page__textContent', { timeout: 15000 }).catch(() => console.log("Text layer not found"));
  
  await page.waitForTimeout(2000); 

  // Look for the invisible text layer created by pdf.js
  const textLayerContent = await page.evaluate(() => {
    const textLayer = document.querySelector('.react-pdf__Page__textContent');
    return textLayer ? textLayer.innerText : "Text layer not found!";
  });
  
  console.log("Extracted text from PDF layer:");
  console.log(textLayerContent);

  const path = '/home/openclaw/.openclaw/media/outbound/pdf-render-verified.png';
  await page.screenshot({ path, fullPage: false });
  console.log("Saved screenshot to " + path);

  await browser.close();
})();
