/**
 * Modal / View: New Document Submission
 * Institutional application submission and draft creation.
 */

import React, { useState, useEffect } from 'react';
import { api } from '../api/apiClient';
import { FilePlus, Save, Send, AlertCircle, X } from 'lucide-react';

export default function NewDocumentSubmissionModal({ isOpen, onClose, onDocumentCreated, onSuccess, initialDraft = null }) {
  const [activeTemplates, setActiveTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [title, setTitle] = useState('');
  const [fieldAnswers, setFieldAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadActiveTemplates();
    }
  }, [isOpen]);

  useEffect(() => {
    if (initialDraft) {
      setTitle(initialDraft.title || '');
      setSelectedTemplateId(initialDraft.linkedTemplateId || '');
      const answersMap = {};
      (initialDraft.fieldValues || []).forEach(fv => {
        answersMap[fv.fieldId] = fv.enteredValue;
      });
      setFieldAnswers(answersMap);
    }
  }, [initialDraft]);

  const loadActiveTemplates = async () => {
    setLoading(true);
    try {
      const res = await api.getActiveForms();
      if (res.success) {
        setActiveTemplates(res.formTemplates || []);
        if (res.formTemplates && res.formTemplates.length > 0 && !selectedTemplateId) {
          setSelectedTemplateId(res.formTemplates[0].templateId);
          setSelectedTemplate(res.formTemplates[0]);
        }
      }
    } catch {
      setError('Failed to fetch available form templates.');
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateChange = (templateId) => {
    setSelectedTemplateId(templateId);
    const tmpl = activeTemplates.find(t => t.templateId === templateId);
    setSelectedTemplate(tmpl);
    setFieldAnswers({});
    setError('');
  };

  const handleFieldChange = (fieldId, value) => {
    setFieldAnswers(prev => ({ ...prev, [fieldId]: value }));
  };

  const preparePayload = () => {
    if (!selectedTemplate) return null;
    const fieldValues = (selectedTemplate.fields || []).map(f => ({
      fieldId: f.fieldId,
      fieldName: f.fieldName,
      enteredValue: fieldAnswers[f.fieldId] || ''
    }));

    return {
      documentId: initialDraft ? initialDraft.documentId : undefined,
      templateId: selectedTemplate.templateId,
      title: title.trim() || `${selectedTemplate.formName} Application`,
      fieldValues
    };
  };

  const handleSaveDraft = async () => {
    const payload = preparePayload();
    if (!payload) return;

    setIsSubmitting(true);
    setError('');
    try {
      const res = await api.saveDraft(payload);
      if (res.success) {
        if (onSuccess) onSuccess(res.document);
        if (onDocumentCreated) onDocumentCreated(res.document);
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Failed to save draft.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = preparePayload();
    if (!payload) return;

    setIsSubmitting(true);
    setError('');
    try {
      const res = await api.submitDocument(payload);
      if (res.success) {
        if (onSuccess) onSuccess(res.document);
        if (onDocumentCreated) onDocumentCreated(res.document);
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Failed to submit document.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl max-w-3xl w-full p-6 sm:p-8 max-h-[90vh] flex flex-col border border-gray-100">
        
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 text-[#005a9c] rounded-2xl flex items-center justify-center shrink-0">
              <FilePlus size={20} />
            </div>
            <div>
              <h3 className="text-xl font-black uppercase tracking-tight text-gray-900">
                {initialDraft ? `Edit Application Draft` : 'Submit Institutional Document'}
              </h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Select form template and provide required application details
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer" 
            disabled={isSubmitting}
          >
            <X size={20} />
          </button>
        </div>

        {/* SCROLLABLE FORM BODY */}
        <form onSubmit={handleSubmit} className="overflow-y-auto pr-1 space-y-4 flex-grow">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 p-3.5 rounded-2xl text-xs font-bold text-center flex items-center justify-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form Template Selection */}
          {!initialDraft && (
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1 block mb-1.5" htmlFor="form-template-select">
                Institutional Form Template *
              </label>
              <select
                id="form-template-select"
                className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#005a9c] bg-gray-50 focus:bg-white text-xs font-bold transition-all outline-none"
                value={selectedTemplateId}
                onChange={(e) => handleTemplateChange(e.target.value)}
                disabled={isSubmitting || loading}
              >
                {activeTemplates.map(tmpl => (
                  <option key={tmpl.templateId} value={tmpl.templateId}>
                    {tmpl.formName} ({tmpl.department})
                  </option>
                ))}
              </select>
              {selectedTemplate?.description && (
                <div className="text-[11px] text-gray-400 font-semibold mt-1 ml-1">
                  {selectedTemplate.description}
                </div>
              )}
            </div>
          )}

          {/* Document Title */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1 block mb-1.5" htmlFor="doc-title-input">
              Application Subject / Title *
            </label>
            <input
              id="doc-title-input"
              type="text"
              className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#005a9c] bg-gray-50 focus:bg-white text-xs font-bold transition-all outline-none"
              placeholder="e.g., NPTEL Course Exemption Request"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Sequential Stages Preview */}
          {selectedTemplate?.blueprintStages && selectedTemplate.blueprintStages.length > 0 && (
            <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2">
                Approval Routing Hierarchy:
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {selectedTemplate.blueprintStages.map((stg, sIdx) => (
                  <React.Fragment key={stg.stageId || sIdx}>
                    <span className="px-3 py-1 bg-white border border-gray-200 rounded-xl text-gray-700 font-bold text-[11px] shadow-sm">
                      Stage {stg.stageOrder}: {stg.assignedOfficeName}
                    </span>
                    {sIdx < selectedTemplate.blueprintStages.length - 1 && (
                      <span className="text-gray-400 font-bold">→</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}

          {/* Dynamic Fields */}
          <div className="pt-2 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">
              Required Application Fields:
            </h4>
            {selectedTemplate?.fields && selectedTemplate.fields.length > 0 ? (
              selectedTemplate.fields.map(field => {
                const isRequired = field.isRequired;
                const value = fieldAnswers[field.fieldId] || '';

                if (field.fieldType === 'dropdown') {
                  return (
                    <div key={field.fieldId}>
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1 block mb-1.5">
                        {field.fieldName} {isRequired && '*'}
                      </label>
                      <select
                        className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#005a9c] bg-gray-50 focus:bg-white text-xs font-bold transition-all outline-none"
                        value={value}
                        onChange={(e) => handleFieldChange(field.fieldId, e.target.value)}
                        required={isRequired}
                      >
                        <option value="">-- Choose Option --</option>
                        {(field.optionsList || []).map((opt, oIdx) => (
                          <option key={oIdx} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                }

                if (field.fieldType === 'textarea') {
                  return (
                    <div key={field.fieldId}>
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1 block mb-1.5">
                        {field.fieldName} {isRequired && '*'}
                      </label>
                      <textarea
                        className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#005a9c] bg-gray-50 focus:bg-white text-xs font-bold transition-all outline-none"
                        rows={3}
                        value={value}
                        onChange={(e) => handleFieldChange(field.fieldId, e.target.value)}
                        maxLength={field.maxLength || 1000}
                        required={isRequired}
                        placeholder={`Provide details for ${field.fieldName}...`}
                      />
                    </div>
                  );
                }

                return (
                  <div key={field.fieldId}>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1 block mb-1.5">
                      {field.fieldName} {isRequired && '*'}
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#005a9c] bg-gray-50 focus:bg-white text-xs font-bold transition-all outline-none"
                      value={value}
                      onChange={(e) => handleFieldChange(field.fieldId, e.target.value)}
                      maxLength={field.maxLength || 250}
                      required={isRequired}
                      placeholder={`Enter ${field.fieldName}...`}
                    />
                  </div>
                );
              })
            ) : (
              <div className="text-gray-400 italic text-xs ml-1">No custom fields defined for this form.</div>
            )}
          </div>

          {/* FOOTER BUTTONS */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-4">
            <button
              type="button"
              onClick={handleSaveDraft}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all inline-flex items-center gap-1.5 cursor-pointer"
              disabled={isSubmitting}
            >
              <Save size={14} /> Save Draft
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-3 rounded-xl font-black text-xs uppercase tracking-wider text-gray-500 hover:bg-gray-100 transition-all cursor-pointer"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-[#005a9c] hover:bg-blue-800 text-white px-7 py-3 rounded-xl font-black text-xs uppercase tracking-wider shadow-lg shadow-blue-900/20 transition-all inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                disabled={isSubmitting}
                id="btn-submit-document"
              >
                <Send size={14} />
                {isSubmitting ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
