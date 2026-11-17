import { NextRequest, NextResponse } from 'next/server';
import { getSessionAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { logAdminActivity } from '@/lib/activity-logger';

// GET /api/admin/prices - Fetch agricultural price index & commodity benchmarks
export async function GET(req: NextRequest) {
  try {
    const admin = await getSessionAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') || 'all';
    const trend = searchParams.get('trend') || 'all';
    const search = (searchParams.get('search') || '').trim();

    // 1. Fetch all commodities from Supabase
    const { data: allRows, error: statsError } = await supabaseAdmin
      .from('commodity_prices')
      .select('*');

    if (statsError) throw statsError;

    const list = allRows || [];
    const stats = {
      totalCommodities: list.length,
      stableCount: list.filter(c => c.price_trend === 'stable').length,
      increasingCount: list.filter(c => c.price_trend === 'increasing').length,
      decreasingCount: list.filter(c => c.price_trend === 'decreasing').length,
      alertCount: list.filter(c => c.price_trend === 'alert').length,
    };

    // 2. Filter clauses
    let filtered = list;

    if (category && category.toLowerCase() !== 'all') {
      filtered = filtered.filter(c => (c.category || '').toLowerCase() === category.toLowerCase());
    }

    if (trend && trend.toLowerCase() !== 'all') {
      filtered = filtered.filter(c => (c.price_trend || '').toLowerCase() === trend.toLowerCase());
    }

    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(c =>
        (c.commodity_name || '').toLowerCase().includes(s) ||
        (c.market_source || '').toLowerCase().includes(s) ||
        (c.notes || '').toLowerCase().includes(s)
      );
    }

    // Sort: alert first, then increasing, then stable, then alphabetically
    filtered.sort((a, b) => {
      const score = (t: string) => (t === 'alert' ? 0 : t === 'increasing' ? 1 : 2);
      const diff = score(a.price_trend) - score(b.price_trend);
      if (diff !== 0) return diff;
      return (a.commodity_name || '').localeCompare(b.commodity_name || '');
    });

    return NextResponse.json({
      success: true,
      commodities: filtered,
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

    const { data, error } = await supabaseAdmin
      .from('commodity_prices')
      .insert({
        commodity_name,
        category,
        min_price: Number(min_price) || 0,
        max_price: Number(max_price) || 0,
        suggested_srp: Number(suggested_srp) || 0,
        unit,
        price_trend,
        change_percentage,
        market_source,
        notes,
        updated_by: admin.email || 'admin@localfarm.com'
      })
      .select()
      .single();

    if (error) throw error;

    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    await logAdminActivity({
      action: 'Price Index Benchmark Added',
      detail: `Published SRP benchmark for ${commodity_name} (₱${suggested_srp}/${unit})`,
      type: 'system',
      user: admin.email || 'admin@localfarm.com',
      ip: clientIp,
      status: 'success'
    });

    return NextResponse.json({ success: true, message: `Benchmark for "${commodity_name}" published.`, item: data });
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

    const updatePayload: Record<string, any> = {
      updated_by: admin.email || 'admin@localfarm.com',
      updated_at: new Date().toISOString()
    };
    if (commodity_name !== undefined) updatePayload.commodity_name = commodity_name;
    if (category !== undefined) updatePayload.category = category;
    if (min_price !== undefined) updatePayload.min_price = Number(min_price);
    if (max_price !== undefined) updatePayload.max_price = Number(max_price);
    if (suggested_srp !== undefined) updatePayload.suggested_srp = Number(suggested_srp);
    if (unit !== undefined) updatePayload.unit = unit;
    if (price_trend !== undefined) updatePayload.price_trend = price_trend;
    if (change_percentage !== undefined) updatePayload.change_percentage = change_percentage;
    if (market_source !== undefined) updatePayload.market_source = market_source;
    if (notes !== undefined) updatePayload.notes = notes;

    const { error } = await supabaseAdmin
      .from('commodity_prices')
      .update(updatePayload)
      .eq('id', id);

    if (error) throw error;

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

    const { error } = await supabaseAdmin
      .from('commodity_prices')
      .delete()
      .eq('id', id);

    if (error) throw error;

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
