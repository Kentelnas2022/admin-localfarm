'use client';

import { useRef, useState } from 'react';
import { Search, X } from 'lucide-react';

type SearchUser = {
  id: number;
  full_name?: string;
  username?: string;
  email?: string;
  avatar_url?: string;
};

export function UserSearch({ value, onChange, users, onSelect }: {
  value: string;
  onChange: (value: string) => void;
  users: SearchUser[];
  onSelect: (user: SearchUser) => void;
}) {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const expanded = open || Boolean(value);
  const close = () => {
    setOpen(false);
    onChange('');
    triggerRef.current?.focus();
  };

  return (
    <div
      className="relative h-10 w-56 max-w-full shrink-0"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          event.stopPropagation();
          close();
        }
      }}
    >
      <div className={`absolute left-0 top-0 h-10 overflow-hidden rounded-xl border bg-white dark:bg-[#181a18] transition-[width,border-color,box-shadow] duration-300 ease-in-out motion-reduce:transition-none ${expanded ? 'w-full border-emerald-600/40 shadow-sm' : 'w-10 border-slate-200 dark:border-white/10'}`}>
        <button
          ref={triggerRef}
          type="button"
          aria-label="Search users"
          aria-expanded={open}
          aria-controls="user-search-results"
          onClick={() => { setOpen(true); inputRef.current?.focus(); }}
          className="absolute left-0 top-0 z-10 flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:text-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-600"
        >
          <Search className="h-3.5 w-3.5" />
        </button>
        <input
          ref={inputRef}
          aria-label="Search users by name, email, or username"
          tabIndex={expanded ? 0 : -1}
          value={value}
          onFocus={() => setOpen(true)}
          onChange={(event) => { onChange(event.target.value); setOpen(true); }}
          placeholder="Search users..."
          className={`h-full w-full bg-transparent pl-9 pr-9 text-xs text-slate-900 outline-none placeholder:text-slate-400 dark:text-white transition-opacity duration-200 motion-reduce:transition-none ${expanded ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        />
        {expanded && (
          <button type="button" onClick={close} aria-label="Close and clear user search" className="absolute right-0 top-0 flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-600">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <div
        id="user-search-results"
        inert={!open || !value.trim()}
        className={`absolute left-0 top-full z-40 mt-2 w-full origin-top rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-white/10 dark:bg-[#181a18] transition-[opacity,transform,visibility] duration-200 motion-reduce:transition-none ${open && value.trim() ? 'visible translate-y-0 scale-100 opacity-100' : 'invisible -translate-y-1 scale-95 opacity-0'}`}
      >
        <p role="status" className="px-2 py-1.5 text-[11px] text-slate-500 dark:text-slate-400">
          {users.length ? `${users.length} matching ${users.length === 1 ? 'user' : 'users'}` : 'No users found. Try another name or check your filters.'}
        </p>
        <ul className="max-h-64 overflow-y-auto">
          {users.slice(0, 8).map((user) => {
            const name = user.full_name || user.username || user.email || `User #${user.id}`;
            return (
              <li key={user.id}>
                <button type="button" onClick={() => { setOpen(false); onSelect(user); }} className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left hover:bg-emerald-50 focus-visible:bg-emerald-50 focus-visible:outline-none dark:hover:bg-white/5 dark:focus-visible:bg-white/5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-emerald-100 text-xs font-bold text-emerald-800">
                    {user.avatar_url ? <img src={user.avatar_url} alt="" className="h-full w-full object-cover" /> : name.charAt(0).toUpperCase()}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-semibold text-slate-900 dark:text-white">{name}</span>
                    <span className="block truncate text-[11px] text-slate-500 dark:text-slate-400">{user.username ? `@${user.username}` : user.email}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        {users.length > 8 && <p className="px-2 py-1.5 text-[11px] text-slate-500">More matches in the directory below.</p>}
      </div>
    </div>
  );
}
