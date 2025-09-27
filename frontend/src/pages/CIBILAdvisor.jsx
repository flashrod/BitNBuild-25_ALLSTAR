import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCardIcon,
  HomeIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  ClockIcon,
  LightBulbIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  PencilIcon,
  XMarkIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

const initialAccount = {
  type: '',
  opened: '',
  limit: '',
  balance: '',
  paymentHistory: [{ date: '', onTime: true }]
};

const initialInquiry = { date: '', type: '' };

const demoScoreHistory = [
  { month: 'Jan', score: 730 },
  { month: 'Feb', score: 735 },
  { month: 'Mar', score: 740 },
  { month: 'Apr', score: 745 },
  { month: 'May', score: 750 },
  { month: 'Jun', score: 755 },
];

const capitalizeWords = str =>
  str.replace(/\b\w/g, l => l.toUpperCase()).replace(/_/g, ' ');

const getScoreFactors = (accounts, inquiries) => {
  let latePayments = 0;
  let utilizationSum = 0;
  let limitSum = 0;
  let accountAges = [];
  let mix = new Set();
  let recentInquiries = 0;

  accounts.forEach(acc => {
    mix.add(acc.type);
    if (acc.opened) {
      const years = (new Date() - new Date(acc.opened)) / (1000 * 60 * 60 * 24 * 365.25);
      accountAges.push(years);
    }
    if (acc.limit && acc.balance) {
      utilizationSum += Number(acc.balance);
      limitSum += Number(acc.limit);
    }
    acc.paymentHistory.forEach(ph => {
      if (ph.date && !ph.onTime) latePayments++;
    });
  });

  inquiries.forEach(inq => {
    if (inq.date && new Date(inq.date) > new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)) recentInquiries++;
  });

  const utilization = limitSum > 0 ? utilizationSum / limitSum : 0;
  const avgAge = accountAges.length > 0 ? (accountAges.reduce((a, b) => a + b, 0) / accountAges.length) : 0;

  return {
    PaymentHistory: {
      Status: latePayments === 0 ? 'Good' : 'Late Payments',
      Recent: latePayments === 0 ? 'No Late Payments' : `${latePayments} Late Payment(s)`
    },
    CreditUtilization: {
      Current: `${Math.round(utilization * 100)}%`,
      Status: utilization < 0.3 ? 'Low' : utilization < 0.5 ? 'Moderate' : 'High'
    },
    CreditAge: {
      AverageAge: `${avgAge.toFixed(1)} Years`,
      Status: avgAge > 4 ? 'Healthy' : avgAge > 2 ? 'Moderate' : 'Young'
    },
    AccountMix: {
      Accounts: `${accounts.length} Account(s), ${mix.size} Type(s)`,
      Status: mix.size > 1 ? 'Diverse' : 'Limited'
    },
    Inquiries: {
      Recent: `${recentInquiries}`,
      Status: recentInquiries <= 2 ? 'Low' : 'High'
    }
  };
};

const getRecommendations = (factors) => {
  const recs = [];
  if (factors.CreditUtilization.Status === 'High') {
    recs.push({
      Title: 'Reduce Credit Utilization',
      Description: 'Aim To Keep Utilization Below 30% For A Better Score.',
      ExpectedScoreImprovement: 10
    });
  }
  if (factors.CreditAge.Status === 'Young') {
    recs.push({
      Title: 'Increase Credit Age',
      Description: 'Avoid Closing Old Accounts To Maintain A Healthy Average Age.',
      ExpectedScoreImprovement: 8
    });
  }
  if (factors.AccountMix.Status === 'Limited') {
    recs.push({
      Title: 'Diversify Account Mix',
      Description: 'Consider Adding A Secured Loan For A More Diverse Profile.',
      ExpectedScoreImprovement: 6
    });
  }
  if (factors.PaymentHistory.Status === 'Late Payments') {
    recs.push({
      Title: 'Improve Payment History',
      Description: 'Pay All Dues On Time To Avoid Score Penalties.',
      ExpectedScoreImprovement: 15
    });
  }
  if (factors.Inquiries.Status === 'High') {
    recs.push({
      Title: 'Limit Credit Inquiries',
      Description: 'Too Many Recent Inquiries Can Lower Your Score.',
      ExpectedScoreImprovement: 5
    });
  }
  if (recs.length === 0) {
    recs.push({
      Title: 'Maintain Good Credit Habits',
      Description: 'Your Profile Looks Healthy. Keep Up The Good Work!',
      ExpectedScoreImprovement: 0
    });
  }
  return recs;
};

const CIBILAdvisor = ({ user }) => {
  const [accounts, setAccounts] = useState([initialAccount]);
  const [inquiries, setInquiries] = useState([initialInquiry]);
  const [score, setScore] = useState(null);
  const [scoreHistory, setScoreHistory] = useState(demoScoreHistory);
  const [showDetails, setShowDetails] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editable, setEditable] = useState(false);

  // Add new account
  const addAccount = () => setAccounts([...accounts, initialAccount]);
  // Remove account
  const removeAccount = idx => setAccounts(accounts.filter((_, i) => i !== idx));
  // Update account field
  const updateAccount = (idx, field, value) => {
    const updated = [...accounts];
    updated[idx][field] = value;
    setAccounts(updated);
  };
  // Update payment history
  const updatePaymentHistory = (accIdx, payIdx, field, value) => {
    const updated = [...accounts];
    updated[accIdx].paymentHistory[payIdx][field] = value;
    setAccounts(updated);
  };
  // Add payment history row
  const addPaymentHistory = accIdx => {
    const updated = [...accounts];
    updated[accIdx].paymentHistory.push({ date: '', onTime: true });
    setAccounts(updated);
  };

  // Add new inquiry
  const addInquiry = () => setInquiries([...inquiries, initialInquiry]);
  // Remove inquiry
  const removeInquiry = idx => setInquiries(inquiries.filter((_, i) => i !== idx));
  // Update inquiry field
  const updateInquiry = (idx, field, value) => {
    const updated = [...inquiries];
    updated[idx][field] = value;
    setInquiries(updated);
  };

  // Calculate CIBIL score (simple simulation)
  const calculateScore = () => {
    setError('');
    setSuccess('');
    let base = 750;
    let latePayments = 0;
    let utilizationSum = 0;
    let limitSum = 0;
    let accountAges = [];
    let mix = new Set();
    let recentInquiries = 0;

    accounts.forEach(acc => {
      mix.add(acc.type);
      if (acc.opened) {
        const years = (new Date() - new Date(acc.opened)) / (1000 * 60 * 60 * 24 * 365.25);
        accountAges.push(years);
      }
      if (acc.limit && acc.balance) {
        utilizationSum += Number(acc.balance);
        limitSum += Number(acc.limit);
      }
      acc.paymentHistory.forEach(ph => {
        if (ph.date && !ph.onTime) latePayments++;
      });
    });

    inquiries.forEach(inq => {
      if (inq.date && new Date(inq.date) > new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)) recentInquiries++;
    });

    // Score logic
    if (latePayments > 0) base -= latePayments * 25;
    if (limitSum > 0) {
      const utilization = utilizationSum / limitSum;
      if (utilization > 0.3) base -= 20;
      else if (utilization > 0.5) base -= 40;
    }
    if (accountAges.length > 0) {
      const avgAge = accountAges.reduce((a, b) => a + b, 0) / accountAges.length;
      if (avgAge < 2) base -= 15;
      else if (avgAge < 4) base -= 5;
    }
    if (mix.size < 2) base -= 10;
    if (recentInquiries > 2) base -= 10;

    base = Math.max(300, Math.min(900, Math.round(base)));
    setScore(base);

    // Simulate score history update
    const newHistory = [...scoreHistory];
    newHistory.push({ month: 'Now', score: base });
    setScoreHistory(newHistory);

    setShowDetails(true);
    setSuccess('Score calculated!');
  };

  // Score factors and recommendations
  const scoreFactors = getScoreFactors(accounts, inquiries);
  const recommendations = getRecommendations(scoreFactors);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-light text-gray-900 mb-2">CIBIL Score Calculator</h1>
          <p className="text-gray-600">Enter Your Credit Details To Calculate Your Estimated CIBIL Score</p>
        </motion.div>

        {/* Form */}
        {!showDetails && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 mb-8">
            <h2 className="text-xl font-medium text-gray-900 mb-6 flex items-center space-x-2">
              <CreditCardIcon className="w-6 h-6 text-indigo-600" />
              <span>Credit Accounts</span>
            </h2>
            {accounts.map((acc, idx) => (
              <div key={idx} className="mb-6 border-b border-gray-100 pb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
                    <select
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      value={acc.type}
                      onChange={e => updateAccount(idx, 'type', e.target.value)}
                    >
                      <option value="">Select Type</option>
                      <option value="Credit Card">Credit Card</option>
                      <option value="Home Loan">Home Loan</option>
                      <option value="Personal Loan">Personal Loan</option>
                      <option value="Auto Loan">Auto Loan</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Opened Date</label>
                    <input
                      type="date"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      value={acc.opened}
                      onChange={e => updateAccount(idx, 'opened', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Credit Limit</label>
                    <input
                      type="number"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      value={acc.limit}
                      onChange={e => updateAccount(idx, 'limit', e.target.value)}
                      min={0}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Balance</label>
                    <input
                      type="number"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      value={acc.balance}
                      onChange={e => updateAccount(idx, 'balance', e.target.value)}
                      min={0}
                    />
                  </div>
                </div>
                <div className="mb-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment History</label>
                  {acc.paymentHistory.map((ph, payIdx) => (
                    <div key={payIdx} className="flex items-center space-x-2 mb-2">
                      <input
                        type="date"
                        className="border border-gray-300 rounded-lg px-2 py-1"
                        value={ph.date}
                        onChange={e => updatePaymentHistory(idx, payIdx, 'date', e.target.value)}
                      />
                      <select
                        className="border border-gray-300 rounded-lg px-2 py-1"
                        value={ph.onTime ? 'On Time' : 'Late'}
                        onChange={e => updatePaymentHistory(idx, payIdx, 'onTime', e.target.value === 'On Time')}
                      >
                        <option value="On Time">On Time</option>
                        <option value="Late">Late</option>
                      </select>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="text-indigo-600 text-sm font-medium flex items-center mt-1"
                    onClick={() => addPaymentHistory(idx)}
                  >
                    <PlusIcon className="w-4 h-4 mr-1" /> Add Payment
                  </button>
                </div>
                <button
                  type="button"
                  className="text-red-500 text-xs font-medium mt-2"
                  onClick={() => removeAccount(idx)}
                  disabled={accounts.length === 1}
                >
                  Remove Account
                </button>
              </div>
            ))}
            <button
              type="button"
              className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg font-medium flex items-center"
              onClick={addAccount}
            >
              <PlusIcon className="w-5 h-5 mr-2" /> Add Account
            </button>
          </motion.div>
        )}

        {/* Inquiries */}
        {!showDetails && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 mb-8">
            <h2 className="text-xl font-medium text-gray-900 mb-6 flex items-center space-x-2">
              <ChartBarIcon className="w-6 h-6 text-indigo-600" />
              <span>Credit Inquiries</span>
            </h2>
            {inquiries.map((inq, idx) => (
              <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Inquiry Date</label>
                  <input
                    type="date"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    value={inq.date}
                    onChange={e => updateInquiry(idx, 'date', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Inquiry Type</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    value={inq.type}
                    onChange={e => updateInquiry(idx, 'type', e.target.value)}
                  >
                    <option value="">Select Type</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Loan">Loan</option>
                  </select>
                </div>
                <button
                  type="button"
                  className="text-red-500 text-xs font-medium mt-2"
                  onClick={() => removeInquiry(idx)}
                  disabled={inquiries.length === 1}
                >
                  Remove Inquiry
                </button>
              </div>
            ))}
            <button
              type="button"
              className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg font-medium flex items-center"
              onClick={addInquiry}
            >
              <PlusIcon className="w-5 h-5 mr-2" /> Add Inquiry
            </button>
          </motion.div>
        )}

        {/* Calculate Button & Result */}
        {!showDetails && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 mb-8">
            <div className="flex items-center space-x-3 mb-6">
              <ShieldCheckIcon className="w-6 h-6 text-indigo-600" />
              <h2 className="text-xl font-medium text-gray-900">Calculate CIBIL Score</h2>
            </div>
            <button
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg text-base font-medium hover:bg-indigo-700 transition-colors"
              onClick={calculateScore}
            >
              Calculate Score
            </button>
            {error && (
              <div className="mt-4 text-red-600 text-sm flex items-center">
                <ExclamationTriangleIcon className="w-5 h-5 mr-2" /> {error}
              </div>
            )}
          </motion.div>
        )}

        {/* Slide-out Details */}
        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative"
              >
                <button
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowDetails(false)}
                  aria-label="Close"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
                <div className="mb-6">
                  <span className="block text-sm text-gray-500 mb-1">Estimated Score</span>
                  <span className="text-4xl font-bold text-indigo-700">{score}</span>
                </div>
                <div className="mb-6">
                  <div className="flex items-center space-x-2 mb-2">
                    <InformationCircleIcon className="w-5 h-5 text-gray-400" />
                    <span className="text-xs text-gray-600">
                      Calculated from payment history, utilization, account age, mix, and inquiries.
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Score History</h3>
                  <div className="h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={scoreHistory}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                        <YAxis domain={[600, 900]} tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                        <Tooltip formatter={(value) => `${value} Points`} contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px' }} />
                        <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Score Factors</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(scoreFactors).map(([factor, details], idx) => (
                      <div key={factor} className="bg-gray-50 rounded-lg p-2 flex flex-col">
                        <span className="text-xs text-gray-500 font-medium mb-1">{capitalizeWords(factor)}</span>
                        <span className="text-xs text-gray-900 mb-1">{details.Status}</span>
                        {details.Current && <span className="text-xs text-gray-600">Current: {details.Current}</span>}
                        {details.AverageAge && <span className="text-xs text-gray-600">Avg Age: {details.AverageAge}</span>}
                        {details.Accounts && <span className="text-xs text-gray-600">Accounts: {details.Accounts}</span>}
                        {details.Recent && <span className="text-xs text-gray-600">Recent: {details.Recent}</span>}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Improvement Recommendations</h3>
                  <ul className="space-y-2">
                    {recommendations.map((rec, idx) => (
                      <li key={idx} className="bg-gray-50 rounded-lg p-2 text-xs text-gray-700 flex justify-between items-center">
                        <div>
                          <span className="font-medium text-indigo-700">{rec.Title}:</span> {rec.Description}
                        </div>
                        {rec.ExpectedScoreImprovement && (
                          <span className="ml-2 text-emerald-600 font-semibold">+{rec.ExpectedScoreImprovement} pts</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CIBILAdvisor;