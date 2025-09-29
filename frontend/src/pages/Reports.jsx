import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  DocumentTextIcon,
  ChartBarIcon,
  LightBulbIcon,
  CalendarIcon,
  ArrowTrendingUpIcon,
  BanknotesIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { useFinancialData } from '../FinancialDataContext';
const Reports = ({ user }) => {
  const { analysis, tax, reports, loading: aggLoading, error: aggError } = useFinancialData();
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedReport, setSelectedReport] = useState('summary');
  const [aiReport, setAiReport] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);

  useEffect(() => {
    setLoading(aggLoading);
    setError(aggError);
    if (reports) {
      setReportData(reports[selectedReport] || reports);
      setLoading(false);
      // Use unified financial data for Gemini call
      generateGeminiReport({ analysis, tax, reports });
    } else if (aggError) {
      setReportData(getDemoReport(selectedReport));
      setLoading(false);
    }
  }, [reports, analysis, tax, aggLoading, aggError, selectedReport]);

  // Gemini API call
  const generateGeminiReport = async (data) => {
    setAiLoading(true);
    setAiError(null);
    try {
      // Prepare prompt for Gemini
      const prompt = `You are a financial analyst. Given the following user financial data, generate a brief report summarizing expenditure, highlight key insights, and provide actionable tips for better financial management.\n\nData: ${JSON.stringify(data)}`;
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
        }),
      });
      if (!response.ok) throw new Error('Gemini API error');
      const result = await response.json();
      // Parse Gemini output
      const text = result?.candidates?.[0]?.content?.parts?.[0]?.text || 'No report generated.';
      setAiReport(text);
    } catch (err) {
      setAiError('Failed to generate AI report.');
    } finally {
      setAiLoading(false);
    }
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const userId = user?.id || 'mock-user-id';
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/reports/${userId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setReports(data.reports || []);
        if (data.reports && data.reports.length > 0) {
          setSelectedReport(data.reports[0]);
        }
      } else {
        console.error('Failed to fetch reports');
        setError('Failed to load reports. Please try again later.');
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      setError('Error loading reports. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };
    // Fallback demo data
    const getDemoReport = (type) => {
      if (type === 'summary') {
        return {
          summary: {
            total_income: 150000,
            total_expenses: 85000,
            net_savings: 65000,
            portfolio_value: 2000000,
            top_expense_category: 'Food & Dining',
            best_investment: 'Index Fund',
            tax_efficiency: 78
          }
        };
      } else if (type === 'detailed') {
        return {
          detailed: [
            { category: 'Food & Dining', value: 25000 },
            { category: 'Transportation', value: 15000 },
            { category: 'Shopping', value: 20000 },
            { category: 'Bills & Utilities', value: 12000 },
            { category: 'Entertainment', value: 8000 },
            { category: 'Others', value: 5000 }
          ]
        };
      } else if (type === 'tax') {
        return {
          tax: {
            income_tax: 45000,
            capital_gains: 12000,
            deductions: 15000
          }
        };
      }
      return {};
    };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const ReportCard = ({ report, isSelected, onClick }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      className={`p-4 rounded-xl border cursor-pointer transition-all ${
        isSelected 
          ? 'bg-blue-50 border-blue-400' 
          : 'bg-white border-gray-200 hover:border-blue-300'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1">
            {report.title || 'Financial Report'}
          </h3>
          <p className="text-sm text-gray-600 mb-2">{report.source || 'Multiple Sources'}</p>
          <div className="flex items-center space-x-4 text-xs text-gray-500">
            <span className="flex items-center">
              <CalendarIcon className="w-3 h-3 mr-1" />
              {formatDate(report.created_at)}
            </span>
            <span className="flex items-center">
              <DocumentTextIcon className="w-3 h-3 mr-1" />
              {report.type || 'General'}
            </span>
          </div>
        </div>
        {isSelected && (
          <CheckCircleIcon className="w-5 h-5 text-blue-600" />
        )}
      </div>
    </motion.div>
  );

  const SummarySection = ({ summary }) => {
    if (!summary) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
      >
        <div className="flex items-center mb-4">
          <DocumentTextIcon className="w-6 h-6 text-blue-600 mr-2" />
          <h2 className="text-xl font-semibold text-gray-900">Executive Summary</h2>
        </div>
        
        <div className="space-y-4">
          {/* Financial Overview */}
          {summary.financial_overview && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Financial Overview</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Total Income</p>
                  <p className="text-lg font-bold text-green-600">
                    ₹{summary.financial_overview.total_income?.toLocaleString() || '0'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Expenses</p>
                  <p className="text-lg font-bold text-red-600">
                    ₹{summary.financial_overview.total_expenses?.toLocaleString() || '0'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Net Savings</p>
                  <p className="text-lg font-bold text-blue-600">
                    ₹{summary.financial_overview.net_savings?.toLocaleString() || '0'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tax Liability</p>
                  <p className="text-lg font-bold text-purple-600">
                    ₹{summary.financial_overview.tax_liability?.toLocaleString() || '0'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Key Insights */}
          {summary.key_insights && summary.key_insights.length > 0 && (
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Key Insights</h3>
              <ul className="space-y-2">
                {summary.key_insights.map((insight, index) => (
                  <li key={index} className="flex items-start">
                    <InformationCircleIcon className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Risk Factors */}
          {summary.risk_factors && summary.risk_factors.length > 0 && (
            <div className="bg-red-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2 flex items-center">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mr-2" />
                Risk Factors
              </h3>
              <ul className="space-y-1">
                {summary.risk_factors.map((risk, index) => (
                  <li key={index} className="text-gray-700 text-sm">• {risk}</li>
                ))}
              </ul>
            </div>
          )}

          {/* AI Generated Summary */}
          {summary.ai_summary && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700 leading-relaxed">{summary.ai_summary}</p>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  const FutureScopeSection = ({ futureScope }) => {
    if (!futureScope) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
      >
        <div className="flex items-center mb-4">
          <LightBulbIcon className="w-6 h-6 text-yellow-600 mr-2" />
          <h2 className="text-xl font-semibold text-gray-900">Future Scope & Recommendations</h2>
        </div>
        
        <div className="space-y-4">
          {/* Investment Opportunities */}
          {futureScope.investment_opportunities && futureScope.investment_opportunities.length > 0 && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2 flex items-center">
                <ArrowTrendingUpIcon className="w-5 h-5 text-green-600 mr-2" />
                Investment Opportunities
              </h3>
              <ul className="space-y-2">
                {futureScope.investment_opportunities.map((opp, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-green-600 mr-2">✓</span>
                    <div>
                      <p className="font-medium text-gray-900">{opp.title}</p>
                      <p className="text-sm text-gray-600">{opp.description}</p>
                      {opp.expected_return && (
                        <p className="text-xs text-green-600 mt-1">
                          Expected Return: {opp.expected_return}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Tax Optimization */}
          {futureScope.tax_optimization && futureScope.tax_optimization.length > 0 && (
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2 flex items-center">
                <BanknotesIcon className="w-5 h-5 text-purple-600 mr-2" />
                Tax Optimization Strategies
              </h3>
              <ul className="space-y-2">
                {futureScope.tax_optimization.map((strategy, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-purple-600 mr-2">→</span>
                    <div>
                      <p className="text-gray-900">{strategy.action}</p>
                      {strategy.potential_savings && (
                        <p className="text-sm text-purple-600">
                          Potential Savings: ₹{strategy.potential_savings.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Items */}
          {futureScope.action_items && futureScope.action_items.length > 0 && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Recommended Actions</h3>
              <div className="space-y-2">
                {futureScope.action_items.map((item, index) => (
                  <div key={index} className="flex items-start">
                    <input
                      type="checkbox"
                      className="mt-1 mr-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <p className="text-gray-900">{item.task}</p>
                      {item.deadline && (
                        <p className="text-xs text-gray-600 mt-1">
                          Deadline: {formatDate(item.deadline)}
                        </p>
                      )}
                      {item.priority && (
                        <span className={`text-xs px-2 py-1 rounded-full mt-1 inline-block ${
                          item.priority === 'high' ? 'bg-red-100 text-red-700' :
                          item.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {item.priority} priority
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Long-term Goals */}
          {futureScope.long_term_goals && (
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Long-term Financial Goals</h3>
              <p className="text-gray-700">{futureScope.long_term_goals}</p>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  if (loading || aiLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">{loading ? 'Loading reports...' : 'Generating AI report...'}</p>
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
        className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl p-8 text-white"
      >
        <div className="flex items-center space-x-4">
          <ChartBarIcon className="w-10 h-10" />
          <div>
            <h1 className="text-3xl font-bold mb-2">Financial Reports</h1>
            <p className="text-blue-100 text-lg">
              Comprehensive analysis, summaries, and future recommendations for your financial data
            </p>
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
      {aiError && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg"
        >
          {aiError}
        </motion.div>
      )}

  {(!reports || reports.length === 0) ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-8 text-center border border-gray-100"
        >
          <DocumentTextIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Reports Available</h2>
          <p className="text-gray-600">
            Reports will be automatically generated when you upload financial data in the Upload Files or Capital Gains sections.
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Report List */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Available Reports</h2>
            <div className="space-y-3">
              {reports.map((report) => (
                <ReportCard
                  key={report.id}
                  report={report}
                  isSelected={selectedReport?.id === report.id}
                  onClick={() => setSelectedReport(report)}
                />
              ))}
            </div>
          </div>

          {/* Report Details */}
          <div className="lg:col-span-2 space-y-6">
            {selectedReport ? (
              <>
                <SummarySection summary={selectedReport.summary} />
                <FutureScopeSection futureScope={selectedReport.future_scope} />
                {/* Gemini AI Report Section */}
                {aiReport && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-indigo-50 rounded-xl p-6 shadow-sm border border-indigo-100 mt-6"
                  >
                    <h2 className="text-xl font-semibold text-indigo-900 mb-2">AI Generated Financial Report & Tips</h2>
                    <p className="text-gray-800 whitespace-pre-line">{aiReport}</p>
                  </motion.div>
                )}
              </>
            ) : (
              <div className="bg-gray-50 rounded-xl p-8 text-center">
                <p className="text-gray-600">Select a report to view details</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;