// src/components/ai/ChatMaskIcon.tsx
"use client";

import React from "react";

export default function ChatMaskIcon({
  className = "w-6 h-6",
}: {
  className?: string;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="batGrad" x1="0" y1="0" x2="64" y2="64">
          <stop offset="0" stopColor="var(--color-mediumgreen)" />
          <stop offset="1" stopColor="var(--color-lightgreen)" />
        </linearGradient>
      </defs>

      {/* Forma geral da máscara com "orelhas" */}
      <path
        d="
          M12 28
          C12 18, 18 10, 22 6
          L26 14
          C30 12, 34 12, 38 14
          L42 6
          C46 10, 52 18, 52 28
          C52 44, 42 54, 32 54
          C22 54, 12 44, 12 28 Z
        "
        fill="url(#batGrad)"
        stroke="rgba(255,255,255,0.85)"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* olhos */}
      <path
        d="M22 32 c3 -3 7 -3 10 0 c-3 1 -7 1 -10 0 Z"
        fill="black"
        opacity="0.7"
      />
      <path
        d="M42 32 c-3 -3 -7 -3 -10 0 c3 1 7 1 10 0 Z"
        fill="black"
        opacity="0.7"
      />

      {/* recorte da área dos olhos (brilho) */}
      <ellipse cx="26" cy="32" rx="3.2" ry="2" fill="white" opacity="0.65" />
      <ellipse cx="38" cy="32" rx="3.2" ry="2" fill="white" opacity="0.65" />

      {/* sombra inferior sutil */}
      <path
        d="M20 46 C26 50, 38 50, 44 46"
        stroke="rgba(0,0,0,0.35)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
