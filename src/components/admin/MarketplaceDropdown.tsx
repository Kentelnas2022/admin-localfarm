'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Check, ChevronDown } from 'lucide-react';

type Option = { value: string; label: string };

export function MarketplaceDropdown({ label, value, options, onChange }: {
  label: string; value: string; options: Option[]; onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const id = useId();
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    root.current?.querySelector<HTMLElement>('[aria-selected="true"]')?.focus();
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [open]);

  return (
    <div ref={root} className="market-dropdown" onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget as Node)) setOpen(false);
    }} onKeyDown={(event) => {
      if (event.key === 'Escape') { event.preventDefault(); setOpen(false); trigger.current?.focus(); }
      if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
        event.preventDefault();
        if (!open) { setOpen(true); return; }
        const items = Array.from(root.current?.querySelectorAll<HTMLButtonElement>('[role="option"]') || []);
        const current = items.indexOf(document.activeElement as HTMLButtonElement);
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : (current + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
        items[next]?.focus();
      }
    }}>
      <button ref={trigger} type="button" className="market-dropdown-trigger" aria-label={label} aria-haspopup="listbox" aria-expanded={open} aria-controls={open ? id : undefined} onClick={() => setOpen(!open)}>
        <span>{options.find(option => option.value === value)?.label}</span>
        <ChevronDown size={15} className={open ? 'is-open' : ''} />
      </button>
      <AnimatePresence>
        {open && <motion.div id={id} role="listbox" aria-label={label} className="market-dropdown-menu"
          initial={{ opacity: 0, y: reducedMotion ? 0 : 6, scale: reducedMotion ? 1 : .98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: reducedMotion ? 0 : 4, scale: reducedMotion ? 1 : .98 }}
          transition={{ duration: reducedMotion ? 0 : .16, ease: [.16, 1, .3, 1] }}>
          {options.map(option => <button key={option.value} type="button" role="option" aria-selected={option.value === value} tabIndex={-1} onClick={() => {
            setOpen(false); trigger.current?.focus(); onChange(option.value);
          }}><span>{option.label}</span>{option.value === value && <Check size={14}/>}</button>)}
        </motion.div>}
      </AnimatePresence>
    </div>
  );
}
