import { NextRequest, NextResponse } from 'next/server';
import { getSessionAdmin } from '@/lib/auth';
import { query } from '@/lib/db';
import { logAdminActivity } from '@/lib/activity-logger';

// GET /api/admin/posts - Fetch paginated marketplace produce posts & analytics
export async function GET(req: NextRequest) {
  try {
    const admin = await getSessionAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const postId = parseInt(searchParams.get('postId') || '0', 10);

    // Fetch comments for a single post when postId is provided
    if (postId) {
      const comments = await query<any[]>(
        `SELECT pc.id, pc.post_id, pc.user_id, pc.content, pc.comment, pc.likes_count, pc.created_at,
                u.full_name, u.username, u.avatar_url, u.is_verified
         FROM \`post_comments\` pc
         LEFT JOIN \`users\` u ON pc.user_id = u.id
         WHERE pc.post_id = ?
         ORDER BY pc.created_at ASC`,
        [postId]
      );
      return NextResponse.json({
        success: true,
        comments: (comments || []).map((c: any) => ({
          ...c,
          text: c.content || c.comment || ''
        }))
      });
    }

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '8', 10));
    const offset = (page - 1) * limit;
    const category = searchParams.get('category') || 'all';
    const search = (searchParams.get('search') || '').trim();
    const sortBy = searchParams.get('sortBy') || 'newest';

    // 1. KPI Stats
    const [statsRow] = await query<any[]>(`
      SELECT 
        COUNT(*) as totalPosts,
        SUM(CASE WHEN category = 'Field' THEN 1 ELSE 0 END) as fieldCount,
        SUM(CASE WHEN category = 'Wholesaler' THEN 1 ELSE 0 END) as wholesalerCount,
        SUM(CASE WHEN category = 'Temporary' THEN 1 ELSE 0 END) as temporaryCount,
        SUM(CASE WHEN category = 'General' THEN 1 ELSE 0 END) as generalCount
      FROM \`posts\`
    `);

    const stats = {
      totalPosts: Number(statsRow?.[0]?.totalPosts ?? statsRow?.totalPosts ?? 0),
      fieldCount: Number(statsRow?.[0]?.fieldCount ?? statsRow?.fieldCount ?? 0),
      wholesalerCount: Number(statsRow?.[0]?.wholesalerCount ?? statsRow?.wholesalerCount ?? 0),
      temporaryCount: Number(statsRow?.[0]?.temporaryCount ?? statsRow?.temporaryCount ?? 0),
      generalCount: Number(statsRow?.[0]?.generalCount ?? statsRow?.generalCount ?? 0),
    };

    // 2. Filter clauses
    const whereClauses: string[] = [];
    const params: any[] = [];

    if (category && category.toLowerCase() !== 'all') {
      whereClauses.push('LOWER(p.category) = LOWER(?)');
      params.push(category);
    }

    if (search) {
      whereClauses.push(`(
        p.content LIKE ? OR 
        p.location LIKE ? OR 
        u.full_name LIKE ? OR 
        u.username LIKE ? OR 
        u.email LIKE ?
      )`);
      const pattern = `%${search}%`;
      params.push(pattern, pattern, pattern, pattern, pattern);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Total Count
    const [countRow] = await query<any[]>(
      `SELECT COUNT(*) as filteredCount 
       FROM \`posts\` p 
       LEFT JOIN \`users\` u ON p.user_id = u.id 
       ${whereSql}`,
      params
    );
    const totalCount = Number(countRow?.[0]?.filteredCount ?? countRow?.filteredCount ?? 0);
    const totalPages = Math.max(1, Math.ceil(totalCount / limit));

    // Sort order
    let orderSql = 'p.created_at DESC';
    if (sortBy === 'popular' || sortBy === 'likes') {
      orderSql = 'p.likes_count DESC, p.created_at DESC';
    } else if (sortBy === 'comments') {
      orderSql = 'p.comments_count DESC, p.created_at DESC';
    } else if (sortBy === 'shares') {
      orderSql = 'p.shares_count DESC, p.created_at DESC';
    } else if (sortBy === 'oldest') {
      orderSql = 'p.created_at ASC';
    }

    const rawPosts = await query<any[]>(
      `SELECT p.id, p.user_id, p.content, p.image_url, p.images, p.photos, p.category, p.privacy, p.location, 
              p.likes_count, p.comments_count, p.shares_count, p.expires_at, p.is_live_replay, p.viewer_count, p.created_at, p.updated_at,
              u.full_name, u.username, u.email, u.phone_number, u.avatar_url, u.is_verified,
              fp.farm_name, fp.farmer_code
       FROM \`posts\` p
       LEFT JOIN \`users\` u ON p.user_id = u.id
       LEFT JOIN \`farmer_profiles\` fp ON u.id = fp.user_id
       ${whereSql}
       ORDER BY ${orderSql}
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    // Fetch active commodity_prices for SRP compliance checking
    let commodityBenchmarks: any[] = [];
    try {
      commodityBenchmarks = await query<any[]>(
        'SELECT commodity_name, min_price, max_price, suggested_srp, unit FROM `commodity_prices`'
      );
    } catch {}

    function evaluatePostSrpCompliance(content: string) {
      if (!content || commodityBenchmarks.length === 0) return null;
      const lower = content.toLowerCase();

      // Extract peso price e.g. ₱120, P120, PHP 120, or 120/kg
      const priceRegex = /(?:₱|php\s*|p\s*)(\d+(?:,\d{3})*(?:\.\d+)?)|(\d+(?:,\d{3})*(?:\.\d+)?)\s*\/\s*(?:kg|kilo|sack|crate|pack)/i;
      const match = content.match(priceRegex);
      if (!match) return null;
      const rawPrice = (match[1] || match[2] || '').replace(/,/g, '');
      const listedPrice = parseFloat(rawPrice);
      if (!listedPrice || isNaN(listedPrice)) return null;

      // Match commodity by full name or significant keywords
      const stopWords = new Set(['native', 'fresh', 'red', 'white', 'green', 'yellow', 'sweet', 'local', 'organic', 'well', 'milled', 'commercial', 'class']);
      let matchedBenchmark: any = null;

      for (const b of commodityBenchmarks) {
        const bLower = String(b.commodity_name || '').toLowerCase();
        if (lower.includes(bLower)) {
          matchedBenchmark = b;
          break;
        }
        const words = bLower.split(/[^a-z]+/).filter((w) => w.length >= 4 && !stopWords.has(w));
        for (const w of words) {
          const singular = w.endsWith('es') ? w.slice(0, -2) : w.endsWith('s') ? w.slice(0, -1) : w;
          if (singular.length >= 3 && lower.includes(singular)) {
            matchedBenchmark = b;
            break;
          }
        }
        if (matchedBenchmark) break;
      }

      if (!matchedBenchmark) return null;

      const minP = Number(matchedBenchmark.min_price) || 0;
      const maxP = Number(matchedBenchmark.max_price) || Number(matchedBenchmark.suggested_srp) * 1.15;
      const srp = Number(matchedBenchmark.suggested_srp) || 0;

      let status: 'overpriced' | 'compliant' | 'bargain' = 'compliant';
      if (maxP > 0 && listedPrice > maxP) {
        status = 'overpriced';
      } else if (minP > 0 && listedPrice < minP) {
        status = 'bargain';
      }

      const variancePct = srp > 0 ? Math.round(((listedPrice - srp) / srp) * 100) : 0;

      return {
        status,
        commodity_name: matchedBenchmark.commodity_name,
        listed_price: listedPrice,
        suggested_srp: srp,
        min_price: minP,
        max_price: maxP,
        unit: matchedBenchmark.unit || 'kg',
        variance_pct: variancePct
      };
    }

    const posts = (rawPosts || []).map((p: any) => {
      let resolvedImage = p.image_url;
      if (!resolvedImage && (p.images || p.photos)) {
        try {
          const arr = JSON.parse(p.images || p.photos);
          if (Array.isArray(arr) && arr.length > 0) resolvedImage = arr[0];
        } catch {}
      }
      return {
        ...p,
        image_url: resolvedImage || null,
        srp_check: evaluatePostSrpCompliance(p.content || '')
      };
    });

    return NextResponse.json({
      success: true,
      posts,
      stats,
      pagination: {
        currentPage: page,
        pageSize: limit,
        totalCount,
        totalPages,
      }
    });
  } catch (error: any) {
    console.error('Posts fetch error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch posts' }, { status: 500 });
  }
}

// POST /api/admin/posts - Send an official Bantay Presyo SRP Compliance Warning to a seller
export async function POST(req: NextRequest) {
  try {
    const admin = await getSessionAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { postId, userId, commodityName, listedPrice, suggestedSrp, maxPrice, unit } = body;

    if (!postId || !userId) {
      return NextResponse.json({ error: 'postId and userId are required' }, { status: 400 });
    }

    const notifTitle = `⚠️ Bantay Presyo SRP Compliance Advisory`;
    const notifContent = `Your marketplace listing #${postId} for "${commodityName || 'Produce'}" is priced at ₱${Number(listedPrice).toFixed(2)}/${unit || 'kg'}, which exceeds the Department of Agriculture ceiling of ₱${Number(maxPrice).toFixed(2)}/${unit || 'kg'} (Official SRP: ₱${Number(suggestedSrp).toFixed(2)}/${unit || 'kg'}). Please adjust your price to avoid listing removal.`;

    await query(
      `INSERT INTO \`notifications\` (user_id, actor_id, type, title, content, entity_name, target_id, is_read)
       VALUES (?, ?, 'price_warning', ?, ?, 'post', ?, 0)`,
      [userId, admin.id, notifTitle, notifContent, postId]
    );

    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    await logAdminActivity({
      action: 'SRP Price Compliance Advisory Sent',
      detail: `Sent Bantay Presyo warning for listing #${postId} (${commodityName}: listed ₱${listedPrice} vs SRP ₱${suggestedSrp})`,
      type: 'security',
      user: admin.email || 'admin@localfarm.com',
      ip: clientIp,
      status: 'warning'
    });

    return NextResponse.json({
      success: true,
      message: `Official Bantay Presyo SRP compliance warning dispatched to seller.`
    });
  } catch (error: any) {
    console.error('POST /api/admin/posts error:', error);
    return NextResponse.json({ error: error.message || 'Failed to send SRP warning' }, { status: 500 });
  }
}

// DELETE /api/admin/posts?id=... or ?commentId=...&postId=... - Delete produce listing or comment
export async function DELETE(req: NextRequest) {
  try {
    const admin = await getSessionAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const commentId = parseInt(searchParams.get('commentId') || '0', 10);
    const postId = parseInt(searchParams.get('postId') || '0', 10);

    // Delete individual comment if commentId is specified
    if (commentId) {
      await query('DELETE FROM `post_comments` WHERE id = ?', [commentId]);
      if (postId) {
        await query('UPDATE `posts` SET comments_count = GREATEST(0, comments_count - 1) WHERE id = ?', [postId]);
      }

      const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
      await logAdminActivity({
        action: 'Post Comment Removed',
        detail: `Moderator deleted comment #${commentId} on listing #${postId || 'N/A'}`,
        type: 'security',
        user: admin.email || 'admin@localfarm.com',
        ip: clientIp,
        status: 'warning'
      });

      return NextResponse.json({ success: true, message: `Comment #${commentId} removed.` });
    }

    const id = parseInt(searchParams.get('id') || '0', 10);

    if (!id) {
      return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 });
    }

    // Lookup post info for log
    const pRows = await query<any[]>('SELECT * FROM `posts` WHERE id = ?', [id]);
    const postSnippet = pRows?.[0]?.content?.slice(0, 50) || `#${id}`;

    await query('DELETE FROM `posts` WHERE id = ?', [id]);

    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    await logAdminActivity({
      action: 'Post Moderated & Deleted',
      detail: `Moderator deleted produce listing #${id}: "${postSnippet}..."`,
      type: 'security',
      user: admin.email || 'admin@localfarm.com',
      ip: clientIp,
      status: 'warning'
    });

    return NextResponse.json({ success: true, message: `Post #${id} deleted successfully.` });
  } catch (error: any) {
    console.error('Post delete error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete post' }, { status: 500 });
  }
}
