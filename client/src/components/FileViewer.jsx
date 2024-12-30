import React, { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import "./styles/FileViewer.css"
// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function FileViewer(props) {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);

  const onLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setPageNumber(1);
  };

  return (
    <div className="card w-100">
      <div className="card-body w-100">
        {/* <h6 className="card-title">Title: {props.file.title}</h6> */}
        <Document file={props.file.fileUrl} onLoadSuccess={onLoadSuccess} loading="Please wait!!" className={["w-100","d-flex","justify-content-center","container","img-fluid","overflow-scroll","doc"]}>
          <Page pageNumber={pageNumber} className={["w-100","container","img-fluid","pdf-page"]}/>
        </Document>
        <div className="mt-3 text-center">
          <button
            className="btn btn-secondary me-2"
            disabled={pageNumber <= 1}
            onClick={() => setPageNumber(pageNumber - 1)}
          >
            Previous
          </button>
          <span>
            Page {pageNumber} of {numPages}
          </span>
          <button
            className="btn btn-secondary ms-2"
            disabled={pageNumber >= numPages}
            onClick={() => setPageNumber(pageNumber + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

