import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  CalculatorIcon,
  CurrencyRupeeIcon,
  ChartBarIcon,
  LightBulbIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const TaxCalculator = ({ user }) => {
  const [taxData, setTaxData] = useState(null);
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
      setTaxData(taxRes);
      setRecommendations(recRes.recommendations || []);
    } catch (err) {
      setError('Error fetching tax data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, subtitle, icon: Icon, color, bgColor }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`p-6 rounded-xl ${bgColor} border border-gray-100`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
      {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
    </motion.div>
  );

  const RecommendationCard = ({ recommendation, index }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white p-6 rounded-xl border border-gray-100 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start space-x-4">
        <div className="p-2 bg-blue-100 rounded-lg">
          <LightBulbIcon className="w-5 h-5 text-blue-600" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-900">{recommendation.title}</h3>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
              {recommendation.category}
            </span>
          </div>
          <p className="text-gray-600 mb-3">{recommendation.description}</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-green-600 font-semibold">
                Potential Savings: ₹{recommendation.potential_savings?.toLocaleString()}
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Action: {recommendation.action_required}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );

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
    <div className="space-y-6">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-green-600 to-green-800 rounded-2xl p-8 text-white"
      >
        <div className="flex items-center space-x-4">
          <CalculatorIcon className="w-10 h-10" />
          <div>
            <h1 className="text-3xl font-bold mb-2">AI-Powered Tax Optimization</h1>
            <p className="text-green-100 text-lg">
              Smart tax calculation with regime comparison and personalized recommendations
            </p>
          </div>
        </div>
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center space-x-3"
        >
          <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
          <span className="text-red-800">{error}</span>
        </motion.div>
      )}

      {taxData && (
        <>
          {/* Tax Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Gross Income"
              value={`₹${taxData.gross_income?.toLocaleString()}`}
              icon={CurrencyRupeeIcon}
              color="bg-gradient-to-br from-blue-500 to-blue-700"
              bgColor="bg-gradient-to-br from-blue-50 to-blue-100"
            />
            <StatCard
              title="Recommended Regime"
              value={taxData.recommended_regime?.toUpperCase()}
              subtitle="Best option for you"
              icon={CheckCircleIcon}
              color="bg-gradient-to-br from-green-500 to-green-700"
              bgColor="bg-gradient-to-br from-green-50 to-green-100"
            />
            <StatCard
              title="Tax Savings"
              value={`₹${taxData.savings_with_recommendation?.toLocaleString()}`}
              subtitle="vs other regime"
              icon={ChartBarIcon}
              color="bg-gradient-to-br from-purple-500 to-purple-700"
              bgColor="bg-gradient-to-br from-purple-50 to-purple-100"
            />
            <StatCard
              title="Deductions Used"
              value={`₹${taxData.old_regime?.deductions_claimed?.toLocaleString()}`}
              subtitle="Old regime"
              icon={DocumentTextIcon}
              color="bg-gradient-to-br from-orange-500 to-orange-700"
              bgColor="bg-gradient-to-br from-orange-50 to-orange-100"
            />
          </div>

          {/* Tax Regime Comparison */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100"
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
                  <tr className={`hover:bg-gray-50 ${taxData.recommended_regime === 'old' ? 'bg-green-50' : ''}`}>
                    <td className="py-4 px-6 font-medium text-gray-900">
                      <div className="flex items-center space-x-2">
                        <span>Old Regime</span>
                        {taxData.recommended_regime === 'old' && (
                          <CheckCircleIcon className="w-4 h-4 text-green-600" />
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right font-medium text-gray-900">
                      ₹{taxData.old_regime?.taxable_income?.toLocaleString()}
                    </td>
                    <td className="py-4 px-6 text-right font-medium text-gray-900">
                      ₹{taxData.old_regime?.tax_payable?.toLocaleString()}
                    </td>
                    <td className="py-4 px-6 text-right text-gray-600">
                      ₹{taxData.old_regime?.deductions_claimed?.toLocaleString()}
                    </td>
                  </tr>
                  <tr className={`hover:bg-gray-50 ${taxData.recommended_regime === 'new' ? 'bg-green-50' : ''}`}>
                    <td className="py-4 px-6 font-medium text-gray-900">
                      <div className="flex items-center space-x-2">
                        <span>New Regime</span>
                        {taxData.recommended_regime === 'new' && (
                          <CheckCircleIcon className="w-4 h-4 text-green-600" />
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right font-medium text-gray-900">
                      ₹{taxData.new_regime?.taxable_income?.toLocaleString()}
                    </td>
                    <td className="py-4 px-6 text-right font-medium text-gray-900">
                      ₹{taxData.new_regime?.tax_payable?.toLocaleString()}
                    </td>
                    <td className="py-4 px-6 text-right text-gray-600">
                      ₹{taxData.new_regime?.deductions_claimed?.toLocaleString()}
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
            className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Advance Tax Payment Schedule</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {taxData.advance_tax_schedule && Object.entries(taxData.advance_tax_schedule).map(([quarter, amount]) => (
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
              <RecommendationCard key={idx} recommendation={rec} index={idx} />
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
  );
};

export default TaxCalculator;