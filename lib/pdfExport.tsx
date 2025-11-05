// pages/lib/pdfExport.ts
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

/**
 * Export a DOM element to a single-page A4 PDF (no browser headers/footers).
 * - element: the DOM node containing the resume (full A4-styled HTML).
 * - filename: desired file name, e.g. 'john_doe_resume.pdf'
 *
 * Note: install `html2canvas` and `jspdf` (see instructions).
 */
export async function exportResumeToPdf(element: HTMLElement, filename = "resume.pdf") {
  if (!element) throw new Error("No element provided");

  // A4 dimensions in mm
  const A4_WIDTH_MM = 210;
  const A4_HEIGHT_MM = 297;
  const MARGIN_MM = 10; // adjustable margin (mm)
  const usableWidthMM = A4_WIDTH_MM - MARGIN_MM * 2;
  const usableHeightMM = A4_HEIGHT_MM - MARGIN_MM * 2;

  // DPI assumption for px->mm conversion. We will work with pixel sizes,
  // but use the actual canvas pixel dimensions to compute final PDF mm sizes.
  // If your template already targets 794x1123 px (96dpi), it's okay — we'll scale.

  // create offscreen wrapper to avoid modifying original layout / styles
  const wrapper = document.createElement("div");
  wrapper.style.position = "fixed";
  wrapper.style.left = "-9999px";
  wrapper.style.top = "0";
  wrapper.style.background = "#ffffff";
  wrapper.style.padding = "0";
  wrapper.style.margin = "0";
  wrapper.style.boxSizing = "border-box";

  // clone the element to render
  const clone = element.cloneNode(true) as HTMLElement;

  // Force dark text and white bg for readability
  clone.style.background = "#ffffff";
  clone.style.color = "#111827"; // dark text override
  // optional: ensure width matches your template width so things render consistent
  // The common A4 px width at 96dpi ~ 794 px. If your template uses 800/760 width, that's fine.
  // We'll set the wrapper width to the clone's scrollWidth or fallback to 794.
  const desiredPxWidth = 794; // base width to render at (adjust if your template uses a different internal width)
  clone.style.width = `${desiredPxWidth}px`;

  // append and render
  wrapper.appendChild(clone);
  document.body.appendChild(wrapper);

  try {
    // Let layout settle
    await new Promise((r) => setTimeout(r, 50));

    // Use html2canvas to render the clone.
    // increase scale for better quality (2 is good), but be mindful of memory/time with very big DOM.
    const html2canvasOptions = {
      scale: 2, // quality multiplier
      useCORS: true,
      allowTaint: false,
      logging: false,
      // width: desiredPxWidth, // optional
    };

    const canvas = await html2canvas(clone, html2canvasOptions);

    // Canvas size in px
    const canvasWidthPx = canvas.width;
    const canvasHeightPx = canvas.height;

    // Convert rendered canvas to image data URL
    const imgData = canvas.toDataURL("image/jpeg", 0.98);

    // Now compute sizes in PDF units (mm).
    // We'll use the PDF width = usableWidthMM, and compute height proportionally.
    // But if the computed height in mm exceeds usableHeightMM, we'll shrink to fit.
    // First compute px-to-mm scale using the canvas width -> usableWidthMM mapping:
    // pxToMm = usableWidthMM / canvasWidthPx
    const pxToMm = usableWidthMM / canvasWidthPx;
    let imgWidthMM = canvasWidthPx * pxToMm;
    let imgHeightMM = canvasHeightPx * pxToMm;

    // If img height would overflow usable height, scale down to fit A4
    if (imgHeightMM > usableHeightMM) {
      const scaleDown = usableHeightMM / imgHeightMM;
      imgWidthMM = imgWidthMM * scaleDown;
      imgHeightMM = imgHeightMM * scaleDown;
    }

    // Create jsPDF (units mm)
    const pdf = new jsPDF({
      unit: "mm",
      format: "a4",
      orientation: "portrait",
    });

    // center image horizontally and vertically inside margins
    const x = (A4_WIDTH_MM - imgWidthMM) / 2;
    const y = (A4_HEIGHT_MM - imgHeightMM) / 2;

    // Add image to PDF
    pdf.addImage(imgData, "JPEG", x, y, imgWidthMM, imgHeightMM, undefined, "FAST");

    // Save file
    pdf.save(filename);
  } finally {
    // cleanup
    wrapper.remove();
  }
}
