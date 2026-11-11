'use client';

import React, { useState, useEffect } from 'react';
import './sidebar.css';
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
  adminRole?: string;
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
  adminEmail = 'admin@localfarm.com',
  adminRole = 'super_admin'
}: AdminSidebarProps) {
  const navTree: NavGroupItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutGrid,
    },
    {
      id: 'people_farm',
      label: 'Community',
      icon: UsersRound,
      items: [
        { id: 'users', label: 'Members', icon: Users },
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
      label: 'Commerce',
      icon: Store,
      items: [
        { id: 'marketplace', label: 'Marketplace', icon: ShoppingBag },
        { id: 'prices', label: 'Price Watch', icon: BadgeDollarSign },
        { id: 'stories', label: 'Field Stories', icon: Radio },
      ],
    },
    {
      id: 'safety_alerts',
      label: 'Safety',
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

  // Role-Based Access Control (RBAC) Permitted Tab List
  // Strictly enforce: ONLY super_admin (and system admin) have access to 'users' (Users Directory)
  const rolePermissions: Record<string, string[]> = {
    super_admin: ['dashboard', 'users', 'verification', 'marketplace', 'prices', 'stories', 'announcements', 'reports', 'emergency', 'settings'],
    admin: ['dashboard', 'users', 'verification', 'marketplace', 'prices', 'stories', 'announcements', 'reports', 'emergency', 'settings'],
    inspector: ['dashboard', 'verification', 'prices', 'announcements'],
    moderator: ['dashboard', 'marketplace', 'stories', 'reports', 'announcements'],
    dispatcher: ['dashboard', 'emergency', 'announcements'],
  };

  const cleanRole = adminRole?.toLowerCase() || '';
  const allowedTabs = rolePermissions[cleanRole] || (cleanRole === 'admin' ? rolePermissions.super_admin : ['dashboard']);

  // Filter navTree according to allowed tabs for current admin role
  const filteredNavTree = navTree
    .map(group => {
      if (!group.items) {
        return allowedTabs.includes(group.id) ? group : null;
      }
      const visibleSubItems = group.items.filter(item => allowedTabs.includes(item.id));
      if (visibleSubItems.length === 0) return null;
      return {
        ...group,
        items: visibleSubItems,
      };
    })
    .filter(Boolean) as NavGroupItem[];

  const roleLabel = ({ super_admin: 'Super admin', admin: 'Admin', inspector: 'Inspector', moderator: 'Moderator', dispatcher: 'Dispatcher' } as Record<string, string>)[cleanRole] || 'Operator';

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

  useEffect(() => {
    const parent = getParentGroupId(activeTab);
    if (parent) {
      setOpenGroups(prev => ({
        ...prev,
        [parent]: true,
      }));
    }
  }, [activeTab]);

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
    <aside className={'farm-sidebar sidebar ' + (isCollapsed ? 'is-collapsed' : '')} aria-label="Administration sidebar">
      <div className="sidebar-brand">
        {!isCollapsed && <span className="sidebar-wordmark">LocalFarm</span>}
        <button type="button" className="sidebar-toggle" onClick={onToggleCollapse} aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'} aria-expanded={!isCollapsed} title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}><Menu size={19} strokeWidth={1.6}/></button>
      </div>
      <nav className="sidebar-navigation" aria-label="Admin navigation">
        {filteredNavTree.map(group => {
          const Icon = group.icon;
          if (!group.items?.length) return <button type="button" className={'sidebar-link sidebar-item' + (activeTab === group.id ? ' active' : '')} key={group.id} aria-label={group.label} aria-current={activeTab === group.id ? 'page' : undefined} title={isCollapsed ? group.label : undefined} onClick={() => setActiveTab(group.id)}><Icon size={19} strokeWidth={1.6}/>{!isCollapsed && <span>{group.label}</span>}</button>;
          const isOpen = !!openGroups[group.id];
          const isChildActive = group.items.some(item => item.id === activeTab);
          const count = group.items.reduce((sum, item) => sum + (item.badge || 0), 0);
          return <div className="sidebar-group" key={group.id}>
            <button type="button" className={'sidebar-link sidebar-item sidebar-group-toggle' + (isChildActive ? ' has-active-child' : '')} aria-label={group.label} aria-expanded={isOpen && !isCollapsed} aria-controls={'nav-' + group.id} onClick={() => toggleGroup(group.id)} title={isCollapsed ? group.label : undefined}>
              <Icon size={19} strokeWidth={1.6}/>
              {!isCollapsed && <><span>{group.label}</span>{count > 0 && !isOpen && <small className="sidebar-count">{count}</small>}<ChevronDown size={14} className={isOpen ? 'is-open' : ''}/></>}
            </button>
            <div id={'nav-' + group.id} hidden={!isOpen || isCollapsed} className="sidebar-children">
              {group.items.map(item => {
                const ChildIcon = item.icon;
                return <button type="button" key={item.id} className={'sidebar-link sidebar-item' + (activeTab === item.id ? ' active' : '')} aria-current={activeTab === item.id ? 'page' : undefined} onClick={() => setActiveTab(item.id)}><ChildIcon size={17} strokeWidth={1.6}/><span>{item.label}</span>{!!item.badge && <small className="sidebar-count">{item.badge}</small>}</button>;
              })}
            </div>
          </div>;
        })}
      </nav>
      <div className="sidebar-account">
        <div className="sidebar-profile" title={adminEmail}>
          <div className="sidebar-avatar" aria-hidden="true">{adminEmail.slice(0, 2).toUpperCase()}</div>
          {!isCollapsed && (
            <div className="sidebar-identity">
              <span className="sidebar-role-label">{roleLabel}</span>
              <small className="sidebar-email-label" title={adminEmail}>{adminEmail}</small>
            </div>
          )}
        </div>
        <button type="button" className="sidebar-signout" onClick={onLogout} aria-label="Sign out" title={isCollapsed ? 'Sign out' : undefined}><LogOut size={16} strokeWidth={1.6}/>{!isCollapsed && <span>Sign out</span>}</button>
      </div>
    </aside>
  );
}
