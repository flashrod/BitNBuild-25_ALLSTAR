import React, { createContext, useContext, useState, useEffect } from 'react';

const FinancialDataContext = createContext();

// Utility to fetch analysis and tax data for a user
export const fetchUserFinancialData = async (userId, timeRange = 'monthly') => {
	const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
	try {
		const analysisRes = await fetch(`${API_URL}/analysis/${userId}?timeRange=${timeRange}`);
		const taxRes = await fetch(`${API_URL}/tax/${userId}/calculate`);
		const analysisData = analysisRes.ok ? await analysisRes.json() : null;
		const taxData = taxRes.ok ? await taxRes.json() : null;
		return {
			analysis: analysisData?.analysis || analysisData,
			tax: taxData,
		};
	} catch (err) {
		return { analysis: null, tax: null, error: 'Failed to fetch financial data' };
	}
};

export const FinancialDataProvider = ({ children, userId = 'mock-user-id', timeRange = 'monthly' }) => {
	const [analysis, setAnalysis] = useState(null);
	const [reports, setReports] = useState(null);
	const [tax, setTax] = useState(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);

	useEffect(() => {
		const fetchData = async () => {
			setLoading(true);
			setError(null);
			try {
				const { analysis, tax } = await fetchUserFinancialData(userId, timeRange);
				const reportsRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/reports/${userId}`);
				const reportsData = reportsRes.ok ? await reportsRes.json() : null;
				setAnalysis(analysis);
				setTax(tax);
				setReports(reportsData?.reports || reportsData);
			} catch (err) {
				setError('Failed to fetch financial data');
			} finally {
				setLoading(false);
			}
		};
		fetchData();
	}, [userId, timeRange]);

	return (
		<FinancialDataContext.Provider value={{ analysis, tax, reports, loading, error }}>
			{children}
		</FinancialDataContext.Provider>
	);
};

export const useFinancialData = () => useContext(FinancialDataContext);
