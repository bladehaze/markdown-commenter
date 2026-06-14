import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import LZString from 'lz-string';
import Mark from 'mark.js';
import 'github-markdown-css/github-markdown.css';
import './App.css';
import PdfViewer from './PdfViewer';

function App() {
  const [documentText, setDocumentText] = useState('# Welcome\n\nHighlight some text to add a comment! To load your own text, pass LZ-compressed data in the URL hash.');
  const [comments, setComments] = useState([]);
  const [activeSelection, setActiveSelection] = useState('');
  const [selectionRect, setSelectionRect] = useState(null);
  const [draftComment, setDraftComment] = useState('');
  const [showSheet, setShowSheet] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [copyStatus, setCopyStatus] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);

  // 1. URL Decoder
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const payload = params.get('payload') || window.location.hash.replace(/^#/, '');

    if (id) {
      setDocumentText('Loading document...');
      fetch('/api/load?id=' + id)
        .then(res => res.json())
        .then(data => {
          if (data.text) {
            setDocumentText(data.text);
          } else {
            setDocumentText('# Error\n\nDocument not found or expired.');
          }
        })
        .catch(err => {
          console.error(err);
          setDocumentText('# Error\n\nFailed to load document from server.');
        });
    } else if (payload) {
      try {
        let decoded = LZString.decompressFromEncodedURIComponent(payload);
        if (decoded) {
          setDocumentText(decoded);
        }
      } catch (e) {
        console.error("Failed to decode URL payload", e);
      }
    }
  }, []);

  // 2. Selection Handler
  useEffect(() => {
    let timeoutId = null;
    
    const handleSelection = () => {
      // Clear any pending calculation to let the browser settle
      if (timeoutId) clearTimeout(timeoutId);
      
      timeoutId = setTimeout(() => {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0 || selection.toString().trim() === '') {
          if (!showSheet && !showCart) {
            setActiveSelection('');
            setSelectionRect(null);
          }
          return;
        }
        
        const text = selection.toString().trim();
        
        if (!showSheet && !showCart) {
          setActiveSelection(text);
          try {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            // Ensure we have a valid rect before setting it
            if (rect.width > 0 && rect.height > 0) {
              setSelectionRect({
                top: rect.top + window.scrollY,
                left: rect.left + window.scrollX,
                width: rect.width,
                height: rect.height
              });
            }
          } catch(e) {
            console.error(e);
          }
        }
      }, 100); // 100ms debounce
    };

    document.addEventListener('selectionchange', handleSelection);
    return () => {
      document.removeEventListener('selectionchange', handleSelection);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [showSheet, showCart]);


  // 3. Highlight Application
  // Use a slight timeout to ensure React DOM has finished rendering before mark.js scans it
  useEffect(() => {
    const container = document.querySelector('.document-container');
    if (!container) return;
    
    setTimeout(() => {
      const instance = new Mark(container);
    instance.unmark({
      done: () => {
        comments.forEach(c => {
          instance.mark(c.quote, {
            className: 'comment-highlight',
            separateWordSearch: false,
            acrossElements: true,
            each: (elem) => {
              elem.setAttribute('data-comment-id', c.id);
            }
          });
        });
      }
    });
      }, 50);
  }, [comments, documentText]);

  // Click Handler for Highlights
  const handleDocumentClick = (e) => {
    // If user taps empty space (not a highlight and not the tooltip), clear selection
    if (!e.target.closest('mark.comment-highlight') && !e.target.closest('.inline-tooltip-btn')) {
      if (activeSelection) {
        setActiveSelection('');
        setSelectionRect(null);
        window.getSelection().removeAllRanges();
      }
      return;
    }
    const markNode = e.target.closest('mark.comment-highlight');
    if (markNode) {
      const id = markNode.getAttribute('data-comment-id');
      const comment = comments.find(c => c.id.toString() === id);
      if (comment) {
        window.getSelection().removeAllRanges(); // Clear any native selection
        setActiveSelection(comment.quote);
        setDraftComment(comment.text);
        setEditingCommentId(comment.id);
        setShowSheet(true);
      }
    }
  };

  const handleOpenComment = () => {
    setEditingCommentId(null);
    setShowSheet(true);
  };

  const handleSaveComment = () => {
    if (draftComment.trim() === '') return;
    
    if (editingCommentId) {
      setComments(comments.map(c => c.id === editingCommentId ? { ...c, text: draftComment } : c));
    } else {
      setComments([...comments, { id: Date.now(), quote: activeSelection, text: draftComment }]);
    }
    
    setDraftComment('');
    setEditingCommentId(null);
    setShowSheet(false);
    setActiveSelection('');
    setSelectionRect(null);
    window.getSelection().removeAllRanges();
    // explicit save trigger log
  };

  const handleDeleteComment = () => {
    if (editingCommentId) {
      setComments(comments.filter(c => c.id !== editingCommentId));
    }
    setDraftComment('');
    setEditingCommentId(null);
    setShowSheet(false);
    setActiveSelection('');
    setSelectionRect(null);
    window.getSelection().removeAllRanges();
  };

  const handleCancelComment = () => {
    setDraftComment('');
    setEditingCommentId(null);
    setShowSheet(false);
    setActiveSelection('');
    setSelectionRect(null);
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

  const generateShareLink = async () => {
    try {
      const response = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: documentText })
      });
      if (response.ok) {
        const data = await response.json();
        const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname + "?id=" + data.id;
        window.history.replaceState({}, "", newUrl);
        navigator.clipboard.writeText(newUrl);
        alert('Share link copied to clipboard!');
        return;
      }
    } catch(e) {
      console.error(e);
    }
    // Fallback
    const encoded = LZString.compressToEncodedURIComponent(documentText);
    const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname + "?payload=" + encoded;
    window.history.replaceState({}, "", newUrl);
    navigator.clipboard.writeText(newUrl);
    alert('Share link copied to clipboard! (Fallback)');
  };

  return (
    <div className="App">
      <header className="app-header">
        <h1>Inline Comments</h1>
        <button onClick={generateShareLink} className="btn-secondary">Get Share Link</button>
      </header>

      <main className="document-container markdown-body" onClick={handleDocumentClick}>
        {documentText.startsWith('JVBER') ? <PdfViewer base64Data={documentText} /> : <ReactMarkdown>{documentText}</ReactMarkdown>}
      </main>

      {/* Inline Tooltip Button */}
      {activeSelection && selectionRect && !showSheet && !showCart && (
        <button 
          className="inline-tooltip-btn" 
          onClick={handleOpenComment}
          onPointerDown={(e) => e.preventDefault()}
          style={{
            position: 'absolute',
            top: `${Math.max(0, selectionRect.top - 50)}px`,
            left: `${selectionRect.left + selectionRect.width / 2}px`,
            transform: 'translateX(-50%)',
            zIndex: 1000
          }}
        >
          💬 Comment
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
              {editingCommentId && (
                <button onClick={handleDeleteComment} className="btn-cancel" style={{color: '#ef4444', marginRight: 'auto'}}>
                  Delete
                </button>
              )}
              <button onClick={handleCancelComment} className="btn-cancel">Cancel</button>
              <button onClick={handleSaveComment} className="btn-primary">
                {editingCommentId ? 'Update' : 'Save'}
              </button>
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
