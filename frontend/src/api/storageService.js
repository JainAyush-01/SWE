/**
 * Client-Side Data Storage & Provider Service for LNMIIT Digi-Doc
 * Manages institutional workflows, documents, users, and office hierarchies in browser storage.
 */

const STORAGE_KEY_DOCS = 'digidoc_docs';
const STORAGE_KEY_FORMS = 'digidoc_forms';
const STORAGE_KEY_OFFICES = 'digidoc_offices';
const STORAGE_KEY_NOTIFS = 'digidoc_notifs';
const STORAGE_KEY_USERS = 'digidoc_users';
const STORAGE_KEY_ROLE_REQS = 'digidoc_role_requests';

// Initial Seed Data
const INITIAL_OFFICES = [
  {
    officeId: 'OFC03',
    officeName: 'HOD Office - CSE',
    department: 'Computer Science & Engineering',
    officeEmail: 'csehod@lnmiit.ac.in',
    currentInCharge: 'U_HOD_CSE',
    currentInChargeName: 'Dr. Meera Kapoor',
    activeInChargeName: 'Dr. Meera Kapoor',
    temporaryInCharge: null
  },
  {
    officeId: 'OFC05',
    officeName: 'Dean Office - Academics',
    department: 'Academic Affairs',
    officeEmail: 'deanacad@lnmiit.ac.in',
    currentInCharge: 'U_DEAN_ACAD',
    currentInChargeName: 'Prof. Rakesh Menon',
    activeInChargeName: 'Prof. Rakesh Menon',
    temporaryInCharge: null
  },
  {
    officeId: 'OFC01',
    officeName: 'Hostel Warden Office',
    department: 'Student Affairs',
    officeEmail: 'warden@lnmiit.ac.in',
    currentInCharge: 'U_WARDEN',
    currentInChargeName: 'Dr. Sandeep Saini',
    activeInChargeName: 'Dr. Sandeep Saini',
    temporaryInCharge: null
  },
  {
    officeId: 'OFC02',
    officeName: 'Finance & Accounts Office',
    department: 'Finance & Accounts',
    officeEmail: 'cfo@lnmiit.ac.in',
    currentInCharge: 'U_CFO',
    currentInChargeName: 'Mr. Mukesh Sharma',
    activeInChargeName: 'Mr. Mukesh Sharma',
    temporaryInCharge: null
  }
];

const INITIAL_FORMS = [
  {
    templateId: 'FT01',
    formName: 'Course Exemption Request',
    description: 'Application for NPTEL/SWAYAM credit transfer, international university credit recognition, or course substitution.',
    department: 'Academic Affairs',
    hierarchyReviewStatus: 'Approved',
    activeStatus: true,
    workflowStages: [
      { stageNumber: 1, officeId: 'OFC03', officeName: 'HOD Office - CSE' },
      { stageNumber: 2, officeId: 'OFC05', officeName: 'Dean Office - Academics' }
    ],
    fields: [
      { fieldId: 'F01', fieldName: 'Course Code & Title', fieldType: 'text', isRequired: true, maxLength: 100 },
      { fieldId: 'F02', fieldName: 'Reason for Exemption', fieldType: 'textarea', isRequired: true, maxLength: 500 }
    ]
  },
  {
    templateId: 'FT02',
    formName: 'Hostel Fee Representation',
    description: 'Semester mess rebate adjustments, fee invoice discrepancy corrections, or caution money refunds.',
    department: 'Student Affairs',
    hierarchyReviewStatus: 'Approved',
    activeStatus: true,
    workflowStages: [
      { stageNumber: 1, officeId: 'OFC01', officeName: 'Hostel Warden Office' },
      { stageNumber: 2, officeId: 'OFC02', officeName: 'Finance & Accounts Office' }
    ],
    fields: [
      { fieldId: 'F03', fieldName: 'Room & Hostel Number', fieldType: 'text', isRequired: true, maxLength: 50 },
      { fieldId: 'F04', fieldName: 'Fee Discrepancy Details', fieldType: 'textarea', isRequired: true, maxLength: 500 }
    ]
  },
  {
    templateId: 'FT03',
    formName: 'Lab Equipment Requisition',
    description: 'Requisition for specialized lab hardware, oscilloscope access, or embedded development kits.',
    department: 'Computer Science & Engineering',
    hierarchyReviewStatus: 'Approved',
    activeStatus: true,
    workflowStages: [
      { stageNumber: 1, officeId: 'OFC03', officeName: 'HOD Office - CSE' }
    ],
    fields: [
      { fieldId: 'F05', fieldName: 'Equipment Name & Specs', fieldType: 'text', isRequired: true, maxLength: 100 },
      { fieldId: 'F06', fieldName: 'Project Justification', fieldType: 'textarea', isRequired: true, maxLength: 500 }
    ]
  }
];

const INITIAL_DOCS = [
  {
    documentId: 'DOC-1001',
    templateId: 'FT01',
    templateName: 'Course Exemption Request',
    submittedBy: 'U_STUDENT',
    submitterName: 'Student Submitter',
    submitterRoll: '24UCC001',
    currentStatus: 'Under Review',
    currentStageNumber: 1,
    currentResponsibleOfficeId: 'OFC03',
    currentResponsibleOfficeName: 'HOD Office - CSE',
    createdDate: new Date(Date.now() - 86400000 * 2).toISOString(),
    lastUpdatedDate: new Date(Date.now() - 86400000).toISOString(),
    canWithdraw: true,
    workflowStages: [
      { stageNumber: 1, officeId: 'OFC03', officeName: 'HOD Office - CSE' },
      { stageNumber: 2, officeId: 'OFC05', officeName: 'Dean Office - Academics' }
    ],
    formData: {
      'Course Code & Title': 'CS421 Advanced Machine Learning (NPTEL)',
      'Reason for Exemption': 'Completed 12-week Elite certification with gold medal.'
    },
    approvalActions: [
      {
        actionId: 'ACT-001',
        actionType: 'Submitted',
        actorName: 'Student Submitter',
        timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
        comments: 'Application submitted for departmental evaluation.'
      }
    ]
  },
  {
    documentId: 'DOC-1002',
    templateId: 'FT03',
    templateName: 'Lab Equipment Requisition',
    submittedBy: 'U_STUDENT',
    submitterName: 'Student Submitter',
    submitterRoll: '24UCC001',
    currentStatus: 'Approved',
    currentStageNumber: 1,
    currentResponsibleOfficeId: 'OFC03',
    currentResponsibleOfficeName: 'HOD Office - CSE',
    createdDate: new Date(Date.now() - 86400000 * 5).toISOString(),
    lastUpdatedDate: new Date(Date.now() - 86400000 * 4).toISOString(),
    canWithdraw: false,
    workflowStages: [
      { stageNumber: 1, officeId: 'OFC03', officeName: 'HOD Office - CSE' }
    ],
    formData: {
      'Equipment Name & Specs': 'NVIDIA Jetson Nano Dev Kit B01',
      'Project Justification': 'Edge AI computer vision research project.'
    },
    approvalActions: [
      {
        actionId: 'ACT-002',
        actionType: 'Submitted',
        actorName: 'Student Submitter',
        timestamp: new Date(Date.now() - 86400000 * 5).toISOString(),
        comments: 'Initial submission'
      },
      {
        actionId: 'ACT-003',
        actionType: 'Approved',
        actorName: 'Dr. Meera Kapoor (HOD CSE)',
        timestamp: new Date(Date.now() - 86400000 * 4).toISOString(),
        comments: 'Approved for hardware lab issuing.'
      }
    ]
  }
];

const INITIAL_NOTIFS = [
  {
    notificationId: 'NOTIF-1',
    recipient: 'U_STUDENT',
    title: 'Document Approved',
    message: 'Your Lab Equipment Requisition (DOC-1002) has been approved by HOD Office - CSE.',
    readStatus: false,
    sentTimestamp: new Date(Date.now() - 86400000 * 4).toISOString(),
    documentId: 'DOC-1002'
  },
  {
    notificationId: 'NOTIF-2',
    recipient: 'U_HOD_CSE',
    title: 'Document Pending Review',
    message: 'Course Exemption Request (DOC-1001) requires your review.',
    readStatus: false,
    sentTimestamp: new Date(Date.now() - 86400000).toISOString(),
    documentId: 'DOC-1001'
  }
];

const INITIAL_USERS = [
  {
    userId: 'U_ADMIN',
    name: 'Institutional Administrator',
    institutionalEmail: 'admin@lnmiit.ac.in',
    systemRole: 'Administrator',
    officeId: 'OFC_ADMIN',
    position: 'Registrar & System Administrator',
    accountStatus: true
  },
  {
    userId: 'U_HOD_CSE',
    name: 'Dr. Meera Kapoor',
    institutionalEmail: 'csehod@lnmiit.ac.in',
    systemRole: 'Approver',
    officeId: 'OFC03',
    position: 'Head of Department, CSE',
    accountStatus: true
  },
  {
    userId: 'U_DEAN_ACAD',
    name: 'Prof. Rakesh Menon',
    institutionalEmail: 'deanacad@lnmiit.ac.in',
    systemRole: 'Approver',
    officeId: 'OFC05',
    position: 'Dean of Academic Affairs',
    accountStatus: true
  },
  {
    userId: 'U_STUDENT',
    name: 'Student Submitter',
    institutionalEmail: 'student@lnmiit.ac.in',
    systemRole: 'Submitter',
    officeId: null,
    position: 'B.Tech Student (Roll: 24UCC001)',
    accountStatus: true,
    rollNo: '24UCC001'
  }
];

const INITIAL_ROLE_REQS = [
  {
    requestId: 'REQ-101',
    userId: 'U_STUDENT',
    name: 'Student Submitter',
    institutionalEmail: 'student@lnmiit.ac.in',
    requestedRole: 'Approver',
    requestedOfficeId: 'OFC01',
    requestedOfficeName: 'Hostel Warden Office',
    justification: 'Appointed as Assistant Hostel Warden for BH-1.',
    status: 'Pending',
    createdDate: new Date(Date.now() - 86400000).toISOString()
  }
];

// LocalStorage helpers
function readFromStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`[LocalStorage] Failed to write key ${key}:`, err);
  }
}

// Getters & Setters
const getDocs = () => readFromStorage(STORAGE_KEY_DOCS, INITIAL_DOCS);
const setDocs = (d) => writeToStorage(STORAGE_KEY_DOCS, d);

const getForms = () => readFromStorage(STORAGE_KEY_FORMS, INITIAL_FORMS);
const setForms = (f) => writeToStorage(STORAGE_KEY_FORMS, f);

const getOffices = () => readFromStorage(STORAGE_KEY_OFFICES, INITIAL_OFFICES);
const setOffices = (o) => writeToStorage(STORAGE_KEY_OFFICES, o);

const getNotifs = () => readFromStorage(STORAGE_KEY_NOTIFS, INITIAL_NOTIFS);
const setNotifs = (n) => writeToStorage(STORAGE_KEY_NOTIFS, n);

const getUsers = () => readFromStorage(STORAGE_KEY_USERS, INITIAL_USERS);
const setUsers = (u) => writeToStorage(STORAGE_KEY_USERS, u);

const getRoleRequests = () => readFromStorage(STORAGE_KEY_ROLE_REQS, INITIAL_ROLE_REQS);
const setRoleRequests = (r) => writeToStorage(STORAGE_KEY_ROLE_REQS, r);

export const storageService = {
  // Authentication & Sessions
  login: async ({ institutionalEmail, email, name: inputName, accountType, role: inputRole, rollNo: inputRollNo, officeId: inputOfficeId } = {}) => {
    const input = (institutionalEmail || email || '').trim().toLowerCase();
    let role = 'STUDENT';
    let name = inputName || 'Student Submitter';
    let rollNo = inputRollNo || '24UCC001';
    let officeId = inputOfficeId || null;

    if (inputRole === 'ADMIN' || accountType === 'admin' || input.includes('admin')) {
      role = 'ADMIN';
      name = inputName || 'Institutional Administrator';
      rollNo = inputRollNo || 'ADMIN';
      officeId = 'OFC_ADMIN';
    } else if (inputRole === 'APPROVER' || accountType === 'approver' || input.includes('hod') || input.includes('cse')) {
      role = 'APPROVER';
      name = inputName || 'Dr. Meera Kapoor';
      rollNo = inputRollNo || 'OFC03';
      officeId = inputOfficeId || 'OFC03';
    } else if (inputRole === 'DEAN' || input.includes('dean')) {
      role = 'APPROVER';
      name = inputName || 'Prof. Rakesh Menon';
      rollNo = inputRollNo || 'OFC05';
      officeId = inputOfficeId || 'OFC05';
    } else if (input) {
      if (!inputName) {
        const prefix = input.split('@')[0];
        name = prefix.charAt(0).toUpperCase() + prefix.slice(1);
      }
      if (!inputRollNo) {
        rollNo = (inputName || 'USER').slice(0, 8).toUpperCase();
      }
    }

    const user = {
      userId: `U_${role}_${Date.now()}`,
      name,
      institutionalEmail: input || 'user@example.com',
      systemRole: role === 'ADMIN' ? 'Administrator' : role === 'APPROVER' ? 'Approver' : 'Submitter',
      officeId,
      position: `${role} Persona`,
      accountStatus: true,
      rollNo
    };

    localStorage.setItem('userEmail', user.institutionalEmail);
    localStorage.setItem('userRole', role);
    localStorage.setItem('currentUser', JSON.stringify(user));
    if (rollNo) localStorage.setItem('currentRollNo', rollNo);

    return {
      success: true,
      token: 'digidoc-session-token',
      role,
      rollNo,
      user
    };
  },

  getProfile: async () => {
    const role = localStorage.getItem('userRole') || 'STUDENT';
    const email = localStorage.getItem('userEmail') || (role === 'ADMIN' ? 'admin@example.com' : role === 'APPROVER' ? 'csehod@example.com' : 'student@example.com');
    const savedUserStr = localStorage.getItem('currentUser');
    if (savedUserStr) {
      try {
        const saved = JSON.parse(savedUserStr);
        return { success: true, user: saved };
      } catch {}
    }
    return {
      success: true,
      user: {
        userId: `U_${role}_ACTIVE`,
        name: role === 'ADMIN' ? 'Institutional Administrator' : role === 'APPROVER' ? 'Dr. Meera Kapoor' : 'Student Submitter',
        institutionalEmail: email,
        systemRole: role === 'ADMIN' ? 'Administrator' : role === 'APPROVER' ? 'Approver' : 'Submitter',
        position: `${role} View`,
        officeId: role === 'APPROVER' ? 'OFC03' : null,
        accountStatus: true,
        rollNo: role === 'STUDENT' ? '24UCC001' : null
      }
    };
  },

  logout: async () => ({ success: true }),

  // User Management
  getUsers: async () => ({ success: true, users: getUsers() }),

  createUser: async (userData) => {
    const current = getUsers();
    const newUser = {
      userId: `U_${Date.now()}`,
      accountStatus: true,
      ...userData
    };
    setUsers([...current, newUser]);
    return { success: true, user: newUser };
  },

  updateUser: async (userId, data) => {
    const current = getUsers();
    const updated = current.map(u => u.userId === userId ? { ...u, ...data } : u);
    setUsers(updated);
    return { success: true };
  },

  toggleUserStatus: async (userId) => {
    const current = getUsers();
    const updated = current.map(u => u.userId === userId ? { ...u, accountStatus: !u.accountStatus } : u);
    setUsers(updated);
    return { success: true };
  },

  // Role Requests
  getRoleUpgradeRequests: async () => ({ success: true, requests: getRoleRequests() }),

  getMyRoleUpgradeRequests: async () => ({ success: true, requests: getRoleRequests() }),

  createRoleUpgradeRequest: async (data) => {
    const current = getRoleRequests();
    const newReq = {
      requestId: `REQ-${Date.now().toString().slice(-4)}`,
      status: 'Pending',
      createdDate: new Date().toISOString(),
      ...data
    };
    setRoleRequests([newReq, ...current]);
    return { success: true, request: newReq };
  },

  decideRoleUpgradeRequest: async (requestId, { decision, reviewerComment, assignedRole, assignedOfficeId }) => {
    const current = getRoleRequests();
    const updated = current.map(r => r.requestId === requestId ? {
      ...r,
      status: decision === 'Approved' ? 'Approved' : 'Rejected',
      reviewerComment,
      assignedRole,
      assignedOfficeId
    } : r);
    setRoleRequests(updated);
    return { success: true, message: `Role upgrade request ${decision}.` };
  },

  // Documents Lifecycle
  getMyDocuments: async () => {
    const all = getDocs();
    return { success: true, documents: all };
  },

  getPendingDocuments: async (officeId) => {
    const all = getDocs();
    const pending = all.filter(d => {
      if (d.currentStatus !== 'Under Review') return false;
      if (officeId && d.currentResponsibleOfficeId && d.currentResponsibleOfficeId !== officeId) {
        return false;
      }
      return true;
    });
    return { success: true, documents: pending };
  },

  getApproverHistory: async () => {
    const all = getDocs();
    const history = [];
    all.forEach(d => {
      (d.approvalActions || []).forEach(a => {
        if (['Approved', 'Rejected', 'Returned'].includes(a.actionType)) {
          history.push({
            actionId: a.actionId,
            documentId: d.documentId,
            documentTitle: d.title || d.templateName || 'Institutional Application',
            actionType: a.actionType,
            comment: a.comments || '',
            timestamp: a.timestamp
          });
        }
      });
    });
    return {
      success: true,
      history,
      documents: all.filter(d => ['Approved', 'Rejected', 'Returned'].includes(d.currentStatus))
    };
  },

  getDocumentById: async (id) => {
    const all = getDocs();
    const doc = all.find(d => d.documentId === id) || all[0];
    if (!doc) return { success: false, message: 'Document not found' };

    const stages = (doc.lockedStages || doc.workflowStages || []).map((s, idx) => ({
      stageIndex: idx,
      stageNumber: s.stageNumber || idx + 1,
      officeId: s.officeId,
      officeName: s.officeName || `Office ${idx + 1}`,
      status: s.status || (idx < (doc.currentStageNumber || 1) - 1 ? 'Approved' : idx === (doc.currentStageNumber || 1) - 1 ? (doc.currentStatus || 'Under Review') : 'Pending'),
      completedAt: s.completedAt
    }));

    let fieldValues = doc.fieldValues || [];
    if ((!fieldValues || fieldValues.length === 0) && doc.formData) {
      fieldValues = Object.entries(doc.formData).map(([k, v], idx) => ({
        fieldId: `f_${idx}`,
        fieldName: k,
        enteredValue: String(v)
      }));
    }

    const enhancedDoc = {
      ...doc,
      lockedStages: stages,
      workflowStages: stages,
      currentStageIndex: Math.max(0, (doc.currentStageNumber || 1) - 1),
      fieldValues
    };

    return {
      success: true,
      document: enhancedDoc,
      auditActions: doc.approvalActions || [],
      revisions: doc.revisions || [],
      canWithdraw: doc.currentStatus === 'Under Review' || doc.currentStatus === 'Returned',
      canCurrentUserAct: doc.currentStatus === 'Under Review'
    };
  },

  submitDocument: async (docData) => {
    const current = getDocs();
    const forms = getForms();
    const template = forms.find(f => f.templateId === docData.templateId);

    const workflowStages = (template && template.workflowStages && template.workflowStages.length > 0)
      ? template.workflowStages.map((s, idx) => ({
          stageNumber: idx + 1,
          officeId: s.officeId,
          officeName: s.officeName || 'Department Office',
          status: idx === 0 ? 'Under Review' : 'Pending'
        }))
      : [
          { stageNumber: 1, officeId: 'OFC03', officeName: 'HOD Office - CSE', status: 'Under Review' },
          { stageNumber: 2, officeId: 'OFC05', officeName: 'Dean Office - Academics', status: 'Pending' }
        ];

    const currentResponsibleOfficeId = workflowStages[0]?.officeId || 'OFC03';
    const currentResponsibleOfficeName = workflowStages[0]?.officeName || 'HOD Office - CSE';

    const formData = {};
    (docData.fieldValues || []).forEach(f => {
      formData[f.fieldName || f.fieldId] = f.enteredValue;
    });

    const currentUserEmail = localStorage.getItem('userEmail') || 'student@lnmiit.ac.in';
    const currentRollNo = localStorage.getItem('currentRollNo') || '24UCC001';
    let submitterName = 'Student Submitter';
    try {
      const savedUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      if (savedUser.name) submitterName = savedUser.name;
    } catch {}

    const newDoc = {
      documentId: docData.documentId && !docData.documentId.startsWith('DRAFT')
        ? docData.documentId
        : `DOC-${Date.now().toString().slice(-4)}`,
      templateId: docData.templateId || (template ? template.templateId : 'FT01'),
      templateName: template ? template.formName : (docData.title || 'Institutional Application'),
      title: docData.title || (template ? `${template.formName} Request` : 'Institutional Application'),
      submittedBy: 'U_STUDENT',
      submitterName,
      submitterRoll: currentRollNo,
      submitterEmail: currentUserEmail,
      currentStatus: 'Under Review',
      currentStageNumber: 1,
      currentResponsibleOfficeId,
      currentResponsibleOfficeName,
      workflowStages,
      formData,
      fieldValues: docData.fieldValues || [],
      createdDate: new Date().toISOString(),
      lastUpdatedDate: new Date().toISOString(),
      canWithdraw: true,
      approvalActions: [
        {
          actionId: `ACT-${Date.now()}`,
          actionType: 'Submitted',
          actorName: submitterName,
          timestamp: new Date().toISOString(),
          comments: 'Application submitted for institutional review.'
        }
      ]
    };

    const updated = [newDoc, ...current.filter(d => d.documentId !== docData.documentId && d.documentId !== newDoc.documentId)];
    setDocs(updated);
    return { success: true, document: newDoc, message: 'Document submitted successfully!' };
  },

  saveDraft: async (docData) => {
    const current = getDocs();
    const forms = getForms();
    const template = forms.find(f => f.templateId === docData.templateId);

    const formData = {};
    (docData.fieldValues || []).forEach(f => {
      formData[f.fieldName || f.fieldId] = f.enteredValue;
    });

    const draftDoc = {
      documentId: docData.documentId || `DRAFT-${Date.now().toString().slice(-4)}`,
      templateId: docData.templateId || (template ? template.templateId : 'FT01'),
      templateName: template ? template.formName : (docData.title || 'Institutional Application'),
      title: docData.title || 'Draft Application',
      submittedBy: 'U_STUDENT',
      submitterName: 'Student Submitter',
      currentStatus: 'Draft',
      formData,
      fieldValues: docData.fieldValues || [],
      createdDate: new Date().toISOString(),
      lastUpdatedDate: new Date().toISOString(),
      canWithdraw: true
    };
    const updated = [draftDoc, ...current.filter(d => d.documentId !== draftDoc.documentId)];
    setDocs(updated);
    return { success: true, document: draftDoc, message: 'Draft saved!' };
  },

  approveDocument: async (id, comment) => {
    const current = getDocs();
    let updatedDoc = null;
    const updated = current.map(d => {
      if (d.documentId === id) {
        const nextStageIdx = (d.currentStageNumber || 1);
        const hasNextStage = d.workflowStages && d.workflowStages.length > nextStageIdx;
        const isFinalApproval = !hasNextStage;
        const newStatus = isFinalApproval ? 'Approved' : 'Under Review';
        const nextStageNumber = isFinalApproval ? d.currentStageNumber : nextStageIdx + 1;
        const nextOffice = isFinalApproval
          ? d.currentResponsibleOfficeName
          : (d.workflowStages[nextStageIdx]?.officeName || 'Next Office');
        const nextOfficeId = isFinalApproval
          ? d.currentResponsibleOfficeId
          : (d.workflowStages[nextStageIdx]?.officeId || d.currentResponsibleOfficeId);

        const updatedStages = (d.workflowStages || []).map((s, idx) => {
          if (idx === (d.currentStageNumber || 1) - 1) {
            return { ...s, status: 'Approved', completedAt: new Date().toISOString() };
          }
          if (idx === nextStageIdx && !isFinalApproval) {
            return { ...s, status: 'Under Review' };
          }
          return s;
        });

        updatedDoc = {
          ...d,
          currentStatus: newStatus,
          currentStageNumber: nextStageNumber,
          currentResponsibleOfficeId: nextOfficeId,
          currentResponsibleOfficeName: nextOffice,
          canWithdraw: false,
          lastUpdatedDate: new Date().toISOString(),
          workflowStages: updatedStages,
          approvalActions: [
            ...(d.approvalActions || []),
            {
              actionId: `ACT-${Date.now()}`,
              actionType: 'Approved',
              actorName: d.currentResponsibleOfficeName || 'Approver Reviewer',
              timestamp: new Date().toISOString(),
              comments: comment || (isFinalApproval ? 'Final Approval granted.' : 'Endorsed and forwarded to next stage.')
            }
          ]
        };
        return updatedDoc;
      }
      return d;
    });
    setDocs(updated);
    return { success: true, document: updatedDoc, message: 'Document approved!' };
  },

  rejectDocument: async (id, comment) => {
    const current = getDocs();
    let updatedDoc = null;
    const updated = current.map(d => {
      if (d.documentId === id) {
        const updatedStages = (d.workflowStages || []).map((s, idx) => {
          if (idx === (d.currentStageNumber || 1) - 1) {
            return { ...s, status: 'Rejected', completedAt: new Date().toISOString() };
          }
          return s;
        });

        updatedDoc = {
          ...d,
          currentStatus: 'Rejected',
          canWithdraw: false,
          lastUpdatedDate: new Date().toISOString(),
          workflowStages: updatedStages,
          approvalActions: [
            ...(d.approvalActions || []),
            {
              actionId: `ACT-${Date.now()}`,
              actionType: 'Rejected',
              actorName: d.currentResponsibleOfficeName || 'Approver Reviewer',
              timestamp: new Date().toISOString(),
              comments: comment || 'Application rejected.'
            }
          ]
        };
        return updatedDoc;
      }
      return d;
    });
    setDocs(updated);
    return { success: true, document: updatedDoc, message: 'Document rejected.' };
  },

  returnDocument: async (id, comment) => {
    const current = getDocs();
    let updatedDoc = null;
    const updated = current.map(d => {
      if (d.documentId === id) {
        const updatedStages = (d.workflowStages || []).map((s, idx) => {
          if (idx === (d.currentStageNumber || 1) - 1) {
            return { ...s, status: 'Returned', completedAt: new Date().toISOString() };
          }
          return s;
        });

        updatedDoc = {
          ...d,
          currentStatus: 'Returned',
          canWithdraw: true,
          lastUpdatedDate: new Date().toISOString(),
          workflowStages: updatedStages,
          approvalActions: [
            ...(d.approvalActions || []),
            {
              actionId: `ACT-${Date.now()}`,
              actionType: 'Returned',
              actorName: d.currentResponsibleOfficeName || 'Approver Reviewer',
              timestamp: new Date().toISOString(),
              comments: comment || 'Returned for revisions.'
            }
          ]
        };
        return updatedDoc;
      }
      return d;
    });
    setDocs(updated);
    return { success: true, document: updatedDoc, message: 'Document returned for revisions!' };
  },

  withdrawDocument: async (id) => {
    const current = getDocs();
    const updated = current.map(d => d.documentId === id ? {
      ...d,
      currentStatus: 'Withdrawn',
      canWithdraw: false,
      lastUpdatedDate: new Date().toISOString(),
      approvalActions: [
        ...(d.approvalActions || []),
        {
          actionId: `ACT-${Date.now()}`,
          actionType: 'Withdrawn',
          actorName: d.submitterName || 'Student Submitter',
          timestamp: new Date().toISOString(),
          comments: 'Application withdrawn by applicant.'
        }
      ]
    } : d);
    setDocs(updated);
    return { success: true, message: 'Document withdrawn.' };
  },

  resubmitDocument: async (id, payload) => {
    const current = getDocs();
    let updatedDoc = null;
    const updated = current.map(d => {
      if (d.documentId === id) {
        const revisedFieldValues = payload.revisedFieldValues || d.fieldValues;
        const formData = { ...d.formData };
        if (Array.isArray(revisedFieldValues)) {
          revisedFieldValues.forEach(f => {
            formData[f.fieldName || f.fieldId] = f.enteredValue;
          });
        }

        const updatedStages = (d.workflowStages || []).map((s, idx) => {
          if (idx === (d.currentStageNumber || 1) - 1) {
            return { ...s, status: 'Under Review' };
          }
          return s;
        });

        updatedDoc = {
          ...d,
          currentStatus: 'Under Review',
          lastUpdatedDate: new Date().toISOString(),
          fieldValues: revisedFieldValues,
          formData,
          workflowStages: updatedStages,
          approvalActions: [
            ...(d.approvalActions || []),
            {
              actionId: `ACT-${Date.now()}`,
              actionType: 'Resubmitted',
              actorName: d.submitterName || 'Student Submitter',
              timestamp: new Date().toISOString(),
              comments: payload.submitterComment || 'Resubmitted with requested revisions.'
            }
          ]
        };
        return updatedDoc;
      }
      return d;
    });
    setDocs(updated);
    return { success: true, document: updatedDoc, message: 'Document resubmitted successfully.' };
  },

  // Form Catalog
  getActiveForms: async () => ({ success: true, formTemplates: getForms().filter(f => f.activeStatus && f.hierarchyReviewStatus === 'Approved') }),

  getAllForms: async () => ({ success: true, formTemplates: getForms() }),

  getPendingHierarchyForms: async () => {
    const pending = getForms().filter(f => f.hierarchyReviewStatus === 'Pending');
    return { success: true, formTemplates: pending };
  },

  createFormTemplate: async (data) => {
    const current = getForms();
    const newForm = {
      ...data,
      templateId: `FT-${Date.now().toString().slice(-3)}`,
      hierarchyReviewStatus: 'Approved',
      activeStatus: true
    };
    setForms([...current, newForm]);
    return { success: true, formTemplate: newForm, message: 'Form created successfully!' };
  },

  approveHierarchy: async (id) => {
    const current = getForms();
    const updated = current.map(f => f.templateId === id ? { ...f, hierarchyReviewStatus: 'Approved', activeStatus: true } : f);
    setForms(updated);
    return { success: true, message: 'Form hierarchy approved.' };
  },

  returnHierarchy: async (id, comment) => {
    const current = getForms();
    const updated = current.map(f => f.templateId === id ? { ...f, hierarchyReviewStatus: 'Returned', reviewerComment: comment } : f);
    setForms(updated);
    return { success: true, message: 'Form hierarchy returned for revision.' };
  },

  toggleFormActive: async (id) => {
    const current = getForms();
    const updated = current.map(f => f.templateId === id ? { ...f, activeStatus: !f.activeStatus } : f);
    setForms(updated);
    return { success: true, message: 'Form status toggled.' };
  },

  // Offices & Titles
  getAllOffices: async () => ({ success: true, offices: getOffices() }),

  getMyTitles: async () => {
    const role = localStorage.getItem('userRole') || 'STUDENT';
    const email = localStorage.getItem('userEmail') || (role === 'APPROVER' ? 'csehod@lnmiit.ac.in' : 'student@lnmiit.ac.in');
    let userName = role === 'APPROVER' ? 'Dr. Meera Kapoor' : 'Student Submitter';
    try {
      const savedUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      if (savedUser.name) userName = savedUser.name;
    } catch {}

    const isApproverOrAdmin = role === 'APPROVER' || role === 'ADMIN';

    return {
      success: true,
      personalPersona: {
        type: 'PERSONAL',
        id: 'personal',
        title: 'Personal Profile',
        name: userName,
        email,
        role: 'STUDENT'
      },
      officeTitles: isApproverOrAdmin ? [
        {
          type: 'OFFICE',
          id: 'OFC03',
          officeId: 'OFC03',
          title: 'HOD Office - CSE',
          name: userName.includes('Dr.') ? userName : 'Dr. Meera Kapoor',
          email: 'csehod@lnmiit.ac.in',
          role: 'APPROVER'
        },
        {
          type: 'OFFICE',
          id: 'OFC05',
          officeId: 'OFC05',
          title: 'Dean Office - Academics',
          name: 'Prof. Rakesh Menon',
          email: 'deanacad@lnmiit.ac.in',
          role: 'APPROVER'
        }
      ] : []
    };
  },

  createOffice: async (data) => {
    const current = getOffices();
    const newOffice = {
      ...data,
      officeId: `OFC-${Date.now().toString().slice(-3)}`,
      currentInChargeName: data.currentInChargeName || 'Unassigned',
      activeInChargeName: data.currentInChargeName || 'Unassigned'
    };
    setOffices([...current, newOffice]);
    return { success: true, office: newOffice };
  },

  updateOfficeDetails: async (id, data) => {
    const current = getOffices();
    const updated = current.map(o => o.officeId === id ? { ...o, ...data } : o);
    setOffices(updated);
    return { success: true };
  },

  deleteOffice: async (id) => {
    const current = getOffices();
    const updated = current.filter(o => o.officeId !== id);
    setOffices(updated);
    return { success: true };
  },

  assignTemporaryInCharge: async (id, data) => {
    const current = getOffices();
    const updated = current.map(o => o.officeId === id ? { ...o, temporaryInCharge: data.tempUserId, activeInChargeName: data.tempUserName || 'Cover In-Charge' } : o);
    setOffices(updated);
    return { success: true };
  },

  clearTemporaryInCharge: async (id) => {
    const current = getOffices();
    const updated = current.map(o => o.officeId === id ? { ...o, temporaryInCharge: null, activeInChargeName: o.currentInChargeName } : o);
    setOffices(updated);
    return { success: true };
  },

  // Notifications
  getMyNotifications: async () => {
    const all = getNotifs();
    return { success: true, unreadCount: all.filter(n => !n.readStatus).length, notifications: all };
  },

  markNotificationRead: async (id) => {
    const current = getNotifs();
    const updated = current.map(n => n.notificationId === id ? { ...n, readStatus: true } : n);
    setNotifs(updated);
    return { success: true };
  },

  markAllNotificationsRead: async () => {
    const current = getNotifs();
    const updated = current.map(n => ({ ...n, readStatus: true }));
    setNotifs(updated);
    return { success: true };
  },

  // Management Overview
  getSystemStats: async () => {
    const d = getDocs();
    const f = getForms();
    return {
      success: true,
      stats: {
        totalDocuments: d.length,
        underReviewCount: d.filter(x => x.currentStatus === 'Under Review').length,
        approvedCount: d.filter(x => x.currentStatus === 'Approved').length,
        rejectedCount: d.filter(x => x.currentStatus === 'Rejected').length,
        formsCount: f.length
      }
    };
  },

  getApprovalDelays: async () => ({ success: true, delays: [] }),
  getAllWorkflows: async () => ({ success: true, workflows: getDocs() }),
  getApprovedHierarchies: async () => ({ success: true, hierarchies: getForms() }),

  // Reset local storage to initial defaults
  resetDatabase: async () => {
    localStorage.removeItem(STORAGE_KEY_DOCS);
    localStorage.removeItem(STORAGE_KEY_FORMS);
    localStorage.removeItem(STORAGE_KEY_OFFICES);
    localStorage.removeItem(STORAGE_KEY_NOTIFS);
    localStorage.removeItem(STORAGE_KEY_USERS);
    localStorage.removeItem(STORAGE_KEY_ROLE_REQS);
    return { success: true, message: 'All local data reset to default state.' };
  }
};
