// lib/clientPdfExport.ts
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// Color mapping for Tailwind colors that use oklch()
const colorMap: Record<string, string> = {
  // Gray colors
  'rgb(from oklch(0.989 0 0) r g b)': '#fafafa',
  'rgb(from oklch(0.969 0 0) r g b)': '#f5f5f5',
  'rgb(from oklch(0.942 0 0) r g b)': '#e5e5e5',
  'rgb(from oklch(0.902 0 0) r g b)': '#d4d4d4',
  'rgb(from oklch(0.834 0 0) r g b)': '#a3a3a3',
  'rgb(from oklch(0.706 0 0) r g b)': '#737373',
  'rgb(from oklch(0.571 0 0) r g b)': '#525252',
  'rgb(from oklch(0.439 0 0) r g b)': '#404040',
  'rgb(from oklch(0.314 0 0) r g b)': '#262626',
  'rgb(from oklch(0.156 0 0) r g b)': '#171717',
  'rgb(from oklch(0.083 0 0) r g b)': '#0a0a0a',
  // Add more colors as needed
};

// Function to replace oklch colors with regular RGB/hex colors
const replaceOklchColors = (element: HTMLElement) => {
  // Get all computed styles
  const allElements = element.querySelectorAll('*');
  
  allElements.forEach((el) => {
    const computedStyle = window.getComputedStyle(el as Element);
    const htmlEl = el as HTMLElement;
    
    // Check and fix common style properties that might use oklch
    ['color', 'backgroundColor', 'borderColor'].forEach(prop => {
      const value = computedStyle.getPropertyValue(prop);
      if (value && (value.includes('oklch') || value.includes('from oklch'))) {
        // Try to find a replacement color
        const replacement = colorMap[value];
        if (replacement) {
          htmlEl.style.setProperty(prop, replacement, 'important');
        } else {
          // Fallback colors
          if (prop === 'color') htmlEl.style.setProperty(prop, '#1f2937', 'important'); // gray-800
          if (prop === 'backgroundColor') htmlEl.style.setProperty(prop, '#ffffff', 'important'); // white
          if (prop === 'borderColor') htmlEl.style.setProperty(prop, '#e5e7eb', 'important'); // gray-200
        }
      }
    });
  });
  
  // Also check the main element
  const mainStyle = window.getComputedStyle(element);
  ['color', 'backgroundColor', 'borderColor'].forEach(prop => {
    const value = mainStyle.getPropertyValue(prop);
    if (value && (value.includes('oklch') || value.includes('from oklch'))) {
      const replacement = colorMap[value];
      if (replacement) {
        element.style.setProperty(prop, replacement, 'important');
      } else {
        if (prop === 'color') element.style.setProperty(prop, '#1f2937', 'important');
        if (prop === 'backgroundColor') element.style.setProperty(prop, '#ffffff', 'important');
        if (prop === 'borderColor') element.style.setProperty(prop, '#e5e7eb', 'important');
      }
    }
  });
};

export const exportResumeToPDFClient = async (elementId: string, filename: string = 'resume') => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error('Resume element not found');
    }

    // Create a clone for PDF generation without modifying the original
    const clonedElement = element.cloneNode(true) as HTMLElement;
    clonedElement.id = 'pdf-clone';
    
    // Create temporary container for PDF generation
    const tempContainer = document.createElement('div');
    tempContainer.style.cssText = `
      position: absolute;
      top: -9999px;
      left: -9999px;
      width: 794px;
      height: 1123px;
      background: white;
      z-index: -1;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    
    // Apply PDF-specific styles to cloned element
    clonedElement.style.cssText = `
      width: 794px;
      height: 1123px;
      margin: 0;
      padding: 0;
      box-shadow: none;
      border: none;
      border-radius: 0;
      background: white;
      overflow: hidden;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    
    // Find and modify the inner container
    const innerContainer = clonedElement.querySelector('div') as HTMLElement;
    if (innerContainer) {
      innerContainer.style.cssText = `
        border: none !important;
        border-radius: 0 !important;
        padding: 16px !important;
        margin: 0 !important;
        box-shadow: none !important;
        width: 100% !important;
        height: 100% !important;
        box-sizing: border-box !important;
        background: white !important;
      `;
    }

    tempContainer.appendChild(clonedElement);
    document.body.appendChild(tempContainer);

    // Replace oklch colors with standard colors
    replaceOklchColors(clonedElement);

    // Wait for any images to load
    const images = clonedElement.querySelectorAll('img');
    const imagePromises = Array.from(images).map(img => {
      return new Promise((resolve) => {
        if (img.complete) {
          resolve(true);
        } else {
          img.onload = () => resolve(true);
          img.onerror = () => resolve(true);
          setTimeout(() => resolve(true), 3000);
        }
      });
    });
    
    await Promise.all(imagePromises);

    // Wait a bit more for styles to apply
    await new Promise(resolve => setTimeout(resolve, 500));

    // Generate canvas with settings that avoid oklch issues
    const canvas = await html2canvas(clonedElement, {
      scale: 2,
      useCORS: true,
      allowTaint: true, // Allow tainted canvas to avoid CORS issues
      backgroundColor: '#ffffff',
      width: 794,
      height: 1123,
      logging: false,
      imageTimeout: 0,
      removeContainer: false,
    //   ignoreElements: (element) => {
    //     // Skip elements that might have problematic styles
    //     const style = window.getComputedStyle(element);
    //     const bgColor = style.backgroundColor;
    //     const color = style.color;
    //     return (bgColor && bgColor.includes('oklch')) || (color && color.includes('oklch'));
    //   },
    });

    // Remove temporary container
    document.body.removeChild(tempContainer);

    // Create PDF
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const imgData = canvas.toDataURL('image/png', 1.0);
    
    if (imgHeight > pageHeight) {
      // Scale to fit one page
      const scaleFactor = pageHeight / imgHeight;
      const scaledWidth = imgWidth * scaleFactor;
      const scaledHeight = pageHeight;
      const xOffset = (imgWidth - scaledWidth) / 2;
      
      pdf.addImage(
        imgData,
        'PNG',
        xOffset,
        0,
        scaledWidth,
        scaledHeight,
        undefined,
        'FAST'
      );
    } else {
      pdf.addImage(
        imgData,
        'PNG',
        0,
        0,
        imgWidth,
        imgHeight,
        undefined,
        'FAST'
      );
    }

    pdf.save(`${filename.replace(/\s+/g, '_')}.pdf`);
    return true;
  } catch (error) {
    console.error('PDF export failed:', error);
    throw error;
  }
};

// Alternative simpler approach using browser print
export const printResume = () => {
  const printContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Resume</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.4;
            background: white;
            margin: 0;
            color: #1f2937;
          }
          .resume-container {
            width: 100%;
            max-width: 210mm;
            margin: 0 auto;
            padding: 15mm;
            background: white;
          }
          @page {
            margin: 0;
            size: A4;
          }
          @media print {
            body { margin: 0; }
            .resume-container { 
              margin: 0;
              box-shadow: none;
              max-width: none;
              width: 100%;
              padding: 15mm;
            }
          }
          /* Override Tailwind colors that might cause issues */
          .text-gray-900 { color: #1f2937 !important; }
          .text-gray-800 { color: #374151 !important; }
          .text-gray-700 { color: #4b5563 !important; }
          .text-gray-600 { color: #6b7280 !important; }
          .bg-white { background-color: #ffffff !important; }
          .bg-gray-100 { background-color: #f3f4f6 !important; }
          .border-gray-200 { border-color: #e5e7eb !important; }
          .border-gray-300 { border-color: #d1d5db !important; }
        </style>
      </head>
      <body>
        <div class="resume-container" id="print-resume">
          Loading...
        </div>
        <script>
          // Copy content from main page
          const originalResume = window.opener?.document.getElementById('resume-container');
          const printResume = document.getElementById('print-resume');
          if (originalResume && printResume) {
            printResume.innerHTML = originalResume.innerHTML;
            setTimeout(() => {
              window.print();
              window.onafterprint = () => window.close();
            }, 500);
          }
        </script>
      </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(printContent);
    printWindow.document.close();
  }
};