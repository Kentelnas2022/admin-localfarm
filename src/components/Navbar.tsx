'use client';

import React, { useState } from 'react';
import { User, Menu, X } from 'lucide-react';
import { LocalFarmLogo } from './ui/LocalFarmLogo';

interface NavbarProps {
  onLoginClick?: () => void;
}

export function Navbar({ onLoginClick }: NavbarProps) {
  const [activeNav, setActiveNav] = useState('Home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Home', href: '#home' },
    { name: 'About', href: '#about' },
    { name: 'Features', href: '#features' },
    { name: 'Blog', href: '#blog' },
    { name: 'Contact', href: '#contact' },
  ];

  return (
    <header className="w-full bg-white border-b border-slate-100 shrink-0 z-50">
      <div className="w-full flex items-center justify-between px-6 sm:px-10 lg:px-14 xl:px-16 py-4 relative">
        {/* Far Left Corner: Brand Logo */}
        <div className="flex items-center">
          <a href="#home" className="flex items-center hover:opacity-90 transition-opacity">
            <LocalFarmLogo />
          </a>
        </div>

        {/* Exact Center: Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 lg:gap-10 absolute left-1/2 -translate-x-1/2">
          {navLinks.map((link) => {
            const isActive = activeNav === link.name;
            return (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setActiveNav(link.name)}
                className="relative text-[15px] font-medium transition-colors group flex flex-col items-center"
              >
                <span
                  className={
                    isActive
                      ? 'text-slate-900 font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }
                >
                  {link.name}
                </span>
                {isActive && (
                  <span className="mt-1 h-[2.5px] w-6 rounded-full bg-[#439639]" />
                )}
              </a>
            );
          })}
        </nav>

        {/* Far Right Corner: Login Button */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onLoginClick}
            className="flex items-center gap-2 rounded-lg bg-[#439639] hover:bg-[#38852e] px-5 py-2 text-sm font-semibold text-white shadow-sm transition-all active:scale-95"
          >
            <User className="h-4 w-4 text-white" />
            <span>Login</span>
          </button>

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 text-slate-700 hover:text-slate-900"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-6 py-4 space-y-3">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              onClick={() => {
                setActiveNav(link.name);
                setMobileMenuOpen(false);
              }}
              className={`block text-sm font-medium ${
                activeNav === link.name ? 'text-[#439639] font-bold' : 'text-slate-600'
              }`}
            >
              {link.name}
            </a>
          ))}
        </div>
      )}
    </header>
  );
}
