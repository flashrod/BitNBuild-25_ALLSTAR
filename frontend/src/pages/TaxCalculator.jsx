import React, { useState, useEffect } from "react";
import {
  CalculatorIcon,
  CurrencyRupeeIcon,
  CheckCircleIcon,
  LightBulbIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  ChartBarIcon
} from "@heroicons/react/24/outline";
import { motion } from "framer-motion";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const TaxCalculator = ({ user }) => {
  const [income, setIncome] = useState("");
  const [deductions, setDeductions] = useState("");
  const [result, setResult] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user?.id) return;
    fetchTaxData();
  }, [user]);

  const fetchTaxData = async () => {
    setLoading(true);
    setError('');
    try {
      const [taxRes, recRes] = await Promise.all([
        fetch(`${API_URL}/tax/${user.id}/calculate`).then(res => res.json()),
        fetch(`${API_URL}/tax/${user.id}/recommendations`).then(res => res.json())
      ]);
      setResult(taxRes);
      setRecommendations(recRes.recommendations || []);
    } catch (err) {
      setError('Error fetching tax data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCalculate = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/tax/${user.id}/calculate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          income: Number(income),
          deductions: Number(deductions),
        }),
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError('Error calculating tax.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center space-x-3">
          <ArrowPathIcon className="w-8 h-8 text-blue-600 animate-spin" />
          <span className="text-lg font-medium text-gray-600">Calculating your taxes...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center space-x-4">
            <CalculatorIcon className="w-10 h-10 text-indigo-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Tax Calculator</h1>
              <p className="text-gray-600">Estimate your tax, compare regimes, and get AI-powered recommendations.</p>
            </div>
          </div>
        </motion.div>

        {/* Input Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Annual Income</label>
              <div className="relative">
                <CurrencyRupeeIcon className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  value={income}
                  onChange={(e) => setIncome(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g. 800000"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Total Deductions</label>
              <input
                type="number"
                value={deductions}
                onChange={(e) => setDeductions(e.target.value)}
                className="px-4 py-2 w-full border border-gray-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="e.g. 150000"
              />
            </div>
          </div>
          <button
            onClick={handleCalculate}
            className="mt-6 w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
          >
            Calculate Tax
          </button>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center space-x-3 mb-8"
          >
            <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
            <span className="text-red-800">{error}</span>
          </motion.div>
        )}

        {/* Tax Results */}
        {result && (
          <>
            {/* Tax Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 border border-gray-100"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700">
                    <CurrencyRupeeIcon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Gross Income</h3>
                <p className="text-2xl font-bold text-gray-900 mb-1">₹{result.gross_income?.toLocaleString()}</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 rounded-xl bg-gradient-to-br from-green-50 to-green-100 border border-gray-100"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-green-700">
                    <CheckCircleIcon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Recommended Regime</h3>
                <p className="text-2xl font-bold text-gray-900 mb-1">{result.recommended_regime?.toUpperCase()}</p>
                <p className="text-sm text-gray-600">Best option for you</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 border border-gray-100"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700">
                    <ChartBarIcon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Tax Savings</h3>
                <p className="text-2xl font-bold text-gray-900 mb-1">₹{result.savings_with_recommendation?.toLocaleString()}</p>
                <p className="text-sm text-gray-600">vs other regime</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 border border-gray-100"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-orange-700">
                    <DocumentTextIcon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Deductions Used</h3>
                <p className="text-2xl font-bold text-gray-900 mb-1">₹{result.old_regime?.deductions_claimed?.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Old regime</p>
              </motion.div>
            </div>

            {/* Tax Regime Comparison */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 mb-8"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Tax Regime Comparison</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-4 px-6 font-semibold text-gray-900">Regime</th>
                      <th className="text-right py-4 px-6 font-semibold text-gray-900">Taxable Income</th>
                      <th className="text-right py-4 px-6 font-semibold text-gray-900">Tax Payable</th>
                      <th className="text-right py-4 px-6 font-semibold text-gray-900">Deductions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <tr className={`hover:bg-gray-50 ${result.recommended_regime === 'old' ? 'bg-green-50' : ''}`}>
                      <td className="py-4 px-6 font-medium text-gray-900">
                        <div className="flex items-center space-x-2">
                          <span>Old Regime</span>
                          {result.recommended_regime === 'old' && (
                            <CheckCircleIcon className="w-4 h-4 text-green-600" />
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right font-medium text-gray-900">
                        ₹{result.old_regime?.taxable_income?.toLocaleString()}
                      </td>
                      <td className="py-4 px-6 text-right font-medium text-gray-900">
                        ₹{result.old_regime?.tax_payable?.toLocaleString()}
                      </td>
                      <td className="py-4 px-6 text-right text-gray-600">
                        ₹{result.old_regime?.deductions_claimed?.toLocaleString()}
                      </td>
                    </tr>
                    <tr className={`hover:bg-gray-50 ${result.recommended_regime === 'new' ? 'bg-green-50' : ''}`}>
                      <td className="py-4 px-6 font-medium text-gray-900">
                        <div className="flex items-center space-x-2">
                          <span>New Regime</span>
                          {result.recommended_regime === 'new' && (
                            <CheckCircleIcon className="w-4 h-4 text-green-600" />
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right font-medium text-gray-900">
                        ₹{result.new_regime?.taxable_income?.toLocaleString()}
                      </td>
                      <td className="py-4 px-6 text-right font-medium text-gray-900">
                        ₹{result.new_regime?.tax_payable?.toLocaleString()}
                      </td>
                      <td className="py-4 px-6 text-right text-gray-600">
                        ₹{result.new_regime?.deductions_claimed?.toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </motion.div>

            {/* Advance Tax Schedule */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 mb-8"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Advance Tax Payment Schedule</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {result.advance_tax_schedule && Object.entries(result.advance_tax_schedule).map(([quarter, amount]) => (
                  <div key={quarter} className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl text-center">
                    <p className="text-sm font-medium text-gray-600 mb-1">{quarter}</p>
                    <p className="text-lg font-bold text-gray-900">₹{amount?.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}

        {/* Recommendations Section */}
        {recommendations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100"
          >
            <div className="flex items-center space-x-3 mb-6">
              <LightBulbIcon className="w-8 h-8 text-yellow-600" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Personalized Tax-Saving Recommendations</h2>
                <p className="text-gray-600">AI-powered insights to optimize your tax savings</p>
              </div>
            </div>
            <div className="space-y-4">
              {recommendations.map((rec, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-gray-50 p-6 rounded-xl border border-gray-100 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start space-x-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <LightBulbIcon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900">{rec.title}</h3>
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                          {rec.category}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-3">{rec.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="text-green-600 font-semibold">
                          Potential Savings: ₹{rec.potential_savings?.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-500">
                          Action: {rec.action_required}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border border-green-200">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-green-800">Total Potential Additional Savings:</span>
                <span className="text-xl font-bold text-green-900">
                  ₹{recommendations.reduce((sum, rec) => sum + (rec.potential_savings || 0), 0).toLocaleString()}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default TaxCalculator;