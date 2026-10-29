/**
 * Component: DocumentStatusBadge
 * Displays standardized color-coded status badges
 */

import React from 'react';
import { Clock, CheckCircle2, XCircle, RotateCcw, FileText, Ban, CheckCheck } from 'lucide-react';

export default function DocumentStatusBadge({ status }) {
  const getBadgeConfig = (statusStr) => {
    switch (statusStr) {
      case 'Draft':
        return {
          bg: '#f1f5f9',
          color: '#475569',
          border: '#cbd5e1',
          icon: FileText,
          label: 'Draft'
        };
      case 'Submitted':
        return {
          bg: '#e0f2fe',
          color: '#0369a1',
          border: '#bae6fd',
          icon: Clock,
          label: 'Submitted'
        };
      case 'Under Review':
        return {
          bg: '#fef3c7',
          color: '#b45309',
          border: '#fde68a',
          icon: Clock,
          label: 'Under Review'
        };
      case 'Approved':
        return {
          bg: '#dcfce7',
          color: '#15803d',
          border: '#bbf7d0',
          icon: CheckCircle2,
          label: 'Stage Approved'
        };
      case 'Completed':
        return {
          bg: '#ecfdf5',
          color: '#047857',
          border: '#a7f3d0',
          icon: CheckCheck,
          label: 'Completed'
        };
      case 'Rejected':
        return {
          bg: '#ffe4e6',
          color: '#be123c',
          border: '#fecdd3',
          icon: XCircle,
          label: 'Rejected'
        };
      case 'Returned':
        return {
          bg: '#f3e8ff',
          color: '#7e22ce',
          border: '#e9d5ff',
          icon: RotateCcw,
          label: 'Returned for Revision'
        };
      case 'Withdrawn':
        return {
          bg: '#f8fafc',
          color: '#64748b',
          border: '#e2e8f0',
          icon: Ban,
          label: 'Withdrawn'
        };
      default:
        return {
          bg: '#f3f4f6',
          color: '#374151',
          border: '#e5e7eb',
          icon: FileText,
          label: statusStr || 'Unknown'
        };
    }
  };

  const config = getBadgeConfig(status);
  const Icon = config.icon;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 10px',
        borderRadius: '9999px',
        fontSize: '0.8125rem',
        fontWeight: '600',
        backgroundColor: config.bg,
        color: config.color,
        border: `1px solid ${config.border}`,
        letterSpacing: '0.01em',
        lineHeight: 1
      }}
    >
      <Icon size={14} />
      {config.label}
    </span>
  );
}
