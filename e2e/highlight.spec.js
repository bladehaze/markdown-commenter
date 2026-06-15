import { test, expect } from '@playwright/test';

test.describe('Mobile Commenting Flow', () => {

  test('Test 1: The "Change My Mind & Scroll" Flow', async ({ page }) => {
    // Navigate to the test document
    await page.goto('http://localhost:4173/?id=y3luvy0h');
    
    // Give react time to fetch and render
    await expect(page.locator('.document-container')).toBeVisible();
    await page.waitForTimeout(1000); 

    // --- Sequence 1: Highlight, Adjust, and Cancel ---
    // 1. Initial selection
    await page.evaluate(() => {
      const textNode = document.querySelector('h1').childNodes[0];
      const range = document.createRange();
      range.setStart(textNode, 0);
      range.setEnd(textNode, 5); // Select "Highl"
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      document.dispatchEvent(new Event('selectionchange'));
    });
    
    // Assert tooltip spawns
    await expect(page.locator('.inline-tooltip-btn')).toBeVisible();

    // 2. User adjusts selection (drags the blue pin)
    await page.evaluate(() => {
      const textNode = document.querySelector('h1').childNodes[0];
      const range = document.createRange();
      range.setStart(textNode, 0);
      range.setEnd(textNode, 15); // Expand to "Highlight Cont"
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      document.dispatchEvent(new Event('selectionchange'));
    });

    // Assert tooltip is still visible after adjustment
    await expect(page.locator('.inline-tooltip-btn')).toBeVisible();

    // 3. User changes mind, taps background to cancel
    await page.locator('body').click({ position: { x: 10, y: 10 } });

    // Assert tooltip disappears
    await expect(page.locator('.inline-tooltip-btn')).not.toBeVisible();

    // --- Sequence 2: Scroll down and repeat ---
    // 1. Scroll down
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(500); // let scroll settle

    // 2. Select text further down the page
    await page.evaluate(() => {
      const pNodes = document.querySelectorAll('p');
      const targetP = pNodes[0].childNodes[0];
      const range = document.createRange();
      range.setStart(targetP, 0);
      range.setEnd(targetP, 5);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      document.dispatchEvent(new Event('selectionchange'));
    });

    // Assert tooltip spawns at new location
    await expect(page.locator('.inline-tooltip-btn')).toBeVisible();

    // 3. User adjusts selection again
    await page.evaluate(() => {
      const pNodes = document.querySelectorAll('p');
      const targetP = pNodes[pNodes.length - 1].childNodes[0];
      const range = document.createRange();
      range.setStart(targetP, 0);
      range.setEnd(targetP, 30);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      document.dispatchEvent(new Event('selectionchange'));
    });

    await expect(page.locator('.inline-tooltip-btn')).toBeVisible();

    // 4. Click comment and save
    await page.locator('.inline-tooltip-btn').click();
    await page.locator('textarea').fill('This is a comment after scrolling!');
    await page.locator('button:has-text("Save")').click();

    // Assert the text actually highlighted yellow
    await expect(page.locator('mark.comment-highlight')).toHaveCount(1);
    
    // Assert tooltip and bottom sheet are properly gone
    await expect(page.locator('.inline-tooltip-btn')).not.toBeVisible();
    await expect(page.locator('.bottom-sheet')).not.toBeVisible();
  });
});
