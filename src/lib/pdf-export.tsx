"use client";

import jsPDF from "jspdf";
import * as htmlToImage from "html-to-image";
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
  fingerprint?: string;
  design?: any;
  status?: string;
}

/**
 * Ensures all web fonts and images in the target container have finished loading
 * before html-to-image captures a pixel-perfect snapshot.
 */
async function waitForAssetsReady(container: HTMLElement): Promise<void> {
  // 1. Wait for any injected Google Fonts <link> stylesheets to finish downloading
  const fontLinks = Array.from(container.querySelectorAll<HTMLLinkElement>("link[rel='stylesheet']"));
  if (fontLinks.length > 0) {
    await Promise.all(
      fontLinks.map((link) => {
        return new Promise((resolve) => {
          if (link.sheet) {
            resolve(true);
            return;
          }
          link.addEventListener("load", () => resolve(true), { once: true });
          link.addEventListener("error", () => resolve(false), { once: true });
          setTimeout(() => resolve(false), 2000);
        });
      })
    );
  }

  // 2. Wait for document fonts to settle with safety timeout
  if (typeof document !== "undefined" && document.fonts) {
    try {
      await Promise.race([
        document.fonts.ready,
        new Promise((resolve) => setTimeout(resolve, 2500)),
      ]);
    } catch {
      /* ignore font readiness errors */
    }
  }

  // 3. Wait for all <img> tags to complete loading and decoding
  const images = Array.from(container.querySelectorAll("img"));
  if (images.length > 0) {
    await Promise.all(
      images.map(async (img) => {
        if (!img.complete) {
          await new Promise((resolve) => {
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            // Safety timeout of 2.5s per image so export never hangs
            setTimeout(() => resolve(false), 2500);
          });
        }
        if (typeof img.decode === "function") {
          try {
            await img.decode();
          } catch {
            /* ignore decode error */
          }
        }
      })
    );
  }

  // 4. Brief layout settle time to ensure SVG gradients and canvas auto-fit have committed
  await new Promise((resolve) => setTimeout(resolve, 300));
}

/**
 * Renders a certificate in an isolated offscreen DOM sandbox with printMode=true,
 * awaits all assets and dynamic text fitting, and captures a 1:1 pixel-perfect HTMLCanvas
 * using the browser's native rendering engine via html-to-image.
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
  const isCanvasElements = Boolean(parsedDesign.canvasElements);
  const baseW = isCanvasElements ? (isPortrait ? 2480 : 3508) : (isPortrait ? 538 : 760);
  const baseH = isCanvasElements ? (isPortrait ? 3508 : 2480) : (isPortrait ? 760 : 538);

  // If legacy template (760x538), use 4.615 pixel ratio so output canvas is true 3508x2480 300 DPI
  const targetPixelRatio = isCanvasElements ? 1 : 4.615;

  // Create isolated sandbox element at (0, 0) behind the view with pointer-events disabled
  const sandbox = document.createElement("div");
  if (typeof document !== "undefined" && document.documentElement) {
    sandbox.className = document.documentElement.className;
  }
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

  if (typeof window !== "undefined") {
    const computed = window.getComputedStyle(document.documentElement);
    const fontVars = [
      "--font-inter",
      "--font-outfit",
      "--font-cinzel",
      "--font-cormorant",
      "--font-script",
      "--font-playfair",
      "--font-spacemono",
      "--font-spacegrotesk",
      "--font-sans",
      "--font-serif",
      "--font-mono",
    ];
    for (const v of fontVars) {
      const val = computed.getPropertyValue(v);
      if (val) {
        sandbox.style.setProperty(v, val);
      }
    }
  }

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
          fingerprint={options.fingerprint}
          design={parsedDesign}
          status={options.status || "valid"}
          printMode={true}
        />
      );
    });

    // Await all fonts, webfont stylesheets, images, and layout measurements
    await waitForAssetsReady(sandbox);

    const targetNode = (sandbox.querySelector("#certificate-print-node") as HTMLElement) || sandbox;

    let canvas: HTMLCanvasElement;
    try {
      canvas = await htmlToImage.toCanvas(targetNode, {
        width: baseW,
        height: baseH,
        pixelRatio: targetPixelRatio,
        backgroundColor: "#ffffff",
        cacheBust: false,
      });
    } catch (imgErr) {
      console.warn("html-to-image standard rasterization issue, retrying with skipFonts:", imgErr);
      try {
        canvas = await htmlToImage.toCanvas(targetNode, {
          width: baseW,
          height: baseH,
          pixelRatio: targetPixelRatio,
          backgroundColor: "#ffffff",
          skipFonts: true,
        });
      } catch (toPngErr) {
        console.warn("html-to-image toCanvas skipFonts failed, rendering via toPng fallback:", toPngErr);
        const dataUrl = await htmlToImage.toPng(targetNode, {
          width: baseW,
          height: baseH,
          pixelRatio: targetPixelRatio,
          backgroundColor: "#ffffff",
          skipFonts: true,
        });
        const offscreenImg = new Image();
        offscreenImg.crossOrigin = "anonymous";
        await new Promise<void>((resolve, reject) => {
          offscreenImg.onload = () => resolve();
          offscreenImg.onerror = (e) => reject(e);
          offscreenImg.src = dataUrl;
        });
        canvas = document.createElement("canvas");
        canvas.width = Math.round(baseW * targetPixelRatio);
        canvas.height = Math.round(baseH * targetPixelRatio);
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(offscreenImg, 0, 0, canvas.width, canvas.height);
        }
      }
    }

    return canvas;
  } finally {
    try {
      root.unmount();
    } catch {}
    sandbox.remove();
  }
}

/**
 * Downloads a single certificate as an A4 PDF with 1:1 pixel-perfect fidelity matching the live preview.
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

  // Use lossless PNG to guarantee 1:1 crystal-clear graphics without compression artifacts
  const imgData = canvas.toDataURL("image/png");
  pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight, undefined, "FAST");

  const cleanName = (cert.recipientName || "Recipient").trim().replace(/[^\w\s-]/g, "").replace(/\s+/g, "_");
  const finalFilename = filename || `Certificate_${cleanName}.pdf`;
  pdf.save(finalFilename);
}

/**
 * Downloads a single certificate directly as a high-resolution 300 DPI PNG image.
 */
export async function downloadCertificateImage(
  cert: RenderCertOptions,
  filename?: string
): Promise<void> {
  const canvas = await renderCertToCanvas(cert);
  const dataUrl = canvas.toDataURL("image/png");
  const link = document.createElement("a");
  const cleanName = (cert.recipientName || "Recipient").trim().replace(/[^\w\s-]/g, "").replace(/\s+/g, "_");
  link.download = filename || `Certificate_${cleanName}.png`;
  link.href = dataUrl;
  link.click();
}

/**
 * Downloads a batch of certificates as a multi-page A4 PDF with 1:1 pixel-perfect fidelity.
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
    let certDesign: any = {};
    if (certs[i]?.design) {
      try {
        certDesign = typeof certs[i].design === "string" ? JSON.parse(certs[i].design) : certs[i].design;
      } catch {}
    }
    const certIsPortrait = certDesign.orientation === "portrait";

    if (i > 0) {
      pdf.addPage("a4", certIsPortrait ? "p" : "l");
    }
    if (onProgress) onProgress(i + 1, certs.length);

    const canvas = await renderCertToCanvas(certs[i]);
    const imgData = canvas.toDataURL("image/png");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    pdf.addImage(imgData, "PNG", 0, 0, pageWidth, pageHeight, undefined, "FAST");
  }

  const finalFilename = filename || `Batch_Certificates_${certs.length}.pdf`;
  pdf.save(finalFilename);
}

if (typeof window !== "undefined") {
  (window as any).__renderCertToCanvas = renderCertToCanvas;
  (window as any).__downloadCertificatePdf = downloadCertificatePdf;
}

