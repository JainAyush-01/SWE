import React, { useState, useEffect } from 'react';
import { api } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import DocumentStatusBadge from '../components/DocumentStatusBadge';
import ModalDocumentDetail from '../components/ModalDocumentDetail';
import NewDocumentSubmissionModal from './NewDocumentSubmissionModal';
import RoleUpgradeRequestModal from '../components/RoleUpgradeRequestModal';
import Pagination from '../components/Pagination';
import {
  FilePlus,
  Search,
  Eye,
  FileEdit,
  RotateCcw,
  Ban,
  FileText
} from 'lucide-react';

export default function SubmitterDashboard() {
  const { currentUser } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [roleRequests, setRoleRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'active', 'returned', 'completed'
  const [documentPage, setDocumentPage] = useState(1);
  const documentsPerPage = 8;

  // Modal states
  const [selectedDocId, setSelectedDocId] = useState(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [editingDraft, setEditingDraft] = useState(null);
  const [showRoleRequestModal, setShowRoleRequestModal] = useState(false);

  useEffect(() => {
    loadMyDocuments();
    api.getMyRoleUpgradeRequests().then(res => setRoleRequests(res.requests || [])).catch(() => setRoleRequests([]));
  }, [currentUser]);

  const loadMyDocuments = async () => {
    setLoading(true);
    try {
      const res = await api.getMyDocuments();
      if (res.success) {
        setDocuments(res.documents || []);
      }
    } catch (err) {
      console.error('Failed to load submitter documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch =
      (doc.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.documentId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.templateName || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === 'returned') return doc.currentStatus === 'Returned';
    if (activeTab === 'active') return ['Submitted', 'Under Review'].includes(doc.currentStatus);
    if (activeTab === 'completed') return ['Completed', 'Approved', 'Rejected'].includes(doc.currentStatus);
    return true;
  });
  const paginatedDocuments = filteredDocuments.slice((documentPage - 1) * documentsPerPage, documentPage * documentsPerPage);

  // Modal State
  const [modal, setModal] = useState(null);
  const closeModal = () => setModal(null);

  const handleWithdraw = (docId) => {
    setModal({
      isOpen: true,
      type: 'confirm',
      title: 'Withdraw Application',
      message: 'Are you sure you want to withdraw this application? This action cannot be undone.',
      onConfirm: async () => {
        try {
          const res = await api.withdrawDocument(docId);
          if (res.success) {
            await loadMyDocuments();
          }
        } catch (err) {
          setModal({
            isOpen: true,
            type: 'alert',
            title: 'Withdrawal Failed',
            message: err.message || 'Could not withdraw document.'
          });
        }
      }
    });
  };

  const inReviewCount = documents.filter(d => ['Submitted', 'Under Review'].includes(d.currentStatus)).length;
  const returnedCount = documents.filter(d => d.currentStatus === 'Returned').length;
  const completedCount = documents.filter(d => ['Completed', 'Approved', 'Rejected'].includes(d.currentStatus)).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* --- GLOBAL MODAL --- */}
      {modal && modal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl max-w-md w-full p-8">
            <h3 className={`text-2xl font-black uppercase tracking-tighter mb-2 ${modal.title.includes('DANGER') || modal.title.includes('Failed') ? 'text-red-600' : 'text-gray-900'}`}>
              {modal.title}
            </h3>
            <p className="text-sm font-bold text-gray-500 mb-6 leading-relaxed">{modal.message}</p>

            <div className="flex gap-3 justify-end">
              {modal.type === 'confirm' && (
                <button onClick={closeModal} className="px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all cursor-pointer">
                  Cancel
                </button>
              )}
              <button
                onClick={() => {
                  if (modal.onConfirm) modal.onConfirm();
                  closeModal();
                }}
                className={`px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest text-white shadow-xl transition-all active:scale-95 cursor-pointer ${
                  modal.title.includes('Withdraw') || modal.title.includes('DANGER') ? 'bg-red-600 hover:bg-red-700' : 'bg-[#005a9c] hover:bg-blue-800'
                }`}
              >
                {modal.type === 'alert' ? 'Okay' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- HERO BANNER --- */}
      <div className="rounded-[2rem] sm:rounded-[2.5rem] bg-[#005a9c] p-6 sm:p-8 mb-8 text-white flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-xl">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight uppercase">My Document Requests</h1>
          <p className="text-blue-100 text-xs font-bold uppercase tracking-widest mt-1">
            {currentUser?.rollNo ? `${currentUser.rollNo} • ` : ''}{currentUser?.institutionalEmail}
          </p>
        </div>

        <div className="flex gap-3 flex-wrap">
          {currentUser?.systemRole === 'Submitter' && (
            <button
              onClick={() => setShowRoleRequestModal(true)}
              className="bg-white/10 text-white border border-white/30 hover:bg-white/20 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer"
            >
              Request Role Access
            </button>
          )}
          <button
            onClick={() => {
              setEditingDraft(null);
              setShowSubmitModal(true);
            }}
            className="bg-white text-[#005a9c] hover:bg-gray-100 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            id="btn-new-document"
          >
            <FilePlus size={16} /> New Application
          </button>
        </div>
      </div>

      {currentUser?.systemRole === 'Submitter' && roleRequests[0] && (
        <div className={`mb-6 rounded-2xl border px-4 py-3 text-xs font-semibold ${roleRequests[0].status === 'Pending' ? 'bg-amber-50 border-amber-200 text-amber-900' : roleRequests[0].status === 'Approved' ? 'bg-green-50 border-green-200 text-green-900' : 'bg-red-50 border-red-200 text-red-900'}`}>
          Latest role request: <span className="font-black">{roleRequests[0].requestedRole}</span> · {roleRequests[0].status}
          {roleRequests[0].reviewerComment && <span> · {roleRequests[0].reviewerComment}</span>}
        </div>
      )}

      {/* --- FILTER & SEARCH BAR --- */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        {/* Filter Pills */}
        <div className="flex bg-gray-100 p-1.5 rounded-2xl border border-gray-200 overflow-x-auto w-full sm:w-auto">
          <button
            onClick={() => { setActiveTab('all'); setDocumentPage(1); }}
            className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'all' ? 'bg-white text-[#005a9c] shadow-sm' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            All ({documents.length})
          </button>
          <button
            onClick={() => { setActiveTab('active'); setDocumentPage(1); }}
            className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'active' ? 'bg-white text-[#005a9c] shadow-sm' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            In Review ({inReviewCount})
          </button>
          <button
            onClick={() => { setActiveTab('returned'); setDocumentPage(1); }}
            className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'returned' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Returned ({returnedCount})
          </button>
          <button
            onClick={() => { setActiveTab('completed'); setDocumentPage(1); }}
            className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'completed' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Completed ({completedCount})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search size={16} className="text-gray-400 absolute left-4 top-3" />
          <input
            type="text"
            placeholder="Search by title, ID, or form..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setDocumentPage(1); }}
            className="w-full bg-white border border-gray-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs font-bold focus:ring-2 focus:ring-[#005a9c] outline-none shadow-sm transition-all"
          />
        </div>
      </div>

      {/* --- DOCUMENTS CONTENT --- */}
      {loading ? (
        <div className="bg-white rounded-[2rem] p-12 text-center border border-gray-100 shadow-sm">
          <div className="inline-block w-8 h-8 border-3 border-gray-200 border-t-[#005a9c] rounded-full animate-spin mb-3"></div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Loading documents...</p>
        </div>
      ) : filteredDocuments.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-[2.5rem] p-12 text-center border border-gray-100 shadow-sm max-w-xl mx-auto my-6">
          <div className="w-16 h-16 bg-blue-50 text-[#005a9c] rounded-3xl flex items-center justify-center mx-auto mb-4">
            <FileText size={30} />
          </div>
          <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">No Document Applications Found</h3>
          <p className="text-xs font-bold text-gray-400 mt-2 mb-6">
            {searchQuery
              ? 'No requests match your current search query.'
              : 'You have not submitted any routing requests. Select a predefined institutional form to begin.'}
          </p>
          <button
            onClick={() => {
              setEditingDraft(null);
              setShowSubmitModal(true);
            }}
            className="bg-[#005a9c] hover:bg-blue-800 text-white px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg transition-all inline-flex items-center gap-2 cursor-pointer"
          >
            <FilePlus size={16} /> Submit New Application
          </button>
        </div>
      ) : (
        /* Document Cards Table */
        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/70 text-[10px] font-black uppercase tracking-widest text-gray-400">
                  <th className="py-4 px-6">Application ID</th>
                  <th className="py-4 px-6">Subject / Title</th>
                  <th className="py-4 px-6">Form Type</th>
                  <th className="py-4 px-6">Current Office</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Last Updated</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {paginatedDocuments.map((doc) => {
                  const currentStage = doc.lockedStages?.[doc.currentStageIndex];
                  const canWithdraw = doc.canWithdraw === true && doc.currentStatus !== 'Draft';

                  return (
                    <tr key={doc.documentId} className="hover:bg-blue-50/40 transition-colors">
                      <td className="py-4 px-6 font-mono font-bold text-[#005a9c]">
                        {doc.documentId}
                      </td>
                      <td className="py-4 px-6 font-bold text-gray-900 max-w-xs truncate">
                        {doc.title}
                      </td>
                      <td className="py-4 px-6 font-medium text-gray-600">
                        {doc.templateName}
                      </td>
                      <td className="py-4 px-6">
                        {currentStage ? (
                          <span className="font-bold text-gray-800">
                            {currentStage.assignedOfficeName}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <DocumentStatusBadge status={doc.currentStatus} />
                      </td>
                      <td className="py-4 px-6 text-gray-400 font-medium">
                        {doc.lastUpdatedDate ? new Date(doc.lastUpdatedDate).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedDocId(doc.documentId)}
                            className="bg-gray-100 hover:bg-[#005a9c] hover:text-white text-gray-700 px-3 py-1.5 rounded-xl font-bold text-[11px] uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1"
                            title="View tracking and remarks"
                          >
                            <Eye size={13} /> View
                          </button>

                          {doc.currentStatus === 'Draft' && (
                            <button
                              onClick={() => {
                                setEditingDraft(doc);
                                setShowSubmitModal(true);
                              }}
                              className="bg-blue-50 hover:bg-[#005a9c] hover:text-white text-[#005a9c] border border-blue-100 px-3 py-1.5 rounded-xl font-bold text-[11px] uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1"
                            >
                              <FileEdit size={13} /> Edit Draft
                            </button>
                          )}

                          {doc.currentStatus === 'Returned' && (
                            <button
                              onClick={() => setSelectedDocId(doc.documentId)}
                              className="bg-orange-50 hover:bg-orange-600 hover:text-white text-orange-600 border border-orange-200 px-3 py-1.5 rounded-xl font-bold text-[11px] uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1"
                            >
                              <RotateCcw size={13} /> Fix & Resubmit
                            </button>
                          )}

                          {canWithdraw && (
                            <button
                              onClick={() => handleWithdraw(doc.documentId)}
                              className="text-gray-400 hover:text-red-600 p-1.5 rounded-xl hover:bg-red-50 transition-all cursor-pointer"
                              title="Withdraw Application"
                            >
                              <Ban size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination currentPage={documentPage} totalItems={filteredDocuments.length} itemsPerPage={documentsPerPage} onPageChange={setDocumentPage} />
          <div className="h-5" />
        </div>
      )}

      {/* --- MODALS --- */}
      {selectedDocId && (
        <ModalDocumentDetail
          documentId={selectedDocId}
          isOpen={Boolean(selectedDocId)}
          onClose={() => setSelectedDocId(null)}
          onActionCompleted={() => {
            setSelectedDocId(null);
            loadMyDocuments();
          }}
        />
      )}

      {showSubmitModal && (
        <NewDocumentSubmissionModal
          isOpen={showSubmitModal}
          initialDraft={editingDraft}
          onClose={() => {
            setShowSubmitModal(false);
            setEditingDraft(null);
          }}
          onSuccess={() => {
            setShowSubmitModal(false);
            setEditingDraft(null);
            loadMyDocuments();
          }}
        />
      )}

      <RoleUpgradeRequestModal
        isOpen={showRoleRequestModal}
        onClose={() => setShowRoleRequestModal(false)}
        onSubmitted={request => setRoleRequests(previous => [request, ...previous])}
      />

    </div>
  );
}
