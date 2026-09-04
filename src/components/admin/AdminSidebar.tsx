'use client';

import React from 'react';
import { 
  LayoutGrid, 
  Users, 
  AlertCircle, 
  Megaphone, 
  Settings, 
  LogOut,
  Menu
} from 'lucide-react';

interface AdminSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  pendingCount?: number;
  adminEmail?: string;
}

export function AdminSidebar({ 
  activeTab, 
  setActiveTab, 
  onLogout,
  isCollapsed,
  onToggleCollapse,
  pendingCount = 5,
  adminEmail = 'admin@localfarm.com'
}: AdminSidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'reports', label: 'Moderation', icon: AlertCircle, badge: pendingCount > 0 ? pendingCount : undefined },
    { id: 'announcements', label: 'Announcements', icon: Megaphone },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside 
      className={`h-screen sticky top-0 bg-white dark:bg-[#242526] text-slate-800 dark:text-[#e4e6eb] shrink-0 flex flex-col justify-between select-none shadow-xs border-r border-slate-200/80 dark:border-[#393a3b] transition-all duration-300 ease-in-out z-30 overflow-hidden ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Top Header: Hamburger Toggle Button (Animated burger rotation & smooth Menu label) */}
        <div className="h-16 flex items-center border-b border-slate-100 dark:border-[#393a3b] px-4 shrink-0 overflow-hidden">
          <button
            onClick={onToggleCollapse}
            className="h-10 w-10 rounded-xl border border-slate-200 dark:border-[#393a3b] bg-white dark:bg-[#3a3b3c] hover:bg-slate-50 dark:hover:bg-[#4e4f50] active:scale-95 text-slate-700 dark:text-[#e4e6eb] flex items-center justify-center transition-all duration-200 shadow-2xs cursor-pointer shrink-0"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <Menu className={`h-5 w-5 text-slate-700 dark:text-[#e4e6eb] transition-transform duration-300 ease-in-out ${isCollapsed ? 'rotate-90 text-[#237227] dark:text-[#31a24c]' : 'rotate-0'}`} />
          </button>
          
          <div className={`overflow-hidden transition-all duration-300 ease-in-out ml-auto flex items-center ${
            isCollapsed ? 'opacity-0 max-w-0 pointer-events-none translate-x-2' : 'opacity-100 max-w-20 translate-x-0'
          }`}>
            <span className="text-[11px] font-bold text-slate-400 dark:text-[#8a8d91] tracking-wider uppercase whitespace-nowrap">Menu</span>
          </div>
        </div>

        {/* Navigation Menu (Smooth width, opacity, and transform transitions without unmounting) */}
        <nav className="p-3 space-y-1.5 overflow-y-auto flex-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`group relative flex items-center w-full h-11 px-3 rounded-xl transition-colors duration-200 cursor-pointer overflow-hidden ${
                  isActive
                    ? 'bg-[#237227] text-white font-bold shadow-xs'
                    : 'text-slate-600 dark:text-[#b0b3b8] hover:bg-slate-100 dark:hover:bg-[#3a3b3c] hover:text-slate-900 dark:hover:text-[#e4e6eb] font-medium'
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                {/* Fixed Icon track: keeps icon stable and centered */}
                <div className="w-5 h-5 flex items-center justify-center shrink-0">
                  <Icon className={`h-4.5 w-4.5 transition-colors ${isActive ? 'text-white' : 'text-slate-500 dark:text-[#b0b3b8] group-hover:text-slate-900 dark:group-hover:text-[#e4e6eb]'}`} />
                </div>
                
                {/* Label text: smoothly slides and fades */}
                <span className={`text-xs text-left truncate whitespace-nowrap transition-all duration-300 ease-in-out ${
                  isCollapsed 
                    ? 'opacity-0 max-w-0 -translate-x-2 ml-0 pointer-events-none' 
                    : 'opacity-100 max-w-[140px] translate-x-0 ml-3 flex-1'
                }`}>
                  {item.label}
                </span>

                {/* Badge indicator */}
                {item.badge && (
                  <span className={`rounded-full text-[10px] font-bold px-1.5 py-0.5 transition-all duration-300 ease-in-out shrink-0 ${
                    isCollapsed 
                      ? 'absolute top-1 right-2 bg-amber-500 text-white shadow-xs scale-90'
                      : isActive 
                        ? 'bg-white/25 text-white scale-100 ml-auto' 
                        : 'bg-amber-100 dark:bg-[#3a3b3c] text-amber-800 dark:text-[#f7b125] group-hover:bg-slate-200 dark:group-hover:bg-[#4e4f50] group-hover:text-slate-900 dark:group-hover:text-[#e4e6eb] scale-100 ml-auto'
                  }`}>
                    {item.badge}
                  </span>
                )}

                {/* Tooltip on Collapsed Mode */}
                {isCollapsed && (
                  <div className="absolute left-full ml-3 px-2.5 py-1 bg-[#18191a] text-[#e4e6eb] border border-[#393a3b] text-xs rounded-md shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                    {item.label}
                  </div>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Area: Administrator Section and Logout Button */}
      <div className="p-3.5 pb-5 border-t border-slate-100 dark:border-[#393a3b] space-y-3 bg-slate-50/40 dark:bg-[#18191a]/80 shrink-0 overflow-hidden">
        
        {/* Administrator Profile (Clean circular avatar without bulky box when collapsed, comfortable card when expanded) */}
        <div 
          className={`flex items-center transition-all duration-300 ease-in-out overflow-hidden ${
            isCollapsed 
              ? 'justify-center p-1 rounded-xl' 
              : 'bg-white dark:bg-[#242526] border border-slate-200/70 dark:border-[#393a3b] rounded-2xl p-2.5 shadow-2xs'
          }`}
          title={isCollapsed ? `Administrator (${adminEmail})` : undefined}
        >
          <div className="relative shrink-0 flex items-center justify-center">
            <div className="h-10 w-10 rounded-full bg-[#237227]/15 text-[#237227] dark:text-[#31a24c] font-extrabold flex items-center justify-center text-xs">
              AD
            </div>
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-[#237227] ring-2 ring-white dark:ring-[#242526]" />
          </div>
          
          <div className={`min-w-0 transition-all duration-300 ease-in-out ${
            isCollapsed 
              ? 'opacity-0 max-w-0 -translate-x-2 pointer-events-none' 
              : 'opacity-100 max-w-[140px] translate-x-0 ml-3 flex-1'
          }`}>
            <div className="text-xs font-bold text-slate-800 dark:text-[#e4e6eb] truncate">Administrator</div>
            <div className="text-[10px] text-slate-400 dark:text-[#b0b3b8] truncate">{adminEmail}</div>
          </div>
        </div>

        {/* Sign Out Button: Gray by default, Red on hover */}
        <button
          onClick={onLogout}
          className={`group relative flex items-center w-full rounded-xl bg-slate-100 dark:bg-[#3a3b3c] hover:bg-red-600 dark:hover:bg-[#f02849] active:bg-red-700 text-slate-700 dark:text-[#e4e6eb] hover:text-white dark:hover:text-white border border-slate-200/90 dark:border-[#393a3b] hover:border-red-600 dark:hover:border-[#f02849] font-semibold text-xs shadow-2xs hover:shadow-sm transition-all duration-200 cursor-pointer overflow-hidden ${
            isCollapsed ? 'h-10 justify-center' : 'h-10 px-3.5 gap-2.5 justify-center'
          }`}
          title={isCollapsed ? "Sign out" : undefined}
        >
          <LogOut className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:-translate-x-0.5" />
          <span className={`whitespace-nowrap transition-all duration-300 ease-in-out ${
            isCollapsed ? 'opacity-0 max-w-0 pointer-events-none' : 'opacity-100 max-w-[140px]'
          }`}>
            Sign out
          </span>
          {isCollapsed && (
            <div className="absolute left-full ml-3 px-2.5 py-1 bg-[#18191a] text-[#e4e6eb] border border-[#393a3b] text-xs rounded-md shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
              Sign out
            </div>
          )}
        </button>
      </div>
    </aside>
  );
}
