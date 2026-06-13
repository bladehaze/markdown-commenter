import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import LZString from 'lz-string';
import './App.css';

function App() {
  const [documentText, setDocumentText] = useState('# Welcome\n\nHighlight some text to add a comment! To load your own text, pass LZ-compressed data in the URL hash.');
  const [comments, setComments] = useState([]);
  const [activeSelection, setActiveSelection] = useState('');
  const [draftComment, setDraftComment] = useState('');
  const [showSheet, setShowSheet] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [copyStatus, setCopyStatus] = useState('');

  // 1. URL Decoder
  useEffect(() => {
    const params = new URLSearchParams(window.location.search); const payload = params.get('payload') || window.location.hash.replace(/^#/, '');
    if (payload) {
      try {
        // Try decoding
        let decoded = LZString.decompressFromEncodedURIComponent(payload);
        if (decoded) {
          setDocumentText(decoded);
        }
      } catch (e) {
        console.error("Failed to decode URL hash", e);
      }
    }
  }, []);

  // 2. Selection Handler
  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      const text = selection.toString().trim();
      
      // Only show sheet if they selected a reasonable amount of text and aren't already typing a comment
      if (text.length > 0 && !showSheet && !showCart) {
        setActiveSelection(text);
      }
    };

    document.addEventListener('selectionchange', handleSelection);
    return () => document.removeEventListener('selectionchange', handleSelection);
  }, [showSheet, showCart]);

  const handleOpenComment = () => {
    setShowSheet(true);
  };

  const handleSaveComment = () => {
    if (draftComment.trim() === '') return;
    setComments([...comments, { id: Date.now(), quote: activeSelection, text: draftComment }]);
    setDraftComment('');
    setShowSheet(false);
    setActiveSelection('');
    window.getSelection().removeAllRanges(); // Clear selection
  };

  const handleCancelComment = () => {
    setDraftComment('');
    setShowSheet(false);
    setActiveSelection('');
    window.getSelection().removeAllRanges();
  };

  // 4. Discord Export Generator
  const handleCopyAll = async () => {
    if (comments.length === 0) return;
    
    const formatted = comments.map(c => {
      // Split quote by lines to add > to each line for discord blockquotes
      const blockquote = c.quote.split('\n').map(line => `> *${line}*`).join('\n');
      return `${blockquote}\n${c.text}`;
    }).join('\n\n');

    try {
      await navigator.clipboard.writeText(formatted);
      setCopyStatus('Copied! Swipe back to Discord to paste.');
      setTimeout(() => setCopyStatus(''), 3000);
    } catch (err) {
      setCopyStatus('Failed to copy. Make sure you tapped the button.');
    }
  };

  const generateShareLink = () => {
    const encoded = LZString.compressToEncodedURIComponent(documentText);
    const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname + "?payload=" + encoded; window.history.replaceState({}, "", newUrl); navigator.clipboard.writeText(newUrl); return;
    navigator.clipboard.writeText(window.location.href);
    alert('Share link copied to clipboard!');
  };

  return (
    <div className="App">
      <header className="app-header">
        <h1>Inline Comments</h1>
        <button onClick={generateShareLink} className="btn-secondary">Get Share Link</button>
      </header>

      <main className="document-container">
        <ReactMarkdown>{documentText}</ReactMarkdown>
      </main>

      {/* Selection Floating Button (Mobile friendly) */}
      {activeSelection && !showSheet && !showCart && (
        <button className="floating-comment-btn" onClick={handleOpenComment}>
          💬 Comment on Selection
        </button>
      )}

      {/* Bottom Sheet for Input */}
      {showSheet && (
        <div className="bottom-sheet">
          <div className="sheet-content">
            <div className="quote-preview">
              <em>"{activeSelection.length > 100 ? activeSelection.substring(0, 100) + '...' : activeSelection}"</em>
            </div>
            <textarea 
              value={draftComment}
              onChange={(e) => setDraftComment(e.target.value)}
              placeholder="Type your thought here..."
              autoFocus
            />
            <div className="sheet-actions">
              <button onClick={handleCancelComment} className="btn-cancel">Cancel</button>
              <button onClick={handleSaveComment} className="btn-primary">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button (Cart) */}
      {comments.length > 0 && !showSheet && (
        <button className="fab-cart" onClick={() => setShowCart(true)}>
          📝 {comments.length}
        </button>
      )}

      {/* Full Screen Cart Modal */}
      {showCart && (
        <div className="cart-modal">
          <div className="cart-header">
            <h2>Your Drafts ({comments.length})</h2>
            <button onClick={() => setShowCart(false)}>Close</button>
          </div>
          <div className="cart-items">
            {comments.map(c => (
              <div key={c.id} className="cart-item">
                <blockquote>{c.quote}</blockquote>
                <p>{c.text}</p>
              </div>
            ))}
          </div>
          <div className="cart-footer">
            <button className="btn-copy-all" onClick={handleCopyAll}>
              Copy All for Discord
            </button>
            {copyStatus && <div className="copy-toast">{copyStatus}</div>}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
