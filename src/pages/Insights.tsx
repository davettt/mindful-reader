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
    return 'text-stone-500';
  };

  const trendArrow = (trend: string) => {
    if (trend === 'improving') return '↗';
    if (trend === 'declining') return '↘';
    return '→';
  };

  const chartData = data.overall.map((w) => ({
    week: new Date(w.week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    impact: Number(w.avg.toFixed(1)),
  }));

  return (
    <div className="py-8">
      <h1 className="font-serif text-2xl font-semibold text-stone-800">Your Reading Impact</h1>

      <div className="mt-2 flex items-center gap-2">
        <span className="text-lg">{trendIcon}</span>
        <span className="text-sm text-stone-500">Overall Trend: {overallTrend}</span>
      </div>

      <div className="mt-6 rounded-xl border border-stone-200 bg-white p-4">
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData}>
            <XAxis
              dataKey="week"
              tick={{ fontSize: 11, fill: '#a8a29e' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 3]}
              ticks={[0, 1, 2, 3]}
              tick={{ fontSize: 11, fill: '#a8a29e' }}
              axisLine={false}
              tickLine={false}
              width={20}
            />
            <Tooltip
              contentStyle={{
                background: 'white',
                border: '1px solid #e7e5e4',
                borderRadius: '8px',
                fontSize: '13px',
              }}
            />
            <Line
              type="monotone"
              dataKey="impact"
              stroke="#44403c"
              strokeWidth={2}
              dot={{ fill: '#44403c', r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6">
        <h2 className="font-serif text-lg font-medium text-stone-700">By Category</h2>
        <div className="mt-3 space-y-3">
          {Object.entries(data.byCategory).map(([cat, info]) => (
            <div key={cat} className="rounded-xl border border-stone-200 bg-white px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="font-medium text-stone-700">{cat}</span>
                <div className="flex items-center gap-2">
                  <span className={`text-sm ${trendColor(info.trend)}`}>
                    {trendArrow(info.trend)} {info.avg.toFixed(1)} avg
                  </span>
                  <span className="text-xs text-stone-300">({info.trend})</span>
                </div>
              </div>
              {data.insights[cat] && (
                <p className="mt-2 text-sm text-amber-600">{data.insights[cat]}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
