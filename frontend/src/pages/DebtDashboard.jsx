import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  AcademicCapIcon,
  ChartBarIcon,
  DocumentTextIcon,
  PlusIcon,
  BanknotesIcon,
  CalculatorIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

// Style reference: CIBILAdvisor.jsx
const initialDebts = [];
const API_BASE = "http://localhost:8000";
const mockUserId = "mock-user-id";

const DebtDashboard = () => {
  const [debts, setDebts] = useState(initialDebts);
  const [form, setForm] = useState({ name: "", amount: "", rate: "", minPayment: "" });
  const [strategy, setStrategy] = useState("snowball");
  const [simulation, setSimulation] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef();
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");

  // Fetch debts from backend
  useEffect(() => {
    fetch(`${API_BASE}/debt/list?user_id=${mockUserId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.debts) setDebts(data.debts);
      });
  }, []);

  // Handle form input changes
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Add new debt
  const handleAddDebt = (e) => {
    e.preventDefault();
    if (!form.name || !form.amount || !form.rate || !form.minPayment) return;
    setDebts([
      ...debts,
      {
        name: form.name,
        amount: parseFloat(form.amount),
        rate: parseFloat(form.rate),
        minPayment: parseFloat(form.minPayment),
      },
    ]);
    setForm({ name: "", amount: "", rate: "", minPayment: "" });
  };

  // Simulate repayment
  const handleSimulate = async () => {
    setLoading(true);
    const formData = new FormData();
    formData.append("user_id", mockUserId);
    formData.append("strategy", strategy);
    const res = await fetch(`${API_BASE}/debt/simulate`, {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    setSimulation(data);
    setLoading(false);
  };

  // Handle CSV upload
  const handleFileUpload = async (e) => {
    setUploadError("");
    setUploadSuccess("");
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("user_id", mockUserId);
    formData.append("file", file);
    try {
      const res = await fetch(`${API_BASE}/debt/ingest`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setUploadSuccess(`Uploaded ${file.name} successfully!`);
        // Refresh debts
        fetch(`${API_BASE}/debt/list?user_id=${mockUserId}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.debts) setDebts(data.debts);
          });
      } else {
        setUploadError("Upload failed. Please check your file format.");
      }
    } catch (err) {
      setUploadError("Error uploading file. Try again.");
    }
  };

  // Example chart data (robust for both backend and manual debts)
  const chartData = debts.map((debt) => ({
    name: debt.lender || debt.name,
    amount: debt.principal || debt.amount,
    color: '#6366f1',
  }));

  // Helper: Format currency
  const formatCurrency = (val) =>
    `₹${Number(val).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  // Helper: Format percent
  const formatPercent = (val) => `${Number(val).toFixed(2)}%`;

  // Helper: Format chart axis
  const formatAxis = (val) => `${Math.round(val / 1000)}k`;

  // Helper: Format simulation summary
  const formatSimSummary = (sim) =>
    sim
      ? `Strategy: ${sim.strategy.charAt(0).toUpperCase() + sim.strategy.slice(1)} | Months: ${sim.months} | Total Interest: ${formatCurrency(sim.total_interest)}`
      : '';

  // Helper: Prepare timeline chart data
  const timelineChartData = simulation?.timeline?.map((m) => ({
    month: `M${m.month}`,
    total_debt: m.total_debt,
    interest_paid: m.interest_paid,
  })) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center space-x-3 mb-2">
            <ChartBarIcon className="w-6 h-6 text-indigo-600" />
            <h1 className="text-3xl font-light text-gray-900">
              Debt Management & Repayment Simulator
            </h1>
          </div>
          <p className="text-gray-600">
            Upload your debts or add manually to simulate repayment strategies and get actionable insights.
          </p>
        </motion.div>

        {/* Upload CSV */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 mb-8"
        >
          <h2 className="text-xl font-medium text-gray-900 mb-6 flex items-center space-x-2">
            <DocumentTextIcon className="w-6 h-6 text-indigo-600" />
            <span>Upload Debt CSV</span>
          </h2>
          <input
            type="file"
            accept=".csv,.xlsx"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
          />
          {uploadError && (
            <div className="mt-4 text-red-600 text-sm flex items-center">
              <ExclamationTriangleIcon className="w-5 h-5 mr-2" /> {uploadError}
            </div>
          )}
          {uploadSuccess && (
            <div className="mt-4 text-emerald-600 text-sm flex items-center">
              <ShieldCheckIcon className="w-5 h-5 mr-2" /> {uploadSuccess}
            </div>
          )}
        </motion.div>

        {/* Sleek card for Add Debt */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 mb-8"
        >
          <h2 className="text-xl font-medium text-gray-900 mb-6 flex items-center space-x-2">
            <PlusIcon className="w-6 h-6 text-indigo-600" />
            <span>Add Debt Manually</span>
          </h2>
          <form className="grid grid-cols-1 md:grid-cols-4 gap-4" onSubmit={handleAddDebt}>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Debt Name"
              className="border rounded-lg px-3 py-2"
            />
            <input
              name="amount"
              value={form.amount}
              onChange={handleChange}
              placeholder="Amount"
              type="number"
              className="border rounded-lg px-3 py-2"
            />
            <input
              name="rate"
              value={form.rate}
              onChange={handleChange}
              placeholder="Interest Rate (%)"
              type="number"
              className="border rounded-lg px-3 py-2"
            />
            <input
              name="minPayment"
              value={form.minPayment}
              onChange={handleChange}
              placeholder="Min Payment"
              type="number"
              className="border rounded-lg px-3 py-2"
            />
            <button
              type="submit"
              className="col-span-1 md:col-span-4 bg-indigo-600 text-white rounded-lg px-4 py-2 mt-2"
            >
              Add Debt
            </button>
          </form>
        </motion.div>

        {/* Sleek card for Debt List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 mb-8"
        >
          <h2 className="text-xl font-medium text-gray-900 mb-6 flex items-center space-x-2">
            <BanknotesIcon className="w-6 h-6 text-indigo-600" />
            <span>Your Debts</span>
          </h2>
          {debts.length === 0 ? (
            <p className="text-gray-500">No debts added yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {debts.map((debt, idx) => (
                <li key={idx} className="py-3 flex justify-between items-center">
                  <span className="font-medium text-gray-800">{debt.lender || debt.name}</span>
                  <span className="text-gray-600">₹{(debt.principal || debt.amount).toLocaleString()} @ {(debt.interest_rate || debt.rate)}%</span>
                  <span className="text-gray-500">EMI: ₹{(debt.emi || debt.minPayment).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </motion.div>

        {/* Sleek card for Debt Distribution Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 mb-8"
        >
          <h2 className="text-xl font-medium text-gray-900 mb-6 flex items-center space-x-2">
            <ChartBarIcon className="w-6 h-6 text-indigo-600" />
            <span>Debt Distribution</span>
          </h2>
          {chartData.length === 0 ? (
            <p className="text-gray-500">No debts to display.</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} interval={0} angle={-30} dy={10} />
                <YAxis tickFormatter={formatAxis} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip formatter={formatCurrency} labelFormatter={(label) => label} contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px' }} />
                <Bar dataKey="amount" fill="#6366f1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Sleek card for Repayment Simulation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 mb-8"
        >
          <h2 className="text-xl font-medium text-gray-900 mb-6 flex items-center space-x-2">
            <CalculatorIcon className="w-6 h-6 text-indigo-600" />
            <span>Repayment Simulation</span>
          </h2>
          <div className="flex items-center gap-4 mb-4">
            <select
              value={strategy}
              onChange={(e) => setStrategy(e.target.value)}
              className="border rounded-lg px-3 py-2"
            >
              <option value="snowball">Snowball</option>
              <option value="avalanche">Avalanche</option>
            </select>
            <button
              onClick={handleSimulate}
              className="bg-indigo-600 text-white rounded-lg px-4 py-2"
              disabled={loading}
            >
              {loading ? "Simulating..." : "Simulate Repayment"}
            </button>
          </div>
          {simulation && (
            <>
              <div className="mb-6">
                <div className="font-semibold text-indigo-700 mb-2">{formatSimSummary(simulation)}</div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={timelineChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} />
                    <YAxis tickFormatter={formatAxis} tick={{ fontSize: 12, fill: '#64748b' }} />
                    <Tooltip formatter={formatCurrency} labelFormatter={(label) => label} contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px' }} />
                    <Bar dataKey="total_debt" fill="#6366f1" radius={[8, 8, 0, 0]} name="Total Debt" />
                    <Bar dataKey="interest_paid" fill="#f59e0b" radius={[8, 8, 0, 0]} name="Interest Paid" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 overflow-x-auto">
                <div className="font-semibold mb-2">Full Timeline</div>
                <table className="w-full text-xs">
                  <thead>
                    <tr>
                      <th className="text-left py-1 px-2">Month</th>
                      <th className="text-left py-1 px-2">Total Debt</th>
                      <th className="text-left py-1 px-2">Interest Paid</th>
                    </tr>
                  </thead>
                  <tbody>
                    {timelineChartData.map((row, idx) => (
                      <tr key={idx}>
                        <td className="py-1 px-2">{row.month}</td>
                        <td className="py-1 px-2">{formatCurrency(row.total_debt)}</td>
                        <td className="py-1 px-2">{formatCurrency(row.interest_paid)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default DebtDashboard;
