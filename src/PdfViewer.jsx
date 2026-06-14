import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

// Force react-pdf to load the worker from the official external CDN
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

export default function PdfViewer({ base64Data }) {
  const [numPages, setNumPages] = useState(null);
  
  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
  }

  const pdfDataUri = `data:application/pdf;base64,${base64Data}`;

  return (
    <div className="pdf-container" style={{ width: '100%', overflowX: 'hidden' }}>
      <Document
        file={pdfDataUri}
        onLoadSuccess={onDocumentLoadSuccess}
        loading={<p style={{color: 'var(--color-fg-default)'}}>Loading PDF...</p>}
        error={<p style={{color: 'red'}}>Failed to load PDF.</p>}
      >
        {Array.from(new Array(numPages), (el, index) => (
          <div key={`page_${index + 1}`} style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center', backgroundColor: 'var(--color-canvas-default, #ffffff)' }}>
            <Page 
              pageNumber={index + 1} 
              renderTextLayer={true} 
              renderAnnotationLayer={false}
              width={Math.min(window.innerWidth - 40, 800)} // Responsive scaling for mobile
            />
          </div>
        ))}
      </Document>
    </div>
  );
}
