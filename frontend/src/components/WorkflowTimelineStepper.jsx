/**
 * Component: WorkflowTimelineStepper
 * Visual representation of sequential approval workflow stages.
 */

import React from 'react';
import { Check, Clock, X, RotateCcw, Building2 } from 'lucide-react';

export default function WorkflowTimelineStepper({ stages = [], currentStageIndex = 0, currentStatus = '' }) {
  if (!stages || stages.length === 0) {
    return <div style={{ color: '#64748b', fontSize: '0.875rem' }}>No approval stages defined for this document.</div>;
  }

  return (
    <div className="workflow-stepper-container">
      <div className="stepper-track">
        {stages.map((stage, idx) => {
          const isCompleted = idx < currentStageIndex || stage.status === 'Approved';
          const isCurrent = idx === currentStageIndex && currentStatus === 'Under Review';
          const isRejected = idx === currentStageIndex && currentStatus === 'Rejected';
          const isReturned = idx === currentStageIndex && currentStatus === 'Returned';

          let stepState = 'pending';
          if (isCompleted) stepState = 'completed';
          if (isCurrent) stepState = 'current';
          if (isRejected) stepState = 'rejected';
          if (isReturned) stepState = 'returned';

          return (
            <div key={stage.stageId || idx} className={`stepper-step ${stepState}`}>
              {/* Connector line */}
              {idx > 0 && (
                <div
                  className={`stepper-line ${idx <= currentStageIndex ? 'line-active' : ''}`}
                />
              )}

              {/* Step circle icon */}
              <div className="stepper-icon-box">
                {stepState === 'completed' && <Check size={18} strokeWidth={3} />}
                {stepState === 'current' && <Clock size={18} className="animate-pulse" />}
                {stepState === 'rejected' && <X size={18} strokeWidth={3} />}
                {stepState === 'returned' && <RotateCcw size={18} />}
                {stepState === 'pending' && <span className="step-num">{stage.stageOrder || idx + 1}</span>}
              </div>

              {/* Step details */}
              <div className="stepper-content">
                <div className="stepper-title">
                  Stage {stage.stageOrder || idx + 1}
                </div>
                <div className="stepper-office">
                  <Building2 size={13} style={{ marginRight: '4px', verticalAlign: '-1px' }} />
                  {stage.assignedOfficeName}
                </div>
                <div className="stepper-status-note">
                  {stepState === 'completed' && (
                    <span className="text-green-600">
                      Approved {stage.completedAt ? `(${new Date(stage.completedAt).toLocaleDateString()})` : ''}
                    </span>
                  )}
                  {stepState === 'current' && (
                    <span className="text-amber-600 font-semibold">
                      Pending Action
                    </span>
                  )}
                  {stepState === 'rejected' && (
                    <span className="text-rose-600 font-semibold">
                      Rejected at this stage
                    </span>
                  )}
                  {stepState === 'returned' && (
                    <span className="text-purple-600 font-semibold">
                      Revision Requested
                    </span>
                  )}
                  {stepState === 'pending' && <span className="text-slate-400">Upcoming</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
