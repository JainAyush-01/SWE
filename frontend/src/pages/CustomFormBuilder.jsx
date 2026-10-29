/**
 * Page / Modal: Custom Form & Approval Hierarchy Builder
 */

import React, { useState, useEffect } from 'react';
import { api } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import {
  Layers,
  Plus,
  Trash2,
  Building2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  X,
  Send
} from 'lucide-react';

export default function CustomFormBuilder({ isOpen, onClose, onFormCreated }) {
  const { currentUser } = useAuth();
  const [offices, setOffices] = useState([]);
  const [formName, setFormName] = useState('');
  const [description, setDescription] = useState('');
  const [department, setDepartment] = useState('Computer Science & Engineering');

  // Dynamic Fields
  const [fields, setFields] = useState([
    {
      fieldId: 'F_1',
      fieldName: 'Reason / Justification',
      fieldType: 'textarea',
      isRequired: true,
      maxLength: 500,
      optionsList: []
    }
  ]);

  // Dynamic Sequential Stages
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadOffices();
    }
  }, [isOpen]);

  const loadOffices = async () => {
    setLoading(true);
    try {
      const res = await api.getAllOffices();
      if (res.success) {
        setOffices(res.offices || []);
        // Set default initial stages if empty
        if (stages.length === 0 && res.offices && res.offices.length > 0) {
          setStages([
            {
              stageId: 'STG_1',
              stageOrder: 1,
              assignedOfficeId: res.offices[0].officeId,
              assignedOfficeName: res.offices[0].officeName
            }
          ]);
        }
      }
    } catch (err) {
      setError('Failed to fetch campus offices.');
    } finally {
      setLoading(false);
    }
  };

  // Field manipulation
  const addField = () => {
    const newId = `F_${Date.now().toString().slice(-4)}`;
    setFields(prev => [
      ...prev,
      {
        fieldId: newId,
        fieldName: 'New Question Field',
        fieldType: 'text',
        isRequired: true,
        maxLength: 250,
        optionsList: []
      }
    ]);
  };

  const updateField = (idx, patch) => {
    setFields(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], ...patch };
      return copy;
    });
  };

  const removeField = (idx) => {
    if (fields.length <= 1) {
      alert('A form must have at least one field.');
      return;
    }
    setFields(prev => prev.filter((_, i) => i !== idx));
  };

  // Stage manipulation
  const addStage = () => {
    if (offices.length === 0) return;
    const defaultOffice = offices[0];
    setStages(prev => [
      ...prev,
      {
        stageId: `STG_${prev.length + 1}`,
        stageOrder: prev.length + 1,
        assignedOfficeId: defaultOffice.officeId,
        assignedOfficeName: defaultOffice.officeName
      }
    ]);
  };

  const updateStageOffice = (stageIdx, officeId) => {
    const matchedOffice = offices.find(o => o.officeId === officeId);
    setStages(prev => {
      const copy = [...prev];
      copy[stageIdx] = {
        ...copy[stageIdx],
        assignedOfficeId: officeId,
        assignedOfficeName: matchedOffice ? matchedOffice.officeName : 'Assigned Office'
      };
      return copy;
    });
  };

  const removeStage = (stageIdx) => {
    if (stages.length <= 1) {
      alert('A workflow hierarchy must have at least one approval stage.');
      return;
    }
    const updated = stages.filter((_, i) => i !== stageIdx).map((stg, i) => ({
      ...stg,
      stageOrder: i + 1
    }));
    setStages(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formName.trim()) {
      setError('Form Name is required.');
      return;
    }

    if (fields.length === 0) {
      setError('AC-15: At least one form field must be defined.');
      return;
    }

    if (stages.length === 0) {
      setError('AC-15: At least one approval stage must be defined.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const payload = {
        formName: formName.trim(),
        description: description.trim(),
        department,
        fields,
        blueprintStages: stages
      };

      const res = await api.createFormTemplate(payload);
      if (res.success) {
        if (onFormCreated) onFormCreated(res.formTemplate);
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Failed to submit form template.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl max-w-4xl w-full p-6 sm:p-8 max-h-[90vh] flex flex-col border border-gray-100">
        
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 text-[#005a9c] rounded-2xl flex items-center justify-center shrink-0">
              <Layers size={20} />
            </div>
            <div>
              <h3 className="text-xl font-black uppercase tracking-tight text-gray-900">
                Custom Form & Hierarchy Builder
              </h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Design custom dynamic fields and sequential institutional approval stages
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
        <form onSubmit={handleSubmit} className="overflow-y-auto pr-1 space-y-5 flex-grow">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 p-3.5 rounded-2xl text-xs font-bold text-center flex items-center justify-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {currentUser.systemRole === 'Submitter' && (
            <div className="p-3.5 bg-blue-50 border border-blue-200/60 rounded-2xl flex items-start gap-2.5 text-xs text-blue-900 font-medium">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-[#005a9c]" />
              <div>
                <strong>Notice:</strong> Newly proposed custom forms are submitted for administrative review before becoming available across campus.
              </div>
            </div>
          )}

          {/* Form Meta */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1 block mb-1.5" htmlFor="template-name">
                Form Template Name *
              </label>
              <input
                id="template-name"
                type="text"
                className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#005a9c] bg-gray-50 focus:bg-white text-xs font-bold transition-all outline-none"
                placeholder="e.g., Summer Project Budget Approval"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1 block mb-1.5" htmlFor="dept-select">
                Target Department
              </label>
              <select
                id="dept-select"
                className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#005a9c] bg-gray-50 focus:bg-white text-xs font-bold transition-all outline-none"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              >
                <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                <option value="Academic Affairs">Academic Affairs</option>
                <option value="Student Affairs">Student Affairs</option>
                <option value="Finance & Accounts">Finance & Accounts</option>
                <option value="Hostel Administration">Hostel Administration</option>
                <option value="General Administration">General Administration</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1 block mb-1.5" htmlFor="template-desc">
              Form Purpose / Description
            </label>
            <input
              id="template-desc"
              type="text"
              className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#005a9c] bg-gray-50 focus:bg-white text-xs font-bold transition-all outline-none"
              placeholder="Brief explanation of when students or faculty should use this form..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* SECTION 1: Form Fields Builder */}
          <div className="p-5 bg-gray-50/70 rounded-2xl border border-gray-200/80">
            <div className="flex items-center justify-between mb-3.5">
              <div>
                <h4 className="text-sm font-black uppercase tracking-tight text-gray-900">1. Define Form Fields</h4>
                <p className="text-[11px] text-gray-500">Inputs required from the submitter</p>
              </div>
              <button
                type="button"
                onClick={addField}
                className="px-3 py-1.5 rounded-xl border border-[#005a9c] text-[#005a9c] hover:bg-[#005a9c] hover:text-white text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                id="btn-add-field"
              >
                <Plus size={14} /> Add Input Field
              </button>
            </div>

            <div className="space-y-3">
              {fields.map((field, fIdx) => (
                <div key={field.fieldId || fIdx} className="p-3.5 bg-white rounded-2xl border border-gray-200 shadow-sm">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                    <div className="md:col-span-5">
                      <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">Field Label *</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-[#005a9c]"
                        value={field.fieldName}
                        onChange={(e) => updateField(fIdx, { fieldName: e.target.value })}
                        required
                      />
                    </div>
                    <div className="md:col-span-3">
                      <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">Field Type</label>
                      <select
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-[#005a9c] bg-white"
                        value={field.fieldType}
                        onChange={(e) => updateField(fIdx, { fieldType: e.target.value })}
                      >
                        <option value="text">Single Line Text</option>
                        <option value="textarea">Multi-line Paragraph</option>
                        <option value="dropdown">Dropdown Choice</option>
                      </select>
                    </div>
                    <div className="md:col-span-3 flex items-center gap-2 mt-4 md:mt-5">
                      <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded text-[#005a9c] focus:ring-[#005a9c]"
                          checked={field.isRequired}
                          onChange={(e) => updateField(fIdx, { isRequired: e.target.checked })}
                        />
                        Required Field
                      </label>
                    </div>
                    <div className="md:col-span-1 text-right mt-2 md:mt-5">
                      <button
                        type="button"
                        onClick={() => removeField(fIdx)}
                        className="text-gray-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Remove field"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Dropdown Options if selected */}
                  {field.fieldType === 'dropdown' && (
                    <div className="mt-3 pt-3 border-t border-gray-100 text-xs">
                      <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">
                        Dropdown Choices (comma-separated)
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-[#005a9c]"
                        placeholder="Option 1, Option 2, Option 3..."
                        value={(field.optionsList || []).join(', ')}
                        onChange={(e) => {
                          const opts = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                          updateField(fIdx, { optionsList: opts });
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 2: Workflow Hierarchy Builder */}
          <div className="p-5 bg-gray-50/70 rounded-2xl border border-gray-200/80">
            <div className="flex items-center justify-between mb-3.5">
              <div>
                <h4 className="text-sm font-black uppercase tracking-tight text-gray-900">2. Define Approval Hierarchy</h4>
                <p className="text-[11px] text-gray-500">Sequential offices that must review and approve in order</p>
              </div>
              <button
                type="button"
                onClick={addStage}
                className="px-3 py-1.5 rounded-xl border border-[#005a9c] text-[#005a9c] hover:bg-[#005a9c] hover:text-white text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                id="btn-add-stage"
              >
                <Plus size={14} /> Add Approval Stage
              </button>
            </div>

            <div className="space-y-3">
              {stages.map((stg, sIdx) => (
                <div key={stg.stageId || sIdx} className="p-3.5 bg-white border border-gray-200 rounded-2xl shadow-sm flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1">
                    <span className="w-8 h-8 rounded-xl bg-blue-50 text-[#005a9c] border border-blue-100 flex items-center justify-center font-black text-xs shrink-0">
                      {stg.stageOrder}
                    </span>
                    <div className="flex-1">
                      <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">
                        Assigned Institutional Office *
                      </label>
                      <select
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-[#005a9c] bg-white"
                        value={stg.assignedOfficeId}
                        onChange={(e) => updateStageOffice(sIdx, e.target.value)}
                      >
                        {offices.map(off => (
                          <option key={off.officeId} value={off.officeId}>
                            {off.officeName} — {off.department}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeStage(sIdx)}
                    className="text-gray-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-xl transition-colors cursor-pointer shrink-0 mt-4"
                    title="Remove stage"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-2xl text-xs font-bold transition-all cursor-pointer"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-[#005a9c] hover:bg-[#00467a] text-white font-bold py-3 px-6 rounded-2xl text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-md hover:shadow-lg disabled:opacity-50"
              disabled={isSubmitting}
              id="btn-submit-form-template"
            >
              <Send size={15} />
              {isSubmitting
                ? 'Creating...'
                : currentUser.systemRole === 'Administrator'
                ? 'Create & Activate Template'
                : 'Submit Form for Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
