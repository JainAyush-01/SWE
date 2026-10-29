/**
 * Modal: Return Document For Revision with Mandatory Comment
 */

import React, { useState } from 'react';
import { RotateCcw, AlertCircle, X } from 'lucide-react';

export default function ModalReturnComment({ isOpen, onClose, onConfirm, documentTitle, docId }) {
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      setError('Please provide specific revision instructions so the applicant knows what to update.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      await onConfirm(comment.trim());
      setComment('');
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to return document.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[2rem] shadow-2xl max-w-md w-full p-6 sm:p-8 border border-gray-100">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
          <div className="flex items-center gap-2 text-[#e35205]">
            <RotateCcw size={22} />
            <h3 className="text-xl font-black uppercase tracking-tight text-gray-900">Return for Revision</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1 rounded-xl cursor-pointer" disabled={isSubmitting}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
            <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">Target Application</div>
            <div className="font-bold text-gray-900 text-sm mt-0.5 truncate">{documentTitle || docId}</div>
          </div>

          <div className="p-3.5 bg-orange-50 border border-orange-200/60 rounded-2xl flex items-start gap-2.5 text-xs text-orange-800">
            <AlertCircle size={16} className="shrink-0 mt-0.5 text-[#e35205]" />
            <div>
              The document will be placed in <strong>Returned</strong> status. The applicant will be notified to correct and resubmit the form.
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-2xl text-xs font-bold text-center">
              {error}
            </div>
          )}

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1 block mb-1.5" htmlFor="return-comment">
              Revision Instructions / Required Changes *
            </label>
            <textarea
              id="return-comment"
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#005a9c] bg-gray-50 focus:bg-white text-xs font-bold transition-all outline-none"
              placeholder="Specify the exact corrections needed (e.g., Attach previous marksheet, clarify course syllabus)..."
              value={comment}
              onChange={(e) => {
                setComment(e.target.value);
                if (error) setError('');
              }}
              required
            />
          </div>

          <div className="flex gap-2 justify-end pt-2">
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
              className="px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest text-white bg-[#e35205] hover:bg-orange-700 shadow-lg shadow-orange-600/20 transition-all cursor-pointer disabled:opacity-50"
              disabled={isSubmitting || !comment.trim()}
              id="btn-confirm-return"
            >
              {isSubmitting ? 'Processing...' : 'Return to Applicant'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
