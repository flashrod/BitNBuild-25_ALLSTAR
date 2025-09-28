import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Chatbot from '../components/ChatBot';
import {
  ChartBarIcon,
  CurrencyRupeeIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  DocumentTextIcon,
  CalculatorIcon,
  CreditCardIcon,
  BanknotesIcon,
  HomeIcon,
  ShieldCheckIcon,
  LightBulbIcon,
  ExclamationTriangleIcon,
  UserCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import {
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const Dashboard = ({ user }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [taxData, setTaxData] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [cibilScore, setCibilScore] = useState(null);
  const [cibilAnalysis, setCibilAnalysis] = useState(null);
  const [cibilRecs, setCibilRecs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAllData();
  }, [user]);

  const fetchAllData = async () => {
    setLoading(true);
    setError("");
    try {
      const userId = user?.id || 'mock-user-id';
      setDashboardData(getDemoData());
      // Try to fetch real data in background
      try {
        const [taxRes, recRes, cibilRes, cibilRecRes] = await Promise.allSettled([
          fetch(`${API_URL}/tax/${userId}/calculate`).then(res => res.json()),
          fetch(`${API_URL}/tax/${userId}/recommendations`).then(res => res.json()),
          fetch(`${API_URL}/cibil/${userId}/score`).then(res => res.json()),
          fetch(`${API_URL}/cibil/${userId}/recommendations`).then(res => res.json())
        ]);
        if (taxRes.status === 'fulfilled' && taxRes.value) {
          setTaxData(taxRes.value);
        }
        if (recRes.status === 'fulfilled' && recRes.value?.recommendations) {
          setRecommendations(recRes.value.recommendations);
        }
        if (cibilRes.status === 'fulfilled' && cibilRes.value) {
          setCibilScore(cibilRes.value.current_score);
          setCibilAnalysis(cibilRes.value.score_factors);
        }
        if (cibilRecRes.status === 'fulfilled' && cibilRecRes.value?.recommendations) {
          setCibilRecs(cibilRecRes.value.recommendations);
        }
      } catch (bgError) {
        console.log('Background data fetch failed, using demo data');
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Unable to connect to server');
      setDashboardData(getDemoData());
    } finally {
      setLoading(false);
    }
  };

  const getDemoData = () => ({
    user: { name: user?.name || 'John Doe', email: user?.email || 'john@example.com' },
    summary: {
      total_transactions: 156,
      tax_regime: 'old',
      cibil_score: 750
    },
    financial_summary: {
      monthly_income: 150000,
      monthly_expense: 85000,
      savings_rate: 43.33
    },
    tax_summary: {
      estimated_tax: 245000,
      potential_savings: 45000
    },
    monthly_trend: {
      'Jan-2024': { income: 150000, expense: 82000, net: 68000 },
      'Feb-2024': { income: 150000, expense: 78000, net: 72000 },
      'Mar-2024': { income: 155000, expense: 89000, net: 66000 },
      'Apr-2024': { income: 150000, expense: 85000, net: 65000 },
      'May-2024': { income: 160000, expense: 92000, net: 68000 },
      'Jun-2024': { income: 150000, expense: 81000, net: 69000 },
    },
    expense_breakdown: [
      { name: 'Food & Dining', value: 25000, color: '#6366f1' },
      { name: 'Transportation', value: 15000, color: '#8b5cf6' },
      { name: 'Shopping', value: 20000, color: '#06b6d4' },
      { name: 'Bills & Utilities', value: 12000, color: '#10b981' },
      { name: 'Entertainment', value: 8000, color: '#f59e0b' },
      { name: 'Others', value: 5000, color: '#6b7280' }
    ],
    investment_breakdown: [
      { name: 'SIP/Mutual Funds', value: 25000, color: '#6366f1' },
      { name: 'Fixed Deposits', value: 15000, color: '#8b5cf6' },
      { name: 'PPF', value: 12500, color: '#06b6d4' },
      { name: 'ELSS', value: 10000, color: '#10b981' },
      { name: 'Stocks', value: 7500, color: '#f59e0b' }
    ]
  });

  // Prepare chart data
  const monthlyData = dashboardData?.monthly_trend ? 
    Object.entries(dashboardData.monthly_trend).map(([month, data]) => ({
      month: month.split('-')[0],
      income: data.income,
      expense: data.expense,
      savings: data.net
    })) : [];

  const expenseData = dashboardData?.expense_breakdown || [];
  const investmentData = dashboardData?.investment_breakdown || [];

  // Premium color palette
  const colors = {
    primary: '#1f2937',    // Charcoal
    secondary: '#6b7280',  // Gray
    accent: '#6366f1',     // Indigo
    success: '#10b981',    // Emerald
    warning: '#f59e0b',    // Amber
    danger: '#ef4444',     // Red
    surface: '#ffffff',    // White
    background: '#f9fafb', // Light gray
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-600 font-medium">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-light text-gray-900 mb-2">
                Good morning, {dashboardData?.user?.name || user?.name}
              </h1>
              <p className="text-gray-600">Here's your financial overview</p>
            </div>
            <div className="flex items-center space-x-8">
              <div className="text-right">
                <p className="text-sm text-gray-500">Tax Year</p>
                <p className="text-lg font-semibold text-gray-900">2024-25</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">CIBIL Score</p>
                <p className="text-lg font-semibold text-indigo-600">{dashboardData?.summary?.cibil_score || '750'}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center space-x-3"
          >
            <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <span className="text-amber-800">{error}</span>
          </motion.div>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <ArrowTrendingUpIcon className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="flex items-center text-emerald-600">
                <ArrowTrendingUpIcon className="w-4 h-4 mr-1" />
                <span className="text-sm font-medium">5.2%</span>
              </div>
            </div>
            <p className="text-sm text-gray-500 mb-1">Monthly Income</p>
            <p className="text-2xl font-light text-gray-900">
              ₹{dashboardData?.financial_summary?.monthly_income?.toLocaleString() || '0'}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <CurrencyRupeeIcon className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex items-center text-emerald-600">
                <ArrowTrendingDownIcon className="w-4 h-4 mr-1" />
                <span className="text-sm font-medium">2.1%</span>
              </div>
            </div>
            <p className="text-sm text-gray-500 mb-1">Monthly Expenses</p>
            <p className="text-2xl font-light text-gray-900">
              ₹{dashboardData?.financial_summary?.monthly_expense?.toLocaleString() || '0'}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <ChartBarIcon className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="flex items-center text-emerald-600">
                <ArrowTrendingUpIcon className="w-4 h-4 mr-1" />
                <span className="text-sm font-medium">3.5%</span>
              </div>
            </div>
            <p className="text-sm text-gray-500 mb-1">Savings Rate</p>
            <p className="text-2xl font-light text-gray-900">
              {dashboardData?.financial_summary?.savings_rate?.toFixed(1) || '0'}%
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-gray-100 rounded-lg">
                <DocumentTextIcon className="w-5 h-5 text-gray-600" />
              </div>
            </div>
            <p className="text-sm text-gray-500 mb-1">Total Transactions</p>
            <p className="text-2xl font-light text-gray-900">{dashboardData?.summary?.total_transactions || '0'}</p>
          </motion.div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Monthly Trend */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
          >
            <h3 className="text-lg font-medium text-gray-900 mb-6">Monthly Trend</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#64748b' }}
                  />
                  <YAxis 
                    tickFormatter={(value) => `₹${(value/1000).toFixed(0)}K`}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#64748b' }}
                  />
                  <Tooltip 
                    formatter={(value, name) => [`₹${value.toLocaleString()}`, name === 'income' ? 'Income' : name === 'expense' ? 'Expenses' : 'Savings']}
                    labelFormatter={(label) => `${label} 2024`}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="income" 
                    stroke="#10b981" 
                    fill="url(#colorIncome)" 
                    strokeWidth={2}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="expense" 
                    stroke="#ef4444" 
                    fill="url(#colorExpense)" 
                    strokeWidth={2}
                  />
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Expense Breakdown */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
          >
            <h3 className="text-lg font-medium text-gray-900 mb-6">Expense Breakdown</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {expenseData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => `₹${value.toLocaleString()}`}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Legend */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              {expenseData.map((entry, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: entry.color }}
                  ></div>
                  <span className="text-sm text-gray-600 truncate">{entry.name}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Second Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Investment Portfolio */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
          >
            <h3 className="text-lg font-medium text-gray-900 mb-6">Investment Portfolio</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={investmentData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {investmentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => `₹${value.toLocaleString()}`}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Legend */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              {investmentData.map((entry, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: entry.color }}
                  ></div>
                  <span className="text-sm text-gray-600 truncate">{entry.name}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Tax Summary */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">Tax Summary</h3>
              <CalculatorIcon className="w-5 h-5 text-gray-400" />
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Recommended Regime</span>
                <span className="font-medium text-gray-900">
                  {taxData?.recommended_regime?.toUpperCase() || 'NEW'}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 px-4 bg-indigo-50 rounded-lg">
                <span className="text-gray-600">Tax Savings</span>
                <span className="font-medium text-indigo-600">
                  ₹{taxData?.savings_with_recommendation?.toLocaleString() || '117,000'}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Total Tax</span>
                <span className="font-medium text-gray-900">
                  ₹{taxData?.[taxData.recommended_regime + '_regime']?.tax_payable?.toLocaleString() || '3,236,688'}
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Smart Patterns */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-center space-x-3 mb-6">
              <DocumentTextIcon className="w-5 h-5 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900">Smart Patterns</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <BanknotesIcon className="w-5 h-5 text-indigo-600" />
                  <span className="text-sm font-medium text-gray-900">3</span>
                </div>
                <p className="text-sm font-medium text-gray-900 mb-1">EMI Payments</p>
                <p className="text-xs text-gray-600">₹45,000/month</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <ArrowTrendingUpIcon className="w-5 h-5 text-emerald-600" />
                  <span className="text-sm font-medium text-gray-900">5</span>
                </div>
                <p className="text-sm font-medium text-gray-900 mb-1">SIP Investments</p>
                <p className="text-xs text-gray-600">₹25,000/month</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <HomeIcon className="w-5 h-5 text-cyan-600" />
                  <span className="text-sm font-medium text-gray-900">1</span>
                </div>
                <p className="text-sm font-medium text-gray-900 mb-1">Rent Payment</p>
                <p className="text-xs text-gray-600">₹30,000/month</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <ShieldCheckIcon className="w-5 h-5 text-violet-600" />
                  <span className="text-sm font-medium text-gray-900">2</span>
                </div>
                <p className="text-sm font-medium text-gray-900 mb-1">Insurance</p>
                <p className="text-xs text-gray-600">₹12,000/year</p>
              </div>
            </div>
          </motion.div>

          {/* AI Recommendations */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-center space-x-3 mb-6">
              <LightBulbIcon className="w-5 h-5 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900">AI Recommendations</h3>
            </div>
            <div className="space-y-4">
              {recommendations.length > 0 ? (
                recommendations.slice(0, 3).map((rec, idx) => (
                  <div key={idx} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-gray-900 text-sm">{rec.title}</h4>
                      <span className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-full">
                        {rec.category}
                      </span>
                    </div>
                    <p className="text-gray-600 text-xs mb-2">{rec.description}</p>
                    <p className="text-emerald-600 font-medium text-xs">
                      Save: ₹{rec.potential_savings?.toLocaleString()}
                    </p>
                  </div>
                ))
              ) : (
                <>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 text-sm mb-1">Maximize 80C Deductions</h4>
                    <p className="text-gray-600 text-xs mb-2">Invest ₹1.5L in ELSS, PPF for tax savings</p>
                    <p className="text-emerald-600 font-medium text-xs">Save: ₹46,800</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 text-sm mb-1">Health Insurance Premium</h4>
                    <p className="text-gray-600 text-xs mb-2">Claim ₹25K under 80D for health insurance</p>
                    <p className="text-emerald-600 font-medium text-xs">Save: ₹7,800</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 text-sm mb-1">Home Loan Interest</h4>
                    <p className="text-gray-600 text-xs mb-2">Claim ₹2L under 24(b) for home loan interest</p>
                    <p className="text-emerald-600 font-medium text-xs">Save: ₹62,400</p>
                  </div>
                </>
              )}
            </div>
          </motion.div>

          {/* CIBIL Score & Recommendations */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-center space-x-3 mb-6">
              <CreditCardIcon className="w-5 h-5 text-indigo-600" />
              <h3 className="text-lg font-medium text-gray-900">CIBIL Score</h3>
            </div>
            <div className="mb-4 flex items-center space-x-4">
              <div className="flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-indigo-700">{cibilScore || dashboardData?.summary?.cibil_score || '750'}</span>
                <span className="text-xs text-gray-500">Current Score</span>
              </div>
              <div className="flex-1">
                {cibilAnalysis && (
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(cibilAnalysis).map(([factor, details], idx) => (
                      <div key={factor} className="bg-gray-50 rounded-lg p-2 flex flex-col">
                        <span className="text-xs text-gray-500 font-medium">{factor.replace(/_/g, ' ')}</span>
                        <span className="text-sm text-gray-900">{details.status || details.current || details.average_age || details.accounts || details.recent}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="mt-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Improvement Recommendations</h4>
              {cibilRecs.length > 0 ? (
                <ul className="space-y-2">
                  {cibilRecs.slice(0, 3).map((rec, idx) => (
                    <li key={idx} className="bg-gray-50 rounded-lg p-2 text-xs text-gray-700">
                      <span className="font-medium text-indigo-700">{rec.title}:</span> {rec.description}
                      {rec.expected_score_improvement && (
                        <span className="ml-2 text-emerald-600 font-semibold">+{rec.expected_score_improvement} pts</span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="text-xs text-gray-500">No recommendations available.</span>
              )}
            </div>
          </motion.div>
        </div>
      </div>
      {/* Chatbot floating widget */}
      <Chatbot />
    </div>
  );
};

export default Dashboard;