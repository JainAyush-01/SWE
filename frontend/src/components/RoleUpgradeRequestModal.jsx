import React, { useEffect, useState } from 'react';
import { api } from '../api/apiClient';

export default function RoleUpgradeRequestModal({ isOpen, onClose, onSubmitted }) {
  const [offices, setOffices] = useState([]);
  const [requestedRole, setRequestedRole] = useState('Approver');
  const [requestedOfficeId, setRequestedOfficeId] = useState('');
  const [justification, setJustification] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    api.getAllOffices().then(res => setOffices(res.offices || [])).catch(() => setOffices([]));
  }, [isOpen]);

  if (!isOpen) return null;

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      const res = await api.createRoleUpgradeRequest({
        requestedRole,
        requestedOfficeId: requestedRole === 'Approver' ? requestedOfficeId : null,
        justification
      });
      if (!res.success) throw new Error(res.message);
      onSubmitted?.(res.request);
      onClose();
    } catch (err) {
      setError(err.message || 'Could not submit the request.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[2rem] shadow-2xl max-w-lg w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-black uppercase tracking-tight text-gray-900">Request Institutional Role</h3>
        <p className="text-xs text-gray-500 font-semibold mt-1 mb-5">Your verified profile stays a Submitter until an Administrator approves this request.</p>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="field-label">Requested role</label>
            <select value={requestedRole} onChange={e => setRequestedRole(e.target.value)} className="field-input">
              <option value="Approver">Approver / Office In-Charge</option>
              <option value="Management">Management / Executive Observer</option>
            </select>
          </div>
          {requestedRole === 'Approver' && (
            <div>
              <label className="field-label">Requested office</label>
              <select value={requestedOfficeId} onChange={e => setRequestedOfficeId(e.target.value)} className="field-input">
                <option value="">Select an office (optional)</option>
                {offices.map(office => <option key={office.officeId} value={office.officeId}>{office.officeName}</option>)}
              </select>
            </div>
          )}
          <textarea required minLength={20} rows={4} placeholder="Explain your institutional responsibility and why this access is needed..." value={justification} onChange={e => setJustification(e.target.value)} className="field-input resize-none" />
          {error && <p className="text-xs font-bold text-red-600 bg-red-50 border border-red-100 p-3 rounded-xl">{error}</p>}
          <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-xs font-black uppercase tracking-wider">Cancel</button>
            <button disabled={saving} className="px-5 py-2.5 rounded-xl bg-[#005a9c] text-white text-xs font-black uppercase tracking-wider disabled:opacity-50">{saving ? 'Submitting...' : 'Submit Request'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
