"use client";

import React from "react";

export type ShapeVariant = "divider" | "square" | "circle" | "triangle";

export interface CanvasShapeProps {
  shapeType?: ShapeVariant | string;
  width?: number;
  height?: number;
  color?: string;
  strokeColor?: string;
  strokeWidth?: number;
  borderRadius?: number;
  opacity?: number;
}

const SHAPE_LABELS: Record<ShapeVariant, string> = {
  divider: "Divider",
  square: "Square",
  circle: "Circle",
  triangle: "Triangle",
};

/** Resolves the effective shape variant, defaulting legacy `shape` elements to `"divider"`. */
export function resolveShapeVariant(shapeType?: ShapeVariant | string): ShapeVariant {
  if (shapeType === "square" || shapeType === "circle" || shapeType === "triangle" || shapeType === "divider") {
    return shapeType;
  }
  return "divider";
}

/** Returns the human-readable element label for a shape variant. */
export function getShapeLabel(shapeType?: ShapeVariant | string): string {
  return SHAPE_LABELS[resolveShapeVariant(shapeType)];
}

/**
 * Shared geometric shape renderer for both the interactive canvas editor and
 * final CertificateView / PDF export. Renders completely within the parent's
 * 100% x 100% bounding box without overflow or stroke clipping.
 */
export function CanvasShape({
  shapeType,
  width,
  height,
  color,
  strokeColor,
  strokeWidth = 0,
  borderRadius = 0,
  opacity = 1,
}: CanvasShapeProps) {
  const variant = resolveShapeVariant(shapeType);
  const w = Math.max(1, width ?? (variant === "divider" ? 800 : 400));
  const h = Math.max(1, height ?? (variant === "divider" ? 6 : 400));
  const fill = color === "transparent" ? "transparent" : (color || "#000000");
  const rawStroke = Math.max(0, strokeWidth || 0);
  const hasStroke = rawStroke > 0 && Boolean(strokeColor) && strokeColor !== "transparent";
  const sw = hasStroke ? Math.min(rawStroke, Math.min(w, h) / 2) : 0;
  const clampedOpacity = Math.max(0.05, Math.min(1, Number.isFinite(opacity) ? opacity : 1));
  const clampedRadius = Math.max(0, Math.min(Math.min(w, h) / 2, borderRadius || 0));

  if (variant === "triangle") {
    const pad = sw / 2;
    const topX = w / 2;
    const topY = pad;
    const rightX = Math.max(topX + 0.5, w - pad);
    const botY = Math.max(topY + 0.5, h - pad);
    const leftX = Math.min(topX - 0.5, pad);
    const points = `${topX},${topY} ${rightX},${botY} ${leftX},${botY}`;

    return (
      <svg
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="none"
        className="w-full h-full block pointer-events-none select-none"
        style={{ opacity: clampedOpacity }}
        aria-hidden="true"
      >
        <polygon
          points={points}
          fill={fill === "transparent" ? "none" : fill}
          stroke={hasStroke ? strokeColor : "none"}
          strokeWidth={hasStroke ? sw : 0}
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <div
      className="w-full h-full pointer-events-none select-none"
      style={{
        boxSizing: "border-box",
        backgroundColor: fill,
        opacity: clampedOpacity,
        borderRadius:
          variant === "circle"
            ? "50%"
            : clampedRadius > 0
              ? `${clampedRadius}px`
              : undefined,
        border: hasStroke ? `${sw}px solid ${strokeColor}` : undefined,
      }}
    />
  );
}
