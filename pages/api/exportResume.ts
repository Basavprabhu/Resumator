import type { NextApiRequest, NextApiResponse } from "next";
import puppeteer from "puppeteer";

export const config = {
  api: {
    responseLimit: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Disable server-side PDF export for company/restricted environments
  return res.status(503).json({ 
    error: "Server PDF export is disabled",
    suggestion: "Please use 'Print to PDF' (Ctrl+P) or 'Client Export' instead",
    reason: "Puppeteer may not work in corporate/restricted environments"
  });

  try {
    const { template, resumeData } = req.body;

    if (!template || !resumeData) {
      return res.status(400).json({ error: "Missing template or data" });
    }

    // Production-ready Puppeteer configuration
    let browser;
    try {
      browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox", 
        "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
        "--disable-gpu",
          "--no-first-run",
          "--disable-web-security",
          "--disable-features=VizDisplayCompositor",
          "--single-process", // Important for serverless
        ],
        // Try to use system Chrome first, fallback to bundled
        executablePath: process.env.NODE_ENV === 'production' 
          ? process.env.PUPPETEER_EXECUTABLE_PATH || undefined
          : undefined,
      });
    } catch (launchError) {
      console.error("Puppeteer launch failed:", launchError);
      return res.status(500).json({ 
        error: "PDF generation service unavailable. Please use client-side export instead.",
        details: "Chrome browser not available on server"
      });
    }

    const page = await browser.newPage();

    // Set viewport to A4 size for better scaling
    await page.setViewport({
      width: 794, // A4 width in pixels at 96 DPI
      height: 1123, // A4 height in pixels at 96 DPI
      deviceScaleFactor: 1,
    });

    const baseUrl = process.env.NODE_ENV === 'production' 
      ? process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}`
        : 'https://your-domain.com'
      : 'http://localhost:3000';

    const url = `${baseUrl}/resumePreview?template=${encodeURIComponent(
      template
    )}&data=${encodeURIComponent(JSON.stringify(resumeData))}`;

    try {
    await page.goto(url, { 
      waitUntil: "networkidle0",
      timeout: 30000 
    });

    // Wait for the resume container to be fully loaded
      await page.waitForSelector('#resume-container', { timeout: 15000 });
      
      // Wait a bit more for content to render
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (pageError) {
      console.error("Page load failed:", pageError);
      await browser.close();
      return res.status(500).json({ 
        error: "Failed to load resume page for PDF generation",
        details: "Page timeout or navigation error"
      });
    }

    // Inject CSS to ensure proper scaling and remove any margins
    await page.addStyleTag({
      content: `
        * {
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
        body {
          margin: 0 !important;
          padding: 0 !important;
          background: white !important;
        }
        #resume-container {
          margin: 0 !important;
          padding: 20px !important;
          box-shadow: none !important;
          border: none !important;
          border-radius: 0 !important;
          background: white !important;
          max-width: 100% !important;
          width: 100% !important;
          transform-origin: top left;
          page-break-inside: avoid;
        }
        /* Fix Tailwind oklch colors */
        .text-gray-900 { color: #1f2937 !important; }
        .text-gray-800 { color: #374151 !important; }
        .text-gray-700 { color: #4b5563 !important; }
        .text-blue-600 { color: #2563eb !important; }
        .text-blue-900 { color: #1e3a8a !important; }
        .bg-white { background-color: #ffffff !important; }
        .border-gray-300 { border-color: #d1d5db !important; }
        @page {
          margin: 0;
          size: A4;
        }
        @media print {
          body { margin: 0; }
          #resume-container { 
            margin: 0 !important; 
            box-shadow: none !important;
            page-break-inside: avoid;
          }
        }
      `
    });

    // Generate PDF with optimized settings
    let pdfBuffer;
    try {
      pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "0mm",
        right: "0mm", 
        bottom: "0mm",
          left: "0mm",
      },
      preferCSSPageSize: true,
      });
    } catch (pdfError) {
      console.error("PDF generation failed:", pdfError);
      await browser.close();
      return res.status(500).json({
        error: "PDF generation failed",
        details: "Could not generate PDF from page content"
    });
    }

    await browser.close();

    // Set proper headers for PDF download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${(resumeData.name || 'resume').replace(/[^a-zA-Z0-9]/g, '_')}.pdf"`
    );
    res.setHeader("Content-Length", pdfBuffer.length);

    res.status(200).send(pdfBuffer);

  } catch (error: any) {
    console.error("Export error:", error);
    
    // Provide helpful error messages
    if (error.message?.includes("Chrome")) {
      return res.status(500).json({
        error: "Chrome browser not available for PDF generation",
        suggestion: "Please use the 'Print to PDF' or 'Client Export' options instead",
        details: error.message
      });
    }
    
    return res.status(500).json({ 
      error: "PDF generation failed", 
      details: error.message,
      suggestion: "Try using client-side export or browser print instead"
    });
  }
}