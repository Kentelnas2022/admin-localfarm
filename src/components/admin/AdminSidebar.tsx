'use client';

import React, { useState, useEffect } from 'react';
import { 
  LayoutGrid, 
  Users, 
  AlertCircle, 
  Megaphone, 
  Settings, 
  LogOut,
  Menu,
  Award,
  ShoppingBag,
  BadgeDollarSign,
  Radio,
  ShieldAlert,
  ChevronDown,
  Store,
  UsersRound
} from 'lucide-react';

interface AdminSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  pendingCount?: number;
  pendingVerificationCount?: number;
  adminEmail?: string;
}

interface NavSubItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
}

interface NavGroupItem {
  id: string;
  label: string;
  icon: React.ElementType;
  items?: NavSubItem[];
}

export function AdminSidebar({ 
  activeTab, 
  setActiveTab, 
  onLogout,
  isCollapsed,
  onToggleCollapse,
  pendingCount = 5,
  pendingVerificationCount = 0,
  adminEmail = 'admin@localfarm.com'
}: AdminSidebarProps) {
  const navTree: NavGroupItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutGrid,
    },
    {
      id: 'people_farm',
      label: 'People & Farm',
      icon: UsersRound,
      items: [
        { id: 'users', label: 'Users Directory', icon: Users },
        { 
          id: 'verification', 
          label: 'Accreditation', 
          icon: Award, 
          badge: pendingVerificationCount > 0 ? pendingVerificationCount : undefined 
        },
      ],
    },
    {
      id: 'market_trade',
      label: 'Market & Trade',
      icon: Store,
      items: [
        { id: 'marketplace', label: 'Marketplace', icon: ShoppingBag },
        { id: 'prices', label: 'Price Watch', icon: BadgeDollarSign },
        { id: 'stories', label: 'Field Stories', icon: Radio },
      ],
    },
    {
      id: 'safety_alerts',
      label: 'Safety & Alerts',
      icon: ShieldAlert,
      items: [
        { id: 'announcements', label: 'Announcements', icon: Megaphone },
        { 
          id: 'reports', 
          label: 'Moderation', 
          icon: AlertCircle, 
          badge: pendingCount > 0 ? pendingCount : undefined 
        },
        { id: 'emergency', label: 'Disaster Alert', icon: ShieldAlert },
      ],
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
    },
  ];

  // Map to find which parent group contains a given tab id
  function getParentGroupId(tabId: string): string | null {
    for (const group of navTree) {
      if (group.items?.some(sub => sub.id === tabId)) {
        return group.id;
      }
    }
    return null;
  }

  // State of open/closed dropdowns (default closed, opens on click)
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  function toggleGroup(groupId: string) {
    if (isCollapsed) {
      onToggleCollapse(); // expand sidebar if user clicks a collapsed group
    }
    setOpenGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  }

  return (
    <aside 
      className={`h-screen sticky top-0 bg-white dark:bg-[#242526] text-slate-800 dark:text-[#e4e6eb] shrink-0 flex flex-col justify-between select-none shadow-xs border-r border-slate-200/80 dark:border-[#393a3b] transition-all duration-300 ease-in-out z-30 overflow-hidden ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Top Header: Hamburger Toggle Button */}
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

        {/* Navigation Menu with Clean Accordion Dropdowns */}
        <nav className="p-3 overflow-y-auto flex-1 space-y-1.5">
          {navTree.map((group) => {
            const GroupIcon = group.icon;
            const hasSubItems = Boolean(group.items && group.items.length > 0);

            // Standalone Direct Link (Dashboard, Settings)
            if (!hasSubItems) {
              const isActive = activeTab === group.id;
              return (
                <button
                  key={group.id}
                  onClick={() => setActiveTab(group.id)}
                  className={`group relative flex items-center w-full h-10 px-3 rounded-xl transition-all duration-200 cursor-pointer overflow-hidden ${
                    isActive
                      ? 'bg-[#237227] text-white font-bold shadow-xs'
                      : 'text-slate-600 dark:text-[#b0b3b8] hover:bg-slate-100 dark:hover:bg-[#3a3b3c] hover:text-slate-900 dark:hover:text-[#e4e6eb] font-medium'
                  }`}
                  title={isCollapsed ? group.label : undefined}
                >
                  <div className="w-5 h-5 flex items-center justify-center shrink-0">
                    <GroupIcon className={`h-4.5 w-4.5 transition-colors ${isActive ? 'text-white' : 'text-slate-500 dark:text-[#b0b3b8] group-hover:text-slate-900 dark:group-hover:text-[#e4e6eb]'}`} />
                  </div>
                  
                  <span className={`text-xs text-left truncate whitespace-nowrap transition-all duration-300 ease-in-out ${
                    isCollapsed 
                      ? 'opacity-0 max-w-0 -translate-x-2 ml-0 pointer-events-none' 
                      : 'opacity-100 max-w-[140px] translate-x-0 ml-3 flex-1'
                  }`}>
                    {group.label}
                  </span>

                  {isCollapsed && (
                    <div className="absolute left-full ml-3 px-2.5 py-1 bg-[#18191a] text-[#e4e6eb] border border-[#393a3b] text-xs rounded-md shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                      {group.label}
                    </div>
                  )}
                </button>
              );
            }

            // Accordion Dropdown Group
            const isOpen = Boolean(openGroups[group.id]);
            const isChildActive = Boolean(group.items?.some(sub => sub.id === activeTab));
            
            // Total rollup badge count across child items when collapsed
            const totalRollupBadge = group.items?.reduce((sum, item) => sum + (item.badge || 0), 0) || 0;

            return (
              <div key={group.id} className="space-y-1">
                {/* Parent Dropdown Button */}
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  className={`group relative flex items-center w-full h-10 px-3 rounded-xl transition-all duration-200 cursor-pointer overflow-hidden ${
                    isChildActive && !isOpen
                      ? 'bg-[#237227]/10 dark:bg-[#237227]/20 text-[#237227] dark:text-emerald-400 font-bold border border-[#237227]/20'
                      : 'text-slate-700 dark:text-[#e4e6eb] hover:bg-slate-100/80 dark:hover:bg-[#3a3b3c] font-semibold'
                  }`}
                  title={isCollapsed ? group.label : undefined}
                >
                  {/* Group Icon */}
                  <div className="w-5 h-5 flex items-center justify-center shrink-0">
                    <GroupIcon className={`h-4.5 w-4.5 transition-colors ${
                      isChildActive && !isOpen 
                        ? 'text-[#237227] dark:text-emerald-400' 
                        : 'text-slate-500 dark:text-[#b0b3b8] group-hover:text-slate-900 dark:group-hover:text-white'
                    }`} />
                  </div>

                  {/* Group Label */}
                  <span className={`text-xs text-left truncate whitespace-nowrap transition-all duration-300 ease-in-out ${
                    isCollapsed 
                      ? 'opacity-0 max-w-0 -translate-x-2 ml-0 pointer-events-none' 
                      : 'opacity-100 max-w-[130px] translate-x-0 ml-3 flex-1'
                  }`}>
                    {group.label}
                  </span>

                  {/* Rollup badge when group is collapsed or parent is closed */}
                  {totalRollupBadge > 0 && (!isOpen || isCollapsed) && (
                    <span className="rounded-full text-[10px] font-bold px-1.5 py-0.5 bg-amber-500 text-white shrink-0 ml-auto shadow-2xs">
                      {totalRollupBadge}
                    </span>
                  )}

                  {/* Rotating Chevron */}
                  {!isCollapsed && (
                    <ChevronDown className={`h-3.5 w-3.5 text-slate-400 dark:text-[#8a8d91] transition-transform duration-200 shrink-0 ml-1.5 ${
                      isOpen ? 'rotate-180 text-slate-700 dark:text-white' : 'rotate-0'
                    }`} />
                  )}

                  {/* Tooltip on Collapsed Mode */}
                  {isCollapsed && (
                    <div className="absolute left-full ml-3 px-2.5 py-1 bg-[#18191a] text-[#e4e6eb] border border-[#393a3b] text-xs rounded-md shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                      {group.label} ({group.items?.length || 0})
                    </div>
                  )}
                </button>

                {/* Sub-Items Container with smooth expand/collapse */}
                {isOpen && !isCollapsed && (
                  <div className="border-l border-slate-200/80 dark:border-[#393a3b] ml-5 pl-2 space-y-1 animate-in fade-in slide-in-from-top-1 duration-150">
                    {group.items?.map((subItem) => {
                      const SubIcon = subItem.icon;
                      const isSubActive = activeTab === subItem.id;
                      return (
                        <button
                          key={subItem.id}
                          type="button"
                          onClick={() => setActiveTab(subItem.id)}
                          className={`group relative flex items-center w-full h-9 px-2.5 rounded-lg text-xs transition-all duration-150 cursor-pointer ${
                            isSubActive
                              ? 'bg-[#237227] text-white font-bold shadow-2xs'
                              : 'text-slate-600 dark:text-[#b0b3b8] hover:bg-slate-100 dark:hover:bg-[#3a3b3c] hover:text-slate-900 dark:hover:text-[#e4e6eb] font-medium'
                          }`}
                        >
                          <div className="w-4 h-4 flex items-center justify-center shrink-0">
                            <SubIcon className={`h-3.5 w-3.5 transition-colors ${
                              isSubActive ? 'text-white' : 'text-slate-400 dark:text-[#8a8d91] group-hover:text-slate-800 dark:group-hover:text-white'
                            }`} />
                          </div>
                          
                          <span className="truncate whitespace-nowrap ml-2.5 flex-1 text-left">
                            {subItem.label}
                          </span>

                          {subItem.badge && (
                            <span className={`rounded-full text-[10px] font-bold px-1.5 py-0.2 shrink-0 ml-auto ${
                              isSubActive 
                                ? 'bg-white/25 text-white' 
                                : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                            }`}>
                              {subItem.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Bottom Area: Administrator Section and Logout Button with extra bottom padding to prevent overlap with Next.js dev overlay */}
      <div className="p-3 pb-12 border-t border-slate-100 dark:border-[#393a3b] space-y-2.5 bg-slate-50/50 dark:bg-[#18191a]/80 shrink-0 overflow-hidden">
        
        {/* Administrator Profile Card */}
        <div 
          className={`flex items-center transition-all duration-300 ease-in-out overflow-hidden ${
            isCollapsed 
              ? 'justify-center p-1 rounded-xl' 
              : 'bg-white dark:bg-[#242526] border border-slate-200/70 dark:border-[#393a3b] rounded-2xl p-2.5 shadow-2xs'
          }`}
          title={isCollapsed ? `Administrator (${adminEmail})` : undefined}
        >
          <div className="relative shrink-0 flex items-center justify-center">
            <div className="h-9 w-9 rounded-full bg-[#237227]/15 text-[#237227] dark:text-[#31a24c] font-extrabold flex items-center justify-center text-xs">
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

        {/* Sign Out Button: Elevated above bottom to prevent overlap with dev badges */}
        <button
          onClick={onLogout}
          className={`group relative flex items-center w-full rounded-xl bg-slate-100 dark:bg-[#3a3b3c] hover:bg-rose-600 dark:hover:bg-[#f02849] active:bg-rose-700 text-slate-700 dark:text-[#e4e6eb] hover:text-white dark:hover:text-white border border-slate-200/90 dark:border-[#393a3b] hover:border-rose-600 dark:hover:border-[#f02849] font-semibold text-xs shadow-2xs hover:shadow-sm transition-all duration-200 cursor-pointer overflow-hidden ${
            isCollapsed ? 'h-9 justify-center' : 'h-9 px-3 gap-2.5 justify-center'
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
