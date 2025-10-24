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
        <linearGradient id="maskGrad" x1="0" y1="0" x2="64" y2="64">
          <stop offset="0" stopColor="var(--color-mediumgreen)" />
          <stop offset="1" stopColor="var(--color-lightgreen)" />
        </linearGradient>
      </defs>
      <path
        d="M8 22c0-3 2.5-6 7-6 7 0 10.5 4 17 4s10-4 17-4c4.5 0 7 3 7 6 0 17-11 26-24 26S8 39 8 22Z"
        stroke="rgba(255,255,255,0.8)"
        strokeWidth="2"
        fill="url(#maskGrad)"
      />
      <path
        d="M18 30c3 0 5-2 8-2s5 2 8 2 5-2 8-2 5 2 6 4"
        stroke="rgba(0,0,0,0.35)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="25" cy="30" r="3" fill="black" opacity="0.6" />
      <circle cx="39" cy="30" r="3" fill="black" opacity="0.6" />
    </svg>
  );
}
