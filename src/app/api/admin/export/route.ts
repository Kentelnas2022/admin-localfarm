import { NextRequest, NextResponse } from 'next/server';
import { getSessionAdmin } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const admin = await getSessionAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = (searchParams.get('type') || 'farmers').toLowerCase();
    const dateStr = new Date().toISOString().split('T')[0];

    // Helper: escape CSV cell
    const csvEscape = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    if (type === 'farmers') {
      const rows = await query<any[]>(`
        SELECT 
          fp.farmer_code,
          u.full_name,
          u.username,
          u.email,
          u.phone_number,
          fp.farm_name,
          fp.crops,
          fp.farm_location,
          fp.hectares,
          fp.yield_trend,
          fp.verification_status,
          fp.certifications,
          u.created_at
        FROM \`farmer_profiles\` fp
        INNER JOIN \`users\` u ON fp.user_id = u.id
        ORDER BY fp.id ASC
      `);

      const headers = [
        'Accreditation ID',
        'Farmer Full Name',
        'Username',
        'Email Address',
        'Phone Number',
        'Farm Facility Name',
        'Cultivated Crops',
        'Farm Location',
        'Land Hectares',
        'Yield Trend',
        'Accreditation Status',
        'Certifications',
        'Registration Date'
      ];

      const csvLines = [
        headers.join(','),
        ...rows.map(r => [
          csvEscape(r.farmer_code),
          csvEscape(r.full_name),
          csvEscape(r.username),
          csvEscape(r.email),
          csvEscape(r.phone_number),
          csvEscape(r.farm_name),
          csvEscape(r.crops),
          csvEscape(r.farm_location),
          csvEscape(r.hectares),
          csvEscape(r.yield_trend),
          csvEscape(r.verification_status),
          csvEscape(r.certifications),
          csvEscape(r.created_at ? new Date(r.created_at).toLocaleDateString() : '')
        ].join(','))
      ];

      return new NextResponse(csvLines.join('\r\n'), {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="localfarm-farmers-registry-${dateStr}.csv"`
        }
      });
    }

    if (type === 'prices') {
      const rows = await query<any[]>('SELECT * FROM `commodity_prices` ORDER BY category ASC, commodity_name ASC');
      const headers = [
        'ID',
        'Commodity Name',
        'Category',
        'Min Price (PHP)',
        'Max Price (PHP)',
        'Suggested SRP (PHP)',
        'Unit',
        'Price Trend',
        'Change Rate',
        'Market Benchmark Source',
        'Notes'
      ];

      const csvLines = [
        headers.join(','),
        ...rows.map(r => [
          csvEscape(r.id),
          csvEscape(r.commodity_name),
          csvEscape(r.category),
          csvEscape(r.min_price),
          csvEscape(r.max_price),
          csvEscape(r.suggested_srp),
          csvEscape(r.unit),
          csvEscape(r.price_trend),
          csvEscape(r.change_percentage),
          csvEscape(r.market_source),
          csvEscape(r.notes)
        ].join(','))
      ];

      return new NextResponse(csvLines.join('\r\n'), {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="localfarm-price-bulletin-${dateStr}.csv"`
        }
      });
    }

    if (type === 'posts') {
      const rows = await query<any[]>(`
        SELECT p.id, p.category, p.location, p.likes_count, p.comments_count, p.shares_count, p.created_at, p.content,
               u.full_name, u.email, fp.farm_name
        FROM \`posts\` p
        LEFT JOIN \`users\` u ON p.user_id = u.id
        LEFT JOIN \`farmer_profiles\` fp ON u.id = fp.user_id
        ORDER BY p.id DESC
      `);

      const headers = ['Post ID', 'Author', 'Farm Name', 'Category', 'Location', 'Likes', 'Comments', 'Shares', 'Created At', 'Content'];
      const csvLines = [
        headers.join(','),
        ...rows.map(r => [
          csvEscape(r.id),
          csvEscape(r.full_name),
          csvEscape(r.farm_name),
          csvEscape(r.category),
          csvEscape(r.location),
          csvEscape(r.likes_count),
          csvEscape(r.comments_count),
          csvEscape(r.shares_count),
          csvEscape(r.created_at),
          csvEscape(r.content)
        ].join(','))
      ];

      return new NextResponse(csvLines.join('\r\n'), {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="localfarm-produce-listings-${dateStr}.csv"`
        }
      });
    }

    if (type === 'reports') {
      const rows = await query<any[]>('SELECT * FROM `reports` ORDER BY id ASC');
      const headers = ['Report Code', 'Reporter', 'Reported User', 'Type', 'Reason', 'Severity', 'Status', 'Date Reported', 'Statement'];
      const csvLines = [
        headers.join(','),
        ...rows.map(r => [
          csvEscape(r.report_code),
          csvEscape(r.reporter_name),
          csvEscape(r.reported_user_name),
          csvEscape(r.report_type),
          csvEscape(r.reason),
          csvEscape(r.severity),
          csvEscape(r.status),
          csvEscape(r.date_reported),
          csvEscape(r.statement)
        ].join(','))
      ];

      return new NextResponse(csvLines.join('\r\n'), {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="localfarm-moderation-log-${dateStr}.csv"`
        }
      });
    }

    if (type === 'announcements') {
      const rows = await query<any[]>('SELECT * FROM `announcements` ORDER BY is_pinned DESC, id DESC');
      const headers = ['ID', 'Title', 'Category', 'Priority', 'Target Audience', 'Pinned', 'Archived', 'Created At', 'Content'];
      const csvLines = [
        headers.join(','),
        ...rows.map(r => [
          csvEscape(r.id),
          csvEscape(r.title),
          csvEscape(r.category),
          csvEscape(r.priority),
          csvEscape(r.target_audience),
          csvEscape(r.is_pinned ? 'Yes' : 'No'),
          csvEscape(r.is_archived ? 'Yes' : 'No'),
          csvEscape(r.created_at ? new Date(r.created_at).toLocaleString() : ''),
          csvEscape(r.content)
        ].join(','))
      ];

      return new NextResponse(csvLines.join('\r\n'), {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="localfarm-announcements-${dateStr}.csv"`
        }
      });
    }

    return NextResponse.json({ error: 'Invalid export type requested' }, { status: 400 });

  } catch (error: any) {
    console.error('Export error:', error);
    return NextResponse.json({ error: error.message || 'Export failed' }, { status: 500 });
  }
}
