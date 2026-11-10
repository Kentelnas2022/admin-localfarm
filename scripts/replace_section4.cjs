const fs = require('fs');

const path = 'src/components/admin/AdminDashboardOverview.tsx';
let content = fs.readFileSync(path, 'utf8');

const section4Marker = '{/* 4. MUNICIPAL & BARANGAY AGRICULTURAL DISTRIBUTION */}';
const idx = content.indexOf(section4Marker);

if (idx !== -1) {
  const newSection4 = `{/* 4. MUNICIPAL & BARANGAY AGRICULTURAL DISTRIBUTION */}
      <div className="bg-white dark:bg-[#242526] rounded-3xl p-6 sm:p-7 border border-slate-200/90 dark:border-[#393a3b] shadow-sm select-none">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 pb-5 border-b border-slate-100 dark:border-[#343638]">
          <div>
            <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
              <h3 className="text-base sm:text-lg font-bold text-slate-950 dark:text-white leading-tight tracking-tight">
                Municipal & Barangay Farm Distribution
              </h3>
              <span className="inline-flex items-center text-[11px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 px-2.5 py-0.5 rounded-md">
                Department of Agriculture Cluster Registry
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
              Agrarian land distribution, cultivation status, and verified farming clusters across municipal zones.
            </p>
          </div>

          {/* Right Toolbar: Summary Metrics + View Mode Switcher */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Quick Summary Pill */}
            <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#1a1b1c] border border-slate-200/70 dark:border-slate-800 text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium">
                Monitored Farmland: <strong className="text-slate-900 dark:text-slate-100 font-bold font-mono">229.7 ha</strong>
              </span>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <span className="text-slate-500 dark:text-slate-400 font-medium">
                Active Producers: <strong className="text-slate-900 dark:text-slate-100 font-bold font-mono">101 Farms</strong>
              </span>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 dark:bg-[#18191a] p-1 rounded-xl border border-slate-200/80 dark:border-[#3a3b3c]">
              <button
                type="button"
                onClick={() => setClusterViewMode('cards')}
                className={\`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer \${
                  clusterViewMode === 'cards'
                    ? 'bg-white dark:bg-[#2e2f30] text-slate-900 dark:text-white shadow-xs font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                }\`}
                title="Cards view"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span>Cards</span>
              </button>
              <button
                type="button"
                onClick={() => setClusterViewMode('table')}
                className={\`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer \${
                  clusterViewMode === 'table'
                    ? 'bg-white dark:bg-[#2e2f30] text-slate-900 dark:text-white shadow-xs font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                }\`}
                title="Directory table view"
              >
                <TableIcon className="h-3.5 w-3.5" />
                <span>Table</span>
              </button>
            </div>
          </div>
        </div>

        {/* View Mode: Cards */}
        {clusterViewMode === 'cards' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                id: 'san-jose',
                barangay: 'Barangay San Jose',
                zone: 'Central Valley Sector',
                farms: 34,
                hectares: '84.5',
                crops: ['Rice', 'Yellow Corn', 'Eggplant'],
                status: 'harvest',
                statusLabel: 'Harvest Season'
              },
              {
                id: 'santa-cruz',
                barangay: 'Barangay Santa Cruz',
                zone: 'Highland Ridge Corridor',
                farms: 28,
                hectares: '62.0',
                crops: ['Red Onion', 'Tomato', 'Bell Pepper'],
                status: 'active',
                statusLabel: 'Active Cultivation'
              },
              {
                id: 'santo-nino',
                barangay: 'Barangay Santo Niño',
                zone: 'River Basin Lowlands',
                farms: 21,
                hectares: '45.2',
                crops: ['Bitter Gourd', 'Leafy Greens', 'Okra'],
                status: 'monitoring',
                statusLabel: 'Field Monitoring'
              },
              {
                id: 'san-roque',
                barangay: 'Barangay San Roque',
                zone: 'Eastern Slopes Sector',
                farms: 18,
                hectares: '38.0',
                crops: ['Cassava', 'Sweet Potato', 'Mango'],
                status: 'active',
                statusLabel: 'Active Cultivation'
              },
            ].map((cluster) => {
              const statusStyles = {
                harvest: {
                  bg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200/90 dark:border-emerald-800/60',
                  dot: 'bg-emerald-600',
                },
                active: {
                  bg: 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-700/60',
                  dot: 'bg-slate-500',
                },
                monitoring: {
                  bg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200/90 dark:border-amber-800/60',
                  dot: 'bg-amber-500',
                },
              }[cluster.status as 'harvest' | 'active' | 'monitoring'];

              return (
                <div
                  key={cluster.id}
                  className="rounded-2xl border border-slate-200/90 dark:border-[#343638] bg-slate-50/40 dark:bg-[#1a1b1d] hover:bg-white dark:hover:bg-[#202124] hover:border-slate-300 dark:hover:border-slate-700 transition-all p-5 flex flex-col justify-between group shadow-2xs"
                >
                  <div>
                    {/* Header: Barangay Name, Zone & Calm Agricultural Status */}
                    <div className="flex items-start justify-between gap-2 mb-4">
                      <div className="min-w-0 pr-1">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug group-hover:text-farm-700 dark:group-hover:text-farm-400 transition-colors">
                          {cluster.barangay}
                        </h4>
                        <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                          <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                          <span className="truncate">{cluster.zone}</span>
                        </div>
                      </div>

                      <span className={\`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full shrink-0 border \${statusStyles.bg}\`}>
                        <span className={\`h-1.5 w-1.5 rounded-full \${statusStyles.dot}\`} />
                        <span>{cluster.statusLabel}</span>
                      </span>
                    </div>

                    {/* Numeric Stats (Clean 2-Column, no nested box) */}
                    <div className="grid grid-cols-2 gap-3 py-3 border-y border-slate-200/70 dark:border-[#2e3033]">
                      <div>
                        <div className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                          Farmland Area
                        </div>
                        <div className="text-lg font-black text-slate-900 dark:text-white font-mono tracking-tight mt-0.5">
                          {cluster.hectares} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">ha</span>
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                          Producers
                        </div>
                        <div className="text-lg font-black text-slate-900 dark:text-white font-mono tracking-tight mt-0.5">
                          {cluster.farms} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">Farms</span>
                        </div>
                      </div>
                    </div>

                    {/* Staple Produce Chips */}
                    <div className="mt-3.5">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                        Primary Staple Produce
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {cluster.crops.map((crop) => (
                          <span
                            key={crop}
                            className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-white dark:bg-[#25272a] text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-[#383a3d]"
                          >
                            {crop}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Clean Footer Link */}
                  {onNavigateTab && (
                    <button
                      type="button"
                      onClick={() => onNavigateTab('verification')}
                      className="mt-4 pt-3 border-t border-slate-200/60 dark:border-[#2e3033] flex items-center justify-between text-xs font-semibold text-farm-700 dark:text-farm-400 hover:text-farm-800 dark:hover:text-farm-300 transition-colors w-full cursor-pointer group/btn"
                    >
                      <span>Accredited Producers</span>
                      <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* View Mode: Directory Ledger Table */
          <div className="overflow-x-auto rounded-2xl border border-slate-200/90 dark:border-[#343638]">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-[#1a1b1d] border-b border-slate-200/90 dark:border-[#343638] text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Barangay Cluster</th>
                  <th className="py-3 px-4">Geographic Sector</th>
                  <th className="py-3 px-4">Cultivation Status</th>
                  <th className="py-3 px-4">Registered Area</th>
                  <th className="py-3 px-4">Active Farms</th>
                  <th className="py-3 px-4">Staple Produce</th>
                  <th className="py-3 px-4 text-right">Directory</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#2e3033] bg-white dark:bg-[#1f2022]">
                {[
                  {
                    id: 'san-jose',
                    barangay: 'Barangay San Jose',
                    zone: 'Central Valley Sector',
                    farms: 34,
                    hectares: '84.5',
                    crops: ['Rice', 'Yellow Corn', 'Eggplant'],
                    status: 'harvest',
                    statusLabel: 'Harvest Season'
                  },
                  {
                    id: 'santa-cruz',
                    barangay: 'Barangay Santa Cruz',
                    zone: 'Highland Ridge Corridor',
                    farms: 28,
                    hectares: '62.0',
                    crops: ['Red Onion', 'Tomato', 'Bell Pepper'],
                    status: 'active',
                    statusLabel: 'Active Cultivation'
                  },
                  {
                    id: 'santo-nino',
                    barangay: 'Barangay Santo Niño',
                    zone: 'River Basin Lowlands',
                    farms: 21,
                    hectares: '45.2',
                    crops: ['Bitter Gourd', 'Leafy Greens', 'Okra'],
                    status: 'monitoring',
                    statusLabel: 'Field Monitoring'
                  },
                  {
                    id: 'san-roque',
                    barangay: 'Barangay San Roque',
                    zone: 'Eastern Slopes Sector',
                    farms: 18,
                    hectares: '38.0',
                    crops: ['Cassava', 'Sweet Potato', 'Mango'],
                    status: 'active',
                    statusLabel: 'Active Cultivation'
                  },
                ].map((cluster) => {
                  const statusStyles = {
                    harvest: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/60',
                    active: 'bg-slate-100 text-slate-700 dark:bg-slate-800/80 dark:text-slate-300 border-slate-200/80 dark:border-slate-700/60',
                    monitoring: 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/60',
                  }[cluster.status as 'harvest' | 'active' | 'monitoring'];

                  return (
                    <tr key={cluster.id} className="hover:bg-slate-50/70 dark:hover:bg-[#25272a] transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                        {cluster.barangay}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">
                        {cluster.zone}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={\`inline-flex items-center text-[11px] font-semibold px-2.5 py-0.5 rounded-full border \${statusStyles}\`}>
                          {cluster.statusLabel}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                        {cluster.hectares} ha
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                        {cluster.farms}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1">
                          {cluster.crops.map((crop) => (
                            <span
                              key={crop}
                              className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60"
                            >
                              {crop}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {onNavigateTab ? (
                          <button
                            type="button"
                            onClick={() => onNavigateTab('verification')}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-farm-700 dark:text-farm-400 hover:text-farm-800 dark:hover:text-farm-300 transition-colors cursor-pointer"
                          >
                            <span>Inspect</span>
                            <ArrowUpRight className="h-3 w-3" />
                          </button>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
`;

  content = content.slice(0, idx) + newSection4;
  fs.writeFileSync(path, content, 'utf8');
  console.log('Successfully replaced Section 4!');
} else {
  console.error('Section 4 marker not found!');
}
