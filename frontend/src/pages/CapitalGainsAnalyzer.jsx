import React, { useState, useEffect, useRef } from "react";
import { ChartBarIcon, DocumentTextIcon, ArrowPathIcon, ShieldCheckIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const mockUserId = "mock-user-id";

const CapitalGainsAnalyzer = () => {
  const [gains, setGains] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");
  const fileInputRef = useRef();

  useEffect(() => { fetchGains(); }, []);

  const fetchGains = async () => {
    const res = await fetch(`${API_URL}/capital_gains/list?user_id=${mockUserId}`);
    const data = await res.json();
    setGains(data.gains || []);
  };

  const handleFileUpload = async (e) => {
    setUploadError("");
    setUploadSuccess("");
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("user_id", mockUserId);
    formData.append("file", file);
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/capital_gains/ingest`, { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) {
        setUploadSuccess(`Uploaded ${file.name} successfully!`);
        await fetchGains();
      } else {
        setUploadError("Upload failed. Please check your file format.");
      }
    } catch {
      setUploadError("Error uploading file. Try again.");
    }
    setLoading(false);
  };

  const handleAnalyze = async () => {
    setLoading(true);
    const res = await fetch(`${API_URL}/capital_gains/analyze`, {
      method: "POST",
      body: new URLSearchParams({ user_id: mockUserId }),
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    const data = await res.json();
    setAnalysis(data);
    setLoading(false);
  };

  // Chart data helpers
  const gainDistribution = Object.values(
    gains.reduce((acc, g) => {
      const key = g.instrument || "Other";
      acc[key] = (acc[key] || 0) + parseFloat(g.gain_loss || 0);
      return acc;
    }, {})
  ).map((val, idx, arr) => ({ name: Object.keys(arr)[idx], value: val }));

  const instrumentData = Object.entries(
    gains.reduce((acc, g) => {
      const key = g.instrument || "Other";
      acc[key] = (acc[key] || 0) + parseFloat(g.gain_loss || 0);
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  const timelineData = gains.map((g) => ({
    date: g.trade_date,
    gain: Number(g.gain_loss) || 0,
  }));

  const COLORS = ["#6366f1", "#f59e0b", "#10b981", "#ef4444", "#3b82f6", "#a78bfa", "#f472b6"];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header Section */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center space-x-4">
            <ChartBarIcon className="w-10 h-10 text-indigo-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Capital Gains Analyzer</h1>
              <p className="text-gray-600">Upload your broker statement and get instant capital gains insights.</p>
            </div>
          </div>
        </motion.div>

        {/* Upload CSV */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 mb-8">
          <h2 className="text-xl font-medium text-gray-900 mb-6 flex items-center space-x-2">
            <DocumentTextIcon className="w-6 h-6 text-indigo-600" />
            <span>Upload Capital Gains CSV/XLSX</span>
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

        {/* Capital Gains Distribution Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 mb-8">
          <h2 className="text-xl font-medium text-gray-900 mb-6 flex items-center space-x-2">
            <ChartBarIcon className="w-6 h-6 text-indigo-600" />
            <span>Gain Distribution by Instrument</span>
          </h2>
          {instrumentData.length === 0 ? (
            <p className="text-gray-500">No data to display.</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={instrumentData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} interval={0} angle={-30} dy={10} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip formatter={(val) => `₹${val.toLocaleString()}`} labelFormatter={(label) => label} contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px' }} />
                <Bar dataKey="value" fill="#6366f1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Timeline Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 mb-8">
          <h2 className="text-xl font-medium text-gray-900 mb-6 flex items-center space-x-2">
            <ChartBarIcon className="w-6 h-6 text-indigo-600" />
            <span>Gain/Loss Timeline</span>
          </h2>
          {timelineData.length === 0 ? (
            <p className="text-gray-500">No data to display.</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={timelineData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#6366f1' }} angle={-30} dy={10} />
                <YAxis tick={{ fontSize: 12, fill: '#10b981' }} tickFormatter={(val) => `₹${val.toLocaleString()}`} />
                <Tooltip formatter={(val) => `₹${val.toLocaleString()}`} labelFormatter={(label) => label} contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px' }} />
                <Bar dataKey="gain" fill="#6366f1" radius={[8, 8, 0, 0]} name="Gain/Loss" />
                <Legend verticalAlign="top" height={36} />
                <text x={20} y={20} className="text-xs text-gray-400">(Hover for details)</text>
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Sleek card for Capital Gains Records */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 mb-8">
          <h2 className="text-xl font-medium text-gray-900 mb-6 flex items-center space-x-2">
            <DocumentTextIcon className="w-6 h-6 text-indigo-600" />
            <span>Your Capital Gains Records</span>
          </h2>
          {gains.length === 0 ? (
            <p className="text-gray-500">No records uploaded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="px-3 py-2 text-left">Date</th>
                    <th className="px-3 py-2 text-left">Type</th>
                    <th className="px-3 py-2 text-left">Instrument</th>
                    <th className="px-3 py-2 text-right">Qty</th>
                    <th className="px-3 py-2 text-right">Buy Price</th>
                    <th className="px-3 py-2 text-right">Sell Price</th>
                    <th className="px-3 py-2 text-right">Gain/Loss</th>
                    <th className="px-3 py-2 text-right">Holding Period</th>
                  </tr>
                </thead>
                <tbody>
                  {gains.map((g, idx) => (
                    <tr key={idx} className="border-b border-gray-100">
                      <td className="px-3 py-2">{g.trade_date}</td>
                      <td className="px-3 py-2">{g.type}</td>
                      <td className="px-3 py-2">{g.instrument}</td>
                      <td className="px-3 py-2 text-right">{g.quantity}</td>
                      <td className="px-3 py-2 text-right">{g.buy_price}</td>
                      <td className="px-3 py-2 text-right">{g.sell_price}</td>
                      <td className="px-3 py-2 text-right">{g.gain_loss}</td>
                      <td className="px-3 py-2 text-right">{g.holding_period}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* Sleek card for Capital Gains Analysis */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
          <div className="flex items-center mb-4">
            <ChartBarIcon className="w-6 h-6 text-indigo-600 mr-2" />
            <span className="font-semibold text-gray-900">Capital Gains Analysis</span>
          </div>
          <button
            onClick={handleAnalyze}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition mb-4"
            disabled={loading}
          >
            {loading ? <ArrowPathIcon className="w-5 h-5 inline animate-spin" /> : "Analyze Gains"}
          </button>
          {analysis && (
            <div className="mt-4 space-y-2">
              <div className="text-lg font-bold text-gray-900">Total Gain: ₹{analysis.total_gain}</div>
              <div className="text-green-700">Short Term Gain: ₹{analysis.short_term_gain}</div>
              <div className="text-blue-700">Long Term Gain: ₹{analysis.long_term_gain}</div>
              <div className="text-gray-500 text-sm">Total Records: {analysis.count}</div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default CapitalGainsAnalyzer;