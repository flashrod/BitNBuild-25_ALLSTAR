import React, { useState, useEffect } from 'react';
import { useFinancialData } from '../FinancialDataContext';
import { motion } from 'framer-motion';
import {
  ChartBarIcon,
  ChartPieIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CurrencyRupeeIcon,
  CalendarIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  LineChart, Line, Area, AreaChart,
  ComposedChart, CartesianGrid
} from 'recharts';

const Analysis = ({ user }) => {
  const { analysis, loading: aggLoading, error: aggError } = useFinancialData();
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('monthly');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    setLoading(aggLoading);
    setError(aggError);
    if (analysis) {
      setAnalysisData(analysis);
      setLoading(false);
    } else if (aggError) {
      setAnalysisData(getDemoAnalysis());
      setLoading(false);
    }
  }, [analysis, aggLoading, aggError, timeRange]);

  // Fallback demo data
  const getDemoAnalysis = () => ({
    metrics: {
      total_income: 150000,
      total_expenses: 85000,
      net_savings: 65000,
      portfolio_value: 2000000,
      income_growth: 5.2,
      expense_growth: 3.1,
      savings_rate: 43.3
    },
    trend_data: [
      { period: 'Jan-2024', income: 150000, expenses: 82000 },
      { period: 'Feb-2024', income: 150000, expenses: 78000 },
      { period: 'Mar-2024', income: 155000, expenses: 89000 },
      { period: 'Apr-2024', income: 150000, expenses: 85000 },
      { period: 'May-2024', income: 160000, expenses: 92000 },
      { period: 'Jun-2024', income: 150000, expenses: 81000 }
    ],
    category_distribution: [
      { category: 'Food & Dining', value: 25000, percentage: 29.4 },
      { category: 'Transportation', value: 15000, percentage: 17.6 },
      { category: 'Shopping', value: 20000, percentage: 23.5 },
      { category: 'Bills & Utilities', value: 12000, percentage: 14.1 },
      { category: 'Entertainment', value: 8000, percentage: 9.4 },
      { category: 'Others', value: 5000, percentage: 5.9 }
    ],
    monthly_comparison: [
      { month: 'Jan', income: 150000, expenses: 82000, savings: 68000 },
      { month: 'Feb', income: 150000, expenses: 78000, savings: 72000 },
      { month: 'Mar', income: 155000, expenses: 89000, savings: 66000 },
      { month: 'Apr', income: 150000, expenses: 85000, savings: 65000 },
      { month: 'May', income: 160000, expenses: 92000, savings: 68000 },
      { month: 'Jun', income: 150000, expenses: 81000, savings: 69000 }
    ],
    investment_performance: [
      { date: 'Jan-2024', portfolio_value: 2000000, invested_amount: 1800000 },
      { date: 'Feb-2024', portfolio_value: 2020000, invested_amount: 1820000 },
      { date: 'Mar-2024', portfolio_value: 2050000, invested_amount: 1850000 },
      { date: 'Apr-2024', portfolio_value: 2080000, invested_amount: 1880000 },
      { date: 'May-2024', portfolio_value: 2100000, invested_amount: 1900000 },
      { date: 'Jun-2024', portfolio_value: 2120000, invested_amount: 1920000 }
    ],
    capital_gains_timeline: [
      { date: 'Jan-2024', cumulative: 50000, short_term: 20000, long_term: 30000 },
      { date: 'Feb-2024', cumulative: 52000, short_term: 21000, long_term: 31000 },
      { date: 'Mar-2024', cumulative: 54000, short_term: 22000, long_term: 32000 },
      { date: 'Apr-2024', cumulative: 56000, short_term: 23000, long_term: 33000 },
      { date: 'May-2024', cumulative: 58000, short_term: 24000, long_term: 34000 },
      { date: 'Jun-2024', cumulative: 60000, short_term: 25000, long_term: 35000 }
    ],
    tax_breakdown: [
      { name: 'Income Tax', value: 45000 },
      { name: 'Capital Gains', value: 12000 },
      { name: 'Deductions', value: -15000 }
    ],
    debt_overview: [
      { type: 'Home Loan', principal: 2500000, interest_paid: 120000, remaining: 2200000 }
    ],
    insights: {
      top_expense_category: 'Food & Dining',
      top_expense_amount: 25000,
      best_investment: 'Index Fund',
      best_investment_return: 12.4,
      tax_efficiency: 78,
      tax_saved: 15000
    }
  });

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

  // Format currency
  const formatCurrency = (value) => {
    return `₹${value?.toLocaleString() || 0}`;
  };

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="text-sm font-medium text-gray-900">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-600 font-medium">Loading analysis...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-8 text-white"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <ChartBarIcon className="w-10 h-10" />
            <div>
              <h1 className="text-3xl font-bold mb-2">Financial Analysis</h1>
              <p className="text-purple-100 text-lg">
                Comprehensive charts and visualizations of your financial data
              </p>
            </div>
          </div>
          <div className="flex space-x-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 bg-white/20 backdrop-blur text-white rounded-lg border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
        </div>
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg"
        >
          {error}
        </motion.div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between mb-4">
            <ArrowTrendingUpIcon className="w-8 h-8 text-green-600" />
            <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
              +{analysisData?.metrics?.income_growth || 0}%
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(analysisData?.metrics?.total_income)}
          </p>
          <p className="text-sm text-gray-600">Total Income</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between mb-4">
            <ArrowTrendingDownIcon className="w-8 h-8 text-red-600" />
            <span className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded-full">
              +{analysisData?.metrics?.expense_growth || 0}%
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(analysisData?.metrics?.total_expenses)}
          </p>
          <p className="text-sm text-gray-600">Total Expenses</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between mb-4">
            <CurrencyRupeeIcon className="w-8 h-8 text-blue-600" />
            <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
              {analysisData?.metrics?.savings_rate || 0}%
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(analysisData?.metrics?.net_savings)}
          </p>
          <p className="text-sm text-gray-600">Net Savings</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between mb-4">
            <ChartPieIcon className="w-8 h-8 text-purple-600" />
            <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
              Portfolio
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(analysisData?.metrics?.portfolio_value)}
          </p>
          <p className="text-sm text-gray-600">Portfolio Value</p>
        </motion.div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income vs Expenses Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Income vs Expenses Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={analysisData?.trend_data || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="period" tick={{ fontSize: 12, fill: '#6b7280' }} />
              <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={(value) => `₹${value/1000}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="income" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
              <Area type="monotone" dataKey="expenses" stackId="2" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} />
              <Legend />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Category Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Expense Category Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analysisData?.category_distribution || []}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${entry.percentage}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {(analysisData?.category_distribution || []).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Monthly Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Comparison</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analysisData?.monthly_comparison || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6b7280' }} />
              <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={(value) => `₹${value/1000}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="income" fill="#10b981" radius={[8, 8, 0, 0]} />
              <Bar dataKey="expenses" fill="#ef4444" radius={[8, 8, 0, 0]} />
              <Bar dataKey="savings" fill="#6366f1" radius={[8, 8, 0, 0]} />
              <Legend />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Investment Performance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Investment Performance</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analysisData?.investment_performance || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#6b7280' }} />
              <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={(value) => `₹${value/1000}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="portfolio_value" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1' }} />
              <Line type="monotone" dataKey="invested_amount" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: '#8b5cf6' }} strokeDasharray="5 5" />
              <Legend />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Capital Gains Analysis */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Capital Gains Analysis</h2>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={analysisData?.capital_gains_timeline || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#6b7280' }} />
              <YAxis yAxisId="left" tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={(value) => `₹${value/1000}k`} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: '#6b7280' }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar yAxisId="left" dataKey="short_term" fill="#f59e0b" radius={[8, 8, 0, 0]} />
              <Bar yAxisId="left" dataKey="long_term" fill="#10b981" radius={[8, 8, 0, 0]} />
              <Line yAxisId="right" type="monotone" dataKey="cumulative" stroke="#6366f1" strokeWidth={2} />
              <Legend />
            </ComposedChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Tax Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Tax Breakdown</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analysisData?.tax_breakdown || []}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="value"
              >
                {(analysisData?.tax_breakdown || []).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Debt Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Debt Overview</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analysisData?.debt_overview || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="type" tick={{ fontSize: 12, fill: '#6b7280' }} />
              <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={(value) => `₹${value/1000}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="principal" fill="#ef4444" radius={[8, 8, 0, 0]} />
              <Bar dataKey="interest_paid" fill="#f59e0b" radius={[8, 8, 0, 0]} />
              <Bar dataKey="remaining" fill="#6b7280" radius={[8, 8, 0, 0]} />
              <Legend />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-50 to-indigo-100 p-6 rounded-xl"
        >
          <h3 className="font-semibold text-gray-900 mb-2">Top Expense Category</h3>
          <p className="text-2xl font-bold text-indigo-600">
            {analysisData?.insights?.top_expense_category || 'N/A'}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            {formatCurrency(analysisData?.insights?.top_expense_amount)} this period
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-green-50 to-emerald-100 p-6 rounded-xl"
        >
          <h3 className="font-semibold text-gray-900 mb-2">Best Investment</h3>
          <p className="text-2xl font-bold text-green-600">
            {analysisData?.insights?.best_investment || 'N/A'}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            {analysisData?.insights?.best_investment_return || 0}% return
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-purple-50 to-pink-100 p-6 rounded-xl"
        >
          <h3 className="font-semibold text-gray-900 mb-2">Tax Efficiency</h3>
          <p className="text-2xl font-bold text-purple-600">
            {analysisData?.insights?.tax_efficiency || 0}%
          </p>
          <p className="text-sm text-gray-600 mt-1">
            {formatCurrency(analysisData?.insights?.tax_saved)} saved in deductions
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Analysis;