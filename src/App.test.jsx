import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';

// Mock matchMedia for dark mode checks
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe('App Component Integration Tests', () => {
  let user;
  
  beforeEach(() => {
    user = userEvent.setup();
    // Reset DOM
    document.body.innerHTML = '';
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders the header correctly', () => {
    render(<App />);
    expect(screen.getByText(/Inline Comments/i)).toBeDefined();
    expect(screen.getByText(/Get Share Link/i)).toBeDefined();
  });

  it('handles the full commenting flow and clears selection state correctly', async () => {
    render(<App />);
    
    // 1. Find some text in the rendered markdown to "highlight"
    const contentText = await screen.findByText(/Highlight some text to add a comment!/i);
    expect(contentText).toBeDefined();

    // 2. Mock the window.getSelection and DOM Rects to simulate a mobile text selection
    const mockSelection = {
      toString: () => 'Highlight some text',
      rangeCount: 1,
      getRangeAt: () => ({
        getBoundingClientRect: () => ({ top: 100, left: 100, width: 50, height: 20 })
      }),
      removeAllRanges: vi.fn()
    };
    vi.spyOn(window, 'getSelection').mockReturnValue(mockSelection);

    // 3. Trigger the selectionchange event (which is debounced by 100ms)
    document.dispatchEvent(new Event('selectionchange'));
    
    // 4. Wait for the tooltip button to appear
    let tooltipButton;
    await waitFor(() => {
      tooltipButton = screen.getByText('💬 Comment');
      expect(tooltipButton).toBeDefined();
    }, { timeout: 1000 });

    // 5. Click the tooltip
    await user.click(tooltipButton);

    // 6. Verify the bottom sheet opened
    const saveButton = await screen.findByText('Save');
    expect(saveButton).toBeDefined();

    // 7. Click "Cancel" to test state clearance
    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);

    // 8. Verify the sheet closed AND the tooltip is gone (meaning state was wiped)
    expect(screen.queryByText('Save')).toBeNull();
    expect(screen.queryByText('💬 Comment')).toBeNull();

    // 9. Simulate a SECOND selection to prove it doesn't get stuck
    document.dispatchEvent(new Event('selectionchange'));
    
    await waitFor(() => {
      expect(screen.getByText('💬 Comment')).toBeDefined();
    }, { timeout: 1000 });
  });
});
