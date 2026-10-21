'use client';

import React from 'react';
import { LocalFarmLogo } from './ui/LocalFarmLogo';

export function Navbar() {
  return (
    <header className="w-full bg-white/95 backdrop-blur-md border-b border-slate-100/90 shrink-0 z-50 transition-all sticky top-0">
      <div className="w-full flex items-center justify-between px-6 sm:px-10 lg:px-14 xl:px-16 py-4">
        {/* Brand Logo */}
        <div className="flex items-center">
          <a
            href="/"
            className="flex items-center hover:opacity-95 transition-opacity"
          >
            <LocalFarmLogo className="h-8 sm:h-9 w-auto" />
          </a>
        </div>
      </div>
    </header>
  );
}
