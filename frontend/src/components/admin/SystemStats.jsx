// src/components/admin/SystemStats.jsx
import { useQuery } from "@tanstack/react-query";
import { adminService } from "../../services/adminService";

export default function SystemStats() {
  const { data } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: () => adminService.getDashboardStats(),
  });

  const calculators = data?.calculator_usage || [];

  return (
    <div className="card-retro p-5">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 border-2 border-retro-green/40 flex items-center justify-center">
          <svg className="w-4 h-4 text-retro-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <div>
          <h2 className="font-retro text-xl text-retro-white tracking-wider">
            CALCULATOR USAGE
          </h2>
          <p className="font-mono text-[10px] text-retro-white/30 tracking-widest">
            POPULARITY BY TYPE
          </p>
        </div>
      </div>

      {calculators.length > 0 ? (
        <div className="space-y-3">
          {calculators.map((calc) => {
            const maxUses = Math.max(...calculators.map((c) => c.total_uses || 1));
            const pct = ((calc.total_uses || 0) / maxUses) * 100;

            return (
              <div key={calc.slug} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-sport text-sm text-retro-white/70 tracking-wider">
                    {calc.name}
                  </span>
                  <span className="font-mono text-xs text-retro-green">
                    {calc.total_uses}
                  </span>
                </div>
                <div className="h-2 bg-retro-black border border-retro-gray-light/30">
                  <div
                    className="h-full bg-gradient-to-r from-retro-green-light to-retro-green transition-all duration-700"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-retro-white/20">
          <svg className="w-10 h-10 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="font-mono text-xs tracking-wider">No data yet</p>
        </div>
      )}
    </div>
  );
}
