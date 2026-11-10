'use client';
import React, { useEffect, useId, useRef, useState } from 'react';
import { ArrowUpRight, Users, Sprout, Activity, UserPlus, FileText, MessageCircle, Share2, BookOpen } from 'lucide-react';
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
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
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
  const categoryColors = ['#315d46', '#7ba78b', '#b4cbb7', '#c8ad7f', '#78999b'];
  const k = analytics?.kpis;
  const num = (n?: number) => n === undefined ? '—' : n.toLocaleString();
  const growth = analytics?.userGrowth?.points ?? [];
  const max = Math.max(1, ...growth.map(p => p.cumulative));
  const x = (i: number) => 46 + i * (chartRight - 46) / Math.max(1, growth.length - 1);
  const y = (n: number) => chartBottom - n / max * (chartBottom - chartTop);
  const points = growth.map((p,i) => x(i) + ',' + y(p.cumulative)).join(' ');
  const activity = analytics?.contentActivity ?? [];
  const maxActivity = Math.max(1, ...activity.map(p => p[view]));
  const categories = (categoryView === 'posts' ? analytics?.postCategories : analytics?.reportCategories) ?? [];
  const total = categories.reduce((n,c) => n+c.count, 0);
  const role = adminRole?.toLowerCase() ?? '';
  const canUsers = ['admin','super_admin'].includes(role);
  const canReports = ['admin','super_admin','moderator'].includes(role);
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
  return <div className="farm-overview reference-analytics">
    <section className="metric-grid" aria-label="Community statistics">{metrics.map(([label,value,detail],i) => (
      <article className="metric-card" key={label} style={{animationDelay: i*45+'ms'}}>
        <div className="metric-top"><span>{label}</span><span className="premium-metric-icon">{React.createElement(metricIcons[i], {size:18, strokeWidth:1.7})}</span></div>
        <p className={'metric-number' + (i === 3 ? ' metric-positive' : '')}><AnimatedNumber value={value}/></p>
        <p className="metric-detail">{detail}</p>
      </article>
    ))}</section>
    <div className="overview-grid"><section className="dashboard-panel growth-panel"><div className="panel-heading"><div><h3>Community growth</h3><p className="chart-description">Track your community growth over time.</p></div><span className="quiet-tag">Monthly · cumulative</span></div><div className="chart-summary"><strong><AnimatedNumber duration={420} value={selected?.cumulative ?? (growth.length ? growth[growth.length-1].cumulative : undefined)}/></strong><span>{selected ? selected.label + " · " + selected.count + " new registrations" : "registrations this year"}</span></div>
    {growth.length ? <div className="growth-chart" ref={chartRef} onMouseLeave={() => setSelectedMonth(null)}><svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{height:chartHeight}} role="img" aria-label="Cumulative registrations by month"><defs><linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--analytics-green)" stopOpacity=".26"/><stop offset="100%" stopColor="var(--analytics-green)" stopOpacity=".015"/></linearGradient></defs>{[0,1,2,3,4].map(i => <g key={i}><line x1="46" x2={chartRight} y1={chartTop+i*(chartBottom-chartTop)/4} y2={chartTop+i*(chartBottom-chartTop)/4} className="chart-rule"/><text x="30" y={chartTop+4+i*(chartBottom-chartTop)/4} textAnchor="end" className="chart-label">{Math.round(max*(1-i/4))}</text></g>)}<polygon points={'46,'+chartBottom+' '+points+' '+x(growth.length-1)+','+chartBottom} fill={`url(#${gradientId})`}/><polyline pathLength="1" points={points} fill="none" stroke="var(--dashboard-accent)" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" className="growth-line"/>{growth.map((p,i) => <g key={i} onMouseEnter={() => setSelectedMonth(i)}>{selectedMonth === i && <line x1={x(i)} x2={x(i)} y1={chartTop} y2={chartBottom} className="chart-cursor"/>}<circle tabIndex={0} role="button" aria-label={p.label + ': ' + p.cumulative + ' registrations, ' + p.count + ' new'} onFocus={() => setSelectedMonth(i)} onBlur={() => setSelectedMonth(null)} onClick={() => setSelectedMonth(i)} onKeyDown={e => { if(e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedMonth(i); } }} cx={x(i)} cy={y(p.cumulative)} r={selectedMonth === i ? 6 : 4} fill="var(--dashboard-accent)"><title>{p.label}: {p.cumulative} registrations</title></circle><text x={x(i)} y={chartHeight-10} textAnchor="middle" className="chart-label">{p.label}</text></g>)}</svg></div> : <div className="chart-empty">Growth data will appear here when available.</div>}
    <div className="panel-footer"><span><i className="legend-dot"/> Community registrations</span>{canUsers && <button onClick={() => onNavigateTab?.('users')}>View directory <ArrowUpRight size={15}/></button>}</div></section>
    <section className="dashboard-panel content-panel" aria-label="Content breakdown">
      <div className="panel-heading">
        <div><h3>Content distribution</h3><p className="chart-description">See your community content at a glance.</p></div>
        <div className="segmented-control" aria-label="Content type">
          <button aria-pressed={categoryView === 'posts'} onClick={() => setCategoryView('posts')}>Posts</button>
          {canReports && <button aria-pressed={categoryView === 'reports'} onClick={() => setCategoryView('reports')}>Reports</button>}
        </div>
      </div>
      {total > 0 ? <div className="distribution-body">
        <div className="distribution-ring" role="img" aria-label={categories.map(c => c.name + ': ' + Math.round(c.count / total * 100) + '%').join(', ')}>
          <svg viewBox="0 0 200 200"><circle cx="100" cy="100" r="76" fill="none" stroke="var(--dashboard-line)" strokeWidth="25"/>{Array.from({length: Math.max(analytics?.postCategories?.length ?? 0, analytics?.reportCategories?.length ?? 0)}, (_, index) => {
            const category = categories[index];
            const percentage = category ? category.count / total * 100 : 0;
            const offset = categories.slice(0, index).reduce((sum, c) => sum + c.count, 0) / total * 100;
            return <circle className="distribution-segment" key={index} cx="100" cy="100" r="76" fill="none" stroke={categoryColors[index % categoryColors.length]} strokeWidth="25" pathLength="100" strokeDasharray={percentage + ' ' + (100 - percentage)} strokeDashoffset={-offset} transform="rotate(-90 100 100)"><title>{category ? category.name + ": " + num(category.count) : ""}</title></circle>;
          })}</svg>
          <div className="distribution-center"><strong><AnimatedNumber value={Math.round(categories[0].count / total * 100)}/>%</strong><span key={categoryView} className="distribution-label">{categories[0].name}</span></div>
        </div>
        <div className="distribution-legend" key={categoryView}>{categories.map((category,index) => <div key={category.name}><i style={{background:categoryColors[index % categoryColors.length]}}/><span>{category.name}</span><strong>{num(category.count)}</strong></div>)}</div>
      </div> : <div className="chart-empty">No {categoryView} to show yet.</div>}
      <div className="content-footnote"><i className="legend-dot"/> Share of total {categoryView}</div>
    </section>
    <section className="dashboard-panel monthly-panel"><div className="panel-heading"><div><h3>Monthly activity</h3><p className="chart-description">Visualize your posts, comments, and shares.</p></div><div className="segmented-control">{(['posts','comments','shares'] as const).map(v => <button key={v} aria-pressed={view===v} onClick={() => setView(v)}>{v}</button>)}</div></div>{activity.length ? <div className="activity-chart" role="img" aria-label={'Monthly '+view}>{activity.map((p,i) => <div className="activity-column" key={i} tabIndex={0} aria-label={p.label + ": " + p[view] + " " + view}><div className="activity-track"><div className="activity-bar" style={{height:p[view]/maxActivity*100+'%'}}><span>{p[view]}</span></div></div><span className="bar-label">{p.label}</span><span className="sr-only">{p[view]} {view}</span></div>)}</div> : <div className="chart-empty">Activity data will appear here when available.</div>}<div className="panel-footer"><span><i className="legend-dot"/> Monthly {view}</span><span>{num(k?.[view==='posts'?'totalPosts':view==='comments'?'totalComments':'totalShares'])} total</span></div></section></div>
  </div>;
}
