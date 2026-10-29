/**
 * Page: AdminDashboard
 * Institutional Workflow Administration Panel
 */

import React, { useState, useEffect } from 'react';
import { api } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  CheckCircle,
  Layers,
  Building2,
  Users,
  RotateCcw,
  Check,
  Plus,
  RefreshCw,
  Search,
  FileText,
  UserCheck,
  AlertTriangle,
  Calendar,
  Mail,
  Pencil,
  UserPlus
} from 'lucide-react';
import CustomFormBuilder from './CustomFormBuilder';
import CustomSelect from '../components/CustomSelect';
import Pagination from '../components/Pagination';

import { useLocation, useSearchParams, useNavigate } from 'react-router-dom';

export default function AdminDashboard({ defaultTab = 'dashboard' }) {
  const { currentUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Tab synced with route pathname or search param
  const getInitialTab = () => {
    if (location.pathname.includes('/reviews')) return 'hierarchy';
    if (location.pathname.includes('/offices')) return 'offices';
    if (location.pathname.includes('/catalog')) return 'templates';
    if (location.pathname.includes('/role-requests')) return 'roleRequests';
    if (location.pathname.includes('/users')) return 'users';
    return searchParams.get('tab') || defaultTab || 'dashboard';
  };

  const activeTab = getInitialTab();
  const [pendingHierarchyForms, setPendingHierarchyForms] = useState([]);
  const [allForms, setAllForms] = useState([]);
  const [offices, setOffices] = useState([]);
  const [users, setUsers] = useState([]);
  const [roleRequests, setRoleRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Office assignment dialog state
  const [selectedOffice, setSelectedOffice] = useState(null);
  const [assignmentMode, setAssignmentMode] = useState('permanent'); // 'permanent' | 'temporary'
  const [targetUserId, setTargetUserId] = useState('');
  const [tempEndDate, setTempEndDate] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  // Hierarchy return dialog state
  const [returnTemplateTarget, setReturnTemplateTarget] = useState(null);
  const [hierarchyReturnComment, setHierarchyReturnComment] = useState('');

  // Create form modal
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Create Office form state
  const [newOfficeName, setNewOfficeName] = useState('');
  const [newOfficeDept, setNewOfficeDept] = useState('Computer Science & Engineering');
  const [newOfficeEmail, setNewOfficeEmail] = useState('');
  const [isCreatingOffice, setIsCreatingOffice] = useState(false);
  const [officeCreateError, setOfficeCreateError] = useState('');

  // Edit Office Modal state
  const [editingOffice, setEditingOffice] = useState(null);
  const [editOfficeName, setEditOfficeName] = useState('');
  const [editOfficeDept, setEditOfficeDept] = useState('');
  const [editOfficeEmail, setEditOfficeEmail] = useState('');
  const [isSavingOfficeEdit, setIsSavingOfficeEdit] = useState(false);

  // User Directory filter & search state
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userFilterRole, setUserFilterRole] = useState('ALL');
  const [userPage, setUserPage] = useState(1);
  const usersPerPage = 8;

  // Role request review state
  const [roleDecisionTarget, setRoleDecisionTarget] = useState(null);
  const [roleDecisionAction, setRoleDecisionAction] = useState('reject');
  const [roleDecisionComment, setRoleDecisionComment] = useState('');
  const [roleDecisionRole, setRoleDecisionRole] = useState('Approver');
  const [roleDecisionOfficeId, setRoleDecisionOfficeId] = useState('');
  const [roleRequestPage, setRoleRequestPage] = useState(1);
  const roleRequestsPerPage = 6;
  const [isDecidingRoleRequest, setIsDecidingRoleRequest] = useState(false);

  // Add User & Assign Title Modal state
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPosition, setNewUserPosition] = useState('');
  const [newUserRole, setNewUserRole] = useState('Approver');
  const [newUserOfficeId, setNewUserOfficeId] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('Lnmiit@2026');
  const [newUserSetAsInCharge, setNewUserSetAsInCharge] = useState(true);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [userAddError, setUserAddError] = useState('');

  // Edit User Modal state
  const [editingUser, setEditingUser] = useState(null);
  const [editUserName, setEditUserName] = useState('');
  const [editUserPosition, setEditUserPosition] = useState('');
  const [editUserRole, setEditUserRole] = useState('Approver');
  const [editUserOfficeId, setEditUserOfficeId] = useState('');
  const [editUserSetAsInCharge, setEditUserSetAsInCharge] = useState(false);
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);
  const [userUpdateError, setUserUpdateError] = useState('');

  useEffect(() => {
    loadAdminData();
  }, [currentUser]);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [pendingRes, allFormsRes, officesRes, usersRes, roleRequestsRes] = await Promise.all([
        api.getPendingHierarchyForms(),
        api.getAllForms(),
        api.getAllOffices(),
        api.getUsers(),
        api.getRoleUpgradeRequests()
      ]);

      if (pendingRes.success) setPendingHierarchyForms(pendingRes.formTemplates || []);
      if (allFormsRes.success) setAllForms(allFormsRes.formTemplates || []);
      if (officesRes.success) setOffices(officesRes.offices || []);
      if (usersRes.success) setUsers(usersRes.users || []);
      if (roleRequestsRes.success) setRoleRequests(roleRequestsRes.requests || []);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleDecision = async (request, decision, reviewerComment = '') => {
    try {
      setIsDecidingRoleRequest(true);
      await api.decideRoleUpgradeRequest(request.requestId, {
        decision,
        reviewerComment,
        assignedRole: roleDecisionRole,
        assignedOfficeId: roleDecisionRole === 'Approver' ? roleDecisionOfficeId : null,
      });
      setRoleDecisionTarget(null);
      setRoleDecisionComment('');
      await loadAdminData();
    } catch (err) {
      setModal({
        isOpen: true,
        type: 'alert',
        title: 'Role Request Error',
        message: err.message || 'Could not process this role request.'
      });
    } finally {
      setIsDecidingRoleRequest(false);
    }
  };

  // Modal state
  const [modal, setModal] = useState(null);
  const closeModal = () => setModal(null);

  const handleApproveHierarchy = (tmpl) => {
    setModal({
      isOpen: true,
      type: 'confirm',
      title: 'Approve Workflow',
      message: `Approve workflow hierarchy for "${tmpl.formName}"? This will activate the form campus-wide.`,
      onConfirm: async () => {
        try {
          await api.approveHierarchy(tmpl.templateId);
          await loadAdminData();
        } catch (err) {
          setModal({
            isOpen: true,
            type: 'alert',
            title: 'Approval Failed',
            message: err.message || 'Could not approve hierarchy.'
          });
        }
      }
    });
  };

  const handleReturnHierarchy = async (e) => {
    e.preventDefault();
    if (!returnTemplateTarget || !hierarchyReturnComment.trim()) return;

    try {
      await api.returnHierarchy(returnTemplateTarget.templateId, hierarchyReturnComment.trim());
      setReturnTemplateTarget(null);
      setHierarchyReturnComment('');
      await loadAdminData();
    } catch (err) {
      setModal({
        isOpen: true,
        type: 'alert',
        title: 'Return Failed',
        message: err.message || 'Could not return hierarchy.'
      });
    }
  };

  const handleAssignInCharge = async (e) => {
    e.preventDefault();
    if (!selectedOffice || !targetUserId) return;

    if (assignmentMode === 'temporary' && !tempEndDate) {
      setModal({
        isOpen: true,
        type: 'alert',
        title: 'Missing Date',
        message: 'Please select cover expiration date for temporary in-charge.'
      });
      return;
    }

    setIsAssigning(true);
    try {
      if (assignmentMode === 'permanent') {
        await api.updatePermanentInCharge(selectedOffice.officeId, targetUserId);
      } else {
        await api.assignTemporaryInCharge(selectedOffice.officeId, targetUserId, tempEndDate);
      }
      setSelectedOffice(null);
      setTargetUserId('');
      setTempEndDate('');
      await loadAdminData();
    } catch (err) {
      setModal({
        isOpen: true,
        type: 'alert',
        title: 'Assignment Error',
        message: err.message || 'Could not update office in-charge.'
      });
    } finally {
      setIsAssigning(false);
    }
  };

  const handleClearTempCover = (officeId) => {
    setModal({
      isOpen: true,
      type: 'confirm',
      title: 'Revoke Temporary Cover',
      message: 'Revoke temporary cover and return signing authority to the permanent in-charge?',
      onConfirm: async () => {
        try {
          await api.clearTemporaryInCharge(officeId);
          await loadAdminData();
        } catch (err) {
          setModal({
            isOpen: true,
            type: 'alert',
            title: 'Revoke Error',
            message: err.message || 'Could not clear temporary cover.'
          });
        }
      }
    });
  };

  const handleToggleUserStatus = (user) => {
    const newStatus = !user.accountStatus;
    const actionName = newStatus ? 'activate' : 'deactivate';
    setModal({
      isOpen: true,
      type: 'confirm',
      title: `${newStatus ? 'Activate' : 'Deactivate'} User`,
      message: `Are you sure you want to ${actionName} access for ${user.name} (${user.institutionalEmail})?`,
      onConfirm: async () => {
        try {
          await api.toggleUserStatus(user.userId);
          await loadAdminData();
        } catch (err) {
          setModal({
            isOpen: true,
            type: 'alert',
            title: 'Status Update Error',
            message: err.message || 'Could not update user status.'
          });
        }
      }
    });
  };

  const handleCreateOffice = async (e) => {
    e.preventDefault();
    if (!newOfficeName.trim()) return;
    setIsCreatingOffice(true);
    setOfficeCreateError('');
    try {
      const res = await api.createOffice({
        officeName: newOfficeName.trim(),
        department: newOfficeDept.trim(),
        officeEmail: newOfficeEmail.trim()
      });
      if (res.success) {
        setNewOfficeName('');
        setNewOfficeEmail('');
        await loadAdminData();
      }
    } catch (err) {
      setOfficeCreateError(err.message || 'Failed to create office.');
    } finally {
      setIsCreatingOffice(false);
    }
  };

  const handleSaveOfficeEdit = async (e) => {
    e.preventDefault();
    if (!editingOffice || !editOfficeName.trim()) return;
    setIsSavingOfficeEdit(true);
    try {
      await api.updateOfficeDetails(editingOffice.officeId, {
        officeName: editOfficeName.trim(),
        department: editOfficeDept.trim(),
        officeEmail: editOfficeEmail.trim()
      });
      setEditingOffice(null);
      await loadAdminData();
    } catch (err) {
      setModal({
        isOpen: true,
        type: 'alert',
        title: 'Update Error',
        message: err.message || 'Could not update office details.'
      });
    } finally {
      setIsSavingOfficeEdit(false);
    }
  };

  const handleDeleteOffice = (office) => {
    setModal({
      isOpen: true,
      type: 'confirm',
      title: 'Delete Office',
      message: `Are you sure you want to delete "${office.officeName}"? This cannot be undone. Active documents routed through this office will block deletion.`,
      onConfirm: async () => {
        try {
          await api.deleteOffice(office.officeId);
          await loadAdminData();
        } catch (err) {
          setModal({
            isOpen: true,
            type: 'alert',
            title: 'Delete Failed',
            message: err.message || 'Could not delete this office.'
          });
        }
      }
    });
  };

  const handleToggleFormStatus = async (templateId) => {
    try {
      await api.toggleFormActive(templateId);
      await loadAdminData();
    } catch (err) {
      setModal({
        isOpen: true,
        type: 'alert',
        title: 'Form Status Error',
        message: err.message || 'Could not toggle form active state.'
      });
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) {
      setUserAddError('Please provide both full name and institutional email.');
      return;
    }
    setIsAddingUser(true);
    setUserAddError('');
    try {
      const res = await api.createUser({
        name: newUserName.trim(),
        institutionalEmail: newUserEmail.trim(),
        position: newUserPosition.trim(),
        systemRole: newUserRole,
        officeId: newUserOfficeId,
        password: newUserPassword.trim() || 'Lnmiit@2026',
        setAsInCharge: newUserSetAsInCharge
      });
      if (res.success) {
        setShowAddUserModal(false);
        setNewUserName('');
        setNewUserEmail('');
        setNewUserPosition('');
        setNewUserRole('Approver');
        setNewUserOfficeId('');
        setNewUserPassword('Lnmiit@2026');
        setNewUserSetAsInCharge(true);
        await loadAdminData();
        setModal({
          isOpen: true,
          type: 'alert',
          title: 'User & Title Registered',
          message: `${res.message} The user can now access their review dashboard and institutional workflows.`
        });
      }
    } catch (err) {
      setUserAddError(err.message || 'Failed to create user.');
    } finally {
      setIsAddingUser(false);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsUpdatingUser(true);
    setUserUpdateError('');
    try {
      const res = await api.updateUser(editingUser.userId, {
        name: editUserName.trim(),
        position: editUserPosition.trim(),
        systemRole: editUserRole,
        officeId: editUserOfficeId,
        setAsInCharge: editUserSetAsInCharge
      });
      if (res.success) {
        setEditingUser(null);
        await loadAdminData();
      }
    } catch (err) {
      setUserUpdateError(err.message || 'Failed to update user.');
    } finally {
      setIsUpdatingUser(false);
    }
  };

  const filteredUsers = users.filter(u => {
    const q = userSearchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.institutionalEmail && u.institutionalEmail.toLowerCase().includes(q)) ||
      (u.userId && u.userId.toLowerCase().includes(q)) ||
      (u.position && u.position.toLowerCase().includes(q));
    const matchesRole = userFilterRole === 'ALL' || u.systemRole === userFilterRole;
    return matchesSearch && matchesRole;
  });
  const paginatedUsers = filteredUsers.slice((userPage - 1) * usersPerPage, userPage * usersPerPage);
  const paginatedRoleRequests = roleRequests.slice((roleRequestPage - 1) * roleRequestsPerPage, roleRequestPage * roleRequestsPerPage);

  return (
    <div className="max-w-7xl mx-auto py-2">
      {/* --- GLOBAL MODAL --- */}
      {modal && modal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl max-w-md w-full p-8">
            <h3 className={`text-2xl font-black uppercase tracking-tighter mb-2 ${modal.title.includes('Error') || modal.title.includes('Failed') ? 'text-red-600' : 'text-gray-900'}`}>
              {modal.title}
            </h3>
            <p className="text-sm font-bold text-gray-500 mb-6 leading-relaxed">{modal.message}</p>

            <div className="flex gap-3 justify-end">
              {modal.type === 'confirm' && (
                <button onClick={closeModal} className="px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all cursor-pointer">
                  Cancel
                </button>
              )}
              <button
                onClick={() => {
                  if (modal.onConfirm) modal.onConfirm();
                  closeModal();
                }}
                className="px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest text-white shadow-xl bg-[#005a9c] hover:bg-blue-800 transition-all active:scale-95 cursor-pointer"
              >
                {modal.type === 'alert' ? 'Okay' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- HERO BANNER --- */}
      <div className="rounded-[2rem] sm:rounded-[2.5rem] bg-[#005a9c] p-6 sm:p-8 mb-8 text-white flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center shrink-0 border border-white/20">
            <ShieldCheck size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight uppercase">Administration Panel</h1>
            <p className="text-blue-100 text-xs font-bold uppercase tracking-widest mt-1">
              Institutional Hierarchy, Form Catalog & Authority Governance
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {activeTab === 'users' ? (
            <button
              onClick={() => {
                setUserAddError('');
                setShowAddUserModal(true);
              }}
              className="bg-white text-[#005a9c] hover:bg-gray-100 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              <UserPlus size={16} /> Add User & Title
            </button>
          ) : activeTab === 'offices' ? (
            <button
              onClick={() => {
                const el = document.getElementById('create-office-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-white text-[#005a9c] hover:bg-gray-100 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus size={16} /> Add New Office
            </button>
          ) : activeTab === 'roleRequests' ? null : (
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-white text-[#005a9c] hover:bg-gray-100 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus size={16} /> Create Form Template
            </button>
          )}
          <button
            onClick={loadAdminData}
            className="bg-white/10 hover:bg-white/20 text-white border border-white/20 p-3 rounded-2xl transition-all cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>


      {/* --- SECTION TITLE (Dynamic based on active route) --- */}
      <div className="mb-6">
        <h2 className="text-xl font-black uppercase tracking-tight text-gray-800">
          {activeTab === 'dashboard' && 'Administration Overview'}
          {activeTab === 'hierarchy' && 'Workflow Reviews'}
          {activeTab === 'offices' && 'Offices & In-Charges'}
          {activeTab === 'templates' && 'Form Catalog'}
          {activeTab === 'roleRequests' && 'Role Upgrade Requests'}
          {activeTab === 'users' && 'User Directory'}
        </h2>
      </div>

      {/* --- CONTENT AREA --- */}
      {loading ? (
        <div className="bg-white rounded-[2rem] p-12 text-center border border-gray-100 shadow-sm">
          <div className="inline-block w-8 h-8 border-3 border-gray-200 border-t-[#005a9c] rounded-full animate-spin mb-3"></div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Loading administration data...</p>
        </div>
      ) : activeTab === 'dashboard' ? (
        /* DASHBOARD OVERVIEW */
        <div className="space-y-8">
          {/* 4 KPI METRIC CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* 1. Pending Reviews */}
            <div
              onClick={() => navigate('/admin/reviews')}
              className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="w-11 h-11 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center font-bold">
                  <ShieldCheck size={22} />
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider text-orange-600 bg-orange-100/60 px-2.5 py-1 rounded-full">
                  Action Required
                </span>
              </div>
              <h3 className="text-3xl font-black text-gray-900 group-hover:text-[#005a9c] transition-colors">
                {pendingHierarchyForms.length}
              </h3>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-1">
                Pending Reviews
              </p>
              <p className="text-[11px] text-gray-400 mt-2 font-semibold">
                Custom forms awaiting hierarchy verification
              </p>
            </div>

            {/* 2. Institutional Offices */}
            <div
              onClick={() => navigate('/admin/offices')}
              className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="w-11 h-11 bg-blue-50 text-[#005a9c] rounded-2xl flex items-center justify-center font-bold">
                  <Building2 size={22} />
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 bg-blue-100/60 px-2.5 py-1 rounded-full">
                  Offices
                </span>
              </div>
              <h3 className="text-3xl font-black text-gray-900 group-hover:text-[#005a9c] transition-colors">
                {offices.length}
              </h3>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-1">
                Offices & In-Charges
              </p>
              <p className="text-[11px] text-gray-400 mt-2 font-semibold">
                {offices.filter(o => o.temporaryInCharge && o.temporaryEndDate).length} on temporary cover
              </p>
            </div>

            {/* 3. Form Catalog */}
            <div
              onClick={() => navigate('/admin/catalog')}
              className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="w-11 h-11 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center font-bold">
                  <FileText size={22} />
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 bg-purple-100/60 px-2.5 py-1 rounded-full">
                  Catalog
                </span>
              </div>
              <h3 className="text-3xl font-black text-gray-900 group-hover:text-[#005a9c] transition-colors">
                {allForms.filter(f => (f.activeStatus ?? f.isActive)).length} / {allForms.length}
              </h3>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-1">
                Active Form Catalog
              </p>
              <p className="text-[11px] text-gray-400 mt-2 font-semibold">
                Available for campus-wide submissions
              </p>
            </div>

            {/* 4. User Accounts */}
            <div
              onClick={() => navigate('/admin/users')}
              className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="w-11 h-11 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center font-bold">
                  <Users size={22} />
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-100/60 px-2.5 py-1 rounded-full">
                  Directory
                </span>
              </div>
              <h3 className="text-3xl font-black text-gray-900 group-hover:text-[#005a9c] transition-colors">
                {users.length}
              </h3>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-1">
                Registered Users
              </p>
              <p className="text-[11px] text-gray-400 mt-2 font-semibold">
                Institutional directory members
              </p>
            </div>
          </div>

          {/* TWO SUMMARY PANELS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Panel 1: Pending Form Hierarchy Reviews */}
            <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={18} className="text-[#005a9c]" />
                  <h4 className="text-sm font-black uppercase tracking-wider text-gray-800">
                    Pending Hierarchy Reviews
                  </h4>
                </div>
                <button
                  onClick={() => navigate('/admin/reviews')}
                  className="text-xs font-bold text-[#005a9c] hover:underline cursor-pointer"
                >
                  View All ({pendingHierarchyForms.length})
                </button>
              </div>

              {pendingHierarchyForms.length === 0 ? (
                <div className="text-center py-10">
                  <CheckCircle size={36} className="text-green-500 mx-auto mb-2" />
                  <p className="text-xs font-bold text-gray-700">All Form Hierarchies Approved</p>
                  <p className="text-[11px] text-gray-400 mt-1">No custom forms awaiting audit at this time.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingHierarchyForms.slice(0, 3).map(tmpl => (
                    <button
                      key={tmpl.templateId}
                      type="button"
                      onClick={() => navigate('/admin/reviews')}
                      className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between text-left hover:bg-blue-50 hover:border-blue-100 transition-all cursor-pointer"
                      aria-label={`Review details for ${tmpl.formName}`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-bold text-[#005a9c] bg-white px-2 py-0.5 rounded-lg border border-gray-200">
                            {tmpl.templateId}
                          </span>
                          <span className="font-bold text-gray-900 text-xs">{tmpl.formName}</span>
                        </div>
                        <p className="text-[11px] text-gray-400 font-semibold mt-1">
                          {tmpl.department} • {tmpl.blueprintStages?.length || 0} Approval Stages
                        </p>
                      </div>
                      <span className="text-[11px] font-black uppercase tracking-wider text-[#005a9c] shrink-0 ml-4">Review details →</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Panel 2: Institutional Offices Overview */}
            <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Building2 size={18} className="text-[#005a9c]" />
                  <h4 className="text-sm font-black uppercase tracking-wider text-gray-800">
                    Institutional Offices
                  </h4>
                </div>
                <button
                  onClick={() => navigate('/admin/offices')}
                  className="text-xs font-bold text-[#005a9c] hover:underline cursor-pointer"
                >
                  Manage ({offices.length})
                </button>
              </div>

              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {offices.map(o => (
                  <div key={o.officeId} className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-gray-900 block">{o.officeName}</span>
                      <span className="text-[10px] text-gray-400 font-semibold">{o.department}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-[#005a9c] block">
                        {o.currentInChargeName || o.permanentInChargeName || 'Unassigned'}
                      </span>
                      {o.temporaryInCharge && o.temporaryEndDate && (
                        <span className="text-[9px] font-black uppercase text-amber-700 bg-amber-100/60 px-2 py-0.5 rounded-full">
                          Temp Cover
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'hierarchy' ? (
        /* TAB 1: PENDING HIERARCHY REVIEWS */
        pendingHierarchyForms.length === 0 ? (
          <div className="bg-white rounded-[2.5rem] p-12 text-center border border-gray-100 shadow-sm max-w-xl mx-auto my-6">
            <div className="w-16 h-16 bg-green-50 text-green-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={30} />
            </div>
            <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">No Pending Reviews</h3>
            <p className="text-xs font-bold text-gray-400 mt-2">
              All proposed custom form hierarchies have been verified and activated.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingHierarchyForms.map(tmpl => (
              <div key={tmpl.templateId} className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-[#005a9c] bg-blue-50 px-2.5 py-0.5 rounded-lg">
                        {tmpl.templateId}
                      </span>
                      <h3 className="text-base font-black text-gray-900">{tmpl.formName}</h3>
                      <span className="px-2.5 py-0.5 bg-orange-100 text-orange-800 rounded-full font-black text-[10px] uppercase">
                        Pending Verification
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 font-medium">{tmpl.description || 'No description provided.'}</p>
                    <div className="text-[11px] text-gray-400 mt-1 font-semibold">
                      Proposed by: <span className="font-bold text-gray-700">{tmpl.createdBy}</span> • Department: {tmpl.department}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setReturnTemplateTarget(tmpl)}
                      className="bg-orange-50 hover:bg-orange-600 hover:text-white text-orange-600 border border-orange-200 px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <RotateCcw size={14} /> Return for Correction
                    </button>
                    <button
                      onClick={() => handleApproveHierarchy(tmpl)}
                      className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
                    >
                      <Check size={14} /> Approve Hierarchy
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100 text-xs">
                  <div>
                    <h5 className="font-black text-gray-700 uppercase text-[10px] tracking-widest mb-2">
                      Routing Sequence ({tmpl.blueprintStages?.length || 0} Stages):
                    </h5>
                    <div className="space-y-1.5">
                      {(tmpl.blueprintStages || []).map((stg, sIdx) => (
                        <div key={stg.stageId || sIdx} className="p-2.5 bg-gray-50 border border-gray-200/60 rounded-xl flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-[#005a9c] text-white flex items-center justify-center font-bold text-[10px]">
                            {stg.stageOrder}
                          </span>
                          <span className="font-bold text-gray-800">{stg.assignedOfficeName}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h5 className="font-black text-gray-700 uppercase text-[10px] tracking-widest mb-2">
                      Application Fields ({tmpl.fields?.length || 0}):
                    </h5>
                    <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                      {(tmpl.fields || []).map(fld => (
                        <div key={fld.fieldId} className="p-2 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between">
                          <span className="font-bold text-gray-800">{fld.fieldName}</span>
                          <span className="text-[10px] text-gray-400 uppercase font-semibold">
                            {fld.fieldType} {fld.isRequired ? '• Required' : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : activeTab === 'offices' ? (
        /* TAB 2: OFFICES & IN-CHARGES */
        <div className="space-y-6">
          {/* Create New Office Panel */}
          <div id="create-office-section" className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-blue-50 text-[#005a9c] rounded-xl flex items-center justify-center">
                <Plus size={16} />
              </div>
              <div>
                <h4 className="text-sm font-black uppercase tracking-wider text-gray-800">Create New Institutional Office / Title</h4>
                <p className="text-[11px] text-gray-400 font-semibold">New offices appear immediately in the form builder approval hierarchy dropdown</p>
              </div>
            </div>
            <form onSubmit={handleCreateOffice} className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3 items-end">
              <div className="lg:col-span-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1.5">Office / Title Name *</label>
                <input
                  type="text"
                  value={newOfficeName}
                  onChange={(e) => setNewOfficeName(e.target.value)}
                  placeholder="e.g., HOD Office - CSE, Library Office..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#005a9c] bg-gray-50 focus:bg-white text-xs font-bold transition-all outline-none"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1.5">Institutional Role Email</label>
                <input
                  type="text"
                  value={newOfficeEmail}
                  onChange={(e) => setNewOfficeEmail(e.target.value)}
                  placeholder="e.g., csehod@lnmiit.ac.in"
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#005a9c] bg-gray-50 focus:bg-white text-xs font-mono font-bold transition-all outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1.5">Department *</label>
                <select
                  value={newOfficeDept}
                  onChange={(e) => setNewOfficeDept(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#005a9c] bg-gray-50 focus:bg-white text-xs font-bold transition-all outline-none"
                >
                  <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                  <option value="Electronics & Communication Engineering">Electronics & Communication Engineering</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                  <option value="Academic Affairs">Academic Affairs</option>
                  <option value="Student Affairs">Student Affairs</option>
                  <option value="Finance & Accounts">Finance & Accounts</option>
                  <option value="Hostel Administration">Hostel Administration</option>
                  <option value="Library">Library</option>
                  <option value="Sports & Cultural">Sports & Cultural</option>
                  <option value="General Administration">General Administration</option>
                  <option value="Research & Development">Research & Development</option>
                </select>
              </div>
              <div className="sm:col-span-3 lg:col-span-4 flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isCreatingOffice || !newOfficeName.trim()}
                  className="bg-[#005a9c] hover:bg-blue-800 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2 shrink-0 shadow-md"
                >
                  <Plus size={14} />
                  {isCreatingOffice ? 'Creating...' : 'Add Office & Associate Email'}
                </button>
              </div>
            </form>
            {officeCreateError && (
              <p className="mt-3 text-xs font-bold text-red-600 bg-red-50 px-4 py-2.5 rounded-xl">{officeCreateError}</p>
            )}
          </div>

          {/* Existing Offices Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {offices.map(office => {
              const hasTempCover = Boolean(office.temporaryInCharge && office.temporaryEndDate);
              const inChargeDisplayName = office.currentInChargeName || office.permanentInChargeName || 'Unassigned';

              return (
                <div key={office.officeId} className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-mono text-xs font-bold text-[#005a9c] bg-blue-50 px-2.5 py-0.5 rounded-lg">
                        {office.officeId}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {hasTempCover ? (
                          <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 rounded-full font-black text-[10px] uppercase">
                            Temp Cover
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 bg-green-100 text-green-800 rounded-full font-black text-[10px] uppercase">
                            Permanent
                          </span>
                        )}
                        <button
                          onClick={() => {
                            setEditingOffice(office);
                            setEditOfficeName(office.officeName);
                            setEditOfficeDept(office.department);
                            setEditOfficeEmail(office.officeEmail || '');
                          }}
                          className="p-1.5 text-gray-400 hover:text-[#005a9c] hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                          title="Edit office title and email"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => handleDeleteOffice(office)}
                          className="p-1.5 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                          title="Delete this office"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                        </button>
                      </div>
                    </div>

                    <h3 className="text-base font-black text-gray-900 mb-0.5">{office.officeName}</h3>
                    <p className="text-xs text-gray-400 mb-2.5 font-semibold">{office.department}</p>

                    {/* Associated Role Email Pill */}
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50/70 border border-blue-100 rounded-xl mb-3 text-xs font-mono font-bold text-[#005a9c]">
                      <Mail size={12} className="shrink-0 text-[#005a9c]" />
                      <span className="truncate">{office.officeEmail || `${office.officeName.toLowerCase().replace(/[^a-z0-9]/g, '')}@lnmiit.ac.in`}</span>
                    </div>

                    <div className="space-y-3 p-4 bg-gray-50 rounded-2xl border border-gray-100 text-xs">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-0.5">
                          Permanent In-Charge
                        </span>
                        <span className="font-bold text-gray-900 flex items-center gap-1.5">
                          <UserCheck size={14} className="text-[#005a9c]" /> {inChargeDisplayName}
                        </span>
                      </div>

                      {hasTempCover && (
                        <div className="pt-2 border-t border-gray-200">
                          <span className="text-[10px] font-black uppercase tracking-widest text-amber-700 block mb-0.5">
                            Active Temporary Cover
                          </span>
                          <span className="font-bold text-amber-900 flex items-center gap-1.5">
                            <Users size={14} /> {office.temporaryInChargeName}
                          </span>
                          <span className="text-[10px] text-gray-400 block mt-0.5 font-semibold">
                            Until {new Date(office.temporaryEndDate || office.temporaryCoverEndDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-5 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => {
                        setSelectedOffice(office);
                        setAssignmentMode('permanent');
                        setTargetUserId(office.currentInCharge || office.permanentInChargeUserId || '');
                      }}
                      className="flex-1 bg-gray-100 hover:bg-[#005a9c] hover:text-white text-gray-700 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer text-center"
                    >
                      Change In-Charge
                    </button>

                    {hasTempCover ? (
                      <button
                        onClick={() => handleClearTempCover(office.officeId)}
                        className="bg-red-50 hover:bg-red-600 hover:text-white text-red-600 border border-red-200 px-3 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
                        title="Revoke Temporary Cover"
                      >
                        Revoke
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedOffice(office);
                          setAssignmentMode('temporary');
                          setTargetUserId('');
                        }}
                        className="bg-amber-50 hover:bg-amber-600 hover:text-white text-amber-700 border border-amber-200 px-3 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
                        title="Assign Temporary Cover"
                      >
                        Temp Cover
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : activeTab === 'templates' ? (
        /* TAB 3: FORM CATALOG */
        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-400 bg-gray-50/70">
                  <th className="py-4 px-6">Template ID</th>
                  <th className="py-4 px-6">Form Name</th>
                  <th className="py-4 px-6">Department</th>
                  <th className="py-4 px-6">Stages</th>
                  <th className="py-4 px-6">Type</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {allForms.map(tmpl => {
                  const isFormActive = Boolean(tmpl.activeStatus ?? tmpl.isActive);
                  return (
                    <tr key={tmpl.templateId} className="hover:bg-blue-50/30">
                      <td className="py-4 px-6 font-mono font-bold text-[#005a9c]">
                        {tmpl.templateId}
                      </td>
                      <td className="py-4 px-6 font-bold text-gray-900">{tmpl.formName}</td>
                      <td className="py-4 px-6 text-gray-600 font-medium">{tmpl.department}</td>
                      <td className="py-4 px-6 font-bold text-gray-700">
                        {tmpl.blueprintStages?.length || 0} Stages
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                          tmpl.isCustomProposal ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {tmpl.isCustomProposal ? 'Custom' : 'Standard'}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                          isFormActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {isFormActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => handleToggleFormStatus(tmpl.templateId)}
                          className={`px-3 py-1.5 rounded-xl font-bold text-[11px] uppercase tracking-wider transition-all cursor-pointer ${
                            isFormActive
                              ? 'bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border border-red-200'
                              : 'bg-green-50 text-green-700 hover:bg-green-600 hover:text-white border border-green-200'
                          }`}
                        >
                          {isFormActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'roleRequests' ? (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-100 rounded-[2rem] p-5 text-xs text-blue-900">
            <p className="font-black uppercase tracking-wider mb-1">Review institutional access requests</p>
            <p className="font-semibold">Verify the applicant’s institutional details and justification before assigning a role. Approval updates the account immediately; the applicant must sign in again to refresh the session.</p>
          </div>
          {roleRequests.length === 0 ? (
            <div className="bg-white rounded-[2rem] p-12 text-center border border-gray-100 shadow-sm">
              <UserCheck size={32} className="mx-auto text-gray-300 mb-3" />
              <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">No Role Requests</h3>
              <p className="text-xs font-bold text-gray-400 mt-2">New teacher and staff requests will appear here after institutional verification.</p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {paginatedRoleRequests.map(request => (
                  <article key={request.requestId} className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-5 sm:p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="text-base font-black text-gray-900">{request.requesterName}</h3>
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${request.status === 'Pending' ? 'bg-amber-100 text-amber-800' : request.status === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{request.status}</span>
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-purple-50 text-purple-700 border border-purple-100">{request.requestedRole}</span>
                      </div>
                      <p className="text-xs font-mono text-gray-500 break-all">{request.requesterEmail}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 text-xs">
                        <div><span className="block text-[10px] font-black uppercase tracking-widest text-gray-400">Requested Office</span><span className="font-bold text-gray-800">{offices.find(o => o.officeId === request.requestedOfficeId)?.officeName || 'Not specified'}</span></div>
                      </div>
                      <div className="mt-4 p-3 bg-gray-50 border border-gray-100 rounded-xl">
                        <span className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Applicant justification</span>
                        <p className="text-xs font-semibold text-gray-700 whitespace-pre-wrap">{request.justification}</p>
                      </div>
                      {request.reviewerComment && <p className="mt-3 text-xs font-semibold text-gray-500"><span className="font-black">Reviewer note:</span> {request.reviewerComment}</p>}
                    </div>
                    {request.status === 'Pending' && (
                      <div className="flex lg:flex-col gap-2 shrink-0">
                        <button onClick={() => { setRoleDecisionTarget(request); setRoleDecisionAction('approve'); setRoleDecisionRole(request.requestedRole || 'Approver'); setRoleDecisionOfficeId(request.requestedOfficeId || ''); setRoleDecisionComment(''); }} disabled={isDecidingRoleRequest} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50">Review & Assign</button>
                        <button onClick={() => { setRoleDecisionTarget(request); setRoleDecisionAction('reject'); setRoleDecisionComment(''); }} disabled={isDecidingRoleRequest} className="bg-red-50 hover:bg-red-600 hover:text-white text-red-600 border border-red-200 px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50">Reject</button>
                      </div>
                    )}
                  </div>
                  </article>
                ))}
              </div>
              <Pagination currentPage={roleRequestPage} totalItems={roleRequests.length} itemsPerPage={roleRequestsPerPage} onPageChange={setRoleRequestPage} />
              <div className="h-4" />
            </>
          )}
        </div>
      ) : (
        /* TAB 4: USER DIRECTORY */
        <div className="space-y-4">
          {/* Controls Bar: Search, Role Filter, and Add User Button */}
          <div className="bg-white rounded-[2rem] p-4 sm:p-5 border border-gray-100 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="flex-1 flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={userSearchQuery}
                  onChange={(e) => { setUserSearchQuery(e.target.value); setUserPage(1); }}
                  placeholder="Search by name, email, roll no, or title..."
                  className="w-full pl-9 pr-4 py-2.5 text-xs font-semibold bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#005a9c] outline-none transition-all"
                />
              </div>

              <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl border border-gray-200 shrink-0">
                {['ALL', 'Approver', 'Submitter', 'Administrator'].map(role => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => { setUserFilterRole(role); setUserPage(1); }}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      userFilterRole === role
                        ? 'bg-[#005a9c] text-white shadow-sm'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    {role === 'ALL' ? 'All Roles' : role}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                setUserAddError('');
                setShowAddUserModal(true);
              }}
              className="bg-[#005a9c] hover:bg-blue-800 text-white px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <UserPlus size={15} /> Add User & Title
            </button>
          </div>

          {/* User Table */}
          <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-400 bg-gray-50/70">
                    <th className="py-4 px-6">User ID</th>
                    <th className="py-4 px-6">Full Name</th>
                    <th className="py-4 px-6">Institutional Email</th>
                    <th className="py-4 px-6">Role</th>
                    <th className="py-4 px-6">Designation & Office</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedUsers.map(u => {
                      const userOffice = offices.find(o => o.officeId === u.officeId || o.currentInCharge === u.userId);
                      return (
                        <tr key={u.userId} className="hover:bg-blue-50/30 transition-colors">
                          <td className="py-4 px-6 font-mono font-bold text-[#005a9c]">
                            {u.userId}
                          </td>
                          <td className="py-4 px-6 font-bold text-gray-900">{u.name}</td>
                          <td className="py-4 px-6 font-medium text-gray-600">
                            <div className="flex items-center gap-1.5 font-mono text-[11px]">
                              <Mail size={12} className="text-gray-400 shrink-0" />
                              <span>{u.institutionalEmail}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                              u.systemRole === 'Approver'
                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                : u.systemRole === 'Administrator'
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-blue-50 text-blue-700 border-blue-200'
                            }`}>
                              {u.systemRole}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <span className="font-bold text-gray-800 block text-xs">
                              {u.position || '—'}
                            </span>
                            {userOffice && (
                              <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold rounded-md">
                                <Building2 size={10} className="text-[#005a9c]" />
                                {userOffice.officeName}
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-6">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                              u.accountStatus ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {u.accountStatus ? 'Active' : 'Suspended'}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setEditingUser(u);
                                  setEditUserName(u.name || '');
                                  setEditUserPosition(u.position || '');
                                  setEditUserRole(u.systemRole || 'Approver');
                                  setEditUserOfficeId(u.officeId || '');
                                  setEditUserSetAsInCharge(false);
                                  setUserUpdateError('');
                                }}
                                className="p-1.5 text-gray-400 hover:text-[#005a9c] hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                                title="Edit user title and role"
                              >
                                <Pencil size={13} />
                              </button>
                              <button
                                onClick={() => handleToggleUserStatus(u)}
                                className={`px-3 py-1.5 rounded-xl font-bold text-[11px] uppercase tracking-wider transition-all cursor-pointer ${
                                  u.accountStatus
                                    ? 'bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border border-red-200'
                                    : 'bg-green-50 text-green-700 hover:bg-green-600 hover:text-white border border-green-200'
                                }`}
                              >
                                {u.accountStatus ? 'Suspend' : 'Activate'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
            <Pagination currentPage={userPage} totalItems={filteredUsers.length} itemsPerPage={usersPerPage} onPageChange={setUserPage} />
            <div className="h-5" />
          </div>
        </div>
      )}

      {/* --- IN-CHARGE ASSIGNMENT MODAL --- */}
      {selectedOffice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl max-w-md w-full p-6 sm:p-8 border border-gray-100">
            <h3 className="text-xl font-black uppercase tracking-tight text-gray-900 mb-1">
              {assignmentMode === 'permanent' ? 'Update Permanent In-Charge' : 'Assign Temporary Cover'}
            </h3>
            <p className="text-xs font-bold text-gray-400 mb-5">
              Office: <span className="text-[#005a9c]">{selectedOffice.officeName}</span>
            </p>

            <form onSubmit={handleAssignInCharge} className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1 block mb-1.5">
                  Select Designee User *
                </label>
                <select
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#005a9c] bg-gray-50 focus:bg-white text-xs font-bold transition-all outline-none"
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  required
                >
                  <option value="">-- Choose User --</option>
                  {users.filter(u => u.accountStatus).map(u => (
                    <option key={u.userId} value={u.userId}>
                      {u.name} ({u.institutionalEmail}) - {u.position || u.systemRole}
                    </option>
                  ))}
                </select>
              </div>

              {assignmentMode === 'temporary' && (
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1 block mb-1.5">
                    Cover Expiration Date *
                  </label>
                  <input
                    type="date"
                    className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#005a9c] bg-gray-50 focus:bg-white text-xs font-bold transition-all outline-none"
                    value={tempEndDate}
                    onChange={(e) => setTempEndDate(e.target.value)}
                    required
                  />
                </div>
              )}

              <div className="flex gap-2 justify-end pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setSelectedOffice(null)}
                  className="px-5 py-3 rounded-xl font-black text-xs uppercase tracking-widest bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all cursor-pointer"
                  disabled={isAssigning}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest text-white bg-[#005a9c] hover:bg-blue-800 shadow-lg shadow-blue-900/20 transition-all cursor-pointer disabled:opacity-50"
                  disabled={isAssigning}
                >
                  {isAssigning ? 'Updating...' : 'Save Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- RETURN HIERARCHY MODAL --- */}
      {returnTemplateTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl max-w-md w-full p-6 sm:p-8 border border-gray-100">
            <h3 className="text-xl font-black uppercase tracking-tight text-gray-900 mb-1">
              Return Custom Hierarchy
            </h3>
            <p className="text-xs font-bold text-gray-400 mb-4">
              Form: <span className="text-[#005a9c]">{returnTemplateTarget.formName}</span>
            </p>

            <form onSubmit={handleReturnHierarchy} className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1 block mb-1.5">
                  Administrative Feedback / Correction Note *
                </label>
                <textarea
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#005a9c] bg-gray-50 focus:bg-white text-xs font-bold transition-all outline-none"
                  placeholder="Specify missing offices or routing adjustments needed..."
                  value={hierarchyReturnComment}
                  onChange={(e) => setHierarchyReturnComment(e.target.value)}
                  required
                />
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setReturnTemplateTarget(null)}
                  className="px-5 py-3 rounded-xl font-black text-xs uppercase tracking-widest bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest text-white bg-orange-600 hover:bg-orange-700 shadow-lg shadow-orange-600/20 transition-all cursor-pointer disabled:opacity-50"
                  disabled={!hierarchyReturnComment.trim()}
                >
                  Return to Proposer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- ROLE REQUEST REJECTION MODAL --- */}
      {roleDecisionTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl max-w-md w-full p-6 sm:p-8 border border-gray-100">
            <h3 className="text-xl font-black uppercase tracking-tight text-gray-900 mb-1">{roleDecisionAction === 'approve' ? 'Assign Institutional Role' : 'Reject Role Request'}</h3>
            <p className="text-xs font-semibold text-gray-400 mb-5">
              {roleDecisionAction === 'approve'
                ? <>Choose the final authority for <span className="text-[#005a9c] font-bold">{roleDecisionTarget.requesterName}</span>. The applicant’s request is only advisory.</>
                : <>Explain why <span className="text-[#005a9c] font-bold">{roleDecisionTarget.requesterName}</span> cannot receive {roleDecisionTarget.requestedRole} access yet.</>}
            </p>
            <form onSubmit={(e) => { e.preventDefault(); handleRoleDecision(roleDecisionTarget, roleDecisionAction === 'approve' ? 'Approved' : 'Rejected', roleDecisionComment.trim()); }} className="space-y-4">
              {roleDecisionAction === 'approve' ? (
                <>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">Final System Role *</label>
                    <select value={roleDecisionRole} onChange={(e) => setRoleDecisionRole(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-xs font-bold outline-none" required>
                      <option value="Approver">Approver / Office In-Charge</option>
                      <option value="Management">Management / Executive Oversight</option>
                    </select>
                  </div>
                  {roleDecisionRole === 'Approver' && (
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">Assigned Office *</label>
                      <select value={roleDecisionOfficeId} onChange={(e) => setRoleDecisionOfficeId(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-xs font-bold outline-none" required>
                        <option value="">-- Choose office --</option>
                        {offices.map(office => <option key={office.officeId} value={office.officeId}>{office.officeName} ({office.department})</option>)}
                      </select>
                    </div>
                  )}
                </>
              ) : (
                <textarea
                  rows={4}
                  value={roleDecisionComment}
                  onChange={(e) => setRoleDecisionComment(e.target.value)}
                  minLength={10}
                  required
                  placeholder="Provide a clear correction or verification reason..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#005a9c] bg-gray-50 focus:bg-white text-xs font-semibold outline-none"
                />
              )}
              <div className="flex gap-2 justify-end pt-3 border-t border-gray-100">
                <button type="button" onClick={() => setRoleDecisionTarget(null)} disabled={isDecidingRoleRequest} className="px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all cursor-pointer">Cancel</button>
                <button type="submit" disabled={isDecidingRoleRequest || (roleDecisionAction === 'reject' && roleDecisionComment.trim().length < 10) || (roleDecisionAction === 'approve' && roleDecisionRole === 'Approver' && !roleDecisionOfficeId)} className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest text-white transition-all cursor-pointer disabled:opacity-50 ${roleDecisionAction === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>{isDecidingRoleRequest ? 'Saving...' : roleDecisionAction === 'approve' ? 'Approve & Assign' : 'Reject Request'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT OFFICE MODAL --- */}
      {editingOffice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-[2rem] shadow-2xl max-w-md w-full p-6 sm:p-8 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight text-gray-900">
                  Edit Institutional Office
                </h3>
                <span className="text-[10px] font-mono text-gray-400 font-bold">
                  Office ID: {editingOffice.officeId}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setEditingOffice(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveOfficeEdit} className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">
                  Office / Title Name *
                </label>
                <input
                  type="text"
                  value={editOfficeName}
                  onChange={(e) => setEditOfficeName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#005a9c] bg-gray-50 focus:bg-white text-xs font-bold outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">
                  Institutional Office Email (Role Email)
                </label>
                <input
                  type="text"
                  value={editOfficeEmail}
                  onChange={(e) => setEditOfficeEmail(e.target.value)}
                  placeholder="e.g. csehod@lnmiit.ac.in"
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#005a9c] bg-gray-50 focus:bg-white text-xs font-mono font-bold outline-none"
                />
                <p className="text-[10px] text-gray-400 mt-1 font-semibold">
                  When in-charge changes, the new person automatically represents this email.
                </p>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">
                  Department *
                </label>
                <select
                  value={editOfficeDept}
                  onChange={(e) => setEditOfficeDept(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#005a9c] bg-gray-50 focus:bg-white text-xs font-bold outline-none"
                >
                  <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                  <option value="Electronics & Communication Engineering">Electronics & Communication Engineering</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                  <option value="Academic Affairs">Academic Affairs</option>
                  <option value="Student Affairs">Student Affairs</option>
                  <option value="Finance & Accounts">Finance & Accounts</option>
                  <option value="Hostel Administration">Hostel Administration</option>
                  <option value="Library">Library</option>
                  <option value="Sports & Cultural">Sports & Cultural</option>
                  <option value="General Administration">General Administration</option>
                  <option value="Research & Development">Research & Development</option>
                </select>
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingOffice(null)}
                  className="px-5 py-3 rounded-xl font-black text-xs uppercase tracking-widest bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingOfficeEdit || !editOfficeName.trim()}
                  className="px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest text-white bg-[#005a9c] hover:bg-blue-800 shadow-lg shadow-blue-900/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSavingOfficeEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- ADD USER & ASSIGN TITLE MODAL --- */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl max-w-lg w-full p-6 sm:p-8 border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 bg-blue-50 text-[#005a9c] rounded-2xl flex items-center justify-center shrink-0">
                <UserPlus size={20} />
              </div>
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight text-gray-900">
                  Add User & Assign Title
                </h3>
                <p className="text-xs font-semibold text-gray-400">
                  Register faculty or authority with institutional email and official designation
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3.5 mt-5">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="e.g., Dr. Rajbeer Kaur"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#005a9c] bg-gray-50 focus:bg-white text-xs font-bold outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">
                  Institutional Email Address *
                </label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="e.g., rajbeer.kaur@lnmiit.ac.in"
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#005a9c] bg-gray-50 focus:bg-white text-xs font-mono font-bold outline-none"
                    required
                  />
                </div>
                <p className="text-[10px] text-gray-400 font-semibold mt-1">Must be an authorized @lnmiit.ac.in institutional account</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">
                    System Role *
                  </label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#005a9c] bg-gray-50 focus:bg-white text-xs font-bold outline-none"
                  >
                    <option value="Approver">Approver (Faculty / HOD / Dean)</option>
                    <option value="Submitter">Submitter (Student / Scholar)</option>
                    <option value="Administrator">Administrator (System Governance)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">
                    Initial Password
                  </label>
                  <input
                    type="text"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    placeholder="Lnmiit@2026"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#005a9c] bg-gray-50 focus:bg-white text-xs font-bold outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">
                  Official Academic / Administrative Title *
                </label>
                <input
                  type="text"
                  value={newUserPosition}
                  onChange={(e) => setNewUserPosition(e.target.value)}
                  placeholder="e.g., Professor & Head of Department (CSE), Associate Dean..."
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#005a9c] bg-gray-50 focus:bg-white text-xs font-bold outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">
                  Associate with Institutional Office (Optional)
                </label>
                <select
                  value={newUserOfficeId}
                  onChange={(e) => setNewUserOfficeId(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#005a9c] bg-gray-50 focus:bg-white text-xs font-bold outline-none"
                >
                  <option value="">-- No Direct Office Linkage (General Faculty / Submitter) --</option>
                  {offices.map(o => (
                    <option key={o.officeId} value={o.officeId}>
                      {o.officeName} ({o.officeEmail || o.department})
                    </option>
                  ))}
                </select>
              </div>

              {newUserOfficeId && (
                <label className="flex items-center gap-2 p-3 bg-blue-50/70 border border-blue-100 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newUserSetAsInCharge}
                    onChange={(e) => setNewUserSetAsInCharge(e.target.checked)}
                    className="w-4 h-4 text-[#005a9c] rounded accent-[#005a9c]"
                  />
                  <span className="text-xs font-bold text-gray-800">
                    Designate as current Permanent In-Charge of this office
                  </span>
                </label>
              )}

              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-[11px] text-gray-500 font-semibold leading-relaxed">
                Institutional Authority Policy: This account will be pre-verified and directly activated in LNMIIT Digi-Doc. No unsolicited emails will be dispatched.
              </div>

              {userAddError && (
                <p className="text-xs font-bold text-red-600 bg-red-50 p-3 rounded-xl border border-red-100">
                  {userAddError}
                </p>
              )}

              <div className="flex gap-2 justify-end pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all cursor-pointer"
                  disabled={isAddingUser}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAddingUser}
                  className="px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest text-white bg-[#005a9c] hover:bg-blue-800 shadow-lg shadow-blue-900/20 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  <UserPlus size={14} />
                  {isAddingUser ? 'Creating...' : 'Register User & Title'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT USER TITLE & ROLE MODAL --- */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl max-w-lg w-full p-6 sm:p-8 border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 bg-blue-50 text-[#005a9c] rounded-2xl flex items-center justify-center shrink-0">
                <Pencil size={20} />
              </div>
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight text-gray-900">
                  Edit User Title & Role
                </h3>
                <p className="text-xs font-semibold text-gray-400">
                  Update designation and authority for <span className="text-[#005a9c] font-bold">{editingUser.name}</span>
                </p>
              </div>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-3.5 mt-5">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={editUserName}
                  onChange={(e) => setEditUserName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#005a9c] bg-gray-50 focus:bg-white text-xs font-bold outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">
                  Official Academic / Administrative Title
                </label>
                <input
                  type="text"
                  value={editUserPosition}
                  onChange={(e) => setEditUserPosition(e.target.value)}
                  placeholder="e.g., Professor & Head of Department"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#005a9c] bg-gray-50 focus:bg-white text-xs font-bold outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">
                  System Role
                </label>
                <select
                  value={editUserRole}
                  onChange={(e) => setEditUserRole(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#005a9c] bg-gray-50 focus:bg-white text-xs font-bold outline-none"
                >
                  <option value="Approver">Approver (Faculty / HOD / Dean)</option>
                  <option value="Submitter">Submitter (Student / Scholar)</option>
                  <option value="Administrator">Administrator (System Governance)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">
                  Associated Office
                </label>
                <select
                  value={editUserOfficeId}
                  onChange={(e) => setEditUserOfficeId(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#005a9c] bg-gray-50 focus:bg-white text-xs font-bold outline-none"
                >
                  <option value="">-- No Direct Office Linkage --</option>
                  {offices.map(o => (
                    <option key={o.officeId} value={o.officeId}>
                      {o.officeName} ({o.officeEmail || o.department})
                    </option>
                  ))}
                </select>
              </div>

              {editUserOfficeId && (
                <label className="flex items-center gap-2 p-3 bg-blue-50/70 border border-blue-100 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editUserSetAsInCharge}
                    onChange={(e) => setEditUserSetAsInCharge(e.target.checked)}
                    className="w-4 h-4 text-[#005a9c] rounded accent-[#005a9c]"
                  />
                  <span className="text-xs font-bold text-gray-800">
                    Designate as current Permanent In-Charge of this office
                  </span>
                </label>
              )}

              {userUpdateError && (
                <p className="text-xs font-bold text-red-600 bg-red-50 p-3 rounded-xl border border-red-100">
                  {userUpdateError}
                </p>
              )}

              <div className="flex gap-2 justify-end pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all cursor-pointer"
                  disabled={isUpdatingUser}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingUser}
                  className="px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest text-white bg-[#005a9c] hover:bg-blue-800 shadow-lg shadow-blue-900/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isUpdatingUser ? 'Saving...' : 'Save Title & Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- CREATE FORM MODAL --- */}
      {showCreateModal && (
        <CustomFormBuilder
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadAdminData();
          }}
        />
      )}
    </div>
  );
}
