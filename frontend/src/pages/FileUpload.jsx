import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  CloudArrowUpIcon,
  DocumentTextIcon,
  CurrencyRupeeIcon,
  ArrowTrendingUpIcon,
  ChartBarIcon,
  BanknotesIcon,
  CreditCardIcon,
  HomeIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

const FileUpload = ({ user }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    console.log('File selected:', file); // Debug log
    if (file) {
      setSelectedFile(file);
      setUploadStatus('');
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const resetFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setSelectedFile(null);
    setUploadStatus('');
    setAnalysis(null);
  };

  const removeSelectedFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setSelectedFile(null);
    setUploadStatus('');
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadStatus('Please select a file to upload.');
      return;
    }
    if (!user?.id) {
      setUploadStatus('User not found. Please log in again.');
      console.error('FileUpload: Missing user.id', user);
      return;
    }
    
    setIsUploading(true);
    setUploadStatus('Uploading and analyzing...');
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/upload/${user.id}`,
        {
          method: 'POST',
          body: formData,
        }
      );
      const data = await res.json();
      if (res.ok) {
        setUploadStatus('Upload successful! You can upload another file.');
        setAnalysis(data.analysis);
        // Reset only the file input, keep analysis visible
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        setSelectedFile(null);
      } else {
        setUploadStatus(data.detail || 'Upload failed.');
        console.error('FileUpload: Backend error', data);
      }
    } catch (err) {
      setUploadStatus('Error uploading file. Backend may be down or unreachable.');
      console.error('FileUpload: Network error', err);
    } finally {
      setIsUploading(false);
    }
  };

  const PatternCard = ({ title, data, icon: Icon, color, bgColor }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`p-6 rounded-xl ${bgColor} border border-gray-100`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-900">{data?.count || 0}</p>
          <p className="text-sm text-gray-500">transactions</p>
        </div>
      </div>
      <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Total:</span>
          <span className="font-medium">₹{data?.total?.toLocaleString() || 0}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Average:</span>
          <span className="font-medium">₹{data?.average?.toLocaleString() || 0}</span>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-8 text-white"
      >
        <div className="flex items-center space-x-4">
          <CloudArrowUpIcon className="w-10 h-10" />
          <div>
            <h1 className="text-3xl font-bold mb-2">Smart Financial Data Ingestion</h1>
            <p className="text-blue-100 text-lg">
              Upload your bank statements, credit card statements, or CSV files for instant analysis
            </p>
          </div>
        </div>
      </motion.div>

      {/* Upload Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Upload Financial Document</h2>
          <div className="flex space-x-2">
            {analysis && (
              <button
                onClick={resetFileInput}
                className="px-4 py-2 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
              >
                Clear Analysis
              </button>
            )}
          </div>
        </div>
        
        <div 
          className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-500 transition-colors cursor-pointer"
          onClick={handleFileSelect}
        >
          <CloudArrowUpIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <div className="mb-4">
            <span className="text-lg font-medium text-gray-700 hover:text-blue-600">
              Click to upload or drag and drop
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.pdf,.xls,.xlsx"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Supported formats: CSV, PDF, Excel (.xls, .xlsx)
          </p>
          
          {selectedFile && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-center space-x-2">
                <DocumentTextIcon className="w-5 h-5 text-green-600" />
                <span className="text-green-800 font-medium">{selectedFile.name}</span>
                <button
                  onClick={removeSelectedFile}
                  className="ml-2 text-red-600 hover:text-red-800"
                  title="Remove file"
                >
                  ✕
                </button>
              </div>
            </motion.div>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleUpload();
            }}
            disabled={!selectedFile || isUploading}
            className={`px-8 py-3 rounded-xl font-semibold transition-all ${
              selectedFile && !isUploading
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isUploading ? (
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Processing...</span>
              </div>
            ) : selectedFile ? (
              'Upload & Analyze'
            ) : (
              'Select a file first'
            )}
          </button>
        </div>

        {uploadStatus && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-4 p-4 rounded-lg ${
              uploadStatus.includes('successful') 
                ? 'bg-green-50 border border-green-200 text-green-800' 
                : uploadStatus.includes('Error') || uploadStatus.includes('failed')
                ? 'bg-red-50 border border-red-200 text-red-800'
                : 'bg-blue-50 border border-blue-200 text-blue-800'
            }`}
          >
            {uploadStatus}
          </motion.div>
        )}
      </motion.div>

      {/* Analysis Results */}
      {analysis && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Summary Stats */}
          <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Analysis Summary</h2>
              <div className="text-sm text-gray-500">
                Latest upload analysis
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl">
                <ChartBarIcon className="w-8 h-8 text-blue-600 mb-3" />
                <p className="text-2xl font-bold text-gray-900">{analysis.total_transactions}</p>
                <p className="text-sm text-gray-600">Total Transactions</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl">
                <ArrowTrendingUpIcon className="w-8 h-8 text-green-600 mb-3" />
                <p className="text-2xl font-bold text-gray-900">₹{analysis.income_analysis?.total?.toLocaleString() || 0}</p>
                <p className="text-sm text-gray-600">Total Income</p>
              </div>
              <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-xl">
                <CurrencyRupeeIcon className="w-8 h-8 text-red-600 mb-3" />
                <p className="text-2xl font-bold text-gray-900">₹{analysis.expense_analysis?.total?.toLocaleString() || 0}</p>
                <p className="text-sm text-gray-600">Total Expenses</p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl">
                <DocumentTextIcon className="w-8 h-8 text-purple-600 mb-3" />
                <p className="text-2xl font-bold text-gray-900">{analysis.recurring_transactions?.count || 0}</p>
                <p className="text-sm text-gray-600">Recurring Transactions</p>
              </div>
            </div>
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Analysis Period:</span> {analysis.date_range?.start} - {analysis.date_range?.end}
              </p>
            </div>
          </div>

          {/* Transaction Patterns */}
          <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Smart Pattern Recognition</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {analysis.emi && (
                <PatternCard
                  title="EMI Payments"
                  data={analysis.emi}
                  icon={BanknotesIcon}
                  color="bg-gradient-to-br from-orange-500 to-orange-700"
                  bgColor="bg-gradient-to-br from-orange-50 to-orange-100"
                />
              )}
              {analysis.sip && (
                <PatternCard
                  title="SIP Investments"
                  data={analysis.sip}
                  icon={ArrowTrendingUpIcon}
                  color="bg-gradient-to-br from-green-500 to-green-700"
                  bgColor="bg-gradient-to-br from-green-50 to-green-100"
                />
              )}
              {analysis.rent && (
                <PatternCard
                  title="Rent Payments"
                  data={analysis.rent}
                  icon={HomeIcon}
                  color="bg-gradient-to-br from-blue-500 to-blue-700"
                  bgColor="bg-gradient-to-br from-blue-50 to-blue-100"
                />
              )}
              {analysis.insurance && (
                <PatternCard
                  title="Insurance"
                  data={analysis.insurance}
                  icon={ShieldCheckIcon}
                  color="bg-gradient-to-br from-purple-500 to-purple-700"
                  bgColor="bg-gradient-to-br from-purple-50 to-purple-100"
                />
              )}
            </div>
          </div>

          {/* Category Breakdown */}
          {analysis.category_breakdown && (
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Category Breakdown</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Category</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-900">Total Amount</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-900">Count</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-900">Average</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {Object.entries(analysis.category_breakdown.sum).map(([cat, total]) => (
                      <tr key={cat} className="hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium text-gray-900 capitalize">{cat}</td>
                        <td className="py-3 px-4 text-right font-medium text-gray-900">₹{total.toLocaleString()}</td>
                        <td className="py-3 px-4 text-right text-gray-600">{analysis.category_breakdown.count[cat]}</td>
                        <td className="py-3 px-4 text-right text-gray-600">₹{analysis.category_breakdown.mean[cat]?.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Monthly Trend */}
          {analysis.monthly_trend && (
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Monthly Trend Analysis</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Month</th>
                      <th className="text-right py-3 px-4 font-semibold text-green-600">Income</th>
                      <th className="text-right py-3 px-4 font-semibold text-red-600">Expenses</th>
                      <th className="text-right py-3 px-4 font-semibold text-blue-600">Net Savings</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {Object.entries(analysis.monthly_trend).map(([month, trend]) => (
                      <tr key={month} className="hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium text-gray-900">{month}</td>
                        <td className="py-3 px-4 text-right font-medium text-green-600">₹{trend.income?.toLocaleString()}</td>
                        <td className="py-3 px-4 text-right font-medium text-red-600">₹{trend.expense?.toLocaleString()}</td>
                        <td className="py-3 px-4 text-right font-medium text-blue-600">₹{trend.net?.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default FileUpload;