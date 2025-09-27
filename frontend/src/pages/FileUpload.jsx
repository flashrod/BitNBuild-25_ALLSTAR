import React, { useState } from 'react';
import { supabase } from "../supabaseClient";

const FileUpload = ({ user }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [analysis, setAnalysis] = useState(null);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
    setUploadStatus('');
    setAnalysis(null);
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
    setUploadStatus('Uploading...');
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
        setUploadStatus('Upload successful!');
        setAnalysis(data.analysis);
      } else {
        setUploadStatus(data.detail || 'Upload failed.');
        console.error('FileUpload: Backend error', data);
      }
    } catch (err) {
      setUploadStatus('Error uploading file. Backend may be down or unreachable.');
      console.error('FileUpload: Network error', err);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Upload Financial Data</h1>
      <p className="text-gray-600">Upload your bank statements and financial documents (CSV, PDF, Excel).</p>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select File
          </label>
          <input
            type="file"
            accept=".csv,.pdf,.xls,.xlsx"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {selectedFile && (
            <p className="mt-2 text-sm text-green-600">
              Selected: {selectedFile.name}
            </p>
          )}
        </div>
        <button
          onClick={handleUpload}
          disabled={!selectedFile}
          className={`px-6 py-3 rounded-lg font-semibold transition-all ${
            selectedFile
              ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-lg'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {selectedFile ? 'Upload File' : 'Select a file first'}
        </button>
      </div>
      {uploadStatus && <div className="mt-2 text-sm">{uploadStatus}</div>}
      {analysis && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <h2 className="font-semibold mb-2">Analysis Summary</h2>
          {/* Show summary stats */}
          <div className="mb-2">
            <strong>Total Transactions:</strong> {analysis.total_transactions}<br/>
            <strong>Date Range:</strong> {analysis.date_range?.start} - {analysis.date_range?.end}<br/>
            <strong>Income Total:</strong> ₹{analysis.income_analysis?.total?.toLocaleString()}<br/>
            <strong>Expense Total:</strong> ₹{analysis.expense_analysis?.total?.toLocaleString()}<br/>
            <strong>Recurring Transactions:</strong> {analysis.recurring_transactions?.count} (₹{analysis.recurring_transactions?.total_amount?.toLocaleString()})
          </div>
          {/* Show category breakdown */}
          {analysis.category_breakdown && (
            <div className="mb-2">
              <h3 className="font-semibold">Category Breakdown</h3>
              <table className="w-full text-xs border">
                <thead>
                  <tr>
                    <th className="border px-2 py-1">Category</th>
                    <th className="border px-2 py-1">Total</th>
                    <th className="border px-2 py-1">Count</th>
                    <th className="border px-2 py-1">Average</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(analysis.category_breakdown.sum).map(([cat, total]) => (
                    <tr key={cat}>
                      <td className="border px-2 py-1">{cat}</td>
                      <td className="border px-2 py-1">₹{total.toLocaleString()}</td>
                      <td className="border px-2 py-1">{analysis.category_breakdown.count[cat]}</td>
                      <td className="border px-2 py-1">₹{analysis.category_breakdown.mean[cat]?.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {/* Show monthly trend */}
          {analysis.monthly_trend && (
            <div className="mb-2">
              <h3 className="font-semibold">Monthly Trend</h3>
              <table className="w-full text-xs border">
                <thead>
                  <tr>
                    <th className="border px-2 py-1">Month</th>
                    <th className="border px-2 py-1">Income</th>
                    <th className="border px-2 py-1">Expense</th>
                    <th className="border px-2 py-1">Net</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(analysis.monthly_trend).map(([month, trend]) => (
                    <tr key={month}>
                      <td className="border px-2 py-1">{month}</td>
                      <td className="border px-2 py-1">₹{trend.income?.toLocaleString()}</td>
                      <td className="border px-2 py-1">₹{trend.expense?.toLocaleString()}</td>
                      <td className="border px-2 py-1">₹{trend.net?.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FileUpload;