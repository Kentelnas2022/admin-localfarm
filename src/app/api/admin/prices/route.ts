import { NextRequest, NextResponse } from 'next/server';
import { getSessionAdmin } from '@/lib/auth';
import { query } from '@/lib/db';
import { logAdminActivity } from '@/lib/activity-logger';

async function ensurePricesTable() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS \`commodity_prices\` (
        \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        \`commodity_name\` VARCHAR(150) NOT NULL,
        \`category\` ENUM('Vegetables', 'Fruits', 'Grains & Rice', 'Fish & Aquaculture', 'Herbs & Spices', 'Commercial Crops') NOT NULL DEFAULT 'Vegetables',
        \`min_price\` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        \`max_price\` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        \`suggested_srp\` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        \`unit\` VARCHAR(50) NOT NULL DEFAULT 'kg',
        \`price_trend\` ENUM('stable', 'increasing', 'decreasing', 'alert') NOT NULL DEFAULT 'stable',
        \`change_percentage\` VARCHAR(20) NOT NULL DEFAULT '0%',
        \`market_source\` VARCHAR(150) NOT NULL DEFAULT 'Metro Agritrade & Local Cooperatives',
        \`notes\` VARCHAR(255) DEFAULT NULL,
        \`updated_by\` VARCHAR(150) DEFAULT 'admin@localfarm.com',
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX \`idx_prices_category\` (\`category\`),
        INDEX \`idx_prices_trend\` (\`price_trend\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  } catch {}
}

// GET /api/admin/prices - Fetch agricultural price index & commodity benchmarks
export async function GET(req: NextRequest) {
  try {
    const admin = await getSessionAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await ensurePricesTable();

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') || 'all';
    const trend = searchParams.get('trend') || 'all';
    const search = (searchParams.get('search') || '').trim();

    // 1. KPI Stats
    const [statsRow] = await query<any[]>(`
      SELECT 
        COUNT(*) as totalCommodities,
        SUM(CASE WHEN price_trend = 'stable' THEN 1 ELSE 0 END) as stableCount,
        SUM(CASE WHEN price_trend = 'increasing' THEN 1 ELSE 0 END) as increasingCount,
        SUM(CASE WHEN price_trend = 'decreasing' THEN 1 ELSE 0 END) as decreasingCount,
        SUM(CASE WHEN price_trend = 'alert' THEN 1 ELSE 0 END) as alertCount
      FROM \`commodity_prices\`
    `);

    const stats = {
      totalCommodities: Number(statsRow?.[0]?.totalCommodities ?? statsRow?.totalCommodities ?? 0),
      stableCount: Number(statsRow?.[0]?.stableCount ?? statsRow?.stableCount ?? 0),
      increasingCount: Number(statsRow?.[0]?.increasingCount ?? statsRow?.increasingCount ?? 0),
      decreasingCount: Number(statsRow?.[0]?.decreasingCount ?? statsRow?.decreasingCount ?? 0),
      alertCount: Number(statsRow?.[0]?.alertCount ?? statsRow?.alertCount ?? 0),
    };

    // 2. Filter clauses
    const whereClauses: string[] = [];
    const params: any[] = [];

    if (category && category.toLowerCase() !== 'all') {
      whereClauses.push('LOWER(category) = LOWER(?)');
      params.push(category);
    }

    if (trend && trend.toLowerCase() !== 'all') {
      whereClauses.push('LOWER(price_trend) = LOWER(?)');
      params.push(trend);
    }

    if (search) {
      whereClauses.push('(commodity_name LIKE ? OR market_source LIKE ? OR notes LIKE ?)');
      const pattern = `%${search}%`;
      params.push(pattern, pattern, pattern);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const commodities = await query<any[]>(
      `SELECT * FROM \`commodity_prices\` 
       ${whereSql} 
       ORDER BY 
         CASE WHEN price_trend = 'alert' THEN 0 WHEN price_trend = 'increasing' THEN 1 ELSE 2 END,
         category ASC, 
         commodity_name ASC`,
      params
    );

    return NextResponse.json({
      success: true,
      commodities: commodities || [],
      stats,
    });
  } catch (error: any) {
    console.error('Commodity prices fetch error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch prices' }, { status: 500 });
  }
}

// POST /api/admin/prices - Add new agricultural commodity SRP benchmark
export async function POST(req: NextRequest) {
  try {
    const admin = await getSessionAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      commodity_name,
      category = 'Vegetables',
      min_price = 0,
      max_price = 0,
      suggested_srp = 0,
      unit = 'kg',
      price_trend = 'stable',
      change_percentage = '0%',
      market_source = 'Metro Agritrade & Local Cooperatives',
      notes = ''
    } = body;

    if (!commodity_name || !suggested_srp) {
      return NextResponse.json({ error: 'Commodity name and suggested SRP are required' }, { status: 400 });
    }

    await query(
      `INSERT INTO \`commodity_prices\` 
        (commodity_name, category, min_price, max_price, suggested_srp, unit, price_trend, change_percentage, market_source, notes, updated_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        commodity_name,
        category,
        min_price,
        max_price,
        suggested_srp,
        unit,
        price_trend,
        change_percentage,
        market_source,
        notes,
        admin.email || 'admin@localfarm.com'
      ]
    );

    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    await logAdminActivity({
      action: 'Price Index Benchmark Added',
      detail: `Published SRP benchmark for ${commodity_name} (₱${suggested_srp}/${unit})`,
      type: 'system',
      user: admin.email || 'admin@localfarm.com',
      ip: clientIp,
      status: 'success'
    });

    return NextResponse.json({ success: true, message: `Benchmark for "${commodity_name}" published.` });
  } catch (error: any) {
    console.error('Commodity price add error:', error);
    return NextResponse.json({ error: error.message || 'Failed to add price benchmark' }, { status: 500 });
  }
}

// PUT /api/admin/prices - Update existing price benchmark
export async function PUT(req: NextRequest) {
  try {
    const admin = await getSessionAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      id,
      commodity_name,
      category,
      min_price,
      max_price,
      suggested_srp,
      unit,
      price_trend,
      change_percentage,
      market_source,
      notes
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Commodity ID is required' }, { status: 400 });
    }

    await query(
      `UPDATE \`commodity_prices\` 
       SET commodity_name = COALESCE(?, commodity_name),
           category = COALESCE(?, category),
           min_price = COALESCE(?, min_price),
           max_price = COALESCE(?, max_price),
           suggested_srp = COALESCE(?, suggested_srp),
           unit = COALESCE(?, unit),
           price_trend = COALESCE(?, price_trend),
           change_percentage = COALESCE(?, change_percentage),
           market_source = COALESCE(?, market_source),
           notes = COALESCE(?, notes),
           updated_by = ?
       WHERE id = ?`,
      [
        commodity_name,
        category,
        min_price,
        max_price,
        suggested_srp,
        unit,
        price_trend,
        change_percentage,
        market_source,
        notes,
        admin.email || 'admin@localfarm.com',
        id
      ]
    );

    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    await logAdminActivity({
      action: 'Price Index Benchmark Updated',
      detail: `Updated SRP price for commodity #${id} to ₱${suggested_srp}/${unit || 'kg'} (${price_trend})`,
      type: 'system',
      user: admin.email || 'admin@localfarm.com',
      ip: clientIp,
      status: 'success'
    });

    return NextResponse.json({ success: true, message: 'Price benchmark updated successfully.' });
  } catch (error: any) {
    console.error('Commodity price update error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update price benchmark' }, { status: 500 });
  }
}

// DELETE /api/admin/prices?id=...
export async function DELETE(req: NextRequest) {
  try {
    const admin = await getSessionAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = parseInt(searchParams.get('id') || '0', 10);

    if (!id) {
      return NextResponse.json({ error: 'Invalid commodity ID' }, { status: 400 });
    }

    await query('DELETE FROM `commodity_prices` WHERE id = ?', [id]);

    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    await logAdminActivity({
      action: 'Price Benchmark Removed',
      detail: `Removed commodity price benchmark #${id}`,
      type: 'system',
      user: admin.email || 'admin@localfarm.com',
      ip: clientIp,
      status: 'warning'
    });

    return NextResponse.json({ success: true, message: 'Commodity price benchmark removed.' });
  } catch (error: any) {
    console.error('Commodity price delete error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete price benchmark' }, { status: 500 });
  }
}
