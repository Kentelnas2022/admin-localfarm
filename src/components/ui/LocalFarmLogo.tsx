'use client';

import React from 'react';

interface LocalFarmLogoProps {
  className?: string;
  height?: number;
}

export function LocalFarmLogoIcon({ className = 'h-7 w-7' }: { className?: string }) {
  return (
    <img
      src="/logo-icon.png"
      alt="Local Farm Icon"
      className={`object-contain ${className}`}
      loading="eager"
    />
  );
}

export function LocalFarmLogo({
  className = 'h-8 sm:h-9 w-auto',
}: LocalFarmLogoProps) {
  return (
    <div className="flex items-center select-none">
      <img
        src="/logo.png"
        alt="LOCAL FARM"
        className={`object-contain ${className}`}
        loading="eager"
      />
    </div>
  );
}
