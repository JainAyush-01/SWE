/**
 * Modal: Revise & Resubmit Returned Document
 */

import React, { useState, useEffect } from 'react';
import { api } from '../api/apiClient';
import { RotateCcw, AlertTriangle, Send, X } from 'lucide-react';

export default function ModalReviseDocument({ isOpen, onClose, document, onResubmitted }) {
  const [fieldValues, setFieldValues] = useState([]);
  const [submitterComment, setSubmitterComment] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (document && document.fieldValues) {
      setFieldValues(JSON.parse(JSON.stringify(document.fieldValues)));
    }
  }, [document]);

  if (!isOpen || !document) return null;

  const handleFieldChange = (fieldId, value) => {
    setFieldValues(prev =>
      prev.map(fv => fv.fieldId === fieldId ? { ...fv, enteredValue: value } : fv)
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const res = await api.resubmitDocument(document.documentId, {
        revisedFieldValues: fieldValues,
        submitterComment: submitterComment.trim()
      });

      if (res.success) {
        if (onResubmitted) onResubmitted(res.document);
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Failed to resubmit revised document.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[2rem] shadow-2xl max-w-2xl w-full p-6 sm:p-8 border border-gray-100 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
          <div className="flex items-center gap-2 text-[#005a9c]">
            <RotateCcw size={22} />
            <h3 className="text-xl font-black uppercase tracking-tight text-gray-900">
              Revise & Resubmit Application
            </h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1 rounded-xl cursor-pointer" disabled={isSubmitting}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto pr-1 space-y-4 flex-grow">
          {/* Reviewer Note */}
          <div className="p-4 bg-orange-50 border border-orange-200/70 rounded-2xl flex items-start gap-3">
            <AlertTriangle size={18} className="shrink-0 mt-0.5 text-orange-600" />
            <div>
              <div className="font-black text-xs uppercase tracking-wider text-orange-950">Reviewer Return Comment:</div>
              <p className="text-xs mt-1 text-orange-900 font-bold">
                "{document.returnComment || 'Please revise the submitted fields as requested by administration.'}"
              </p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-2xl text-xs font-bold text-center">
              {error}
            </div>
          )}

          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Correct Application Fields:</h4>
            {fieldValues.map(fv => (
              <div key={fv.fieldId}>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1 block mb-1">
                  {fv.fieldName}
                </label>
                <textarea
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#005a9c] bg-gray-50 focus:bg-white text-xs font-bold transition-all outline-none"
                  rows={2}
                  value={fv.enteredValue || ''}
                  onChange={(e) => handleFieldChange(fv.fieldId, e.target.value)}
                  required
                />
              </div>
            ))}
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1 block mb-1">
              Applicant Revision Notes / Changes Made (Optional)
            </label>
            <input
              type="text"
              className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#005a9c] bg-gray-50 focus:bg-white text-xs font-bold transition-all outline-none"
              placeholder="e.g. Attached required receipts and updated course syllabus..."
              value={submitterComment}
              onChange={(e) => setSubmitterComment(e.target.value)}
            />
          </div>

          <div className="flex gap-2 justify-end pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 rounded-xl font-black text-xs uppercase tracking-widest bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all cursor-pointer"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest text-white bg-[#005a9c] hover:bg-blue-800 shadow-lg shadow-blue-900/20 transition-all cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
              disabled={isSubmitting}
              id="btn-confirm-resubmit"
            >
              <Send size={14} />
              {isSubmitting ? 'Resubmitting...' : 'Resubmit Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
