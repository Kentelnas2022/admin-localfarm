'use client';

import React from 'react';
import { LogIn } from 'lucide-react';
import { LocalFarmLogo } from './ui/LocalFarmLogo';

interface NavbarProps {
  onOpenLogin?: () => void;
}

export function Navbar({ onOpenLogin }: NavbarProps) {
  return (
    <header className="w-full bg-white/90 backdrop-blur-md border-b border-[#eef3ee] shrink-0 z-50 sticky top-0">
      <div className="w-full max-w-[1280px] mx-auto flex items-center justify-between px-5 sm:px-8 lg:px-12 py-3.5">
        <a href="/" className="flex items-center hover:opacity-90 transition-opacity" title="Local Farm Home">
          <LocalFarmLogo className="h-8 sm:h-9 w-auto" />
        </a>

        <div className="flex items-center">
          <button
            type="button"
            onClick={onOpenLogin}
            className="inline-flex items-center gap-1.5 px-5 sm:px-6 py-2.5 rounded-full font-bold text-xs sm:text-sm text-white bg-[#237227] hover:bg-[#1c5c1f] transition-all shadow-xs hover:shadow-sm active:scale-95 cursor-pointer"
          >
            <LogIn className="h-3.5 w-3.5" />
            Log in
          </button>
        </div>
      </div>
    </header>
  );
}
