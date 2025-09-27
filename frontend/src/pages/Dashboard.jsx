import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  CurrencyRupeeIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  DocumentTextIcon,
  CreditCardIcon,
  CalculatorIcon,
  CloudArrowUpIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';
import { supabase } from "../supabaseClient";

const Dashboard = ({ user }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setError("");
    if (!user?.id) return;
    try {
      // Get Supabase access token
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      const res = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/dashboard/${user.id}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );
      if (!res.ok) {
        const errData = await res.json();
        setError(errData.detail || "Failed to fetch dashboard data.");
        setDashboardData(null);
      } else {
        setDashboardData(await res.json());
      }
    } catch (err) {
      setError("Error fetching dashboard data.");
      setDashboardData(null);
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
    }
  });

  const monthlyData = dashboardData?.monthly_trend ? 
    Object.entries(dashboardData.monthly_trend).map(([month, data]) => ({
      month: month.split('-')[0],
      income: data.income,
      expense: data.expense,
      savings: data.net
    })) : [];

  const expenseCategories = [
    { name: 'Rent', value: 30000, percentage: 35 },
    { name: 'EMI', value: 25000, percentage: 29 },
    { name: 'Food', value: 12000, percentage: 14 },
    { name: 'Transport', value: 8000, percentage: 9 },
    { name: 'Utilities', value: 5000, percentage: 6 },
    { name: 'Others', value: 5000, percentage: 6 },
  ];

  const COLORS = ['#0ea5e9', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

  const StatCard = ({ title, value, change, icon: Icon, color }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {change && (
          <div className={`flex items-center space-x-1 ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {change > 0 ? <ArrowUpIcon className="w-4 h-4" /> : <ArrowDownIcon className="w-4 h-4" />}
            <span className="text-sm font-medium">{Math.abs(change)}%</span>
          </div>
        )}
      </div>
      <p className="text-sm text-gray-500 mb-1">{title}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl p-8 text-white"
      >
        <h1 className="text-3xl font-bold mb-2">Welcome back, {dashboardData?.user?.name}!</h1>
        <p className="text-primary-100 text-lg">
          Your financial health score is looking great. Keep up the good work!
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Monthly Income"
          value={`₹${(dashboardData?.financial_summary?.monthly_income || 0).toLocaleString()}`}
          change={5.2}
          icon={CurrencyRupeeIcon}
          color="bg-gradient-to-br from-green-500 to-green-700"
        />
        <StatCard
          title="Monthly Expenses"
          value={`₹${(dashboardData?.financial_summary?.monthly_expense || 0).toLocaleString()}`}
          change={-2.3}
          icon={DocumentTextIcon}
          color="bg-gradient-to-br from-red-500 to-red-700"
        />
        <StatCard
          title="CIBIL Score"
          value={dashboardData?.summary?.cibil_score || 750}
          change={3.5}
          icon={CreditCardIcon}
          color="bg-gradient-to-br from-primary-500 to-primary-700"
        />
        <StatCard
          title="Tax Saved"
          value={`₹${(dashboardData?.tax_summary?.potential_savings || 0).toLocaleString()}`}
          icon={CalculatorIcon}
          color="bg-gradient-to-br from-purple-500 to-purple-700"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income vs Expense Trend */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="card"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Income & Expense Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip />
              <Area type="monotone" dataKey="income" stroke="#10b981" fillOpacity={1} fill="url(#colorIncome)" />
              <Area type="monotone" dataKey="expense" stroke="#ef4444" fillOpacity={1} fill="url(#colorExpense)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Expense Breakdown */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="card"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Expense Categories</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={expenseCategories}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name} ${percentage}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {expenseCategories.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Savings Trend */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Monthly Savings Trend</h3>
          <div className="flex items-center space-x-2">
            <ArrowTrendingUpIcon className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-green-600">
              {dashboardData?.financial_summary?.savings_rate?.toFixed(1)}% savings rate
            </span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip />
            <Bar dataKey="savings" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <button className="p-6 bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl hover:from-primary-100 hover:to-primary-200 transition-all group">
          <CalculatorIcon className="w-8 h-8 text-primary-600 mb-3 group-hover:scale-110 transition-transform" />
          <p className="font-semibold text-gray-900">Calculate Tax</p>
          <p className="text-sm text-gray-600 mt-1">Optimize your tax savings</p>
        </button>
        <button className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl hover:from-green-100 hover:to-green-200 transition-all group">
          <CloudArrowUpIcon className="w-8 h-8 text-green-600 mb-3 group-hover:scale-110 transition-transform" />
          <p className="font-semibold text-gray-900">Upload Statement</p>
          <p className="text-sm text-gray-600 mt-1">Import your financial data</p>
        </button>
        <button className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl hover:from-purple-100 hover:to-purple-200 transition-all group">
          <CreditCardIcon className="w-8 h-8 text-purple-600 mb-3 group-hover:scale-110 transition-transform" />
          <p className="font-semibold text-gray-900">Check CIBIL</p>
          <p className="text-sm text-gray-600 mt-1">Monitor your credit health</p>
        </button>
      </motion.div>
      {error && <div>{typeof error === "string" ? error : JSON.stringify(error)}</div>}
    </div>
  );
};

export default Dashboard;