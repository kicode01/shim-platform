"use client";

import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import React from "react";
import CertificateView from "@/components/CertificateView";

export interface RenderCertOptions {
  certificateId: string;
  recipientName: string;
  role?: string | null;
  eventName?: string | null;
  issueDate?: string | Date;
  design?: any;
  status?: string;
}

/**
 * Ensures all web fonts and images in the target container have finished loading
 * before html2canvas takes a snapshot.
 */
async function waitForAssetsReady(container: HTMLElement): Promise<void> {
  // 1. Wait for document fonts to settle
  if (typeof document !== "undefined" && document.fonts) {
    try {
      await document.fonts.ready;
    } catch {
      /* ignore font readiness errors */
    }
  }

  // 2. Wait for all <img> tags to complete loading
  const images = Array.from(container.querySelectorAll("img"));
  if (images.length > 0) {
    await Promise.all(
      images.map((img) => {
        if (img.complete) return Promise.resolve(true);
        return new Promise((resolve) => {
          img.onload = () => resolve(true);
          img.onerror = () => resolve(false);
          // Safety timeout of 2.5s per image so export never hangs
          setTimeout(() => resolve(false), 2500);
        });
      })
    );
  }

  // 3. Brief layout settle time to ensure SVG gradients and canvas auto-fit have committed
  await new Promise((resolve) => setTimeout(resolve, 250));
}

/**
 * Renders a certificate in an isolated offscreen DOM sandbox with printMode=true,
 * awaits all assets and dynamic text fitting, and captures a 1:1 pixel-perfect HTMLCanvas.
 */
export async function renderCertToCanvas(options: RenderCertOptions): Promise<HTMLCanvasElement> {
  let parsedDesign: any = {};
  if (options.design) {
    try {
      parsedDesign = typeof options.design === "string" ? JSON.parse(options.design) : options.design;
    } catch {
      parsedDesign = {};
    }
  }

  const isPortrait = parsedDesign.orientation === "portrait";
  const baseW = isPortrait ? 2480 : 3508;
  const baseH = isPortrait ? 3508 : 2480;

  // Create isolated sandbox element at (0, 0) behind the view with pointer-events disabled
  const sandbox = document.createElement("div");
  sandbox.style.position = "fixed";
  sandbox.style.left = "0px";
  sandbox.style.top = "0px";
  sandbox.style.width = `${baseW}px`;
  sandbox.style.height = `${baseH}px`;
  sandbox.style.overflow = "hidden";
  sandbox.style.zIndex = "-99999";
  sandbox.style.pointerEvents = "none";
  sandbox.style.opacity = "1";
  sandbox.style.backgroundColor = "#ffffff";
  document.body.appendChild(sandbox);

  const root = createRoot(sandbox);

  try {
    flushSync(() => {
      root.render(
        <CertificateView
          certificateId={options.certificateId}
          recipientName={options.recipientName}
          role={options.role}
          eventId={options.eventName}
          issueDate={options.issueDate}
          design={parsedDesign}
          status={options.status || "valid"}
          printMode={true}
        />
      );
    });

    // Await all fonts, webfont stylesheets, images, and layout measurements
    await waitForAssetsReady(sandbox);

    const targetNode = (sandbox.querySelector("#certificate-print-node") as HTMLElement) || sandbox;

    const canvas = await html2canvas(targetNode, {
      width: baseW,
      height: baseH,
      scale: 1, // 1:1 true 300 DPI resolution (3508x2480 / 2480x3508)
      useCORS: true,
      allowTaint: false, // Prevents canvas from becoming tainted
      backgroundColor: "#ffffff",
      logging: false,
      scrollX: 0,
      scrollY: 0,
      windowWidth: baseW,
      windowHeight: baseH,
    });

    return canvas;
  } finally {
    try {
      root.unmount();
    } catch {}
    sandbox.remove();
  }
}

/**
 * Downloads a single certificate as an A4 PDF with 1:1 fidelity matching the live preview.
 */
export async function downloadCertificatePdf(
  cert: RenderCertOptions,
  filename?: string
): Promise<void> {
  let parsedDesign: any = {};
  if (cert.design) {
    try {
      parsedDesign = typeof cert.design === "string" ? JSON.parse(cert.design) : cert.design;
    } catch {}
  }
  const isPortrait = parsedDesign.orientation === "portrait";

  const canvas = await renderCertToCanvas(cert);

  const pdf = new jsPDF(isPortrait ? "p" : "l", "mm", "a4");
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  const imgData = canvas.toDataURL("image/jpeg", 0.98);
  pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);

  const cleanName = (cert.recipientName || "Recipient").trim().replace(/[^\w\s-]/g, "").replace(/\s+/g, "_");
  const finalFilename = filename || `Certificate_${cleanName}.pdf`;
  pdf.save(finalFilename);
}

/**
 * Downloads a batch of certificates as a multi-page A4 PDF with 1:1 fidelity.
 */
export async function downloadBatchCertificatesPdf(
  certs: RenderCertOptions[],
  filename?: string,
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  if (certs.length === 0) return;

  let parsedDesign: any = {};
  if (certs[0]?.design) {
    try {
      parsedDesign = typeof certs[0].design === "string" ? JSON.parse(certs[0].design) : certs[0].design;
    } catch {}
  }
  const isPortrait = parsedDesign.orientation === "portrait";

  const pdf = new jsPDF(isPortrait ? "p" : "l", "mm", "a4");
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  for (let i = 0; i < certs.length; i++) {
    if (i > 0) pdf.addPage();
    if (onProgress) onProgress(i + 1, certs.length);

    const canvas = await renderCertToCanvas(certs[i]);
    const imgData = canvas.toDataURL("image/jpeg", 0.98);
    pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
  }

  const finalFilename = filename || `Batch_Certificates_${certs.length}.pdf`;
  pdf.save(finalFilename);
}
