import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

// Force react-pdf to load the worker from the official external CDN
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

export default function PdfViewer({ base64Data }) {
  const [numPages, setNumPages] = useState(null);
  const [scale, setScale] = useState(1.0); // Manage zoom scale state
  
  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
  }

  const pdfDataUri = `data:application/pdf;base64,${base64Data}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      {/* Sticky Zoom Controls */}
      <div style={{ 
        position: 'sticky', 
        top: '10px', 
        zIndex: 100, 
        display: 'flex', 
        justifyContent: 'center',
        gap: '15px', 
        marginBottom: '15px',
        padding: '8px',
        backgroundColor: 'var(--color-canvas-default, #ffffff)',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        width: 'fit-content',
        alignSelf: 'center'
      }}>
        <button onClick={() => setScale(s => Math.max(0.4, s - 0.2))} className="btn-secondary" style={{padding: '4px 16px', fontSize: '1.2rem', margin: 0}}>-</button>
        <span style={{lineHeight: '34px', fontWeight: 'bold', minWidth: '50px', textAlign: 'center'}}>{Math.round(scale * 100)}%</span>
        <button onClick={() => setScale(s => Math.min(3.0, s + 0.2))} className="btn-secondary" style={{padding: '4px 16px', fontSize: '1.2rem', margin: 0}}>+</button>
      </div>

      {/* Scrollable PDF Container */}
      <div className="pdf-container" style={{ width: '100%', overflowX: 'auto', textAlign: 'center' }}>
        <Document
          file={pdfDataUri}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={<p style={{color: 'var(--color-fg-default)'}}>Loading PDF...</p>}
          error={<p style={{color: 'red'}}>Failed to load PDF.</p>}
        >
          {Array.from(new Array(numPages), (el, index) => (
            <div key={`page_${index + 1}`} style={{ marginBottom: '20px', display: 'inline-block', backgroundColor: 'var(--color-canvas-default, #ffffff)' }}>
              <Page 
                pageNumber={index + 1} 
                renderTextLayer={true} 
                renderAnnotationLayer={false}
                width={Math.min(window.innerWidth - 40, 800)} // Base width
                scale={scale} // Applied zoom multiplier
              />
            </div>
          ))}
        </Document>
      </div>
    </div>
  );
}
