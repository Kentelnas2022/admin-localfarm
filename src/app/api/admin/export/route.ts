import { NextRequest, NextResponse } from 'next/server';
import { getSessionAdmin } from '@/lib/auth';
import { query } from '@/lib/db';
import { buildLocalFarmPdfReport, TableCell, KpiCard, ColumnDef } from '@/lib/pdfDocument';

export async function GET(req: NextRequest) {
  try {
    const admin = await getSessionAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = (searchParams.get('type') || 'farmers').toLowerCase();
    const format = (searchParams.get('format') || 'pdf').toLowerCase();
    const dateStr = new Date().toISOString().split('T')[0];
    const adminEmail = admin.email || 'admin@localfarm.com';

    // Helper: escape CSV cell (for fallback format=csv)
    const csvEscape = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    // -------------------------------------------------------------
    // 1. ALL USERS / COMMUNITY MEMBERS DIRECTORY
    // -------------------------------------------------------------
    if (type === 'users' || type === 'members') {
      const rows = await query<any[]>(`
        SELECT 
          u.id,
          u.full_name,
          u.username,
          u.email,
          u.phone_number,
          u.role,
          u.status,
          u.is_verified,
          u.created_at,
          fp.farm_name,
          fp.farm_location
        FROM \`users\` u
        LEFT JOIN \`farmer_profiles\` fp ON u.id = fp.user_id
        ORDER BY u.id ASC
      `);

      const farmersCount = rows.filter((r) => (r.role || '').toLowerCase() === 'farmer').length;
      const staffCount = rows.filter((r) => ['staff', 'admin', 'super_admin'].includes((r.role || '').toLowerCase())).length;
      const activeCount = rows.filter((r) => (r.status || 'active').toLowerCase() === 'active').length;
      const pendingCount = rows.filter((r) => (r.status || '').toLowerCase() === 'pending').length;

      if (format === 'csv') {
        const headers = ['User ID', 'Full Name', 'Username', 'Email', 'Phone', 'Role', 'Status', 'Farm Name', 'Location', 'Registered Date'];
        const csvLines = [
          headers.join(','),
          ...rows.map((r) =>
            [
              csvEscape(r.id),
              csvEscape(r.full_name),
              csvEscape(r.username),
              csvEscape(r.email),
              csvEscape(r.phone_number),
              csvEscape(r.role),
              csvEscape(r.status),
              csvEscape(r.farm_name || 'N/A'),
              csvEscape(r.farm_location || 'N/A'),
              csvEscape(r.created_at ? new Date(r.created_at).toLocaleDateString() : '')
            ].join(',')
          )
        ];
        return new NextResponse(csvLines.join('\r\n'), {
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="LocalFarm-Members-Directory-${dateStr}.csv"`
          }
        });
      }

      // Elegant PDF
      const columns: ColumnDef[] = [
        { header: 'ID', width: 45, align: 'center' },
        { header: 'Full Name', width: 135 },
        { header: 'Username', width: 85 },
        { header: 'Email Address', width: 140 },
        { header: 'Contact No.', width: 85 },
        { header: 'Role', width: 75, align: 'center' },
        { header: 'Account Status', width: 85, align: 'center' },
        { header: 'Enrolled Date', width: 75, align: 'center' }
      ];

      const kpis: KpiCard[] = [
        { label: 'Total Registered', value: `${rows.length}`, subtitle: 'Active platform entities' },
        { label: 'Producers / Farmers', value: `${farmersCount}`, subtitle: 'Accredited suppliers', color: [0.106, 0.369, 0.125] },
        { label: 'Active Status', value: `${activeCount}`, subtitle: 'Compliant members', color: [0.086, 0.451, 0.286] },
        { label: 'Pending Review', value: `${pendingCount}`, subtitle: 'Awaiting onboarding', color: [0.706, 0.392, 0.039] }
      ];

      const tableRows: (TableCell | string)[][] = rows.map((r) => {
        const role = (r.role || 'consumer').toLowerCase();
        let roleBadge: 'info' | 'success' | 'neutral' = 'neutral';
        if (role === 'farmer') roleBadge = 'success';
        else if (['staff', 'admin', 'super_admin'].includes(role)) roleBadge = 'info';

        const status = (r.status || 'active').toLowerCase();
        let statusBadge: 'success' | 'warning' | 'danger' = 'success';
        if (status === 'pending') statusBadge = 'warning';
        else if (status === 'suspended' || status === 'banned') statusBadge = 'danger';

        return [
          { text: `#${r.id}`, bold: true },
          { text: r.full_name || 'N/A', bold: true },
          `@${r.username || 'user'}`,
          r.email || 'N/A',
          r.phone_number || 'N/A',
          { text: r.role || 'consumer', badge: roleBadge },
          { text: r.status || 'active', badge: statusBadge },
          r.created_at ? new Date(r.created_at).toLocaleDateString() : 'N/A'
        ];
      });

      const pdfBuffer = buildLocalFarmPdfReport({
        title: 'Community Members & Users Directory',
        subtitle: 'Comprehensive Directory of Verified Farmers, Consumers, Administrative Staff, and System Personnel',
        department: 'User Identity & Platform Governance Registry',
        adminEmail,
        documentRef: `LF-USR-${dateStr.replace(/-/g, '')}`,
        kpis,
        columns,
        rows: tableRows
      });

      return new NextResponse(pdfBuffer as any, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="LocalFarm-Members-Directory-${dateStr}.pdf"`
        }
      });
    }

    // -------------------------------------------------------------
    // 2. FARMER ACCREDITATION DIRECTORY
    // -------------------------------------------------------------
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

      const verifiedCount = rows.filter((r) => (r.verification_status || '').toLowerCase() === 'verified').length;
      const pendingCount = rows.filter((r) => (r.verification_status || '').toLowerCase() === 'pending').length;
      const totalHectares = rows.reduce((sum, r) => sum + parseFloat(r.hectares || '0'), 0).toFixed(1);

      if (format === 'csv') {
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
          ...rows.map((r) =>
            [
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
            ].join(',')
          )
        ];

        return new NextResponse(csvLines.join('\r\n'), {
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="localfarm-farmers-registry-${dateStr}.csv"`
          }
        });
      }

      // Elegant PDF
      const columns: ColumnDef[] = [
        { header: 'Accreditation ID', width: 75, align: 'center' },
        { header: 'Producer Name', width: 110 },
        { header: 'Farm Facility', width: 105 },
        { header: 'Municipal Location', width: 105 },
        { header: 'Area (Ha)', width: 55, align: 'right' },
        { header: 'Cultivated Produce', width: 110 },
        { header: 'Yield Trend', width: 65, align: 'center' },
        { header: 'Accreditation', width: 85, align: 'center' },
        { header: 'Audit Date', width: 65, align: 'center' }
      ];

      const kpis: KpiCard[] = [
        { label: 'Registered Farms', value: `${rows.length}`, subtitle: 'Active facilities' },
        { label: 'Accredited & Verified', value: `${verifiedCount}`, subtitle: 'PhilGAP standard compliant', color: [0.106, 0.369, 0.125] },
        { label: 'Pending Inspection', value: `${pendingCount}`, subtitle: 'Awaiting field audit', color: [0.706, 0.392, 0.039] },
        { label: 'Total Arable Land', value: `${totalHectares} Ha`, subtitle: 'Productive farm area', color: [0.086, 0.451, 0.286] }
      ];

      const tableRows: (TableCell | string)[][] = rows.map((r) => {
        const status = (r.verification_status || 'pending').toLowerCase();
        let statusBadge: 'success' | 'warning' | 'danger' = 'warning';
        if (status === 'verified') statusBadge = 'success';
        else if (status === 'rejected') statusBadge = 'danger';

        return [
          { text: r.farmer_code || 'LF-PENDING', bold: true },
          { text: r.full_name || 'N/A', bold: true },
          r.farm_name || 'Family Farmstead',
          r.farm_location || 'Local Municipality',
          `${parseFloat(r.hectares || '1.0').toFixed(1)} ha`,
          r.crops || 'High-value crops',
          r.yield_trend || 'Stable',
          { text: r.verification_status === 'verified' ? 'ACCREDITED' : 'PENDING AUDIT', badge: statusBadge },
          r.created_at ? new Date(r.created_at).toLocaleDateString() : dateStr
        ];
      });

      const pdfBuffer = buildLocalFarmPdfReport({
        title: 'Farmer Accreditation & Producer Registry',
        subtitle: 'Official Registry of Verified Agricultural Producers, Certified Land Parcels, and Production Capacities',
        department: 'Agricultural Accreditation & Municipal Field Verification Board',
        adminEmail,
        documentRef: `LF-FAR-${dateStr.replace(/-/g, '')}`,
        kpis,
        columns,
        rows: tableRows
      });

      return new NextResponse(pdfBuffer as any, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="LocalFarm-Farmer-Accreditation-${dateStr}.pdf"`
        }
      });
    }

    // -------------------------------------------------------------
    // 3. DEPARTMENT OF AGRICULTURE (DA) COMPLIANCE AUDIT REPORT
    // -------------------------------------------------------------
    if (type === 'da_report') {
      const farmers = await query<any[]>(`
        SELECT 
          fp.farmer_code,
          u.full_name,
          fp.farm_name,
          fp.farm_location,
          fp.hectares,
          fp.crops,
          fp.rsbsa_number,
          fp.verification_status,
          fp.certifications,
          fp.created_at
        FROM \`farmer_profiles\` fp
        INNER JOIN \`users\` u ON fp.user_id = u.id
        ORDER BY fp.farm_location ASC, fp.id ASC
      `);

      const totalHectares = farmers.reduce((sum, f) => sum + parseFloat(f.hectares || '0'), 0).toFixed(1);
      const philgapCount = farmers.filter((f) => (f.certifications || '').toLowerCase().includes('philgap')).length;
      const rsbsaCount = farmers.filter((f) => Boolean(f.rsbsa_number && String(f.rsbsa_number).trim() !== '')).length;

      if (format === 'csv') {
        const headers = [
          'Accreditation Code',
          'Registered Producer Name',
          'Farm Facility Name',
          'Municipal / Barangay Location',
          'Arable Land (Hectares)',
          'Registered Crops / Produce',
          'RSBSA Registry Number',
          'PhilGAP Accreditation Status',
          'Compliance Certifications',
          'Audit Enrolment Date'
        ];

        const csvLines = [
          '# DEPARTMENT OF AGRICULTURE & MUNICIPAL AGRICULTURE OFFICE (MAO) OFFICIAL AUDIT',
          `# Generated Date: ${dateStr}`,
          `# Total Registered Producers: ${farmers.length}`,
          `# Total Registered Arable Area: ${totalHectares} Hectares`,
          `# PhilGAP Accredited: ${philgapCount} | RSBSA Verified: ${rsbsaCount}`,
          '# --------------------------------------------------------------------------------',
          headers.join(','),
          ...farmers.map((f) =>
            [
              csvEscape(f.farmer_code || 'LF-PENDING'),
              csvEscape(f.full_name),
              csvEscape(f.farm_name),
              csvEscape(f.farm_location),
              csvEscape(f.hectares || '1.0'),
              csvEscape(f.crops),
              csvEscape(f.rsbsa_number || 'N/A'),
              csvEscape(f.verification_status === 'verified' ? 'ACCREDITED' : 'PENDING EVALUATION'),
              csvEscape(f.certifications || 'LocalFarm Standard'),
              csvEscape(f.created_at ? new Date(f.created_at).toLocaleDateString() : dateStr)
            ].join(',')
          )
        ];

        return new NextResponse(csvLines.join('\r\n'), {
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="DA-MAO-Agriculture-Compliance-Report-${dateStr}.csv"`
          }
        });
      }

      // Elegant PDF
      const columns: ColumnDef[] = [
        { header: 'Accreditation ID', width: 75, align: 'center' },
        { header: 'Producer Full Name', width: 110 },
        { header: 'Farm Facility', width: 100 },
        { header: 'Barangay Location', width: 100 },
        { header: 'Land (Ha)', width: 55, align: 'right' },
        { header: 'Registered Produce', width: 95 },
        { header: 'RSBSA Registry No.', width: 85 },
        { header: 'PhilGAP Standard', width: 85, align: 'center' },
        { header: 'Certification', width: 70 },
        { header: 'Enrolment Date', width: 65, align: 'center' }
      ];

      const kpis: KpiCard[] = [
        { label: 'Registered Producers', value: `${farmers.length}`, subtitle: 'Official registry entries' },
        { label: 'Total Arable Area', value: `${totalHectares} Ha`, subtitle: 'Documented agricultural area', color: [0.106, 0.369, 0.125] },
        { label: 'PhilGAP Accredited', value: `${philgapCount}`, subtitle: 'Good agricultural practice certified', color: [0.086, 0.451, 0.286] },
        { label: 'RSBSA Verified', value: `${rsbsaCount}`, subtitle: 'National DA Registry of Farmers', color: [0.078, 0.353, 0.647] }
      ];

      const tableRows: (TableCell | string)[][] = farmers.map((f) => {
        const isVerified = (f.verification_status || '').toLowerCase() === 'verified';
        return [
          { text: f.farmer_code || 'LF-PENDING', bold: true },
          { text: f.full_name || 'N/A', bold: true },
          f.farm_name || 'Family Farmstead',
          f.farm_location || 'Local Municipality',
          `${parseFloat(f.hectares || '1.0').toFixed(1)} ha`,
          f.crops || 'High-value crops',
          f.rsbsa_number || 'PENDING',
          { text: isVerified ? 'ACCREDITED' : 'UNDER EVAL', badge: isVerified ? 'success' : 'warning' },
          f.certifications || 'Standard GAP',
          f.created_at ? new Date(f.created_at).toLocaleDateString() : dateStr
        ];
      });

      const pdfBuffer = buildLocalFarmPdfReport({
        title: 'Department of Agriculture & MAO Compliance Audit',
        subtitle: 'Comprehensive Land Registry, PhilGAP Agricultural Standards, and RSBSA Producer Verification Audit',
        department: 'Department of Agriculture (DA) & Municipal Agriculture Office (MAO)',
        adminEmail,
        documentRef: `DA-AUDIT-${dateStr.replace(/-/g, '')}`,
        kpis,
        columns,
        rows: tableRows
      });

      return new NextResponse(pdfBuffer as any, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="DA-MAO-Agriculture-Compliance-Report-${dateStr}.pdf"`
        }
      });
    }

    // -------------------------------------------------------------
    // 4. COMMODITY PRICE WATCH & SRP BULLETIN
    // -------------------------------------------------------------
    if (type === 'prices') {
      const rows = await query<any[]>('SELECT * FROM `commodity_prices` ORDER BY category ASC, commodity_name ASC');

      const categories = Array.from(new Set(rows.map((r) => r.category))).filter(Boolean);
      const stableCount = rows.filter((r) => (r.price_trend || '').toLowerCase().includes('stable')).length;
      const volatileCount = rows.length - stableCount;

      if (format === 'csv') {
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
          ...rows.map((r) =>
            [
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
            ].join(',')
          )
        ];

        return new NextResponse(csvLines.join('\r\n'), {
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="localfarm-price-bulletin-${dateStr}.csv"`
          }
        });
      }

      // Elegant PDF
      const columns: ColumnDef[] = [
        { header: 'ID', width: 35, align: 'center' },
        { header: 'Commodity Name', width: 125 },
        { header: 'Category', width: 85 },
        { header: 'Min Price', width: 70, align: 'right' },
        { header: 'Max Price', width: 70, align: 'right' },
        { header: 'Suggested SRP', width: 80, align: 'right' },
        { header: 'Unit', width: 50, align: 'center' },
        { header: 'Price Trend', width: 70, align: 'center' },
        { header: 'Variance', width: 65, align: 'right' },
        { header: 'Market Source', width: 120 }
      ];

      const kpis: KpiCard[] = [
        { label: 'Tracked Commodities', value: `${rows.length}`, subtitle: 'Active agricultural items' },
        { label: 'Commodity Categories', value: `${categories.length}`, subtitle: 'Grain, poultry, veggies', color: [0.106, 0.369, 0.125] },
        { label: 'Stable Pricing', value: `${stableCount}`, subtitle: 'Within standard SRP range', color: [0.086, 0.451, 0.286] },
        { label: 'Price Volatility Alerts', value: `${volatileCount}`, subtitle: 'Fluctuating commodities', color: [0.706, 0.392, 0.039] }
      ];

      const tableRows: (TableCell | string)[][] = rows.map((r) => {
        const trend = (r.price_trend || 'stable').toLowerCase();
        let trendBadge: 'neutral' | 'warning' | 'info' = 'neutral';
        if (trend.includes('rising') || trend.includes('up')) trendBadge = 'warning';
        else if (trend.includes('falling') || trend.includes('down')) trendBadge = 'info';

        return [
          { text: `#${r.id}`, bold: true },
          { text: r.commodity_name || 'N/A', bold: true },
          r.category || 'General Produce',
          `PHP ${parseFloat(r.min_price || '0').toFixed(2)}`,
          `PHP ${parseFloat(r.max_price || '0').toFixed(2)}`,
          { text: `PHP ${parseFloat(r.suggested_srp || '0').toFixed(2)}`, bold: true, color: [0.106, 0.369, 0.125] },
          r.unit || 'kg',
          { text: r.price_trend || 'STABLE', badge: trendBadge },
          `${r.change_percentage || '0'}%`,
          r.market_source || 'DA Agribusiness Market Board'
        ];
      });

      const pdfBuffer = buildLocalFarmPdfReport({
        title: 'Commodity Price Watch & Suggested Retail Price Bulletin',
        subtitle: 'Official Daily Wholesale Benchmark, Retail Ceiling Prices, and Agribusiness Market Variance Monitor',
        department: 'Agribusiness & Marketing Assistance Service (AMAS) • Price Advisory Unit',
        adminEmail,
        documentRef: `LF-PRC-${dateStr.replace(/-/g, '')}`,
        kpis,
        columns,
        rows: tableRows
      });

      return new NextResponse(pdfBuffer as any, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="LocalFarm-Price-Watch-Bulletin-${dateStr}.pdf"`
        }
      });
    }

    // -------------------------------------------------------------
    // 5. SAFETY, MODERATION & DISPUTE AUDIT REPORT
    // -------------------------------------------------------------
    if (type === 'reports') {
      const rows = await query<any[]>('SELECT * FROM `reports` ORDER BY id ASC');

      const resolvedCount = rows.filter((r) => (r.status || '').toLowerCase() === 'resolved').length;
      const reviewCount = rows.filter((r) => ['pending', 'in_review', 'under_investigation'].includes((r.status || '').toLowerCase())).length;
      const highSeverityCount = rows.filter((r) => ['high', 'critical', 'urgent'].includes((r.severity || '').toLowerCase())).length;

      if (format === 'csv') {
        const headers = ['Report Code', 'Reporter', 'Reported User', 'Type', 'Reason', 'Severity', 'Status', 'Date Reported', 'Statement'];
        const csvLines = [
          headers.join(','),
          ...rows.map((r) =>
            [
              csvEscape(r.report_code),
              csvEscape(r.reporter_name),
              csvEscape(r.reported_user_name),
              csvEscape(r.report_type),
              csvEscape(r.reason),
              csvEscape(r.severity),
              csvEscape(r.status),
              csvEscape(r.date_reported),
              csvEscape(r.statement)
            ].join(',')
          )
        ];

        return new NextResponse(csvLines.join('\r\n'), {
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="localfarm-moderation-log-${dateStr}.csv"`
          }
        });
      }

      // Elegant PDF
      const columns: ColumnDef[] = [
        { header: 'Case Ref Code', width: 75, align: 'center' },
        { header: 'Reporting Party', width: 110 },
        { header: 'Reported Subject', width: 110 },
        { header: 'Incident Type', width: 85 },
        { header: 'Specific Reason / Violation', width: 140 },
        { header: 'Severity', width: 70, align: 'center' },
        { header: 'Resolution', width: 80, align: 'center' },
        { header: 'Filing Date', width: 75, align: 'center' }
      ];

      const kpis: KpiCard[] = [
        { label: 'Total Filed Cases', value: `${rows.length}`, subtitle: 'Platform moderation logs' },
        { label: 'Resolved Cases', value: `${resolvedCount}`, subtitle: 'Closed with remediation', color: [0.086, 0.451, 0.286] },
        { label: 'Active Investigation', value: `${reviewCount}`, subtitle: 'Under moderator review', color: [0.706, 0.392, 0.039] },
        { label: 'High Severity Escalations', value: `${highSeverityCount}`, subtitle: 'Immediate priority', color: [0.745, 0.118, 0.176] }
      ];

      const tableRows: (TableCell | string)[][] = rows.map((r) => {
        const sev = (r.severity || 'low').toLowerCase();
        let sevBadge: 'danger' | 'warning' | 'info' | 'neutral' = 'neutral';
        if (sev === 'critical' || sev === 'high') sevBadge = 'danger';
        else if (sev === 'medium') sevBadge = 'warning';
        else if (sev === 'low') sevBadge = 'info';

        const status = (r.status || 'pending').toLowerCase();
        let statusBadge: 'success' | 'warning' | 'danger' = 'warning';
        if (status === 'resolved' || status === 'closed') statusBadge = 'success';
        else if (status === 'dismissed') statusBadge = 'warning';
        else if (status === 'suspended') statusBadge = 'danger';

        return [
          { text: r.report_code || `#${r.id}`, bold: true },
          { text: r.reporter_name || 'Anonymous User', bold: true },
          r.reported_user_name || 'Listing #N/A',
          r.report_type || 'Platform Violation',
          r.reason || r.statement || 'No detailed statement filed',
          { text: r.severity || 'NORMAL', badge: sevBadge },
          { text: r.status || 'PENDING', badge: statusBadge },
          r.date_reported ? new Date(r.date_reported).toLocaleDateString() : dateStr
        ];
      });

      const pdfBuffer = buildLocalFarmPdfReport({
        title: 'Safety, Moderation & Dispute Audit Report',
        subtitle: 'Formal Case Filing Ledger, Trade Dispute Mediations, Member Grievances, and Security Disciplinary Actions',
        department: 'Trust & Safety Operations • Member Protection Council',
        adminEmail,
        documentRef: `LF-MOD-${dateStr.replace(/-/g, '')}`,
        kpis,
        columns,
        rows: tableRows
      });

      return new NextResponse(pdfBuffer as any, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="LocalFarm-Moderation-Cases-${dateStr}.pdf"`
        }
      });
    }

    // -------------------------------------------------------------
    // 6. OFFICIAL ANNOUNCEMENTS & ADVISORY BULLETINS
    // -------------------------------------------------------------
    if (type === 'announcements') {
      const rows = await query<any[]>('SELECT * FROM `announcements` ORDER BY is_pinned DESC, id DESC');

      const pinnedCount = rows.filter((r) => Boolean(r.is_pinned)).length;
      const activeCount = rows.filter((r) => !r.is_archived).length;
      const urgentCount = rows.filter((r) => (r.priority || '').toLowerCase() === 'urgent' || (r.priority || '').toLowerCase() === 'high').length;

      if (format === 'csv') {
        const headers = ['ID', 'Title', 'Category', 'Priority', 'Target Audience', 'Pinned', 'Archived', 'Created At', 'Content'];
        const csvLines = [
          headers.join(','),
          ...rows.map((r) =>
            [
              csvEscape(r.id),
              csvEscape(r.title),
              csvEscape(r.category),
              csvEscape(r.priority),
              csvEscape(r.target_audience),
              csvEscape(r.is_pinned ? 'Yes' : 'No'),
              csvEscape(r.is_archived ? 'Yes' : 'No'),
              csvEscape(r.created_at ? new Date(r.created_at).toLocaleString() : ''),
              csvEscape(r.content)
            ].join(',')
          )
        ];

        return new NextResponse(csvLines.join('\r\n'), {
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="localfarm-announcements-${dateStr}.csv"`
          }
        });
      }

      // Elegant PDF
      const columns: ColumnDef[] = [
        { header: 'Ref ID', width: 45, align: 'center' },
        { header: 'Notice Headline', width: 175 },
        { header: 'Advisory Category', width: 95 },
        { header: 'Urgency', width: 75, align: 'center' },
        { header: 'Audience', width: 90 },
        { header: 'Pinned', width: 65, align: 'center' },
        { header: 'Status', width: 65, align: 'center' },
        { header: 'Date Broadcasted', width: 85, align: 'center' }
      ];

      const kpis: KpiCard[] = [
        { label: 'Total Bulletins', value: `${rows.length}`, subtitle: 'Published advisories' },
        { label: 'Active Broadcasts', value: `${activeCount}`, subtitle: 'Currently visible to members', color: [0.106, 0.369, 0.125] },
        { label: 'Pinned Directives', value: `${pinnedCount}`, subtitle: 'Affixed top priorities', color: [0.086, 0.451, 0.286] },
        { label: 'Urgent Notices', value: `${urgentCount}`, subtitle: 'Immediate weather/pest alerts', color: [0.745, 0.118, 0.176] }
      ];

      const tableRows: (TableCell | string)[][] = rows.map((r) => {
        const prio = (r.priority || 'normal').toLowerCase();
        let prioBadge: 'danger' | 'warning' | 'success' | 'neutral' = 'neutral';
        if (prio === 'urgent') prioBadge = 'danger';
        else if (prio === 'high') prioBadge = 'warning';
        else if (prio === 'normal') prioBadge = 'success';

        return [
          { text: `#${r.id}`, bold: true },
          { text: r.title || 'Official Advisory', bold: true },
          r.category || 'General Notice',
          { text: r.priority || 'NORMAL', badge: prioBadge },
          r.target_audience || 'All Community Members',
          { text: r.is_pinned ? 'PINNED' : 'STANDARD', badge: r.is_pinned ? 'success' : 'neutral' },
          { text: r.is_archived ? 'ARCHIVED' : 'ACTIVE', badge: r.is_archived ? 'neutral' : 'success' },
          r.created_at ? new Date(r.created_at).toLocaleDateString() : dateStr
        ];
      });

      const pdfBuffer = buildLocalFarmPdfReport({
        title: 'Agricultural Bulletins & Official Advisories',
        subtitle: 'Municipal Directives, Severe Weather Warnings, Pest Advisories, and Community Announcements',
        department: 'Public Affairs & Community Agricultural Outreach Division',
        adminEmail,
        documentRef: `LF-ANN-${dateStr.replace(/-/g, '')}`,
        kpis,
        columns,
        rows: tableRows
      });

      return new NextResponse(pdfBuffer as any, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="LocalFarm-Announcements-Bulletins-${dateStr}.pdf"`
        }
      });
    }

    // -------------------------------------------------------------
    // 7. MARKETPLACE LISTINGS & HARVEST PRODUCE AUDIT
    // -------------------------------------------------------------
    if (type === 'posts') {
      const rows = await query<any[]>(`
        SELECT p.id, p.category, p.location, p.likes_count, p.comments_count, p.shares_count, p.created_at, p.content,
               u.full_name, u.email, fp.farm_name
        FROM \`posts\` p
        LEFT JOIN \`users\` u ON p.user_id = u.id
        LEFT JOIN \`farmer_profiles\` fp ON u.id = fp.user_id
        ORDER BY p.id DESC
      `);

      const totalLikes = rows.reduce((sum, r) => sum + parseInt(r.likes_count || '0', 10), 0);
      const totalComments = rows.reduce((sum, r) => sum + parseInt(r.comments_count || '0', 10), 0);
      const uniqueCats = Array.from(new Set(rows.map((r) => r.category))).filter(Boolean).length;

      if (format === 'csv') {
        const headers = ['Post ID', 'Author', 'Farm Name', 'Category', 'Location', 'Likes', 'Comments', 'Shares', 'Created At', 'Content'];
        const csvLines = [
          headers.join(','),
          ...rows.map((r) =>
            [
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
            ].join(',')
          )
        ];

        return new NextResponse(csvLines.join('\r\n'), {
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="localfarm-produce-listings-${dateStr}.csv"`
          }
        });
      }

      // Elegant PDF
      const columns: ColumnDef[] = [
        { header: 'Listing ID', width: 55, align: 'center' },
        { header: 'Producer / Author', width: 120 },
        { header: 'Farm Facility', width: 110 },
        { header: 'Produce Category', width: 90 },
        { header: 'Dispatch Location', width: 110 },
        { header: 'Likes', width: 50, align: 'right' },
        { header: 'Comments', width: 55, align: 'right' },
        { header: 'Shares', width: 50, align: 'right' },
        { header: 'Listed Date', width: 75, align: 'center' }
      ];

      const kpis: KpiCard[] = [
        { label: 'Harvest Listings', value: `${rows.length}`, subtitle: 'Active produce posts' },
        { label: 'Consumer Inquiries', value: `${totalComments}`, subtitle: 'Buyer engagement', color: [0.106, 0.369, 0.125] },
        { label: 'Consumer Favorites', value: `${totalLikes}`, subtitle: 'Community endorsement', color: [0.086, 0.451, 0.286] },
        { label: 'Active Categories', value: `${uniqueCats}`, subtitle: 'Diverse agricultural goods', color: [0.078, 0.353, 0.647] }
      ];

      const tableRows: (TableCell | string)[][] = rows.map((r) => [
        { text: `#${r.id}`, bold: true },
        { text: r.full_name || 'Community Producer', bold: true },
        r.farm_name || 'Local Farmstead',
        r.category || 'High-value crops',
        r.location || 'Local Municipality',
        String(r.likes_count || 0),
        String(r.comments_count || 0),
        String(r.shares_count || 0),
        r.created_at ? new Date(r.created_at).toLocaleDateString() : dateStr
      ]);

      const pdfBuffer = buildLocalFarmPdfReport({
        title: 'Marketplace Directory & Harvest Listings Audit',
        subtitle: 'Verified Farm Harvest Listings, Produce Availability, and Commercial Trade Engagement Metrics',
        department: 'Agribusiness Marketplace Operations & Commercial Trade Board',
        adminEmail,
        documentRef: `LF-MKT-${dateStr.replace(/-/g, '')}`,
        kpis,
        columns,
        rows: tableRows
      });

      return new NextResponse(pdfBuffer as any, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="LocalFarm-Produce-Listings-${dateStr}.pdf"`
        }
      });
    }

    // -------------------------------------------------------------
    // 8. STORIES & FIELD BROADCASTS AUDIT
    // -------------------------------------------------------------
    if (type === 'stories') {
      const rows = await query<any[]>(`
        SELECT s.id, s.text_content, s.caption, s.views_count, s.is_featured, s.created_at, s.expires_at,
               u.full_name, u.username, fp.farm_name
        FROM \`stories\` s
        LEFT JOIN \`users\` u ON s.user_id = u.id
        LEFT JOIN \`farmer_profiles\` fp ON u.id = fp.user_id
        ORDER BY s.id DESC
      `);

      const totalViews = rows.reduce((sum, r) => sum + parseInt(r.views_count || '0', 10), 0);
      const featuredCount = rows.filter((r) => Boolean(r.is_featured)).length;
      const activeCount = rows.filter((r) => new Date(r.expires_at).getTime() > Date.now()).length;

      const columns: ColumnDef[] = [
        { header: 'Story ID', width: 55, align: 'center' },
        { header: 'Producer / Author', width: 130 },
        { header: 'Farm Facility', width: 120 },
        { header: 'Story Caption / Content', width: 180 },
        { header: 'Views', width: 60, align: 'right' },
        { header: 'Spotlight', width: 70, align: 'center' },
        { header: 'Status', width: 70, align: 'center' },
        { header: 'Published Date', width: 85, align: 'center' }
      ];

      const kpis: KpiCard[] = [
        { label: 'Total Stories', value: `${rows.length}`, subtitle: 'Harvest broadcasts' },
        { label: 'Live Active Stories', value: `${activeCount}`, subtitle: 'Active in mobile app', color: [0.106, 0.369, 0.125] },
        { label: 'Spotlight Featured', value: `${featuredCount}`, subtitle: 'Feed highlights', color: [0.086, 0.451, 0.286] },
        { label: 'Viewer Receipts', value: `${totalViews}`, subtitle: 'Total verified views', color: [0.078, 0.353, 0.647] }
      ];

      const tableRows: (TableCell | string)[][] = rows.map((r) => {
        const isLive = new Date(r.expires_at).getTime() > Date.now();
        return [
          { text: `#${r.id}`, bold: true },
          { text: r.full_name || 'Community Producer', bold: true },
          r.farm_name || 'Local Farmstead',
          r.caption || r.text_content || 'Photo/Video Broadcast',
          String(r.views_count || 0),
          { text: r.is_featured ? 'FEATURED' : 'STANDARD', badge: r.is_featured ? 'success' : 'neutral' },
          { text: isLive ? 'LIVE' : 'EXPIRED', badge: isLive ? 'success' : 'neutral' },
          r.created_at ? new Date(r.created_at).toLocaleDateString() : dateStr
        ];
      });

      const pdfBuffer = buildLocalFarmPdfReport({
        title: 'Stories & Field Broadcasts Audit',
        subtitle: 'Producer Harvest Stories, Mobile Video Dispatches, and Consumer Engagement Receipts',
        department: 'Mobile Feed Outreach & Digital Agribusiness Promotion',
        adminEmail,
        documentRef: `LF-STR-${dateStr.replace(/-/g, '')}`,
        kpis,
        columns,
        rows: tableRows
      });

      return new NextResponse(pdfBuffer as any, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="LocalFarm-Field-Stories-${dateStr}.pdf"`
        }
      });
    }

    // -------------------------------------------------------------
    // 9. ADMINISTRATIVE ACTIVITY & AUDIT LOGS
    // -------------------------------------------------------------
    if (type === 'logs' || type === 'activity_logs') {
      const rows = await query<any[]>(`
        SELECT id, action, detail, type, user, ip, status, created_at
        FROM \`admin_activity_logs\`
        ORDER BY id DESC
        LIMIT 250
      `);

      const successCount = rows.filter((r) => (r.status || '').toLowerCase() === 'success').length;
      const warningCount = rows.filter((r) => (r.status || '').toLowerCase() === 'warning' || (r.status || '').toLowerCase() === 'failed').length;

      const columns: ColumnDef[] = [
        { header: 'Log ID', width: 50, align: 'center' },
        { header: 'Action Executed', width: 140 },
        { header: 'Audit Detail / Payload', width: 200 },
        { header: 'Category', width: 80, align: 'center' },
        { header: 'Actor User', width: 100 },
        { header: 'IP Address', width: 85, align: 'center' },
        { header: 'Outcome', width: 70, align: 'center' },
        { header: 'Timestamp', width: 85, align: 'center' }
      ];

      const kpis: KpiCard[] = [
        { label: 'Audit Records', value: `${rows.length}`, subtitle: 'Recent administrative actions' },
        { label: 'Authorized Operations', value: `${successCount}`, subtitle: 'Standard successful execution', color: [0.106, 0.369, 0.125] },
        { label: 'Security Alerts / Flags', value: `${warningCount}`, subtitle: 'Anomalies or failed actions', color: [0.745, 0.118, 0.176] }
      ];

      const tableRows: (TableCell | string)[][] = rows.map((r) => {
        const status = (r.status || 'success').toLowerCase();
        let badge: 'success' | 'warning' | 'danger' = 'success';
        if (status === 'warning') badge = 'warning';
        else if (status === 'failed' || status === 'error') badge = 'danger';

        return [
          { text: `#${r.id}`, bold: true },
          { text: r.action || 'Admin Action', bold: true },
          r.detail || 'Standard administrative operation',
          { text: r.type || 'system', badge: 'neutral' },
          r.user || 'superadmin',
          r.ip || '127.0.0.1',
          { text: r.status || 'SUCCESS', badge },
          r.created_at ? new Date(r.created_at).toLocaleDateString() : dateStr
        ];
      });

      const pdfBuffer = buildLocalFarmPdfReport({
        title: 'Platform Administrative Audit Trail',
        subtitle: 'Formal Ledger of Administrator Actions, System Security Events, and Configuration Mutations',
        department: 'Security Governance & Compliance Monitoring',
        adminEmail,
        documentRef: `LF-AUD-${dateStr.replace(/-/g, '')}`,
        kpis,
        columns,
        rows: tableRows
      });

      return new NextResponse(pdfBuffer as any, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="LocalFarm-Activity-Audit-Trail-${dateStr}.pdf"`
        }
      });
    }

    return NextResponse.json({ error: 'Invalid export type requested' }, { status: 400 });
  } catch (error: any) {
    console.error('Export error:', error);
    return NextResponse.json({ error: error.message || 'Export failed' }, { status: 500 });
  }
}
