/**
 * API Client & Data Provider for LNMIIT Digi-Doc
 * Provides unified interface for document routing, user management, and institutional workflows.
 */

import { storageService } from './storageService';

export const api = {
  // Auth & Profile
  login: (credentials) => storageService.login(credentials),
  register: (userData) => storageService.login(userData),
  verifyEmail: () => Promise.resolve({ success: true }),
  resendOtp: () => Promise.resolve({ success: true }),
  requestLinkOtp: () => Promise.resolve({ success: true }),
  confirmLinkAccount: () => Promise.resolve({ success: true }),
  logout: () => storageService.logout(),
  getProfile: () => storageService.getProfile(),

  // Users & Roles
  getUsers: () => storageService.getUsers(),
  createUser: (userData) => storageService.createUser(userData),
  updateUser: (userId, data) => storageService.updateUser(userId, data),
  toggleUserStatus: (userId) => storageService.toggleUserStatus(userId),
  createRoleUpgradeRequest: (data) => storageService.createRoleUpgradeRequest(data),
  getMyRoleUpgradeRequests: () => storageService.getMyRoleUpgradeRequests(),
  getRoleUpgradeRequests: () => storageService.getRoleUpgradeRequests(),
  decideRoleUpgradeRequest: (requestId, data) => storageService.decideRoleUpgradeRequest(requestId, data),

  // Documents Lifecycle
  getMyDocuments: () => storageService.getMyDocuments(),
  getPendingDocuments: (officeId) => storageService.getPendingDocuments(officeId),
  getApproverHistory: () => storageService.getApproverHistory(),
  getDocumentById: (id) => storageService.getDocumentById(id),
  saveDraft: (docData) => storageService.saveDraft(docData),
  submitDocument: (docData) => storageService.submitDocument(docData),
  withdrawDocument: (id) => storageService.withdrawDocument(id),
  approveDocument: (id, comment) => storageService.approveDocument(id, comment),
  rejectDocument: (id, comment) => storageService.rejectDocument(id, comment),
  returnDocument: (id, comment) => storageService.returnDocument(id, comment),
  resubmitDocument: (id, payload) => storageService.resubmitDocument(id, payload),

  // Forms Catalog
  getActiveForms: () => storageService.getActiveForms(),
  getAllForms: () => storageService.getAllForms(),
  getPendingHierarchyForms: () => storageService.getPendingHierarchyForms(),
  createFormTemplate: (formData) => storageService.createFormTemplate(formData),
  approveHierarchy: (id) => storageService.approveHierarchy(id),
  returnHierarchy: (id, comment) => storageService.returnHierarchy(id, comment),
  toggleFormActive: (id) => storageService.toggleFormActive(id),

  // Offices & Titles
  getAllOffices: () => storageService.getAllOffices(),
  getMyTitles: () => storageService.getMyTitles(),
  createOffice: (data) => storageService.createOffice(data),
  updateOfficeDetails: (id, data) => storageService.updateOfficeDetails(id, data),
  deleteOffice: (id) => storageService.deleteOffice(id),
  assignTemporaryInCharge: (id, data, maybeEndDate) => storageService.assignTemporaryInCharge(id, data, maybeEndDate),
  clearTemporaryInCharge: (id) => storageService.clearTemporaryInCharge(id),

  // Notifications
  getMyNotifications: () => storageService.getMyNotifications(),
  markNotificationRead: (id) => storageService.markNotificationRead(id),
  markAllNotificationsRead: () => storageService.markAllNotificationsRead(),

  // Management Overview
  getSystemStats: () => storageService.getSystemStats(),
  getApprovalDelays: () => storageService.getApprovalDelays(),
  getAllWorkflows: () => storageService.getAllWorkflows(),
  getApprovedHierarchies: () => storageService.getApprovedHierarchies(),

  // Reset Data
  resetDatabase: () => storageService.resetDatabase()
};
