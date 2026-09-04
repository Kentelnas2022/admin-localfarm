'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Users, 
  Activity, 
  UserPlus, 
  FileText, 
  Clock, 
  UserCheck,
  TrendingUp,
  BarChart3,
  PieChart as PieChartIcon
} from 'lucide-react';

export interface CategoryItem {
  name: string;
  count: number;
  percentage: number;
  color: string;
}

export interface AnalyticsData {
  kpis: {
    totalFarmers: number;
    totalUsers: number;
    activeToday: number;
    activeFarmers: number;
    newSignups: number;
    totalPosts: number;
    activeStories: number;
    pendingConnections: number;
    pendingReports?: number;
    totalReports?: number;
    totalMessages: number;
    totalComments?: number;
    totalShares?: number;
  };
  userGrowth: {
    points: Array<{ month: number; label: string; count: number; cumulative: number }>;
    totalFarmers: number;
  };
  postCategories?: CategoryItem[];
  reportCategories?: CategoryItem[];
  contentActivity: Array<{
    label: string;
    month: number;
    posts: number;
    comments: number;
    shares: number;
  }>;
}

interface OverviewProps {
  analytics?: AnalyticsData | null;
}

export function AdminDashboardOverview({ analytics }: OverviewProps) {
  const [activeCategoryView, setActiveCategoryView] = useState<'posts' | 'reports'>('posts');
  const [hoveredGrowthIndex, setHoveredGrowthIndex] = useState<number | null>(null);
  const [hoveredActivityIndex, setHoveredActivityIndex] = useState<number | null>(null);
  const [activityFilter, setActivityFilter] = useState<'all' | 'posts' | 'comments' | 'shares'>('all');

  // Dynamic responsive widths to align perfectly with titles
  const growthContainerRef = useRef<HTMLDivElement>(null);
  const activityContainerRef = useRef<HTMLDivElement>(null);
  const [growthWidth, setGrowthWidth] = useState<number>(800);
  const [activityWidth, setActivityWidth] = useState<number>(1000);

  useEffect(() => {
    if (!growthContainerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setGrowthWidth(Math.round(entry.contentRect.width));
        }
      }
    });
    ro.observe(growthContainerRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!activityContainerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setActivityWidth(Math.round(entry.contentRect.width));
        }
      }
    });
    ro.observe(activityContainerRef.current);
    return () => ro.disconnect();
  }, []);

  // Schema-accurate metrics from MySQL
  const totalFarmers = analytics?.kpis?.totalFarmers ?? analytics?.kpis?.totalUsers ?? 0;
  const activeToday = analytics?.kpis?.activeToday ?? 0;
  const newSignups = analytics?.kpis?.newSignups ?? 0;
  const totalPosts = analytics?.kpis?.totalPosts ?? 0;
  const activeStories = analytics?.kpis?.activeStories ?? 0;
  const pendingConnections = analytics?.kpis?.pendingConnections ?? 0;
  const totalComments = analytics?.kpis?.totalComments ?? 0;
  const totalShares = analytics?.kpis?.totalShares ?? 0;

  // --- Dynamic Farmer Growth calculations ---
  const defaultGrowthPoints = [
    { month: 1, label: 'Jan', count: 1, cumulative: 1 },
    { month: 2, label: 'Feb', count: 0, cumulative: 1 },
    { month: 3, label: 'Mar', count: 0, cumulative: 1 },
    { month: 4, label: 'Apr', count: 0, cumulative: 1 },
    { month: 5, label: 'May', count: 0, cumulative: 1 },
    { month: 6, label: 'Jun', count: 0, cumulative: 1 },
    { month: 7, label: 'Jul', count: 0, cumulative: 1 },
    { month: 8, label: 'Aug', count: 0, cumulative: 1 },
    { month: 9, label: 'Sep', count: 4, cumulative: 5 },
    { month: 10, label: 'Oct', count: 0, cumulative: 5 },
    { month: 11, label: 'Nov', count: 0, cumulative: 5 },
    { month: 12, label: 'Dec', count: 0, cumulative: 5 },
  ];

  const rawGrowthPoints = analytics?.userGrowth?.points && analytics.userGrowth.points.length === 12
    ? analytics.userGrowth.points
    : defaultGrowthPoints;

  // Compute scale for Farmer Growth line chart
  const maxGrowthValRaw = Math.max(...rawGrowthPoints.map((p) => p.cumulative), 10);
  const growthScaleCeil = Math.ceil(maxGrowthValRaw / 5) * 5 || 10;

  // Chart alignment with title "Farmer Growth" (starts at 52px inside card)
  const growthLeft = 52;
  const growthRight = Math.max(growthLeft + 300, growthWidth - 24);
  const growthChartTop = 28;
  const growthChartBottom = 220;
  const growthChartHeight = growthChartBottom - growthChartTop; // 192px

  const growthPlotPoints = rawGrowthPoints.map((p, i) => {
    const x = growthLeft + i * ((growthRight - growthLeft) / (rawGrowthPoints.length - 1));
    const y = growthChartBottom - (p.cumulative / growthScaleCeil) * growthChartHeight;
    return { ...p, cx: Math.round(x), cy: Math.round(Math.max(growthChartTop, Math.min(growthChartBottom, y))) };
  });

  // Smooth bezier curve path
  let growthPath = `M ${growthPlotPoints[0].cx} ${growthPlotPoints[0].cy}`;
  for (let i = 0; i < growthPlotPoints.length - 1; i++) {
    const p0 = growthPlotPoints[i];
    const p1 = growthPlotPoints[i + 1];
    const midX = (p0.cx + p1.cx) / 2;
    growthPath += ` C ${midX} ${p0.cy}, ${midX} ${p1.cy}, ${p1.cx} ${p1.cy}`;
  }

  // Area path below curve for gradient fill
  const firstPt = growthPlotPoints[0];
  const lastPt = growthPlotPoints[growthPlotPoints.length - 1];
  const areaPath = `${growthPath} L ${lastPt.cx} ${growthChartBottom} L ${firstPt.cx} ${growthChartBottom} Z`;

  // --- Dynamic Post Categories (from MySQL posts.category) ---
  const defaultPostCategories: CategoryItem[] = [
    { name: 'Field', count: 3, percentage: 50, color: '#237227' },
    { name: 'Wholesaler', count: 1, percentage: 17, color: '#E09F3E' },
    { name: 'Temporary', count: 1, percentage: 17, color: '#5B8FB9' },
    { name: 'General', count: 1, percentage: 16, color: '#9D84B7' },
  ];

  const postCategories = analytics?.postCategories && analytics.postCategories.length > 0
    ? analytics.postCategories
    : defaultPostCategories;

  // Compute SVG Donut segments for Post Categories
  const circumference = 2 * Math.PI * 34; // ~213.628
  let accumulatedPct = 0;
  const donutSegments = postCategories.map((cat) => {
    const dashLength = (cat.percentage / 100) * circumference;
    const offset = -1 * (accumulatedPct / 100) * circumference;
    accumulatedPct += cat.percentage;
    return {
      ...cat,
      dashLength,
      dashGap: Math.max(0, circumference - dashLength),
      offset,
    };
  });

  // --- Dynamic Report Categories (from MySQL reports.reason) ---
  const defaultReportCategories: CategoryItem[] = [
    { name: 'Harrassment', count: 6, percentage: 40, color: '#ea4335' },
    { name: 'Scam / Fraud', count: 3, percentage: 20, color: '#fb8c00' },
    { name: 'Counterfeit Goods', count: 2, percentage: 14, color: '#fbbc04' },
    { name: 'Fake Identity', count: 2, percentage: 13, color: '#8e24aa' },
    { name: 'Other', count: 2, percentage: 13, color: '#546e7a' },
  ];

  const reportCategories = analytics?.reportCategories && analytics.reportCategories.length > 0
    ? analytics.reportCategories
    : defaultReportCategories;

  let repAccumulatedPct = 0;
  const reportSegments = reportCategories.map((cat) => {
    const dashLength = (cat.percentage / 100) * circumference;
    const offset = -1 * (repAccumulatedPct / 100) * circumference;
    repAccumulatedPct += cat.percentage;
    return {
      ...cat,
      dashLength,
      dashGap: Math.max(0, circumference - dashLength),
      offset,
    };
  });

  const totalReportCount = analytics?.kpis?.totalReports ?? 15;

  // --- Dynamic Content Activity calculations (posts, comments, shares for all 12 months) ---
  const defaultActivity = [
    { label: 'Jan', month: 1, posts: 0, comments: 0, shares: 0 },
    { label: 'Feb', month: 2, posts: 0, comments: 0, shares: 0 },
    { label: 'Mar', month: 3, posts: 0, comments: 0, shares: 0 },
    { label: 'Apr', month: 4, posts: 0, comments: 0, shares: 0 },
    { label: 'May', month: 5, posts: 0, comments: 0, shares: 0 },
    { label: 'Jun', month: 6, posts: 0, comments: 0, shares: 0 },
    { label: 'Jul', month: 7, posts: 2, comments: 4, shares: 2 },
    { label: 'Aug', month: 8, posts: 2, comments: 1, shares: 0 },
    { label: 'Sep', month: 9, posts: 2, comments: 0, shares: 0 },
    { label: 'Oct', month: 10, posts: 0, comments: 0, shares: 0 },
    { label: 'Nov', month: 11, posts: 0, comments: 0, shares: 0 },
    { label: 'Dec', month: 12, posts: 0, comments: 0, shares: 0 },
  ];

  const activityData = analytics?.contentActivity && analytics.contentActivity.length > 0
    ? defaultActivity.map(def => {
        const found = analytics.contentActivity.find((a: any) => a.month === def.month);
        return found ? { ...def, ...found } : def;
      })
    : defaultActivity;

  // Max value for bar heights based on filter
  const maxActivityRaw = Math.max(
    ...activityData.flatMap((d) => {
      if (activityFilter === 'posts') return [d.posts];
      if (activityFilter === 'comments') return [d.comments];
      if (activityFilter === 'shares') return [d.shares];
      return [d.posts, d.comments, d.shares];
    }),
    5
  );
  const activityScaleCeil = Math.ceil(maxActivityRaw / 5) * 5 || 10;

  // Chart alignment with title "Content Activity" (starts at 52px inside card)
  const activityLeft = 52;
  const activityRight = Math.max(activityLeft + 300, activityWidth - 24);
  const activityChartTop = 32;
  const activityChartBottom = 265;
  const maxBarHeight = activityChartBottom - activityChartTop; // 233px tall bars!
  const monthSlotWidth = (activityRight - activityLeft) / 12;

  return (
    <div className="space-y-6">
      {/* 1. TOP ROW: 6 KPI METRIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
        
        {/* Total Farmers */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-slate-300/80 transition-all duration-200 flex flex-col justify-between min-h-[155px]">
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-xl bg-[#237227]/15 text-[#237227] flex items-center justify-center">
              <Users className="h-5 w-5" />
            </div>
            <span className="inline-flex items-center text-[11px] font-bold text-[#237227] bg-[#237227]/10 border border-[#237227]/20 px-2 py-0.5 rounded-full">
              ↗ +12%
            </span>
          </div>
          <div className="pt-3">
            <div className="text-[30px] font-extrabold text-black tracking-tight leading-none py-0.5">
              {totalFarmers.toLocaleString()}
            </div>
            <div className="text-xs font-semibold text-slate-700 mt-2">Total Farmers</div>
            <div className="text-[10px] text-slate-400 font-normal mt-0.5">Registered accounts</div>
          </div>
        </div>

        {/* Active Today */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-slate-300/80 transition-all duration-200 flex flex-col justify-between min-h-[155px]">
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <Activity className="h-5 w-5" />
            </div>
            <span className="inline-flex items-center text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-100/80 px-2 py-0.5 rounded-full">
              ↗ +5%
            </span>
          </div>
          <div className="pt-3">
            <div className="text-[30px] font-extrabold text-slate-900 tracking-tight leading-none py-0.5">
              {activeToday.toLocaleString()}
            </div>
            <div className="text-xs font-semibold text-slate-600 mt-2">Active Today</div>
            <div className="text-[10px] text-slate-400 font-normal mt-0.5">Active in last 24h</div>
          </div>
        </div>

        {/* New Signups */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-slate-300/80 transition-all duration-200 flex flex-col justify-between min-h-[155px]">
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
              <UserPlus className="h-5 w-5" />
            </div>
            <span className="inline-flex items-center text-[11px] font-bold text-purple-700 bg-purple-50 border border-purple-100/80 px-2 py-0.5 rounded-full">
              ↗ +18%
            </span>
          </div>
          <div className="pt-3">
            <div className="text-[30px] font-extrabold text-slate-900 tracking-tight leading-none py-0.5">
              {newSignups.toLocaleString()}
            </div>
            <div className="text-xs font-semibold text-slate-600 mt-2">New Signups</div>
            <div className="text-[10px] text-slate-400 font-normal mt-0.5">Joined this week</div>
          </div>
        </div>

        {/* Total Posts */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-slate-300/80 transition-all duration-200 flex flex-col justify-between min-h-[155px]">
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center">
              <FileText className="h-5 w-5" />
            </div>
            <span className="inline-flex items-center text-[11px] font-bold text-teal-700 bg-teal-50 border border-teal-100/80 px-2 py-0.5 rounded-full">
              ↗ +8%
            </span>
          </div>
          <div className="pt-3">
            <div className="text-[30px] font-extrabold text-slate-900 tracking-tight leading-none py-0.5">
              {totalPosts.toLocaleString()}
            </div>
            <div className="text-xs font-semibold text-slate-600 mt-2">Total Posts</div>
            <div className="text-[10px] text-slate-400 font-normal mt-0.5">Community feed</div>
          </div>
        </div>

        {/* Active Stories */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-slate-300/80 transition-all duration-200 flex flex-col justify-between min-h-[155px]">
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
              <Clock className="h-5 w-5" />
            </div>
            <span className="inline-flex items-center text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100/80 px-2 py-0.5 rounded-full">
              ↗ +{activeStories > 0 ? activeStories : 1}
            </span>
          </div>
          <div className="pt-3">
            <div className="text-[30px] font-extrabold text-slate-900 tracking-tight leading-none py-0.5">
              {activeStories.toLocaleString()}
            </div>
            <div className="text-xs font-semibold text-slate-600 mt-2">Active Stories</div>
            <div className="text-[10px] text-slate-400 font-normal mt-0.5">24h disappearing</div>
          </div>
        </div>

        {/* Pending Connections */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-slate-300/80 transition-all duration-200 flex flex-col justify-between min-h-[155px]">
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <UserCheck className="h-5 w-5" />
            </div>
            <span className="inline-flex items-center text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-100/80 px-2 py-0.5 rounded-full">
              ↘ -3
            </span>
          </div>
          <div className="pt-3">
            <div className="text-[30px] font-extrabold text-slate-900 tracking-tight leading-none py-0.5">
              {pendingConnections.toLocaleString()}
            </div>
            <div className="text-xs font-semibold text-slate-600 mt-2">Pending Connections</div>
            <div className="text-[10px] text-slate-400 font-normal mt-0.5">Requests in review</div>
          </div>
        </div>

      </div>

      {/* 2. MIDDLE ROW: FARMER GROWTH & POST CATEGORIES (Fixed height so cards never shift) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        
        {/* Modern Farmer Growth Line Chart */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-6 border border-slate-100 shadow-xs flex flex-col justify-between h-[480px] max-h-[480px] overflow-hidden select-none">
          <div className="flex items-center justify-between mb-2 shrink-0 h-10">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-[#237227]/15 text-[#237227] flex items-center justify-center shrink-0">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 leading-none">Farmer Growth</h3>
                <p className="text-xs text-slate-400 mt-1">Monthly new farmer registrations in 2026</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#237227] bg-[#237227]/10 border border-[#237227]/20 px-3 py-1 rounded-full shadow-2xs">
                <span className="h-1.5 w-1.5 rounded-full bg-[#237227] animate-pulse" />
                +36% YoY
              </span>
            </div>
          </div>

          {/* SVG Line Chart with Gradient Area Fill (Responsive, aligned to title, comfortable height) */}
          <div ref={growthContainerRef} className="w-full h-72 relative my-auto">
            <svg className="w-full h-full" viewBox={`0 0 ${growthWidth} 260`} fill="none">
              <defs>
                {/* #237227 Gradient Fill */}
                <linearGradient id="farmerGrowthGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#237227" stopOpacity="0.32" />
                  <stop offset="60%" stopColor="#237227" stopOpacity="0.08" />
                  <stop offset="100%" stopColor="#237227" stopOpacity="0.0" />
                </linearGradient>

                {/* Glow Filter */}
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#237227" floodOpacity="0.3" />
                </filter>
              </defs>

              {/* Grid Lines (Subtle dashed style, aligned from 52px under title to right edge) */}
              <line x1={growthLeft} y1="28" x2={growthRight} y2="28" stroke="var(--chart-grid)" strokeWidth="1" strokeDasharray="4 4" />
              <line x1={growthLeft} y1="76" x2={growthRight} y2="76" stroke="var(--chart-grid)" strokeWidth="1" strokeDasharray="4 4" />
              <line x1={growthLeft} y1="124" x2={growthRight} y2="124" stroke="var(--chart-grid)" strokeWidth="1" strokeDasharray="4 4" />
              <line x1={growthLeft} y1="172" x2={growthRight} y2="172" stroke="var(--chart-grid)" strokeWidth="1" strokeDasharray="4 4" />
              <line x1={growthLeft} y1="220" x2={growthRight} y2="220" stroke="var(--chart-axis)" strokeWidth="1" />

              {/* Dynamic Y-axis Labels in 44px gutter under icon */}
              <text x="44" y="32" textAnchor="end" fontSize="11" fontWeight="600" fill="var(--chart-text)">{growthScaleCeil}</text>
              <text x="44" y="80" textAnchor="end" fontSize="11" fontWeight="600" fill="var(--chart-text)">{Math.round(growthScaleCeil * 0.75)}</text>
              <text x="44" y="128" textAnchor="end" fontSize="11" fontWeight="600" fill="var(--chart-text)">{Math.round(growthScaleCeil * 0.5)}</text>
              <text x="44" y="176" textAnchor="end" fontSize="11" fontWeight="600" fill="var(--chart-text)">{Math.round(growthScaleCeil * 0.25)}</text>
              <text x="44" y="224" textAnchor="end" fontSize="11" fontWeight="600" fill="var(--chart-text)">0</text>

              {/* Area Gradient Fill */}
              <path d={areaPath} fill="url(#farmerGrowthGradient)" />

              {/* Dynamic Smooth Green Trendline with Drop Shadow */}
              <path
                d={growthPath}
                stroke="#237227"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#glow)"
              />

              {/* Hover Hairline Guide */}
              {hoveredGrowthIndex !== null && growthPlotPoints[hoveredGrowthIndex] && (
                <line
                  x1={growthPlotPoints[hoveredGrowthIndex].cx}
                  y1="28"
                  x2={growthPlotPoints[hoveredGrowthIndex].cx}
                  y2="220"
                  stroke="#237227"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                  opacity="0.6"
                />
              )}

              {/* Data Points */}
              {growthPlotPoints.map((pt, i) => {
                const isHovered = hoveredGrowthIndex === i;
                return (
                  <g 
                    key={i} 
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredGrowthIndex(i)}
                    onMouseLeave={() => setHoveredGrowthIndex(null)}
                  >
                    {/* Outer glow ring on hover */}
                    {isHovered && (
                      <circle
                        cx={pt.cx}
                        cy={pt.cy}
                        r="10"
                        fill="#237227"
                        opacity="0.2"
                      />
                    )}

                    {/* Main Dot */}
                    <circle
                      cx={pt.cx}
                      cy={pt.cy}
                      r={isHovered ? 6 : 4.5}
                      fill="#237227"
                      stroke="#ffffff"
                      strokeWidth="2.5"
                      className="transition-all duration-150"
                    />

                    {/* Month Label */}
                    <text 
                      x={pt.cx} 
                      y="244" 
                      textAnchor="middle" 
                      fontSize="11" 
                      fontWeight={isHovered ? "700" : "500"} 
                      fill={isHovered ? "#237227" : "var(--chart-text)"}
                      className="transition-colors"
                    >
                      {pt.label}
                    </text>

                    {/* Floating SVG Tooltip */}
                    {isHovered && (
                      <g className="pointer-events-none transition-all duration-150">
                        <rect
                          x={Math.max(8, Math.min(growthWidth - 128, pt.cx - 60))}
                          y={Math.max(6, pt.cy - 36)}
                          width="120"
                          height="26"
                          rx="6"
                          fill="#242526"
                          stroke="#393a3b"
                          strokeWidth="1"
                          opacity="0.98"
                        />
                        <text
                          x={Math.max(8, Math.min(growthWidth - 128, pt.cx - 60)) + 60}
                          y={Math.max(6, pt.cy - 36) + 17}
                          textAnchor="middle"
                          fill="#ffffff"
                          fontSize="10.5"
                          fontWeight="600"
                        >
                          {pt.label}: {pt.cumulative} farmers
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Bottom Chart Footer / Active Tooltip Info (Fixed height h-8, never wraps or expands) */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 shrink-0 h-8">
            <div className="flex items-center gap-2 truncate pr-2">
              <span className="h-2 w-2 rounded-full bg-[#237227] shrink-0" />
              <span className="truncate">
                {hoveredGrowthIndex !== null && growthPlotPoints[hoveredGrowthIndex] ? (
                  <strong className="text-slate-800">
                    {growthPlotPoints[hoveredGrowthIndex].label}: {growthPlotPoints[hoveredGrowthIndex].cumulative} cumulative farmers
                  </strong>
                ) : (
                  <span>Hover over points to inspect cumulative farmers</span>
                )}
              </span>
            </div>
            <div className="font-semibold text-slate-600 shrink-0">
              Total Community: <span className="text-[#237227] font-bold">{totalFarmers} Farmers</span>
            </div>
          </div>
        </div>

        {/* Categories Donut Card (Fixed height h-[480px] - NEVER shifts or moves) */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-6 border border-slate-100 shadow-xs flex flex-col justify-between h-[480px] max-h-[480px] overflow-hidden">
          <div className="flex items-center justify-between shrink-0 h-9">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <PieChartIcon className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {activeCategoryView === 'posts' ? 'Post Categories' : 'Report Categories'}
                </h3>
                <p className="text-[11px] text-slate-400">
                  {activeCategoryView === 'posts' ? 'Farm produce & post breakdown' : 'Flagged content distribution'}
                </p>
              </div>
            </div>

            {/* Switcher Pill */}
            <div className="flex items-center bg-slate-100/80 p-0.5 rounded-lg text-[10px] font-semibold">
              <button
                onClick={() => setActiveCategoryView('posts')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  activeCategoryView === 'posts'
                    ? 'bg-white text-slate-900 font-bold shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Posts
              </button>
              <button
                onClick={() => setActiveCategoryView('reports')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  activeCategoryView === 'reports'
                    ? 'bg-white text-slate-900 font-bold shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Reports
              </button>
            </div>
          </div>

          {/* Donut Chart with Center Metric (Larger size & comfortable proportions) */}
          <div className="flex items-center justify-center my-auto shrink-0 py-2">
            <div className="relative h-44 w-44">
              {activeCategoryView === 'posts' ? (
                <>
                  <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                    {/* Background track */}
                    <circle cx="50" cy="50" r="34" fill="transparent" stroke="var(--chart-grid)" strokeWidth="11" />
                    {donutSegments.map((seg, idx) => (
                      <circle
                        key={idx}
                        cx="50"
                        cy="50"
                        r="34"
                        fill="transparent"
                        stroke={seg.color}
                        strokeWidth="11"
                        strokeDasharray={`${seg.dashLength} ${seg.dashGap}`}
                        strokeDashoffset={seg.offset}
                        className="transition-all duration-300"
                      >
                        <title>{`${seg.name}: ${seg.percentage}% (${seg.count} posts)`}</title>
                      </circle>
                    ))}
                  </svg>
                  {/* Center Text inside Donut Hole */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                    <span className="text-3xl font-black text-slate-900 leading-none tracking-tight">
                      {totalPosts}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">
                      Total Posts
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                    <circle cx="50" cy="50" r="34" fill="transparent" stroke="var(--chart-grid)" strokeWidth="11" />
                    {reportSegments.map((seg, idx) => (
                      <circle
                        key={idx}
                        cx="50"
                        cy="50"
                        r="34"
                        fill="transparent"
                        stroke={seg.color}
                        strokeWidth="11"
                        strokeDasharray={`${seg.dashLength} ${seg.dashGap}`}
                        strokeDashoffset={seg.offset}
                        className="transition-all duration-300"
                      >
                        <title>{`${seg.name}: ${seg.percentage}% (${seg.count} reports)`}</title>
                      </circle>
                    ))}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                    <span className="text-3xl font-black text-slate-900 leading-none tracking-tight">
                      {totalReportCount}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">
                      Reports
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Fixed-Height Legend Container (Breathable, comfortable 2-column grid) */}
          <div className="border-t border-slate-100 pt-3.5 shrink-0 flex flex-col justify-center">
            {activeCategoryView === 'posts' ? (
              <div className="grid grid-cols-2 gap-3">
                {postCategories.map((cat, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-slate-50/90 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/60 transition-all hover:bg-slate-100/80 dark:hover:bg-slate-700/60 shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span 
                        className="h-3 w-3 rounded-full shrink-0 ring-2 ring-white dark:ring-slate-700 shadow-xs" 
                        style={{ backgroundColor: cat.color }} 
                      />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate tracking-tight">{cat.name}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span className="text-[11px] font-medium text-slate-400 dark:text-slate-400 font-mono">({cat.count})</span>
                      <span className="text-xs font-black text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900/90 px-2 py-0.5 rounded-lg border border-slate-200/80 dark:border-slate-700 shadow-2xs">
                        {cat.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
                {reportCategories.map((item, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50/90 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/60 shadow-2xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span 
                        className="h-2.5 w-2.5 rounded-full shrink-0 ring-1 ring-white dark:ring-slate-700" 
                        style={{ backgroundColor: item.color }} 
                      />
                      <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <span className="text-[10px] text-slate-400 font-mono">({item.count})</span>
                      <span className="text-[11px] font-bold text-slate-900 dark:text-slate-100">{item.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* 3. BOTTOM ROW: CONTENT ACTIVITY GROUPED BAR CHART */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs flex flex-col justify-between h-[540px] max-h-[540px] overflow-hidden select-none">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0 mb-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#237227]/15 text-[#237227] flex items-center justify-center shrink-0">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-none">Content Activity</h3>
              <p className="text-xs text-slate-400 mt-1">Monthly breakdown of posts, comments, and shares (2026)</p>
            </div>
          </div>

          {/* Interactive Metric Filter Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200/60">
            <button
              onClick={() => setActivityFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                activityFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              All Activity
            </button>
            <button
              onClick={() => setActivityFilter('posts')}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                activityFilter === 'posts'
                  ? 'bg-[#237227] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${activityFilter === 'posts' ? 'bg-white' : 'bg-[#237227]'}`} />
              {totalPosts} Posts
            </button>
            <button
              onClick={() => setActivityFilter('comments')}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                activityFilter === 'comments'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${activityFilter === 'comments' ? 'bg-white' : 'bg-emerald-500'}`} />
              {totalComments} Comments
            </button>
            <button
              onClick={() => setActivityFilter('shares')}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                activityFilter === 'shares'
                  ? 'bg-amber-500 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${activityFilter === 'shares' ? 'bg-white' : 'bg-amber-500'}`} />
              {totalShares} Shares
            </button>
          </div>
        </div>

        {/* Clean, Big, High-Definition Bar Chart Canvas */}
        <div ref={activityContainerRef} className="w-full h-80 relative my-auto">
          <svg className="w-full h-full" viewBox={`0 0 ${activityWidth} 310`} fill="none">
            {/* Grid Lines (Aligned from 52px under title to right edge) */}
            <line x1={activityLeft} y1="32" x2={activityRight} y2="32" stroke="var(--chart-grid)" strokeWidth="1" strokeDasharray="4 4" />
            <line x1={activityLeft} y1="90.25" x2={activityRight} y2="90.25" stroke="var(--chart-grid)" strokeWidth="1" strokeDasharray="4 4" />
            <line x1={activityLeft} y1="148.5" x2={activityRight} y2="148.5" stroke="var(--chart-grid)" strokeWidth="1" strokeDasharray="4 4" />
            <line x1={activityLeft} y1="206.75" x2={activityRight} y2="206.75" stroke="var(--chart-grid)" strokeWidth="1" strokeDasharray="4 4" />
            <line x1={activityLeft} y1="265" x2={activityRight} y2="265" stroke="var(--chart-axis)" strokeWidth="1.5" />

            {/* Dynamic Y-axis Labels in 44px gutter under icon */}
            <text x="44" y="36" textAnchor="end" fontSize="11.5" fontWeight="600" fill="var(--chart-text)">{activityScaleCeil}</text>
            <text x="44" y="94" textAnchor="end" fontSize="11.5" fontWeight="600" fill="var(--chart-text)">{Math.round(activityScaleCeil * 0.75)}</text>
            <text x="44" y="152" textAnchor="end" fontSize="11.5" fontWeight="600" fill="var(--chart-text)">{Math.round(activityScaleCeil * 0.5)}</text>
            <text x="44" y="210" textAnchor="end" fontSize="11.5" fontWeight="600" fill="var(--chart-text)">{Math.round(activityScaleCeil * 0.25)}</text>
            <text x="44" y="269" textAnchor="end" fontSize="11.5" fontWeight="600" fill="var(--chart-text)">0</text>

            {/* Dynamic Month Columns & Big Bars */}
            {activityData.map((d, i) => {
              const slotStartX = activityLeft + i * monthSlotWidth;
              const slotCenterX = slotStartX + monthSlotWidth / 2;
              const isHovered = hoveredActivityIndex === i;

              const slotMargin = Math.max(3, Math.min(8, monthSlotWidth * 0.08));
              const slotBgWidth = Math.max(18, monthSlotWidth - slotMargin * 2);
              const slotBgX = slotStartX + slotMargin;

              // Render Single Big Bar Mode (when filtered) or Grouped 3-Bar Mode
              const isSingleMode = activityFilter !== 'all';
              const singleBarWidth = Math.min(42, Math.max(22, slotBgWidth * 0.6));
              const singleBarX = slotCenterX - singleBarWidth / 2;

              // Grouped mode measurements
              const barWidth = Math.min(22, Math.max(9, (slotBgWidth - 14) / 3));
              const barGap = Math.min(5, Math.max(2, (slotBgWidth - barWidth * 3) / 2));
              const clusterWidth = barWidth * 3 + barGap * 2;
              const clusterStartX = slotCenterX - clusterWidth / 2;

              // Heights mapped to maxBarHeight = 233px
              const hPosts = Math.min(maxBarHeight, Math.max(d.posts > 0 ? 12 : 2, (d.posts / activityScaleCeil) * maxBarHeight));
              const hComments = Math.min(maxBarHeight, Math.max(d.comments > 0 ? 12 : 2, (d.comments / activityScaleCeil) * maxBarHeight));
              const hShares = Math.min(maxBarHeight, Math.max(d.shares > 0 ? 12 : 2, (d.shares / activityScaleCeil) * maxBarHeight));

              const yPosts = activityChartBottom - hPosts;
              const yComments = activityChartBottom - hComments;
              const yShares = activityChartBottom - hShares;

              // Single mode values
              let singleVal = 0;
              let singleH = 2;
              let singleColor = '#237227';
              if (activityFilter === 'posts') {
                singleVal = d.posts;
                singleH = hPosts;
                singleColor = '#237227';
              } else if (activityFilter === 'comments') {
                singleVal = d.comments;
                singleH = hComments;
                singleColor = '#10b981';
              } else if (activityFilter === 'shares') {
                singleVal = d.shares;
                singleH = hShares;
                singleColor = '#f59e0b';
              }
              const singleY = activityChartBottom - singleH;

              return (
                <g 
                  key={d.label}
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredActivityIndex(i)}
                  onMouseLeave={() => setHoveredActivityIndex(null)}
                >
                  {/* Background Column Lane */}
                  <rect
                    x={slotBgX}
                    y="26"
                    width={slotBgWidth}
                    height="242"
                    rx="8"
                    fill={isHovered ? "var(--chart-slot-hover)" : "var(--chart-slot-bg)"}
                    opacity={isHovered ? "0.95" : "0.7"}
                    className="transition-all duration-200"
                  />

                  {/* BARS: SINGLE FILTER MODE OR ALL GROUPED MODE */}
                  {isSingleMode ? (
                    // BIG PROMINENT SINGLE BAR
                    <g>
                      <rect
                        x={singleBarX}
                        y={singleY}
                        width={singleBarWidth}
                        height={singleH}
                        rx="5"
                        fill={singleColor}
                        opacity={isHovered ? 1 : 0.9}
                        className="transition-all duration-200"
                      />
                      {/* Bold Count Badge on top of bar */}
                      {singleVal > 0 && (
                        <text
                          x={slotCenterX}
                          y={singleY - 6}
                          textAnchor="middle"
                          fontSize="11"
                          fontWeight="800"
                          fill={singleColor}
                        >
                          {singleVal}
                        </text>
                      )}
                    </g>
                  ) : (
                    // GROUPED 3-BAR MODE (Wide, bold, rounded caps)
                    <g>
                      {/* Posts Bar (#237227) */}
                      <rect
                        x={clusterStartX}
                        y={yPosts}
                        width={barWidth}
                        height={hPosts}
                        rx="3.5"
                        fill="#237227"
                        opacity={isHovered ? 1 : 0.9}
                        className="transition-all duration-200"
                      />
                      {d.posts > 0 && (
                        <text
                          x={clusterStartX + barWidth / 2}
                          y={yPosts - 4}
                          textAnchor="middle"
                          fontSize="9.5"
                          fontWeight="700"
                          fill="#237227"
                        >
                          {d.posts}
                        </text>
                      )}

                      {/* Comments Bar (#10b981) */}
                      <rect
                        x={clusterStartX + barWidth + barGap}
                        y={yComments}
                        width={barWidth}
                        height={hComments}
                        rx="3.5"
                        fill="#10b981"
                        opacity={isHovered ? 1 : 0.9}
                        className="transition-all duration-200"
                      />
                      {d.comments > 0 && (
                        <text
                          x={clusterStartX + barWidth * 1.5 + barGap}
                          y={yComments - 4}
                          textAnchor="middle"
                          fontSize="9.5"
                          fontWeight="700"
                          fill="#10b981"
                        >
                          {d.comments}
                        </text>
                      )}

                      {/* Shares Bar (#f59e0b) */}
                      <rect
                        x={clusterStartX + (barWidth + barGap) * 2}
                        y={yShares}
                        width={barWidth}
                        height={hShares}
                        rx="3.5"
                        fill="#f59e0b"
                        opacity={isHovered ? 1 : 0.9}
                        className="transition-all duration-200"
                      />
                      {d.shares > 0 && (
                        <text
                          x={clusterStartX + barWidth * 2.5 + barGap * 2}
                          y={yShares - 4}
                          textAnchor="middle"
                          fontSize="9.5"
                          fontWeight="700"
                          fill="#f59e0b"
                        >
                          {d.shares}
                        </text>
                      )}
                    </g>
                  )}

                  {/* Month Label */}
                  <text 
                    x={slotCenterX} 
                    y="288" 
                    textAnchor="middle" 
                    fontSize="11.5" 
                    fontWeight={isHovered ? "700" : "600"} 
                    fill={isHovered ? "var(--chart-axis)" : "var(--chart-text)"}
                    className="transition-colors"
                  >
                    {d.label}
                  </text>

                  {/* High-definition Floating SVG Tooltip */}
                  {isHovered && (
                    <g className="pointer-events-none transition-all duration-150">
                      <rect
                        x={Math.max(8, Math.min(activityWidth - 170, slotCenterX - 85))}
                        y="6"
                        width="170"
                        height="26"
                        rx="6"
                        fill="#242526"
                        stroke="#393a3b"
                        strokeWidth="1"
                        opacity="0.98"
                      />
                      <text
                        x={Math.max(8, Math.min(activityWidth - 170, slotCenterX - 85)) + 85}
                        y="23"
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="10"
                        fontWeight="600"
                      >
                        {d.label}: {d.posts} Posts · {d.comments} Com · {d.shares} Shr
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Modern Interactive Legend with View Click Triggers (Fixed height h-9) */}
        <div className="flex items-center justify-center gap-8 pt-3 border-t border-slate-100 text-xs font-semibold text-slate-600 shrink-0 h-9">
          <button
            onClick={() => setActivityFilter(activityFilter === 'posts' ? 'all' : 'posts')}
            className={`flex items-center gap-2 px-3 py-1 rounded-lg transition-all ${
              activityFilter === 'posts' ? 'bg-[#237227]/10 text-[#237227] font-bold' : 'hover:bg-slate-50'
            }`}
          >
            <span className="h-3 w-3 rounded-sm bg-[#237227] shadow-2xs" />
            <span>Posts ({totalPosts})</span>
          </button>
          <button
            onClick={() => setActivityFilter(activityFilter === 'comments' ? 'all' : 'comments')}
            className={`flex items-center gap-2 px-3 py-1 rounded-lg transition-all ${
              activityFilter === 'comments' ? 'bg-emerald-50 text-emerald-700 font-bold' : 'hover:bg-slate-50'
            }`}
          >
            <span className="h-3 w-3 rounded-sm bg-[#10b981] shadow-2xs" />
            <span>Comments ({totalComments})</span>
          </button>
          <button
            onClick={() => setActivityFilter(activityFilter === 'shares' ? 'all' : 'shares')}
            className={`flex items-center gap-2 px-3 py-1 rounded-lg transition-all ${
              activityFilter === 'shares' ? 'bg-amber-50 text-amber-700 font-bold' : 'hover:bg-slate-50'
            }`}
          >
            <span className="h-3 w-3 rounded-sm bg-[#f59e0b] shadow-2xs" />
            <span>Shares ({totalShares})</span>
          </button>
        </div>
      </div>
    </div>
  );
}
