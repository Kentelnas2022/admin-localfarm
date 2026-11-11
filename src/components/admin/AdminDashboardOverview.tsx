'use client';
import React, { useEffect, useId, useRef, useState } from 'react';
import { ArrowUpRight, Users, Sprout, Activity, UserPlus, FileText, MessageCircle, Share2, BookOpen, RefreshCw } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import './dashboard.css';
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
  adminRole?: string;
  adminUser?: any;
  onNavigateTab?: (tab: string) => void;
}


function AnimatedNumber({ value, duration = 650 }: { value?: number; duration?: number }) {
  const [display, setDisplay] = useState(value ?? 0);
  const previous = useRef(value ?? 0);
  useEffect(() => {
    if (value === undefined) return;
    const from = previous.current;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { previous.current = value; setDisplay(value); return; }
    let frame = 0;
    const start = performance.now();
    const update = (time: number) => {
      const progress = Math.min(1, (time - start) / duration);
      previous.current = from + (value - from) * (1 - Math.pow(1 - progress, 3));
      setDisplay(Math.round(previous.current));
      if (progress < 1) frame = requestAnimationFrame(update);
    };
    frame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);
  return <>{value === undefined ? '—' : display.toLocaleString()}</>;
}

export function AdminDashboardOverview({ analytics, adminRole, onNavigateTab }: OverviewProps) {
  const [view, setView] = useState<'posts' | 'comments' | 'shares'>('posts');
  const [categoryView, setCategoryView] = useState<'posts' | 'reports'>('posts');
  const [growthMode, setGrowthMode] = useState<'cumulative' | 'monthly'>('cumulative');
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [hoveredCategoryIndex, setHoveredCategoryIndex] = useState<number | null>(null);
  const [selectedActivityMonth, setSelectedActivityMonth] = useState<number | null>(null);
  const gradientId = useId();
  const chartRef = useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = useState(1000);

  useEffect(() => {
    const element = chartRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setChartWidth(Math.max(240, entry.contentRect.width)));
    observer.observe(element);
    return () => observer.disconnect();
  }, [analytics]);

  const chartHeight = chartWidth < 600 ? 280 : 370;
  const chartBottom = chartHeight - 36;
  const chartTop = 24;
  const chartRight = chartWidth - 20;
  const metricIcons = [Users, Sprout, Activity, UserPlus, FileText, MessageCircle, Share2, BookOpen];
  const { theme } = useTheme();
  const categoryColors = theme === 'dark'
    ? ['#2D5A46', '#3C7057', '#86A994', '#A8C5B3', '#567A66']
    : ['#315d46', '#7ba78b', '#b4cbb7', '#c8ad7f', '#78999b'];
  const k = analytics?.kpis;
  const num = (n?: number) => n === undefined ? '—' : n.toLocaleString();

  // 1. Community Growth line points dynamically calculated based on growthMode (cumulative or monthly)
  const growth = analytics?.userGrowth?.points ?? [];
  const getGrowthVal = (p: { count: number; cumulative: number }) => growthMode === 'cumulative' ? p.cumulative : p.count;
  const max = Math.max(1, ...growth.map(p => getGrowthVal(p)));
  const x = (i: number) => 46 + i * (chartRight - 46) / Math.max(1, growth.length - 1);
  const y = (n: number) => chartBottom - n / max * (chartBottom - chartTop);
  const points = growth.map((p, i) => `${x(i)},${y(getGrowthVal(p))}`).join(' ');

  // 2. Activity chart data
  const activity = analytics?.contentActivity ?? [];
  const maxActivity = Math.max(1, ...activity.map(p => p[view]));

  // 3. Category distribution data
  const categories = (categoryView === 'posts' ? analytics?.postCategories : analytics?.reportCategories) ?? [];
  const total = categories.reduce((n, c) => n + c.count, 0);
  const role = adminRole?.toLowerCase() ?? '';
  const canUsers = ['admin','super_admin'].includes(role);
  const canReports = ['admin','super_admin','moderator'].includes(role);

  const handleMetricClick = (label: string) => {
    switch (label) {
      case 'Community members':
      case 'New signups':
      case 'Active today':
        if (canUsers) onNavigateTab?.('users');
        break;
      case 'Farmers':
        onNavigateTab?.('verification');
        break;
      case 'Total posts':
        onNavigateTab?.('marketplace');
        break;
      case 'Comments':
        setView('comments');
        setSelectedActivityMonth(null);
        document.getElementById('monthly-activity')?.scrollIntoView({ behavior: 'smooth' });
        break;
      case 'Shares':
        setView('shares');
        setSelectedActivityMonth(null);
        document.getElementById('monthly-activity')?.scrollIntoView({ behavior: 'smooth' });
        break;
      case 'Active stories':
        onNavigateTab?.('stories');
        break;
      default:
        break;
    }
  };

  const metrics = [
    ['Community members', k?.totalUsers, 'Registered accounts'],
    ['Farmers', k?.totalFarmers, 'Across the community'],
    ['Active today', k?.activeToday, 'Members seen today'],
    ['New signups', k?.newSignups, 'Last 7 days'],
    ['Total posts', k?.totalPosts, 'Community contributions'],
    ['Comments', k?.totalComments, 'Conversations started'],
    ['Shares', k?.totalShares, 'Knowledge shared'],
    ['Active stories', k?.activeStories, 'Stories available now'],
  ] as const;

  const selected = selectedMonth === null ? undefined : growth[selectedMonth];
  const activeCategory = hoveredCategoryIndex !== null && categories[hoveredCategoryIndex]
    ? categories[hoveredCategoryIndex]
    : (categories.length > 0 ? categories[0] : null);

  return (
    <div className="farm-overview reference-analytics">
      <section className="metric-grid" aria-label="Community statistics">
        {metrics.map(([label, value, detail], i) => (
          <article 
            className="metric-card metric-card-interactive" 
            key={label} 
            style={{ animationDelay: `${i * 45}ms` }}
            role="button"
            tabIndex={0}
            onClick={() => handleMetricClick(label)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleMetricClick(label);
              }
            }}
            title={`Click to view ${label.toLowerCase()} details`}
          >
            <div className="metric-top">
              <span>{label}</span>
              <span className="premium-metric-icon">
                {React.createElement(metricIcons[i], { size: 18, strokeWidth: 1.7 })}
              </span>
            </div>
            <p className={'metric-number' + (i === 3 ? ' metric-positive' : '')}>
              <AnimatedNumber value={value} />
            </p>
            <div className="metric-bottom-row">
              <p className="metric-detail">{detail}</p>
              <span className="metric-action-hint">View <ArrowUpRight size={12} /></span>
            </div>
          </article>
        ))}
      </section>

      <div className="overview-grid">
        {/* 1. COMMUNITY GROWTH PANEL */}
        <section className="dashboard-panel growth-panel">
          <div className="panel-heading">
            <div>
              <h3>Community growth</h3>
              <p className="chart-description">Track your community growth over time from MySQL.</p>
            </div>
            <div className="segmented-control" aria-label="Growth scale toggle">
              <button 
                type="button"
                aria-pressed={growthMode === 'cumulative'} 
                onClick={() => setGrowthMode('cumulative')}
              >
                Cumulative
              </button>
              <button 
                type="button"
                aria-pressed={growthMode === 'monthly'} 
                onClick={() => setGrowthMode('monthly')}
              >
                New Monthly
              </button>
            </div>
          </div>
          <div className="chart-summary">
            <strong>
              <AnimatedNumber 
                duration={420} 
                value={
                  selected 
                    ? getGrowthVal(selected)
                    : (growth.length ? getGrowthVal(growth[growth.length - 1]) : undefined)
                } 
              />
            </strong>
            <span>
              {selected 
                ? `${selected.label} · ${selected.count} new signups (${selected.cumulative} cumulative)` 
                : (growthMode === 'cumulative' ? 'total community members registered' : 'monthly registrations this year')}
            </span>
          </div>

          {growth.length ? (
            <div className="growth-chart" ref={chartRef} onMouseLeave={() => setSelectedMonth(null)}>
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{ height: chartHeight }} role="img" aria-label="Cumulative registrations by month">
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--analytics-green)" stopOpacity=".26" />
                    <stop offset="100%" stopColor="var(--analytics-green)" stopOpacity=".015" />
                  </linearGradient>
                </defs>
                {[0, 1, 2, 3, 4].map(i => (
                  <g key={i}>
                    <line 
                      x1="46" 
                      x2={chartRight} 
                      y1={chartTop + i * (chartBottom - chartTop) / 4} 
                      y2={chartTop + i * (chartBottom - chartTop) / 4} 
                      className="chart-rule" 
                    />
                    <text 
                      x="30" 
                      y={chartTop + 4 + i * (chartBottom - chartTop) / 4} 
                      textAnchor="end" 
                      className="chart-label"
                    >
                      {Math.round(max * (1 - i / 4))}
                    </text>
                  </g>
                ))}
                <polygon 
                  points={`46,${chartBottom} ${points} ${x(growth.length - 1)},${chartBottom}`} 
                  fill={`url(#${gradientId})`} 
                />
                <polyline 
                  pathLength="1" 
                  points={points} 
                  fill="none" 
                  stroke="var(--dashboard-accent)" 
                  strokeWidth="2.8" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  className="growth-line" 
                />
                {growth.map((p, i) => (
                  <g key={i} onMouseEnter={() => setSelectedMonth(i)}>
                    {selectedMonth === i && (
                      <line x1={x(i)} x2={x(i)} y1={chartTop} y2={chartBottom} className="chart-cursor" />
                    )}
                    <circle 
                      tabIndex={0} 
                      role="button" 
                      aria-label={`${p.label}: ${p.cumulative} total, ${p.count} new`} 
                      onFocus={() => setSelectedMonth(i)} 
                      onBlur={() => setSelectedMonth(null)} 
                      onClick={() => setSelectedMonth(selectedMonth === i ? null : i)} 
                      onKeyDown={e => { 
                        if (e.key === 'Enter' || e.key === ' ') { 
                          e.preventDefault(); 
                          setSelectedMonth(selectedMonth === i ? null : i); 
                        } 
                      }} 
                      cx={x(i)} 
                      cy={y(getGrowthVal(p))} 
                      r={selectedMonth === i ? 6 : 4} 
                      fill="var(--dashboard-accent)"
                    >
                      <title>{`${p.label}: ${p.count} new in month, ${p.cumulative} total cumulative`}</title>
                    </circle>
                    <text x={x(i)} y={chartHeight - 10} textAnchor="middle" className="chart-label">
                      {p.label}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          ) : (
            <div className="chart-empty">Growth data will appear here when available.</div>
          )}
          <div className="panel-footer">
            <span><i className="legend-dot" /> Community registrations ({growthMode})</span>
            {canUsers && (
              <button 
                type="button" 
                onClick={() => onNavigateTab?.('users')} 
                className="panel-footer-btn"
              >
                View directory <ArrowUpRight size={15} />
              </button>
            )}
          </div>
        </section>

        {/* 2. CONTENT DISTRIBUTION DONUT PANEL */}
        <section className="dashboard-panel content-panel" aria-label="Content breakdown">
          <div className="panel-heading">
            <div>
              <h3>Content distribution</h3>
              <p className="chart-description">See your community content at a glance.</p>
            </div>
            <div className="segmented-control" aria-label="Content type">
              <button 
                type="button"
                aria-pressed={categoryView === 'posts'} 
                onClick={() => { setCategoryView('posts'); setHoveredCategoryIndex(null); }}
              >
                Posts
              </button>
              {canReports && (
                <button 
                  type="button"
                  aria-pressed={categoryView === 'reports'} 
                  onClick={() => { setCategoryView('reports'); setHoveredCategoryIndex(null); }}
                >
                  Reports
                </button>
              )}
            </div>
          </div>
          {total > 0 ? (
            <div className="distribution-body">
              <div 
                className="distribution-ring" 
                role="img" 
                aria-label={categories.map(c => `${c.name}: ${Math.round(c.count / total * 100)}%`).join(', ')}
              >
                <svg viewBox="0 0 200 200">
                  <circle cx="100" cy="100" r="76" fill="none" stroke="var(--dashboard-line)" strokeWidth="25" />
                  {categories.map((category, index) => {
                    const percentage = (category.count / total) * 100;
                    const offset = categories.slice(0, index).reduce((sum, c) => sum + c.count, 0) / total * 100;
                    const isHovered = hoveredCategoryIndex === index;
                    return (
                      <circle 
                        className={`distribution-segment ${isHovered ? 'distribution-segment-active' : ''}`} 
                        key={category.name || index} 
                        cx="100" 
                        cy="100" 
                        r="76" 
                        fill="none" 
                        stroke={categoryColors[index % categoryColors.length]} 
                        strokeWidth={isHovered ? 29 : 25} 
                        pathLength="100" 
                        strokeDasharray={`${percentage} ${100 - percentage}`} 
                        strokeDashoffset={-offset} 
                        transform="rotate(-90 100 100)"
                        onMouseEnter={() => setHoveredCategoryIndex(index)}
                        onMouseLeave={() => setHoveredCategoryIndex(null)}
                        onClick={() => {
                          if (categoryView === 'posts') onNavigateTab?.('marketplace');
                          else if (categoryView === 'reports') onNavigateTab?.('reports');
                        }}
                        style={{ cursor: 'pointer', transition: 'stroke-width 0.2s ease, opacity 0.2s ease' }}
                      >
                        <title>{`${category.name}: ${num(category.count)} (${Math.round(percentage)}%) - Click to filter`}</title>
                      </circle>
                    );
                  })}
                </svg>

                {/* DYNAMIC CENTER LABEL: updates on hover / selection! */}
                {activeCategory && (
                  <div className="distribution-center" style={{ pointerEvents: 'none' }}>
                    <strong>
                      <AnimatedNumber value={Math.round((activeCategory.count / total) * 100)} />%
                    </strong>
                    <span className="distribution-label">{activeCategory.name}</span>
                    <small style={{ fontSize: '10px', color: 'var(--dashboard-muted)' }}>
                      {num(activeCategory.count)} {categoryView}
                    </small>
                  </div>
                )}
              </div>

              {/* INTERACTIVE LEGEND: Clickable buttons that filter and highlight */}
              <div className="distribution-legend" key={categoryView}>
                {categories.map((category, index) => {
                  const isHovered = hoveredCategoryIndex === index;
                  return (
                    <button
                      type="button"
                      key={category.name}
                      className={`distribution-legend-item ${isHovered ? 'distribution-legend-item-active' : ''}`}
                      onMouseEnter={() => setHoveredCategoryIndex(index)}
                      onMouseLeave={() => setHoveredCategoryIndex(null)}
                      onClick={() => {
                        if (categoryView === 'posts') onNavigateTab?.('marketplace');
                        else if (categoryView === 'reports') onNavigateTab?.('reports');
                      }}
                      title={`Click to view ${category.name} in ${categoryView}`}
                    >
                      <i style={{ background: categoryColors[index % categoryColors.length] }} />
                      <span>{category.name}</span>
                      <strong>{num(category.count)}</strong>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="chart-empty">No {categoryView} to show yet.</div>
          )}
          <div className="content-footnote">
            <i className="legend-dot" /> Share of total {categoryView} · Click any category to view details
          </div>
        </section>

        {/* 3. MONTHLY ACTIVITY BAR PANEL */}
        <section className="dashboard-panel monthly-panel" id="monthly-activity">
          <div className="panel-heading">
            <div>
              <h3>Monthly activity</h3>
              <p className="chart-description">Visualize your posts, comments, and shares.</p>
            </div>
            <div className="segmented-control" aria-label="Activity Metric">
              {(['posts', 'comments', 'shares'] as const).map(v => (
                <button 
                  key={v} 
                  type="button"
                  aria-pressed={view === v} 
                  onClick={() => { setView(v); setSelectedActivityMonth(null); }}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
          {activity.length ? (
            <div className="activity-chart" role="img" aria-label={`Monthly ${view}`}>
              {activity.map((p, i) => {
                const isSelected = selectedActivityMonth === i;
                const barVal = p[view] || 0;
                return (
                  <div 
                    className={`activity-column ${isSelected ? 'activity-column-active' : ''}`} 
                    key={i} 
                    tabIndex={0} 
                    role="button"
                    onClick={() => setSelectedActivityMonth(isSelected ? null : i)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedActivityMonth(isSelected ? null : i);
                      }
                    }}
                    aria-label={`${p.label}: ${barVal} ${view}`}
                    title={`Click to focus ${p.label}: ${barVal} ${view}`}
                  >
                    <div className="activity-track">
                      <div 
                        className="activity-bar" 
                        style={{ height: `${Math.max(barVal > 0 ? 8 : 0, (barVal / maxActivity) * 100)}%` }}
                      >
                        <span>{barVal}</span>
                      </div>
                    </div>
                    <span className="bar-label">{p.label}</span>
                    <span className="sr-only">{barVal} {view}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="chart-empty">Activity data will appear here when available.</div>
          )}
          <div className="panel-footer">
            <span>
              <i className="legend-dot" /> Monthly {view}: {
                selectedActivityMonth !== null && activity[selectedActivityMonth]
                  ? `${activity[selectedActivityMonth].label} (${activity[selectedActivityMonth][view]} ${view})`
                  : `${num(k?.[view === 'posts' ? 'totalPosts' : view === 'comments' ? 'totalComments' : 'totalShares'])} total`
              }
            </span>
            {view === 'posts' && (
              <button 
                type="button"
                onClick={() => onNavigateTab?.('marketplace')} 
                className="panel-footer-btn"
              >
                Manage posts <ArrowUpRight size={14} />
              </button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
