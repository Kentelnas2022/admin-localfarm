'use client';

import React from 'react';

export function Navbar() {
  return (
    <header className="w-full bg-[#F7F7F2] shrink-0 z-50">
      <div className="w-full max-w-[1240px] mx-auto flex items-center justify-between px-6 sm:px-10 lg:px-14 pt-8 pb-4">
        {/* Left: Pure Brand Text */}
        <a
          href="/"
          className="font-clash text-2xl sm:text-[28px] font-medium tracking-tight text-[#303B34] lowercase hover:opacity-85 transition-opacity select-none cursor-pointer"
          title="Local Farm Home"
        >
          localfarm
        </a>

        {/* Right: Uppercase Motto matching Framer reference exactly */}
        <span
          className="text-[11px] sm:text-xs font-semibold tracking-[0.2em] text-[#667B6B] uppercase select-none text-right"
        >
          GROW. SHARE. CONNECT.
        </span>
      </div>
    </header>
  );
}
