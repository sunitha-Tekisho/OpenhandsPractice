import { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../utils/api';

const CATEGORY_COLORS = {
  Food: '#10b981',
  Transport: '#3b82f6',
  Shopping: '#f59e0b',
  Bills: '#ef4444',
  Entertainment: '#8b5cf6',
  Health: '#ec4899',
  Other: '#6b7280'
};

export default function Analytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const { getToken } = useAuth();

  const fetchAnalytics = useCallback(async () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    try {
      const res = await fetch(`${API_BASE_URL}/api/analytics/${year}/${month}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const data = await res.json();
      setAnalytics(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-text-secondary">Loading analytics...</p>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-text-secondary">Unable to load analytics</p>
      </div>
    );
  }

  const categoryData = Object.entries(analytics.categoryBreakdown || {}).map(([name, value]) => ({
    name,
    value,
    percentage: (analytics.categoryPercentages?.[name] || 0).toFixed(1)
  }));

  const last6Months = (analytics.last6Months || []).map(m => ({
    ...m,
    monthLabel: new Date(m.year, m.month - 1).toLocaleDateString('en-US', { month: 'short' })
  }));

  return (
    <div className="flex-1 p-4 md:p-8 max-w-5xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-semibold mb-2">Analytics</h1>
        <p className="text-text-secondary">
          Insight into your spending patterns
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-surface rounded-lg p-6 fade-in">
          <p className="text-text-secondary text-sm mb-2">This Month Total</p>
          <p className="text-2xl font-semibold text-primary">
            {formatAmount(analytics.total || 0)}
          </p>
        </div>
        <div className="bg-surface rounded-lg p-6 fade-in">
          <p className="text-text-secondary text-sm mb-2">Last Month</p>
          <p className="text-2xl font-semibold">
            {formatAmount(analytics.prevMonthTotal || 0)}
          </p>
        </div>
        <div className="bg-surface rounded-lg p-6 fade-in">
          <p className="text-text-secondary text-sm mb-2">Change</p>
          <p className={`text-2xl font-semibold ${analytics.comparison >= 0 ? 'text-danger' : 'text-primary'}`}>
            {analytics.comparison >= 0 ? '+' : ''}{analytics.comparison?.toFixed(1) || 0}%
          </p>
        </div>
      </div>

      {/* Monthly Trend Chart */}
      {last6Months.length > 0 && (
        <div className="bg-surface rounded-lg p-6 mb-8 fade-in">
          <h2 className="text-lg font-semibold mb-6">Monthly Spending Trend</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={last6Months} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <XAxis
                  dataKey="monthLabel"
                  stroke="#a3a3a3"
                  tick={{ fill: '#a3a3a3', fontSize: 12 }}
                  axisLine={{ stroke: '#404040' }}
                />
                <YAxis
                  stroke="#a3a3a3"
                  tick={{ fill: '#a3a3a3', fontSize: 12 }}
                  tickFormatter={(value) => `$${value}`}
                  axisLine={{ stroke: '#404040' }}
                />
                <Tooltip
                  formatter={(value) => [formatAmount(value), 'Total']}
                  contentStyle={{
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #404040',
                    borderRadius: '8px'
                  }}
                  labelStyle={{ color: '#f5f5f5' }}
                />
                <Bar dataKey="total" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Category Breakdown */}
      {categoryData.length > 0 && (
        <div className="bg-surface rounded-lg p-6 fade-in">
          <h2 className="text-lg font-semibold mb-6">Spending by Category</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percentage }) => `${name} (${percentage}%)`}
                    labelLine={{ stroke: '#a3a3a3' }}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name] || '#6b7280'} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [formatAmount(value), 'Amount']}
                    contentStyle={{
                      backgroundColor: '#1a1a1a',
                      border: '1px solid #404040',
                      borderRadius: '8px'
                    }}
                    labelStyle={{ color: '#f5f5f5' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3">
              {categoryData.map(cat => (
                <div key={cat.name} className="flex items-center justify-between p-3 bg-surface-elevated rounded-md">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: CATEGORY_COLORS[cat.name] || '#6b7280' }}
                    />
                    <span>{cat.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatAmount(cat.value)}</p>
                    <p className="text-sm text-text-secondary">{cat.percentage}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {categoryData.length === 0 && last6Months.length === 0 && (
        <div className="bg-surface rounded-lg p-8 text-center">
          <p className="text-text-secondary">
            No data to display. Start adding expenses to see your analytics!
          </p>
        </div>
      )}
    </div>
  );
}