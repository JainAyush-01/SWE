import React, { useState, useEffect } from 'react';
import { api } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import DocumentStatusBadge from '../components/DocumentStatusBadge';
import ModalDocumentDetail from '../components/ModalDocumentDetail';
import ModalRejectionComment from '../components/ModalRejectionComment';
import ModalReturnComment from '../components/ModalReturnComment';
import Pagination from '../components/Pagination';
import {
  CheckCircle2,
  XCircle,
  RotateCcw,
  Clock,
  History,
  Building2,
  Eye,
  RefreshCw,
  Search,
  Check,
  Calendar,
  UserCheck,
  AlertCircle,
  ShieldCheck
} from 'lucide-react';

export default function ApproverDashboard() {
  const { currentUser, activePersona, myTitles, switchPersona, loadTitles } = useAuth();
  const [pendingDocs, setPendingDocs] = useState([]);
  const [historyList, setHistoryList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'history'
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingPage, setPendingPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  const itemsPerPage = 8;

  // Delegation & Managed Offices State
  const [managedOffices, setManagedOffices] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [showDelegationModal, setShowDelegationModal] = useState(false);
  const [delegationOfficeId, setDelegationOfficeId] = useState('');
  const [delegationUserId, setDelegationUserId] = useState('');
  const [delegationStartDate, setDelegationStartDate] = useState('');
  const [delegationEndDate, setDelegationEndDate] = useState('');
  const [delegationReason, setDelegationReason] = useState('');
  const [isDelegating, setIsDelegating] = useState(false);
  const [delegationError, setDelegationError] = useState('');

  // Modals
  const [selectedDocId, setSelectedDocId] = useState(null);
  const [rejectionTarget, setRejectionTarget] = useState(null);
  const [returnTarget, setReturnTarget] = useState(null);

  useEffect(() => {
    loadApproverData();
  }, [currentUser, activePersona]);

  const loadApproverData = async () => {
    setLoading(true);
    try {
      const officeIdFilter = activePersona?.type === 'OFFICE' ? activePersona.officeId : null;
      const [pendingRes, historyRes, officesRes, usersRes] = await Promise.all([
        api.getPendingDocuments(officeIdFilter),
        api.getApproverHistory(),
        api.getAllOffices().catch(() => ({ offices: [] })),
        api.getUsers().catch(() => ({ users: [] }))
      ]);

      if (pendingRes.success) setPendingDocs(pendingRes.documents || []);
      if (historyRes.success) setHistoryList(historyRes.history || []);

      const allOfficesList = officesRes.offices || [];
      // Offices where current user is the permanent in-charge
      const userManaged = allOfficesList.filter(o => o.currentInCharge === currentUser?.userId);
      setManagedOffices(userManaged);

      if (usersRes.success) {
        setAllUsers(usersRes.users || []);
      }
    } catch (err) {
      console.error('Failed to load approver data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDelegationModal = () => {
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const initialOfficeId = (activePersona?.type === 'OFFICE' && managedOffices.some(o => o.officeId === activePersona.officeId))
      ? activePersona.officeId
      : (managedOffices[0]?.officeId || '');

    setDelegationOfficeId(initialOfficeId);
    setDelegationUserId('');
    setDelegationStartDate(today);
    setDelegationEndDate(nextWeek);
    setDelegationReason('');
    setDelegationError('');
    setShowDelegationModal(true);
  };

  const handleConfirmDelegation = async (e) => {
    e.preventDefault();
    if (!delegationOfficeId || !delegationUserId || !delegationEndDate) {
      setDelegationError('Please select office, substitute colleague, and end date.');
      return;
    }
    setIsDelegating(true);
    setDelegationError('');
    try {
      const res = await api.assignTemporaryInCharge(delegationOfficeId, {
        tempUserId: delegationUserId,
        startDate: delegationStartDate,
        endDate: delegationEndDate,
        reason: delegationReason
      });

      if (res.success) {
        setShowDelegationModal(false);
        if (loadTitles) await loadTitles();
        await loadApproverData();
        setModal({
          isOpen: true,
          type: 'alert',
          title: 'Position Delegated',
          message: res.message || 'Position authority has been successfully delegated for the specified time period.'
        });
      }
    } catch (err) {
      setDelegationError(err.message || 'Failed to delegate position.');
    } finally {
      setIsDelegating(false);
    }
  };

  const handleRevokeDelegation = (officeId, officeName) => {
    setModal({
      isOpen: true,
      type: 'confirm',
      title: 'Resume Position',
      message: `Do you want to end temporary cover for "${officeName}" early and resume active signing authority immediately?`,
      onConfirm: async () => {
        try {
          const res = await api.clearTemporaryInCharge(officeId);
          if (loadTitles) await loadTitles();
          await loadApproverData();
        } catch (err) {
          setModal({
            isOpen: true,
            type: 'alert',
            title: 'Revoke Error',
            message: err.message || 'Could not revoke temporary cover.'
          });
        }
      }
    });
  };

  // Modal state
  const [modal, setModal] = useState(null);
  const closeModal = () => setModal(null);

  const handleQuickApprove = (e, doc) => {
    e.stopPropagation();
    setModal({
      isOpen: true,
      type: 'confirm',
      title: 'Approve Document',
      message: `Approve and route document "${doc.title}" (${doc.documentId}) to the next stage?`,
      onConfirm: async () => {
        try {
          await api.approveDocument(doc.documentId, 'Verified and approved.');
          await loadApproverData();
        } catch (err) {
          setModal({
            isOpen: true,
            type: 'alert',
            title: 'Approval Error',
            message: err.message || 'Could not approve document.'
          });
        }
      }
    });
  };

  const handleConfirmReject = async (comment) => {
    if (!rejectionTarget) return;
    await api.rejectDocument(rejectionTarget.documentId, comment);
    setRejectionTarget(null);
    await loadApproverData();
  };

  const handleConfirmReturn = async (comment) => {
    if (!returnTarget) return;
    await api.returnDocument(returnTarget.documentId, comment);
    setReturnTarget(null);
    await loadApproverData();
  };

  const filteredPending = pendingDocs.filter(d =>
    (d.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.documentId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.submitterName || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredHistory = historyList.filter(h =>
    (h.documentTitle || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (h.documentId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (h.comment || '').toLowerCase().includes(searchQuery.toLowerCase())
  );
  const paginatedPending = filteredPending.slice((pendingPage - 1) * itemsPerPage, pendingPage * itemsPerPage);
  const paginatedHistory = filteredHistory.slice((historyPage - 1) * itemsPerPage, historyPage * itemsPerPage);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* --- GLOBAL MODAL --- */}
      {modal && modal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl max-w-md w-full p-8">
            <h3 className={`text-2xl font-black uppercase tracking-tighter mb-2 ${modal.title.includes('Error') ? 'text-red-600' : 'text-gray-900'}`}>
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
                className="px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest text-white shadow-xl bg-[#005a9c] hover:bg-blue-800 transition-all active:scale-95 cursor-pointer"
              >
                {modal.type === 'alert' ? 'Okay' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- HERO BANNER --- */}
      <div className="rounded-[2rem] sm:rounded-[2.5rem] bg-[#005a9c] p-6 sm:p-8 mb-8 text-white flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center shrink-0 border border-white/20">
            <Building2 size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight uppercase">Office Review Queue</h1>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <span className="text-blue-100 text-xs font-bold uppercase tracking-widest">
                {activePersona?.type === 'OFFICE' ? activePersona.title : (currentUser?.position || 'Institutional Signing Authority')}
              </span>
              {activePersona?.email && (
                <span className="bg-white/15 px-2.5 py-0.5 rounded-lg text-[11px] font-mono font-bold text-blue-100 border border-white/20">
                  {activePersona.email}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {managedOffices.length > 0 && (
            <button
              onClick={handleOpenDelegationModal}
              className="bg-white text-[#005a9c] hover:bg-gray-100 px-4 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all inline-flex items-center gap-2 cursor-pointer shadow-lg shrink-0"
              title="Delegate position / assign temporary cover for leave"
            >
              <UserCheck size={16} /> Delegate Position / Leave Cover
            </button>
          )}

          <button
            onClick={loadApproverData}
            className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all inline-flex items-center gap-2 cursor-pointer shrink-0"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh Queue
          </button>
        </div>
      </div>

      {/* --- ACTIVE DELEGATION ALERTS --- */}
      {managedOffices.filter(o => o.temporaryInCharge && o.temporaryEndDate).map(delOffice => (
        <div key={delOffice.officeId} className="mb-6 p-4 sm:p-5 bg-amber-50/90 border border-amber-200 rounded-[2rem] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
              <Calendar size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-amber-200/80 text-amber-900 px-2.5 py-0.5 rounded-full">
                  Active Position Delegation
                </span>
                <span className="font-mono text-xs font-bold text-gray-500">
                  {delOffice.officeName}
                </span>
              </div>
              <p className="text-xs font-bold text-gray-900 mt-1">
                <span className="text-[#005a9c] font-black">{delOffice.temporaryInChargeName}</span> is currently handling your position as temporary in-charge.
              </p>
              <p className="text-[11px] font-semibold text-gray-500 mt-0.5">
                Time Period: <span className="font-bold text-gray-700">{new Date(delOffice.temporaryStartDate || Date.now()).toLocaleDateString()}</span> to <span className="font-bold text-gray-700">{new Date(delOffice.temporaryEndDate).toLocaleDateString()}</span>
                {delOffice.temporaryReason && (
                  <span> • Reason: <span className="font-medium text-gray-700 italic">"{delOffice.temporaryReason}"</span></span>
                )}
              </p>
            </div>
          </div>

          <button
            onClick={() => handleRevokeDelegation(delOffice.officeId, delOffice.officeName)}
            className="px-4 py-2.5 bg-white hover:bg-red-50 text-red-600 hover:text-red-700 border border-red-200 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer shrink-0 shadow-sm"
          >
            Cancel Cover / Resume Position
          </button>
        </div>
      ))}

      {activePersona?.isTemporary && (
        <div className="mb-6 p-4 sm:p-5 bg-blue-50/90 border border-blue-200 rounded-[2rem] flex items-center gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-2xl bg-blue-100 text-[#005a9c] flex items-center justify-center shrink-0">
            <Building2 size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-blue-200 text-blue-900 px-2.5 py-0.5 rounded-full">
                Acting as Temporary In-Charge
              </span>
              <span className="font-mono text-xs font-bold text-gray-500">
                {activePersona.title}
              </span>
            </div>
            <p className="text-xs font-bold text-gray-900 mt-1">
              You are currently handling approvals for this office until <span className="font-black text-[#005a9c]">{new Date(activePersona.temporaryEndDate).toLocaleDateString()}</span>.
            </p>
          </div>
        </div>
      )}

      {/* --- FILTER & SEARCH BAR --- */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        {/* Tab Pills */}
        <div className="flex bg-gray-100 p-1.5 rounded-2xl border border-gray-200 overflow-x-auto w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
              activeTab === 'pending' ? 'bg-white text-[#005a9c] shadow-sm' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Clock size={14} /> Pending Decision ({pendingDocs.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
              activeTab === 'history' ? 'bg-white text-[#005a9c] shadow-sm' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <History size={14} /> Action History ({historyList.length})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search size={16} className="text-gray-400 absolute left-4 top-3" />
          <input
            type="text"
            placeholder="Search by title, ID, or student..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPendingPage(1); setHistoryPage(1); }}
            className="w-full bg-white border border-gray-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs font-bold focus:ring-2 focus:ring-[#005a9c] outline-none shadow-sm transition-all"
          />
        </div>
      </div>

      {/* --- CONTENT --- */}
      {loading ? (
        <div className="bg-white rounded-[2rem] p-12 text-center border border-gray-100 shadow-sm">
          <div className="inline-block w-8 h-8 border-3 border-gray-200 border-t-[#005a9c] rounded-full animate-spin mb-3"></div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Loading review queue...</p>
        </div>
      ) : activeTab === 'pending' ? (
        /* PENDING TAB */
        filteredPending.length === 0 ? (
          <div className="bg-white rounded-[2.5rem] p-12 text-center border border-gray-100 shadow-sm max-w-xl mx-auto my-6">
            <div className="w-16 h-16 bg-green-50 text-green-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={30} />
            </div>
            <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Queue is Cleared</h3>
            <p className="text-xs font-bold text-gray-400 mt-2">
              There are currently no document submissions awaiting your office's review.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/70 text-[10px] font-black uppercase tracking-widest text-gray-400">
                    <th className="py-4 px-6">Document ID</th>
                    <th className="py-4 px-6">Subject / Title</th>
                    <th className="py-4 px-6">Applicant</th>
                    <th className="py-4 px-6">Template</th>
                    <th className="py-4 px-6">Current Status</th>
                    <th className="py-4 px-6 text-right">Decision Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {paginatedPending.map((doc) => (
                    <tr key={doc.documentId} className="hover:bg-blue-50/40 transition-colors">
                      <td className="py-4 px-6 font-mono font-bold text-[#005a9c]">
                        {doc.documentId}
                      </td>
                      <td className="py-4 px-6 font-bold text-gray-900 max-w-xs truncate">
                        {doc.title}
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-bold text-gray-800 block">{doc.submitterName}</span>
                        <span className="text-[10px] text-gray-400 font-mono">{doc.submittedBy}</span>
                      </td>
                      <td className="py-4 px-6 font-medium text-gray-600">
                        {doc.templateName}
                      </td>
                      <td className="py-4 px-6">
                        <DocumentStatusBadge status={doc.currentStatus} />
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedDocId(doc.documentId)}
                            className="bg-gray-100 hover:bg-[#005a9c] hover:text-white text-gray-700 px-3 py-1.5 rounded-xl font-bold text-[11px] uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1"
                          >
                            <Eye size={13} /> Review Details
                          </button>
                          <button
                            onClick={() => setReturnTarget(doc)}
                            className="bg-orange-50 hover:bg-orange-600 hover:text-white text-orange-600 border border-orange-200 px-3 py-1.5 rounded-xl font-bold text-[11px] uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1"
                          >
                            <RotateCcw size={13} /> Return
                          </button>
                          <button
                            onClick={() => setRejectionTarget(doc)}
                            className="bg-red-50 hover:bg-red-600 hover:text-white text-red-600 border border-red-200 px-3 py-1.5 rounded-xl font-bold text-[11px] uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1"
                          >
                            <XCircle size={13} /> Reject
                          </button>
                          <button
                            onClick={(e) => handleQuickApprove(e, doc)}
                            className="bg-green-600 hover:bg-green-700 text-white px-3.5 py-1.5 rounded-xl font-bold text-[11px] uppercase tracking-wider transition-all shadow-sm cursor-pointer flex items-center gap-1"
                          >
                            <Check size={13} /> Approve
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination currentPage={pendingPage} totalItems={filteredPending.length} itemsPerPage={itemsPerPage} onPageChange={setPendingPage} />
            <div className="h-5" />
          </div>
        )
      ) : (
        /* HISTORY TAB */
        filteredHistory.length === 0 ? (
          <div className="bg-white rounded-[2.5rem] p-12 text-center border border-gray-100 shadow-sm max-w-xl mx-auto my-6">
            <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">No Decision History</h3>
            <p className="text-xs font-bold text-gray-400 mt-2">
              You have not recorded any approval decisions on the portal yet.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/70 text-[10px] font-black uppercase tracking-widest text-gray-400">
                    <th className="py-4 px-6">Timestamp</th>
                    <th className="py-4 px-6">Document</th>
                    <th className="py-4 px-6">Action Recorded</th>
                    <th className="py-4 px-6">Official Remark</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {paginatedHistory.map((h, i) => (
                    <tr key={h.actionId || i} className="hover:bg-blue-50/40 transition-colors">
                      <td className="py-4 px-6 text-gray-400 font-medium whitespace-nowrap">
                        {new Date(h.timestamp).toLocaleString()}
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-bold text-gray-900 block">{h.documentTitle || h.documentId}</span>
                        <span className="text-[10px] text-[#005a9c] font-mono font-bold">{h.documentId}</span>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-block px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                          h.actionType === 'Approve' ? 'bg-green-50 text-green-700 border border-green-200' :
                          h.actionType === 'Reject' ? 'bg-red-50 text-red-700 border border-red-200' :
                          'bg-orange-50 text-orange-700 border border-orange-200'
                        }`}>
                          {h.actionType}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-gray-600 font-medium max-w-md">
                        {h.comment || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination currentPage={historyPage} totalItems={filteredHistory.length} itemsPerPage={itemsPerPage} onPageChange={setHistoryPage} />
            <div className="h-5" />
          </div>
        )
      )}

      {/* --- MODALS --- */}
      {selectedDocId && (
        <ModalDocumentDetail
          documentId={selectedDocId}
          isOpen={Boolean(selectedDocId)}
          onClose={() => setSelectedDocId(null)}
          onActionCompleted={() => {
            setSelectedDocId(null);
            loadApproverData();
          }}
        />
      )}

      {rejectionTarget && (
        <ModalRejectionComment
          isOpen={Boolean(rejectionTarget)}
          documentTitle={rejectionTarget.title}
          onClose={() => setRejectionTarget(null)}
          onSubmit={handleConfirmReject}
        />
      )}

      {returnTarget && (
        <ModalReturnComment
          isOpen={Boolean(returnTarget)}
          documentTitle={returnTarget.title}
          onClose={() => setReturnTarget(null)}
          onSubmit={handleConfirmReturn}
        />
      )}

      {/* --- DELEGATE POSITION / TEMPORARY COVER MODAL --- */}
      {showDelegationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl max-w-lg w-full p-6 sm:p-8 border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-50 text-[#005a9c] rounded-2xl flex items-center justify-center shrink-0">
                <UserCheck size={20} />
              </div>
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight text-gray-900">
                  Delegate Position / Leave Cover
                </h3>
                <p className="text-xs font-semibold text-gray-400">
                  Authorize a colleague to handle your office approvals during your absence
                </p>
              </div>
            </div>

            <form onSubmit={handleConfirmDelegation} className="space-y-4 mt-5">
              {/* Office Selection */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">
                  Position / Office to Delegate *
                </label>
                <select
                  value={delegationOfficeId}
                  onChange={(e) => setDelegationOfficeId(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#005a9c] bg-gray-50 focus:bg-white text-xs font-bold outline-none"
                  required
                >
                  {managedOffices.map(o => (
                    <option key={o.officeId} value={o.officeId}>
                      {o.officeName} ({o.officeEmail || o.department})
                    </option>
                  ))}
                </select>
              </div>

              {/* Substitute Selection */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">
                  Substitute In-Charge (Colleague / Faculty) *
                </label>
                <select
                  value={delegationUserId}
                  onChange={(e) => setDelegationUserId(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#005a9c] bg-gray-50 focus:bg-white text-xs font-bold outline-none"
                  required
                >
                  <option value="">-- Choose Colleague to Handle Position --</option>
                  {allUsers
                    .filter(u => u.accountStatus && u.userId !== currentUser?.userId)
                    .map(u => (
                      <option key={u.userId} value={u.userId}>
                        {u.name} ({u.institutionalEmail}) - {u.position || u.systemRole}
                      </option>
                    ))}
                </select>
                <p className="text-[10px] text-gray-400 font-semibold mt-1">
                  The selected colleague will be authorized to review and sign documents for your office during this period.
                </p>
              </div>

              {/* Date Range: From [StartDate] to [EndDate] */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">
                    From (Start Date) *
                  </label>
                  <input
                    type="date"
                    value={delegationStartDate}
                    onChange={(e) => setDelegationStartDate(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#005a9c] bg-gray-50 focus:bg-white text-xs font-bold outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">
                    To (End Date) *
                  </label>
                  <input
                    type="date"
                    value={delegationEndDate}
                    onChange={(e) => setDelegationEndDate(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#005a9c] bg-gray-50 focus:bg-white text-xs font-bold outline-none"
                    required
                  />
                </div>
              </div>

              {/* Reason / Purpose */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">
                  Reason / Purpose (Optional)
                </label>
                <input
                  type="text"
                  value={delegationReason}
                  onChange={(e) => setDelegationReason(e.target.value)}
                  placeholder="e.g., On Academic Leave / Attending Conference in Delhi / Medical Leave"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#005a9c] bg-gray-50 focus:bg-white text-xs font-bold outline-none"
                />
              </div>

              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-[11px] text-gray-600 font-semibold leading-relaxed">
                Authority Policy: While active, routed documents will be delivered to the substitute's review queue. You can cancel this delegation early at any time.
              </div>

              {delegationError && (
                <p className="text-xs font-bold text-red-600 bg-red-50 p-3 rounded-xl border border-red-100">
                  {delegationError}
                </p>
              )}

              <div className="flex gap-2 justify-end pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowDelegationModal(false)}
                  className="px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all cursor-pointer"
                  disabled={isDelegating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isDelegating || !delegationUserId || !delegationEndDate}
                  className="px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest text-white bg-[#005a9c] hover:bg-blue-800 shadow-lg shadow-blue-900/20 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  <UserCheck size={14} />
                  {isDelegating ? 'Activating...' : 'Activate Delegation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
