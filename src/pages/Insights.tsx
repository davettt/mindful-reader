import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

import type { InsightsData } from '../types';
import * as api from '../services/api';

export default function Insights() {
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getInsights()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="font-serif text-lg text-stone-400">Gathering insights...</p>
      </div>
    );
  }

  if (!data || data.overall.length === 0) {
    return (
      <div className="py-8">
        <h1 className="font-serif text-2xl font-semibold text-stone-800">Your Reading Impact</h1>
        <div className="mt-16 text-center">
          <p className="font-serif text-xl text-stone-400">No data yet.</p>
          <p className="mt-2 text-sm text-stone-400">
            Rate some articles to see your impact trends.
          </p>
        </div>
      </div>
    );
  }

  const overallAvg = data.overall.reduce((sum, w) => sum + w.avg, 0) / data.overall.length;
  const recentWeeks = data.overall.slice(-4);
  const olderWeeks = data.overall.slice(-8, -4);
  const recentAvg =
    recentWeeks.length > 0
      ? recentWeeks.reduce((sum, w) => sum + w.avg, 0) / recentWeeks.length
      : overallAvg;
  const olderAvg =
    olderWeeks.length > 0
      ? olderWeeks.reduce((sum, w) => sum + w.avg, 0) / olderWeeks.length
      : overallAvg;

  let overallTrend = 'Steady';
  let trendIcon = '→';
  if (recentAvg > olderAvg + 0.3) {
    overallTrend = 'Improving';
    trendIcon = '↗';
  } else if (recentAvg < olderAvg - 0.3) {
    overallTrend = 'Declining';
    trendIcon = '↘';
  }

  const trendColor = (trend: string) => {
    if (trend === 'improving') return 'text-emerald-600';
    if (trend === 'declining') return 'text-rose-500';
    if (trend === 'insufficient') return 'text-stone-400';
    return 'text-stone-500';
  };

  const trendArrow = (trend: string) => {
    if (trend === 'improving') return '↗';
    if (trend === 'declining') return '↘';
    if (trend === 'insufficient') return '·';
    return '→';
  };

  const trendLabel = (trend: string) => {
    if (trend === 'insufficient') return 'not enough data';
    return trend;
  };

  const chartData = data.overall.map((w) => ({
    week: new Date(w.week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    impact: Number(w.avg.toFixed(1)),
    count: w.count,
  }));

  const impactLevels = [
    { value: 3, label: 'Strong', desc: 'shifted my perspective' },
    { value: 2, label: 'Moderate', desc: 'made me think' },
    { value: 1, label: 'Mild', desc: 'interesting but forgettable' },
    { value: 0, label: 'None', desc: 'just skimmed' },
  ];

  return (
    <div className="py-8">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl font-semibold text-stone-800">Your Reading Impact</h1>
        <div className="mt-1.5 flex items-center gap-1.5 text-sm text-stone-500">
          <span>{trendIcon}</span>
          <span>Overall trend</span>
          <span className="text-stone-300">·</span>
          <span className="font-medium text-stone-600">{overallTrend}</span>
        </div>
      </div>

      {/* Chart card */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-stone-200 bg-white">
        <div className="border-b border-stone-100 px-5 py-4">
          <h2 className="font-serif text-base font-medium text-stone-700">Daily impact</h2>
          <p className="mt-0.5 text-xs text-stone-400">
            Average rating across articles you read each day
          </p>
        </div>

        <div className="px-2 pt-4 pb-2">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
              <XAxis
                dataKey="week"
                tick={{ fontSize: 11, fill: '#a8a29e' }}
                axisLine={false}
                tickLine={false}
                dy={6}
              />
              <YAxis
                domain={[0, 3]}
                ticks={[0, 1, 2, 3]}
                tick={{ fontSize: 11, fill: '#78716c' }}
                axisLine={false}
                tickLine={false}
                width={70}
                tickFormatter={(v: number) => ['None', 'Mild', 'Moderate', 'Strong'][v] || ''}
              />
              <Tooltip
                contentStyle={{
                  background: 'white',
                  border: '1px solid #e7e5e4',
                  borderRadius: '8px',
                  fontSize: '13px',
                  padding: '8px 12px',
                }}
                labelStyle={{ color: '#78716c', fontWeight: 500, marginBottom: 2 }}
                formatter={(value) => [Number(value).toFixed(2), 'Impact']}
              />
              <Line
                type="monotone"
                dataKey="impact"
                stroke="#44403c"
                strokeWidth={2}
                dot={{ fill: '#44403c', r: 3, strokeWidth: 0 }}
                activeDot={{ r: 5, fill: '#44403c' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Scale legend */}
        <div className="border-t border-stone-100 bg-stone-50/50 px-5 py-3">
          <p className="text-[10px] tracking-wider text-stone-400 uppercase">Impact scale</p>
          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-4">
            {impactLevels.map((level) => (
              <div key={level.value} className="flex items-baseline gap-1.5 text-xs">
                <span className="font-medium text-stone-600">{level.value}</span>
                <span className="text-stone-500">{level.label}</span>
                <span className="truncate text-stone-300">— {level.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* By category */}
      <div className="mt-8">
        <h2 className="font-serif text-lg font-medium text-stone-700">By category</h2>
        <div className="mt-3 space-y-2">
          {Object.entries(data.byCategory).map(([cat, info]) => (
            <div key={cat} className="rounded-xl border border-stone-200 bg-white px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-stone-700">{cat}</p>
                  <p className="mt-0.5 text-xs text-stone-400">
                    {info.totalRatings} {info.totalRatings === 1 ? 'rating' : 'ratings'} ·{' '}
                    {trendLabel(info.trend)}
                  </p>
                </div>
                <div className="flex shrink-0 items-baseline gap-1">
                  <span className={`text-base font-semibold ${trendColor(info.trend)}`}>
                    {info.avg.toFixed(1)}
                  </span>
                  <span className="text-xs text-stone-300">/3</span>
                  <span className={`ml-1 text-sm ${trendColor(info.trend)}`}>
                    {trendArrow(info.trend)}
                  </span>
                </div>
              </div>
              {data.insights[cat] && (
                <p className="mt-2 border-t border-stone-100 pt-2 text-sm text-amber-600">
                  {data.insights[cat]}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
