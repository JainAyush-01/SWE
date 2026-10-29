/**
 * Modal: Document Tracking & Detail View
 * Institutional presentation for document status, stages, and timeline.
 */

import React, { useState, useEffect } from 'react';
import { api } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import DocumentStatusBadge from './DocumentStatusBadge';
import WorkflowTimelineStepper from './WorkflowTimelineStepper';
import ModalRejectionComment from './ModalRejectionComment';
import ModalReturnComment from './ModalReturnComment';
import ModalReviseDocument from './ModalReviseDocument';
import {
  FileText,
  User,
  Calendar,
  Building2,
  History,
  AlertCircle,
  XCircle,
  RotateCcw,
  CheckCircle,
  Ban,
  X
} from 'lucide-react';

export default function ModalDocumentDetail({ documentId, isOpen, onClose, onActionCompleted }) {
  const { currentUser } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Sub-modal states
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showReviseModal, setShowReviseModal] = useState(false);

  useEffect(() => {
    if (isOpen && documentId) {
      loadDocumentDetails();
    }
  }, [isOpen, documentId]);

  // Usability: ESC key closes modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !showRejectModal && !showReturnModal && !showReviseModal) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, showRejectModal, showReturnModal, showReviseModal]);

  const loadDocumentDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.getDocumentById(documentId);
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch document details.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const doc = data?.document;
  const auditActions = data?.auditActions || [];
  const revisions = data?.revisions || [];
  const canWithdraw = data?.canWithdraw;
  const canCurrentUserAct = data?.canCurrentUserAct;

  // Actions
  const handleApprove = async () => {
    const comment = window.prompt('Enter approval remarks (optional):', 'Verified and recommended for approval.');
    if (comment === null) return;

    setActionLoading(true);
    try {
      await api.approveDocument(doc.documentId, comment);
      await loadDocumentDetails();
      if (onActionCompleted) onActionCompleted();
    } catch (err) {
      alert(`Approval Failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!window.confirm('Are you sure you want to withdraw this application?')) return;

    setActionLoading(true);
    try {
      await api.withdrawDocument(doc.documentId);
      await loadDocumentDetails();
      if (onActionCompleted) onActionCompleted();
    } catch (err) {
      alert(`Withdrawal Failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmReject = async (comment) => {
    await api.rejectDocument(doc.documentId, comment);
    await loadDocumentDetails();
    if (onActionCompleted) onActionCompleted();
  };

  const handleConfirmReturn = async (comment) => {
    await api.returnDocument(doc.documentId, comment);
    await loadDocumentDetails();
    if (onActionCompleted) onActionCompleted();
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget && !actionLoading) onClose();
        }}
      >
        <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl max-w-4xl w-full p-6 sm:p-8 max-h-[90vh] flex flex-col border border-gray-100">
          
          {/* HEADER */}
          <div className="flex items-center justify-between border-b border-gray-100 pb-5 mb-5">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 bg-blue-50 text-[#005a9c] rounded-2xl flex items-center justify-center shrink-0">
                <FileText size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xl font-black text-gray-900 tracking-tight">
                    {doc ? doc.title : 'Document Details'}
                  </h3>
                  {doc && <DocumentStatusBadge status={doc.currentStatus} />}
                </div>
                <div className="text-xs font-bold text-gray-400 mt-0.5">
                  ID: <span className="font-mono text-[#005a9c]">{documentId}</span> • Form Type: {doc?.templateName}
                </div>
              </div>
            </div>

            <button 
              onClick={onClose} 
              className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer" 
              disabled={actionLoading}
            >
              <X size={20} />
            </button>
          </div>

          {/* SCROLLABLE BODY */}
          <div className="overflow-y-auto pr-1 flex-grow space-y-6">
            {loading ? (
              <div className="p-12 text-center text-gray-400 text-xs font-bold uppercase tracking-widest">
                <div className="w-8 h-8 border-3 border-gray-200 border-t-[#005a9c] rounded-full animate-spin mx-auto mb-3"></div>
                Loading document details...
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl text-xs font-bold text-center">
                {error}
              </div>
            ) : doc ? (
              <div className="space-y-6">
                
                {/* Status Notice Alerts */}
                {doc.currentStatus === 'Rejected' && (
                  <div className="bg-red-50 border border-red-100 p-4 rounded-2xl text-red-700 flex items-start gap-3">
                    <XCircle size={20} className="shrink-0 mt-0.5" />
                    <div>
                      <div className="font-black text-xs uppercase tracking-wider">Application Rejected</div>
                      <div className="text-xs font-bold mt-1 text-red-600">
                        "{doc.rejectionComment}"
                      </div>
                    </div>
                  </div>
                )}

                {doc.currentStatus === 'Returned' && (
                  <div className="bg-orange-50 border border-orange-100 p-4 rounded-2xl text-orange-800 flex items-start gap-3">
                    <RotateCcw size={20} className="shrink-0 mt-0.5 text-orange-600" />
                    <div className="flex-1">
                      <div className="font-black text-xs uppercase tracking-wider">Returned For Revision</div>
                      <div className="text-xs font-bold mt-1 text-orange-700">
                        "{doc.returnComment}"
                      </div>
                      {doc.submittedBy === currentUser?.userId && (
                        <button
                          onClick={() => setShowReviseModal(true)}
                          className="mt-3 bg-[#e35205] text-white px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider hover:bg-orange-700 transition-all shadow-md inline-flex items-center gap-2 cursor-pointer"
                        >
                          <RotateCcw size={14} /> Revise & Resubmit Now
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Submitter & Metadata Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 bg-gray-50 rounded-2xl border border-gray-100 text-xs">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1">
                      Submitter
                    </span>
                    <span className="font-bold text-gray-900 flex items-center gap-1.5 truncate">
                      <User size={13} className="text-[#005a9c] shrink-0" /> {doc.submitterName}
                    </span>
                    <span className="text-[11px] text-gray-500 font-semibold block truncate mt-0.5">
                      {doc.submitterEmail}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1">
                      Submission Date
                    </span>
                    <span className="font-bold text-gray-900 flex items-center gap-1.5">
                      <Calendar size={13} className="text-[#005a9c] shrink-0" />
                      {new Date(doc.createdDate).toLocaleDateString()}
                    </span>
                    <span className="text-[11px] text-gray-500 font-semibold block mt-0.5">
                      {new Date(doc.createdDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1">
                      Current Stage
                    </span>
                    <span className="font-bold text-amber-700 flex items-center gap-1.5 truncate">
                      <Building2 size={13} className="shrink-0" />
                      {doc.currentStatus === 'Completed'
                        ? 'All Stages Completed'
                        : doc.lockedStages[doc.currentStageIndex]?.assignedOfficeName || 'Completed'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1">
                      Last Updated
                    </span>
                    <span className="font-bold text-gray-700 block">
                      {new Date(doc.lastUpdatedDate).toLocaleDateString()}
                    </span>
                    <span className="text-[11px] text-gray-400 font-semibold block mt-0.5">
                      {new Date(doc.lastUpdatedDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {/* Visual Workflow Stepper */}
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                  <h4 className="text-xs font-black uppercase tracking-widest text-gray-700 mb-4">
                    Workflow Progress
                  </h4>
                  <WorkflowTimelineStepper
                    stages={doc.lockedStages}
                    currentStageIndex={doc.currentStageIndex}
                    currentStatus={doc.currentStatus}
                  />
                </div>

                {/* Submitted Field Values */}
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                  <h4 className="text-xs font-black uppercase tracking-widest text-gray-700 mb-3">
                    Submitted Application Details
                  </h4>
                  <div className="divide-y divide-gray-100 rounded-xl border border-gray-100 overflow-hidden">
                    {doc.fieldValues && doc.fieldValues.length > 0 ? (
                      doc.fieldValues.map((fv) => (
                        <div key={fv.fieldId} className="grid grid-cols-1 md:grid-cols-3 p-3.5 bg-white text-xs">
                          <div className="font-bold text-gray-500 uppercase tracking-wider text-[11px]">
                            {fv.fieldName}
                          </div>
                          <div className="md:col-span-2 text-gray-900 font-bold whitespace-pre-wrap">
                            {fv.enteredValue || <span className="text-gray-400 italic font-normal">None</span>}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-gray-400 italic text-xs">No form fields recorded.</div>
                    )}
                  </div>
                </div>

                {/* Revision History */}
                {revisions.length > 0 && (
                  <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                    <h4 className="text-xs font-black uppercase tracking-widest text-gray-700 mb-3 flex items-center gap-2">
                      <History size={15} /> Revision History
                    </h4>
                    <div className="space-y-2.5">
                      {revisions.map((rev, rIdx) => (
                        <div key={rev.revisionId || rIdx} className="p-3.5 bg-orange-50/50 border border-orange-100 rounded-xl text-xs">
                          <div className="flex items-center justify-between font-bold text-orange-950">
                            <span>Revision #{rIdx + 1}</span>
                            <span className="text-gray-400 font-semibold">{new Date(rev.revisionDate).toLocaleString()}</span>
                          </div>
                          <div className="mt-1 text-gray-700 font-medium">
                            <strong>Note:</strong> "{rev.submitterComment}"
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Decision History & Audit Log */}
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                  <h4 className="text-xs font-black uppercase tracking-widest text-gray-700 mb-3 flex items-center gap-2">
                    <History size={15} /> Decision History
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-400 bg-gray-50/50">
                          <th className="py-2.5 px-3">Decision</th>
                          <th className="py-2.5 px-3">Reviewed By</th>
                          <th className="py-2.5 px-3">Office</th>
                          <th className="py-2.5 px-3">Remarks</th>
                          <th className="py-2.5 px-3">Timestamp</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {auditActions.length > 0 ? (
                          auditActions.map((action) => (
                            <tr key={action.actionId} className="hover:bg-gray-50/50">
                              <td className="py-3 px-3">
                                <span
                                  className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                    action.actionType === 'Approve'
                                      ? 'bg-green-100 text-green-700'
                                      : action.actionType === 'Reject'
                                      ? 'bg-red-100 text-red-700'
                                      : 'bg-orange-100 text-orange-700'
                                  }`}
                                >
                                  {action.actionType}
                                </span>
                              </td>
                              <td className="py-3 px-3 font-bold text-gray-800">{action.performerName}</td>
                              <td className="py-3 px-3 text-gray-500 font-medium">{action.designationAtAction}</td>
                              <td className="py-3 px-3 text-gray-700 font-medium max-w-xs">{action.comment}</td>
                              <td className="py-3 px-3 text-gray-400 font-semibold whitespace-nowrap">
                                {new Date(action.timestamp).toLocaleDateString()} {new Date(action.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="text-center text-gray-400 py-4 italic">
                              Awaiting first administrative review.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            ) : null}
          </div>

          {/* FOOTER ACTIONS */}
          {doc && (
            <div className="border-t border-gray-100 pt-5 mt-4 flex items-center justify-between gap-3 flex-wrap">
              <div>
                {/* Submitter Withdraw Button */}
                {doc.submittedBy === currentUser?.userId && ['Submitted', 'Under Review'].includes(doc.currentStatus) && (
                  <button
                    onClick={handleWithdraw}
                    disabled={!canWithdraw || actionLoading}
                    className="bg-red-50 hover:bg-red-600 hover:text-white text-red-600 border border-red-200 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all inline-flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
                  >
                    <Ban size={14} />
                    {canWithdraw ? 'Withdraw Application' : 'Under Active Review'}
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Approver Action Buttons */}
                {canCurrentUserAct && (
                  <>
                    <button
                      onClick={() => setShowReturnModal(true)}
                      className="bg-orange-50 hover:bg-orange-600 hover:text-white text-orange-600 border border-orange-200 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all inline-flex items-center gap-1.5 cursor-pointer"
                      disabled={actionLoading}
                    >
                      <RotateCcw size={14} /> Return for Revision
                    </button>
                    <button
                      onClick={() => setShowRejectModal(true)}
                      className="bg-red-50 hover:bg-red-600 hover:text-white text-red-600 border border-red-200 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all inline-flex items-center gap-1.5 cursor-pointer"
                      disabled={actionLoading}
                    >
                      <XCircle size={14} /> Reject
                    </button>
                    <button
                      onClick={handleApprove}
                      className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md inline-flex items-center gap-1.5 cursor-pointer"
                      disabled={actionLoading}
                    >
                      <CheckCircle size={14} /> Approve & Route
                    </button>
                  </>
                )}
                <button 
                  onClick={onClose} 
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sub-modals */}
      {showRejectModal && (
        <ModalRejectionComment
          isOpen={showRejectModal}
          onClose={() => setShowRejectModal(false)}
          onConfirm={handleConfirmReject}
          documentTitle={doc?.title}
          docId={doc?.documentId}
        />
      )}

      {showReturnModal && (
        <ModalReturnComment
          isOpen={showReturnModal}
          onClose={() => setShowReturnModal(false)}
          onConfirm={handleConfirmReturn}
          documentTitle={doc?.title}
          docId={doc?.documentId}
        />
      )}

      {showReviseModal && (
        <ModalReviseDocument
          isOpen={showReviseModal}
          onClose={() => setShowReviseModal(false)}
          document={doc}
          onResubmitted={() => {
            loadDocumentDetails();
            if (onActionCompleted) onActionCompleted();
          }}
        />
      )}
    </>
  );
}
