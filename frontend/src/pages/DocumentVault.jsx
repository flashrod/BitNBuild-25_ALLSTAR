import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DocumentArrowUpIcon, 
  FolderIcon,
  EyeIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CloudArrowUpIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  BellIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
  TagIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';

import { GlassPanel } from '../components/GlassPanel'; 
import Button from '../components/Button';
import Input from '../components/Input';
import { api } from '../api';


const DocumentVault = ({ user }) => {
  const [documents, setDocuments] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [activeTab, setActiveTab] = useState('documents');
  
  const fileInputRef = useRef(null);

  // Document types for form
  const documentTypes = [
    { value: 'pan_card', label: 'PAN Card', icon: '🏦' },
    { value: 'aadhaar', label: 'Aadhaar Card', icon: '🆔' },
    { value: 'passport', label: 'Passport', icon: '🛂' },
    { value: 'driving_license', label: 'Driving License', icon: '🚗' },
    { value: 'insurance_policy', label: 'Insurance Policy', icon: '🛡️' },
    { value: 'loan_agreement', label: 'Loan Agreement', icon: '💰' },
    { value: 'property_papers', label: 'Property Papers', icon: '🏠' },
    { value: 'bank_statements', label: 'Bank Statements', icon: '🏪' },
    { value: 'tax_documents', label: 'Tax Documents', icon: '📋' },
    { value: 'investment_documents', label: 'Investment Documents', icon: '📈' },
    { value: 'medical_records', label: 'Medical Records', icon: '🏥' },
    { value: 'other', label: 'Other', icon: '📄' }
  ];

  useEffect(() => {
    if (user) {
      loadDocuments();
      loadReminders();
      loadStats();
    }
  }, [user]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/vault/${user.user_id}/documents`);
      setDocuments(response.data.documents);
    } catch (error) {
      console.error('Failed to load documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadReminders = async () => {
    try {
      const response = await api.get(`/vault/${user.user_id}/reminders`);
      setReminders(response.data.reminders);
    } catch (error) {
      console.error('Failed to load reminders:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await api.get(`/vault/${user.user_id}/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('document_type', 'other'); // Default, will be updated in modal
      
      const response = await api.post(`/vault/${user.user_id}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        await loadDocuments();
        await loadStats();
        setShowUploadModal(false);
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDocumentView = async (document) => {
    setSelectedDocument(document);
    try {
      // Log document access
      await api.get(`/vault/${user.user_id}/documents/${document.id}`);
    } catch (error) {
      console.error('Failed to load document details:', error);
    }
  };

  const handleDocumentDownload = async (document) => {
    try {
      const response = await api.get(`/vault/${user.user_id}/documents/${document.id}/download`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = document.file_name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Download failed. Please try again.');
    }
  };

  const handleDocumentDelete = async (document) => {
    if (!confirm(`Are you sure you want to permanently delete "${document.title}"?`)) {
      return;
    }

    try {
      await api.delete(`/vault/${user.user_id}/documents/${document.id}`);
      await loadDocuments();
      await loadStats();
      setSelectedDocument(null);
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Delete failed. Please try again.');
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.document_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (doc.tags && doc.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));
    
    const matchesFilter = filterType === 'all' || doc.document_type === filterType;
    
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-50';
      case 'expired': return 'text-red-600 bg-red-50';
      case 'expiring_soon': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getDocumentIcon = (docType) => {
    const type = documentTypes.find(t => t.value === docType);
    return type ? type.icon : '📄';
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const StatCard = ({ title, value, icon: Icon, color = "blue", subtitle = "" }) => (
    <GlassPanel className="p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg bg-${color}-100 text-${color}-600 mr-4`}>
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-sm text-gray-600">{title}</p>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
      </div>
    </GlassPanel>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-lg text-gray-600">Loading your secure vault...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <ShieldCheckIcon className="h-8 w-8 text-blue-600 mr-3" />
                Secure Document Vault
              </h1>
              <p className="text-gray-600 mt-2">
                Your encrypted financial document repository with AI-powered insights
              </p>
            </div>
            <Button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center"
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <CloudArrowUpIcon className="h-5 w-5 mr-2" />
                  Upload Document
                </>
              )}
            </Button>
          </motion.div>
        </div>

        {/* Statistics Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <StatCard
            title="Total Documents"
            value={stats.document_counts?.total || 0}
            icon={DocumentTextIcon}
            color="blue"
            subtitle={`${formatFileSize(stats.storage?.total_size_bytes || 0)} used`}
          />
          <StatCard
            title="Expired Documents"
            value={stats.document_counts?.expired || 0}
            icon={ExclamationTriangleIcon}
            color="red"
            subtitle="Require immediate attention"
          />
          <StatCard
            title="Expiring Soon"
            value={stats.document_counts?.expiring_soon || 0}
            icon={CalendarIcon}
            color="yellow"
            subtitle="Within 30 days"
          />
          <StatCard
            title="Active Reminders"
            value={stats.reminders?.active || 0}
            icon={BellIcon}
            color="green"
            subtitle="Upcoming notifications"
          />
        </motion.div>

        {/* Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            {[
              { key: 'documents', label: 'Documents', icon: FolderIcon },
              { key: 'reminders', label: 'Reminders', icon: BellIcon },
              { key: 'insights', label: 'Insights', icon: ChartBarIcon }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === tab.key
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'documents' && (
            <motion.div
              key="documents"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              {/* Search and Filter */}
              <GlassPanel className="p-4 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Search documents..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="flex items-center">
                    <FunnelIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Types</option>
                      {documentTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </GlassPanel>

              {/* Documents Grid */}
              {filteredDocuments.length === 0 ? (
                <GlassPanel className="p-12 text-center">
                  <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
                  <p className="text-gray-500 mb-4">
                    {searchQuery || filterType !== 'all' 
                      ? 'Try adjusting your search or filter criteria'
                      : 'Upload your first document to get started'
                    }
                  </p>
                  {!searchQuery && filterType === 'all' && (
                    <Button onClick={() => setShowUploadModal(true)}>
                      <CloudArrowUpIcon className="h-4 w-4 mr-2" />
                      Upload Document
                    </Button>
                  )}
                </GlassPanel>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredDocuments.map((document) => (
                    <motion.div
                      key={document.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ scale: 1.02 }}
                      className="group"
                    >
                      <GlassPanel className="p-6 cursor-pointer transition-all hover:shadow-lg">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center">
                            <span className="text-2xl mr-3">
                              {getDocumentIcon(document.document_type)}
                            </span>
                            <div>
                              <h3 className="font-semibold text-gray-900 line-clamp-1">
                                {document.title}
                              </h3>
                              <p className="text-sm text-gray-500">
                                {document.document_type.replace('_', ' ').toUpperCase()}
                              </p>
                            </div>
                          </div>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(document.status)}`}>
                            {document.status.replace('_', ' ')}
                          </span>
                        </div>

                        <div className="space-y-2 text-sm text-gray-600 mb-4">
                          <div className="flex justify-between">
                            <span>Size:</span>
                            <span>{formatFileSize(document.file_size)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Created:</span>
                            <span>{formatDate(document.created_at)}</span>
                          </div>
                          {document.expiry_date && (
                            <div className="flex justify-between">
                              <span>Expires:</span>
                              <span className={
                                new Date(document.expiry_date) < new Date() 
                                  ? 'text-red-600 font-medium' 
                                  : ''
                              }>
                                {formatDate(document.expiry_date)}
                              </span>
                            </div>
                          )}
                          {document.access_count > 0 && (
                            <div className="flex justify-between">
                              <span>Accessed:</span>
                              <span>{document.access_count} times</span>
                            </div>
                          )}
                        </div>

                        {/* Tags */}
                        {document.tags && document.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-4">
                            {document.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-50 text-blue-600"
                              >
                                <TagIcon className="h-3 w-3 mr-1" />
                                {tag}
                              </span>
                            ))}
                            {document.tags.length > 3 && (
                              <span className="text-xs text-gray-500">
                                +{document.tags.length - 3} more
                              </span>
                            )}
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleDocumentView(document)}
                            className="flex-1 flex items-center justify-center px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
                          >
                            <EyeIcon className="h-4 w-4 mr-1" />
                            View
                          </button>
                          <button
                            onClick={() => handleDocumentDownload(document)}
                            className="flex-1 flex items-center justify-center px-3 py-2 text-sm bg-green-50 text-green-600 rounded-md hover:bg-green-100 transition-colors"
                          >
                            <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                            Download
                          </button>
                          <button
                            onClick={() => handleDocumentDelete(document)}
                            className="flex items-center justify-center px-3 py-2 text-sm bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </GlassPanel>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'reminders' && (
            <motion.div
              key="reminders"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <RemindersDashboard 
                reminders={reminders} 
                user={user} 
                onReminderUpdate={loadReminders}
              />
            </motion.div>
          )}

          {activeTab === 'insights' && (
            <motion.div
              key="insights"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <InsightsDashboard stats={stats} documents={documents} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Upload Modal */}
        <AnimatePresence>
          {showUploadModal && (
            <UploadModal
              user={user}
              onClose={() => setShowUploadModal(false)}
              onUploadSuccess={() => {
                loadDocuments();
                loadStats();
                setShowUploadModal(false);
              }}
              documentTypes={documentTypes}
            />
          )}
        </AnimatePresence>

        {/* Document Details Modal */}
        <AnimatePresence>
          {selectedDocument && (
            <DocumentDetailsModal
              document={selectedDocument}
              user={user}
              onClose={() => setSelectedDocument(null)}
              onDelete={handleDocumentDelete}
              onDownload={handleDocumentDownload}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// Separate components for better organization
const RemindersDashboard = ({ reminders, user, onReminderUpdate }) => {
  const urgentReminders = reminders.filter(r => {
    const daysUntil = Math.ceil((new Date(r.reminder_date) - new Date()) / (1000 * 60 * 60 * 24));
    return daysUntil <= 7;
  });

  const upcomingReminders = reminders.filter(r => {
    const daysUntil = Math.ceil((new Date(r.reminder_date) - new Date()) / (1000 * 60 * 60 * 24));
    return daysUntil > 7 && daysUntil <= 30;
  });

  return (
    <div className="space-y-6">
      {urgentReminders.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-red-600 mb-4">🚨 Urgent Reminders</h3>
          <div className="space-y-3">
            {urgentReminders.map((reminder) => (
              <ReminderCard key={reminder.id} reminder={reminder} urgent />
            ))}
          </div>
        </div>
      )}

      {upcomingReminders.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-blue-600 mb-4">📅 Upcoming Reminders</h3>
          <div className="space-y-3">
            {upcomingReminders.map((reminder) => (
              <ReminderCard key={reminder.id} reminder={reminder} />
            ))}
          </div>
        </div>
      )}

      {reminders.length === 0 && (
        <GlassPanel className="p-12 text-center">
          <BellIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No reminders set</h3>
          <p className="text-gray-500">Upload documents with expiry dates to automatically generate reminders</p>
        </GlassPanel>
      )}
    </div>
  );
};

const ReminderCard = ({ reminder, urgent = false }) => {
  const daysUntil = Math.ceil((new Date(reminder.reminder_date) - new Date()) / (1000 * 60 * 60 * 24));
  
  return (
    <GlassPanel className={`p-4 border-l-4 ${urgent ? 'border-red-500' : 'border-blue-500'}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="font-medium text-gray-900">{reminder.title}</h4>
          <p className="text-sm text-gray-600 mt-1">{reminder.description}</p>
          <div className="flex items-center mt-2 text-xs text-gray-500">
            <CalendarIcon className="h-3 w-3 mr-1" />
            <span>{daysUntil > 0 ? `${daysUntil} days` : 'Today'}</span>
            <span className="ml-4 bg-gray-100 px-2 py-1 rounded">
              Priority: {reminder.priority}/10
            </span>
          </div>
          {reminder.suggested_actions && reminder.suggested_actions.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-medium text-gray-700 mb-1">Suggested Actions:</p>
              <ul className="text-xs text-gray-600 space-y-1">
                {reminder.suggested_actions.slice(0, 2).map((action, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-blue-500 mr-1">•</span>
                    {action}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          urgent ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
        }`}>
          {reminder.type.replace('_', ' ')}
        </span>
      </div>
    </GlassPanel>
  );
};

const InsightsDashboard = ({ stats, documents }) => {
  const expiredDocs = documents.filter(doc => 
    doc.expiry_date && new Date(doc.expiry_date) < new Date()
  );

  const expiringSoon = documents.filter(doc => {
    if (!doc.expiry_date) return false;
    const daysUntil = Math.ceil((new Date(doc.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));
    return daysUntil > 0 && daysUntil <= 30;
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassPanel className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Document Health Score</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Overall Health</span>
              <span className={`font-semibold ${
                expiredDocs.length === 0 && expiringSoon.length <= 2 
                  ? 'text-green-600' : expiredDocs.length > 0 
                  ? 'text-red-600' : 'text-yellow-600'
              }`}>
                {expiredDocs.length === 0 && expiringSoon.length <= 2 
                  ? 'Excellent' : expiredDocs.length > 0 
                  ? 'Needs Attention' : 'Good'
                }
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${
                  expiredDocs.length === 0 && expiringSoon.length <= 2 
                    ? 'bg-green-500' : expiredDocs.length > 0 
                    ? 'bg-red-500' : 'bg-yellow-500'
                }`}
                style={{ 
                  width: `${Math.max(20, 100 - (expiredDocs.length + expiringSoon.length) * 10)}%` 
                }}
              ></div>
            </div>
          </div>
        </GlassPanel>

        <GlassPanel className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">💡 Smart Recommendations</h3>
          <div className="space-y-3">
            {expiredDocs.length > 0 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm font-medium text-red-800">
                  ⚠️ {expiredDocs.length} document(s) have expired
                </p>
                <p className="text-xs text-red-600 mt-1">
                  Immediate renewal required to avoid penalties
                </p>
              </div>
            )}
            {expiringSoon.length > 0 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm font-medium text-yellow-800">
                  ⏰ {expiringSoon.length} document(s) expiring soon
                </p>
                <p className="text-xs text-yellow-600 mt-1">
                  Start renewal process to avoid last-minute rush
                </p>
              </div>
            )}
            {expiredDocs.length === 0 && expiringSoon.length === 0 && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm font-medium text-green-800">
                  ✅ All documents are up to date
                </p>
                <p className="text-xs text-green-600 mt-1">
                  Great job keeping your documents current!
                </p>
              </div>
            )}
          </div>
        </GlassPanel>
      </div>

      {/* Document Type Breakdown */}
      {stats.document_counts?.by_type && (
        <GlassPanel className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 Document Type Breakdown</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(stats.document_counts.by_type).map(([type, count]) => (
              <div key={type} className="text-center">
                <div className="text-2xl font-bold text-blue-600">{count}</div>
                <div className="text-sm text-gray-600 capitalize">
                  {type.replace('_', ' ')}
                </div>
              </div>
            ))}
          </div>
        </GlassPanel>
      )}
    </div>
  );
};

// Upload Modal Component
const UploadModal = ({ user, onClose, onUploadSuccess, documentTypes }) => {
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    document_type: 'other',
    description: '',
    tags: '',
    issue_date: '',
    expiry_date: '',
    document_number: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
    if (file && !formData.title) {
      setFormData(prev => ({ ...prev, title: file.name.split('.')[0] }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedFile) {
      alert('Please select a file to upload');
      return;
    }

    setUploading(true);
    try {
      const submitData = new FormData();
      submitData.append('file', selectedFile);
      
      // Add all form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (value) {
          submitData.append(key, value);
        }
      });

      const response = await api.post(`/vault/${user.user_id}/upload`, submitData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.message) {
        onUploadSuccess();
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-screen overflow-y-auto"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Upload Secure Document</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select File *
            </label>
            <div 
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              {selectedFile ? (
                <div className="space-y-2">
                  <DocumentArrowUpIcon className="h-8 w-8 text-blue-600 mx-auto" />
                  <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <CloudArrowUpIcon className="h-8 w-8 text-gray-400 mx-auto" />
                  <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                  <p className="text-xs text-gray-500">PDF, JPG, PNG up to 10MB</p>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={handleFileSelect}
            />
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <Input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Document title"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Document Type *
              </label>
              <select
                value={formData.document_type}
                onChange={(e) => setFormData(prev => ({ ...prev, document_type: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {documentTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Additional Fields */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Optional description"
              rows="3"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Document Number
              </label>
              <Input
                type="text"
                value={formData.document_number}
                onChange={(e) => setFormData(prev => ({ ...prev, document_number: e.target.value }))}
                placeholder="ID/Reference number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Issue Date
              </label>
              <Input
                type="date"
                value={formData.issue_date}
                onChange={(e) => setFormData(prev => ({ ...prev, issue_date: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expiry Date
              </label>
              <Input
                type="date"
                value={formData.expiry_date}
                onChange={(e) => setFormData(prev => ({ ...prev, expiry_date: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            <Input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
              placeholder="Comma-separated tags (e.g., important, tax, renewal)"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={uploading || !selectedFile}
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <ShieldCheckIcon className="h-4 w-4 mr-2" />
                  Upload Securely
                </>
              )}
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

// Document Details Modal Component
const DocumentDetailsModal = ({ document, user, onClose, onDelete, onDownload }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-screen overflow-y-auto"
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{document.title}</h2>
            <p className="text-gray-600">
              {document.document_type.replace('_', ' ').toUpperCase()}
            </p>
          </div>
          <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(document.status)}`}>
            {document.status.replace('_', ' ')}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Document Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">File Name:</span>
                  <span className="font-medium">{document.file_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">File Size:</span>
                  <span className="font-medium">{formatFileSize(document.file_size)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">File Type:</span>
                  <span className="font-medium">{document.file_type}</span>
                </div>
                {document.document_number && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Document #:</span>
                    <span className="font-medium">{document.document_number}</span>
                  </div>
                )}
              </div>
            </div>

            {document.description && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-sm text-gray-600">{document.description}</p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Dates</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Created:</span>
                  <span className="font-medium">{formatDate(document.created_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Updated:</span>
                  <span className="font-medium">{formatDate(document.updated_at)}</span>
                </div>
                {document.issue_date && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Issue Date:</span>
                    <span className="font-medium">{formatDate(document.issue_date)}</span>
                  </div>
                )}
                {document.expiry_date && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Expiry Date:</span>
                    <span className={`font-medium ${
                      new Date(document.expiry_date) < new Date() 
                        ? 'text-red-600' : ''
                    }`}>
                      {formatDate(document.expiry_date)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Access</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Times Accessed:</span>
                  <span className="font-medium">{document.access_count}</span>
                </div>
                {document.accessed_at && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Accessed:</span>
                    <span className="font-medium">{formatDate(document.accessed_at)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tags */}
        {document.tags && document.tags.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {document.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-blue-50 text-blue-600"
                >
                  <TagIcon className="h-3 w-3 mr-1" />
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="danger"
            onClick={() => onDelete(document)}
            className="flex items-center"
          >
            <TrashIcon className="h-4 w-4 mr-2" />
            Delete
          </Button>
          <div className="flex space-x-3">
            <Button
              variant="secondary"
              onClick={onClose}
            >
              Close
            </Button>
            <Button
              onClick={() => onDownload(document)}
              className="flex items-center"
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-IN');
};

const getStatusColor = (status) => {
  switch (status) {
    case 'active': return 'text-green-600 bg-green-50';
    case 'expired': return 'text-red-600 bg-red-50';
    case 'expiring_soon': return 'text-yellow-600 bg-yellow-50';
    default: return 'text-gray-600 bg-gray-50';
  }
};

export default DocumentVault;