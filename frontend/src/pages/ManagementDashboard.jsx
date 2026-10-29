/**
 * View / Page: ManagementDashboard
 * Executive analytics, bottleneck tracking, and accountability timelines.
 */

import React, { useState, useEffect } from 'react';
import { api } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import DocumentStatusBadge from '../components/DocumentStatusBadge';
import ModalDocumentDetail from '../components/ModalDocumentDetail';
import Pagination from '../components/Pagination';
import {
  BarChart3,
  RefreshCw,
  Eye,
  ShieldAlert
} from 'lucide-react';

export default function ManagementDashboard() {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState(null);
  const [delays, setDelays] = useState([]);
  const [timelines, setTimelines] = useState([]);
  const [hierarchies, setHierarchies] = useState([]);
  const [showHierarchies, setShowHierarchies] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedDocId, setSelectedDocId] = useState(null);
  const [delayPage, setDelayPage] = useState(1);
  const [timelinePage, setTimelinePage] = useState(1);
  const analyticsItemsPerPage = 8;

  useEffect(() => {
    loadManagementData();
  }, [currentUser]);

  const loadManagementData = async () => {
    setLoading(true);
    try {
      const [statsRes, delaysRes, timelinesRes, hierarchiesRes] = await Promise.all([
        api.getSystemStats(),
        api.getApprovalDelays(),
        api.getAllWorkflows(),
        api.getApprovedHierarchies()
      ]);

      if (statsRes.success) setStats(statsRes.stats);
      if (delaysRes.success) setDelays(delaysRes.delays || []);
      if (timelinesRes.success) setTimelines(timelinesRes.timelines || []);
      if (hierarchiesRes.success) setHierarchies(hierarchiesRes.formTemplates || []);
    } catch (err) {
      console.error('Failed to load management analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const paginatedDelays = delays.slice((delayPage - 1) * analyticsItemsPerPage, delayPage * analyticsItemsPerPage);
  const paginatedTimelines = timelines.slice((timelinePage - 1) * analyticsItemsPerPage, timelinePage * analyticsItemsPerPage);

  return (
    <div className="dashboard-container">
      {/* Executive Header */}
      <div className="mgmt-identity-card mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-navy-900 text-white rounded-xl shadow-md">
              <BarChart3 size={26} />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-navy-800 font-bold">
                Executive Management & Institutional Accountability
              </div>
              <h2 className="text-xl font-bold text-slate-800">
                Institutional Workflow Analytics & Delay Monitoring
              </h2>
              <div className="text-xs text-slate-600 font-medium">
                Observer: {currentUser?.name} ({currentUser?.position || 'Director / Executive'})
              </div>
            </div>
          </div>

          <button
            onClick={loadManagementData}
            className="btn btn-secondary p-2.5"
            title="Refresh analytics"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="kpi-card">
            <div className="kpi-label">Total Documents Filed</div>
            <div className="kpi-value text-slate-800">{stats.totalDocuments}</div>
            <div className="text-xs text-slate-500 mt-1">Across all LNMIIT departments</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-label">Currently Under Review</div>
            <div className="kpi-value text-amber-600">{stats.statusCounts['Under Review'] || 0}</div>
            <div className="text-xs text-amber-700 mt-1">Active in approval pipelines</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-label">Successfully Completed</div>
            <div className="kpi-value text-green-600">{stats.statusCounts['Completed'] || 0}</div>
            <div className="text-xs text-green-700 mt-1">Full workflow finished</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-label">Audit Actions Logged</div>
            <div className="kpi-value text-blue-600">{stats.totalActionsLogged}</div>
            <div className="text-xs text-slate-500 mt-1">Immutable security actions</div>
          </div>
        </div>
      )}

      {/* Approval Delay & Bottleneck Intelligence */}
      <div className="table-card mb-6">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert size={20} className="text-amber-600" />
            <div>
              <h4 className="section-title mb-0">Approval Delay & Bottleneck Intelligence</h4>
              <p className="text-xs text-slate-500">
                Monitors pending stages to detect review delays and ensure administrative accountability.
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded">
            {delays.filter(d => d.isBottleneck).length} Bottlenecks Detected
          </span>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Severity</th>
                <th>Doc ID</th>
                <th>Document Subject</th>
                <th>Submitter</th>
                <th>Pending At Office</th>
                <th>Elapsed Waiting Time</th>
                <th className="text-right">Inspect</th>
              </tr>
            </thead>
            <tbody>
              {delays.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    No active documents currently waiting in review queues.
                  </td>
                </tr>
              ) : (
                paginatedDelays.map(delay => (
                  <tr
                    key={delay.documentId}
                    className="hover:bg-slate-50 cursor-pointer"
                    onClick={() => setSelectedDocId(delay.documentId)}
                  >
                    <td>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-bold ${
                          delay.severity === 'Critical'
                            ? 'bg-rose-100 text-rose-800'
                            : delay.severity === 'Moderate'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {delay.severity}
                      </span>
                    </td>
                    <td className="font-mono font-bold text-xs text-crimson-800">{delay.documentId}</td>
                    <td className="font-semibold text-slate-800">{delay.title}</td>
                    <td className="text-xs text-slate-600">{delay.submitterName}</td>
                    <td className="text-xs font-semibold text-slate-800">
                      Stage {delay.currentStageOrder}: {delay.responsibleOffice}
                    </td>
                    <td className="text-xs font-mono font-bold text-slate-700">
                      {delay.elapsedHours} hours ({delay.elapsedDays} days)
                    </td>
                    <td className="text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setSelectedDocId(delay.documentId)}
                        className="btn btn-outline-secondary p-1 text-xs"
                      >
                        <Eye size={13} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination currentPage={delayPage} totalItems={delays.length} itemsPerPage={analyticsItemsPerPage} onPageChange={setDelayPage} />
        <div className="h-4" />
      </div>

      {/* Campus-Wide Workflow Oversight Timelines */}
      <div className="table-card">
        <div className="p-4 border-b border-slate-100">
          <h4 className="section-title mb-0">Campus-Wide Workflow Oversight Timelines</h4>
          <p className="text-xs text-slate-500">
            Complete high-level audit view of all document lifecycles and stage milestones.
          </p>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Subject</th>
                <th>Submitter</th>
                <th>Status</th>
                <th>Stage Milestone Progress</th>
                <th>Audit Actions</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTimelines.map(item => (
                <tr
                  key={item.documentId}
                  className="hover:bg-slate-50 cursor-pointer"
                  onClick={() => setSelectedDocId(item.documentId)}
                >
                  <td className="font-mono font-bold text-xs text-slate-600">{item.documentId}</td>
                  <td className="font-semibold text-slate-800">{item.title}</td>
                  <td className="text-xs text-slate-600">{item.submittedBy}</td>
                  <td>
                    <DocumentStatusBadge status={item.currentStatus} />
                  </td>
                  <td className="text-xs">
                    <div className="flex items-center gap-1">
                      {(item.stages || []).map((s, idx) => (
                        <span
                          key={s.stageId || idx}
                          className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold ${
                            s.status === 'Approved'
                              ? 'bg-green-600 text-white'
                              : s.status === 'In Progress'
                              ? 'bg-amber-500 text-white animate-pulse'
                              : s.status === 'Rejected'
                              ? 'bg-rose-600 text-white'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                          title={`${s.stageOrder}. ${s.assignedOfficeName} (${s.status})`}
                        >
                          {s.stageOrder}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="text-xs font-semibold text-slate-700">
                    {item.actions?.length || 0} decisions
                  </td>
                  <td className="text-right" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setSelectedDocId(item.documentId)}
                      className="btn btn-outline-primary p-1 text-xs"
                    >
                      <Eye size={13} style={{ marginRight: '3px' }} /> Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination currentPage={timelinePage} totalItems={timelines.length} itemsPerPage={analyticsItemsPerPage} onPageChange={setTimelinePage} />
        <div className="h-4" />
      </div>

      {/* Collapsible hierarchy catalog */}
      <div className="table-card mt-6">
        <button
          type="button"
          onClick={() => setShowHierarchies(value => !value)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
          aria-expanded={showHierarchies}
        >
          <span>
            <span className="section-title block mb-0">Approved Form Hierarchies</span>
            <span className="text-xs text-slate-500">Review the currently active approval chains used across campus.</span>
          </span>
          <span className="text-xs font-bold text-[#005a9c]">{showHierarchies ? 'Hide' : `Show ${hierarchies.length}`}</span>
        </button>
        {showHierarchies && (
          <div className="border-t border-slate-100 divide-y divide-slate-100">
            {hierarchies.length === 0 ? (
              <p className="p-5 text-sm text-slate-500">No approved hierarchies are currently available.</p>
            ) : hierarchies.map(template => (
              <div key={template.templateId} className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div>
                    <h5 className="font-bold text-slate-800">{template.formName}</h5>
                    <p className="text-xs text-slate-500 mt-1">{template.department}</p>
                  </div>
                  <span className="text-[11px] font-bold text-slate-500">{template.fields.length} fields · {template.stages.length} stages</span>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {template.stages.map(stage => (
                    <span key={stage.stageId} className="px-2 py-1 rounded bg-slate-100 text-[11px] font-semibold text-slate-700">
                      {stage.stageOrder}. {stage.assignedOfficeName}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Drill-down modal */}
      {selectedDocId && (
        <ModalDocumentDetail
          documentId={selectedDocId}
          isOpen={Boolean(selectedDocId)}
          onClose={() => setSelectedDocId(null)}
          onActionCompleted={loadManagementData}
        />
      )}
    </div>
  );
}
