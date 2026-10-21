import { NextResponse } from 'next/server';
import { getSessionAdmin } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const admin = await getSessionAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. KPI Counts directly from MySQL localfarm tables
    const [userRows] = await query<any[]>('SELECT COUNT(*) as count FROM users');
    const [farmerRows] = await query<any[]>('SELECT COUNT(*) as count FROM users WHERE role = "user"');
    const [recentUsersRows] = await query<any[]>(
      'SELECT COUNT(*) as count FROM users WHERE created_at >= NOW() - INTERVAL 7 DAY'
    );
    const [activeTodayRows] = await query<any[]>(`
      SELECT COUNT(DISTINCT user_id) as count FROM (
        SELECT user_id, created_at FROM posts WHERE created_at >= NOW() - INTERVAL 24 HOUR
        UNION ALL
        SELECT sender_id as user_id, created_at FROM messages WHERE created_at >= NOW() - INTERVAL 24 HOUR
        UNION ALL
        SELECT user_id, created_at FROM stories WHERE created_at >= NOW() - INTERVAL 24 HOUR
        UNION ALL
        SELECT user_id, created_at FROM post_comments WHERE created_at >= NOW() - INTERVAL 24 HOUR
        UNION ALL
        SELECT id as user_id, created_at FROM users WHERE created_at >= NOW() - INTERVAL 24 HOUR
      ) act
    `);
    const [postRows] = await query<any[]>('SELECT COUNT(*) as count FROM posts');
    const [storyRows] = await query<any[]>('SELECT COUNT(*) as count FROM stories WHERE expires_at > NOW()');
    const [pendingConnRows] = await query<any[]>(
      'SELECT COUNT(*) as count FROM connections WHERE status = "pending"'
    );
    const [messageRows] = await query<any[]>('SELECT COUNT(*) as count FROM messages');
    const [commentRows] = await query<any[]>('SELECT COUNT(*) as count FROM post_comments');
    const [shareRows] = await query<any[]>('SELECT COUNT(*) as count FROM post_shares');

    // Reports counts from MySQL reports table
    let pendingReportsCount = 0;
    let totalReportsCount = 0;
    try {
      const [pRep] = await query<any[]>("SELECT COUNT(*) as count FROM `reports` WHERE status = 'pending'");
      pendingReportsCount = pRep?.[0]?.count ?? pRep?.count ?? 0;
      const [tRep] = await query<any[]>("SELECT COUNT(*) as count FROM `reports`");
      totalReportsCount = tRep?.[0]?.count ?? tRep?.count ?? 0;
    } catch {}

    const totalFarmers = farmerRows?.[0]?.count ?? farmerRows?.count ?? userRows?.[0]?.count ?? 0;
    const totalUsers = userRows?.[0]?.count ?? userRows?.count ?? 0;
    const newSignups = recentUsersRows?.[0]?.count ?? recentUsersRows?.count ?? 0;
    const activeToday = activeTodayRows?.[0]?.count ?? activeTodayRows?.count ?? 0;
    const totalPosts = postRows?.[0]?.count ?? postRows?.count ?? 0;
    const activeStories = storyRows?.[0]?.count ?? storyRows?.count ?? 0;
    const pendingConnections = pendingConnRows?.[0]?.count ?? pendingConnRows?.count ?? 0;
    const totalMessages = messageRows?.[0]?.count ?? messageRows?.count ?? 0;
    const totalComments = commentRows?.[0]?.count ?? commentRows?.count ?? 0;
    const totalShares = shareRows?.[0]?.count ?? shareRows?.count ?? 0;

    // 2. User/Farmer Growth Line Chart (Monthly Registrations Jan..Dec)
    const monthlyUsersRows = await query<any[]>(`
      SELECT MONTH(created_at) as month_num, COUNT(*) as count 
      FROM users 
      WHERE YEAR(created_at) = YEAR(CURDATE()) 
      GROUP BY MONTH(created_at)
    `);

    const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const userGrowthByMonth = monthLabels.map((label, idx) => {
      const monthNum = idx + 1;
      const found = monthlyUsersRows.find((r: any) => Number(r.month_num) === monthNum);
      return {
        month: monthNum,
        label,
        count: found ? Number(found.count) : 0,
      };
    });

    // Calculate cumulative counts for the growth line
    let runningSum = 0;
    const userGrowthWithCumulative = userGrowthByMonth.map((item) => {
      runningSum += item.count;
      return {
        ...item,
        cumulative: runningSum,
      };
    });

    // 3. Post Categories Donut Chart (Based on posts.category ENUM)
    const categoryRows = await query<any[]>(`
      SELECT category, COUNT(*) as count 
      FROM posts 
      GROUP BY category
    `);

    const totalCategorizedPosts = categoryRows.reduce((sum: number, r: any) => sum + Number(r.count), 0) || 1;
    const colorMap: Record<string, string> = {
      Field: '#237227',
      Wholesaler: '#E09F3E',
      Temporary: '#5B8FB9',
      General: '#9D84B7',
    };
    const defaultCategories = ['Field', 'Wholesaler', 'Temporary', 'General'];
    const postCategories = defaultCategories.map((cat) => {
      const found = categoryRows.find((r: any) => r.category?.toLowerCase() === cat.toLowerCase());
      const count = found ? Number(found.count) : 0;
      const percentage = Math.round((count / totalCategorizedPosts) * 100);
      return {
        name: cat,
        count,
        percentage,
        color: colorMap[cat] || '#546e7a',
      };
    });

    // 4. Content Activity Grouped Bar Chart (Full Year 12 Months: Jan..Dec)
    const activityMonths = [
      { num: 1, label: 'Jan' },
      { num: 2, label: 'Feb' },
      { num: 3, label: 'Mar' },
      { num: 4, label: 'Apr' },
      { num: 5, label: 'May' },
      { num: 6, label: 'Jun' },
      { num: 7, label: 'Jul' },
      { num: 8, label: 'Aug' },
      { num: 9, label: 'Sep' },
      { num: 10, label: 'Oct' },
      { num: 11, label: 'Nov' },
      { num: 12, label: 'Dec' },
    ];

    const monthlyPosts = await query<any[]>(`
      SELECT MONTH(created_at) as month_num, COUNT(*) as count 
      FROM posts 
      GROUP BY MONTH(created_at)
    `);

    const monthlyComments = await query<any[]>(`
      SELECT MONTH(created_at) as month_num, COUNT(*) as count 
      FROM post_comments 
      GROUP BY MONTH(created_at)
    `);

    const monthlyShares = await query<any[]>(`
      SELECT MONTH(created_at) as month_num, COUNT(*) as count 
      FROM post_shares 
      GROUP BY MONTH(created_at)
    `);

    const contentActivityData = activityMonths.map((m) => {
      const p = monthlyPosts.find((r: any) => Number(r.month_num) === m.num);
      const c = monthlyComments.find((r: any) => Number(r.month_num) === m.num);
      const s = monthlyShares.find((r: any) => Number(r.month_num) === m.num);
      return {
        label: m.label,
        month: m.num,
        posts: p ? Number(p.count) : 0,
        comments: c ? Number(c.count) : 0,
        shares: s ? Number(s.count) : 0,
      };
    });

    // 5. Report Categories Breakdown directly from MySQL reports table
    let reportCategories: any[] = [];
    try {
      const repCatRows = await query<any[]>(`
        SELECT reason, COUNT(*) as count 
        FROM reports 
        GROUP BY reason 
        ORDER BY count DESC
      `);
      const totalCategorizedReports = repCatRows.reduce((sum: number, r: any) => sum + Number(r.count), 0) || 1;
      
      // Categorize into standard high-level moderation buckets:
      // 1. Harassment & Abuse
      // 2. Product & Trade
      // 3. Fraud & Phishing
      // 4. Spam & Other
      const groupMap: Record<string, { count: number; color: string }> = {
        'Harassment & Abuse': { count: 0, color: '#ea4335' },
        'Product & Trade': { count: 0, color: '#f59e0b' },
        'Fraud & Phishing': { count: 0, color: '#8b5cf6' },
        'Spam & Other': { count: 0, color: '#64748b' },
      };

      for (const r of repCatRows) {
        const reason = (r.reason || '').toLowerCase();
        const cnt = Number(r.count) || 0;

        if (reason.includes('harrass') || reason.includes('harass') || reason.includes('abuse') || reason.includes('threat')) {
          groupMap['Harassment & Abuse'].count += cnt;
        } else if (
          reason.includes('counterfeit') || 
          reason.includes('mislead') || 
          reason.includes('gouging') || 
          reason.includes('advertis') || 
          reason.includes('chemical') || 
          reason.includes('product') || 
          reason.includes('listing')
        ) {
          groupMap['Product & Trade'].count += cnt;
        } else if (
          reason.includes('scam') || 
          reason.includes('fraud') || 
          reason.includes('phish') || 
          reason.includes('identity') || 
          reason.includes('impersonat')
        ) {
          groupMap['Fraud & Phishing'].count += cnt;
        } else {
          groupMap['Spam & Other'].count += cnt;
        }
      }

      // Convert to array sorted by count descending
      const formatted = Object.entries(groupMap)
        .filter(([_, data]) => data.count > 0)
        .sort((a, b) => b[1].count - a[1].count);

      // Ensure percentage sums up smoothly to 100%
      reportCategories = formatted.map(([name, data]) => {
        const pct = Math.round((data.count / totalCategorizedReports) * 100);
        return {
          name,
          count: data.count,
          percentage: pct,
          color: data.color,
        };
      });

      // If any rounding drift occurs, adjust largest group
      const sumPct = reportCategories.reduce((acc, c) => acc + c.percentage, 0);
      if (reportCategories.length > 0 && sumPct !== 100) {
        reportCategories[0].percentage += (100 - sumPct);
      }
    } catch {}

    return NextResponse.json({
      kpis: {
        totalFarmers,
        totalUsers,
        activeToday,
        activeFarmers: activeToday,
        newSignups,
        totalPosts,
        activeStories,
        liveNow: activeStories,
        pendingConnections,
        pendingReports: Number(pendingReportsCount),
        totalReports: Number(totalReportsCount),
        totalMessages,
        totalComments,
        totalShares,
      },
      userGrowth: {
        points: userGrowthWithCumulative,
        totalFarmers,
        totalUsers,
      },
      postCategories,
      reportCategories,
      contentActivity: contentActivityData,
    });
  } catch (error: any) {
    console.error('Analytics API error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics data' }, { status: 500 });
  }
}
