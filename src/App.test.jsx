import { render, screen } from '@testing-library/react';
import App from './App';
import { describe, it, expect } from 'vitest';
import React from 'react';

describe('App Component', () => {
  it('renders the header correctly', () => {
    render(<App />);
    const headerElement = screen.getByText(/Inline Comments/i);
    expect(headerElement).toBeDefined();
  });

  it('renders the "Get Share Link" button', () => {
    render(<App />);
    const buttonElement = screen.getByText(/Get Share Link/i);
    expect(buttonElement).toBeDefined();
  });
});