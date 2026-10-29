/**
 * Main Application Shell: LNMIIT Digi-Doc
 * Institutional Document Routing & Approval System
 */

import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import AdminLayout from './components/AdminLayout';
import SubmitterDashboard from './pages/SubmitterDashboard';
import ApproverDashboard from './pages/ApproverDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ManagementDashboard from './pages/ManagementDashboard';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import NotificationModal from './components/NotificationModal';
import ModalDocumentDetail from './components/ModalDocumentDetail';

function DigiDocRoutes() {
  const { currentUser, userRole, loading } = useAuth();
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [activeTrackingDocId, setActiveTrackingDocId] = useState(null);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 font-sans">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-[#005a9c] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xs font-black uppercase tracking-widest text-gray-500">
            Initializing Digi-Doc Portal...
          </p>
        </div>
      </div>
    );
  }

  // Determine home landing route for logged-in users
  const getHomeRedirect = () => {
    if (userRole === 'ADMIN') return '/admin';
    if (userRole === 'APPROVER') return '/approver';
    if (userRole === 'MANAGEMENT') return '/management';
    return '/portal';
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 flex flex-col">
      {/* 
        GLOBAL INSTITUTIONAL NAVBAR:
        Only displayed for Students & Approvers. Admins have their own sidebar layout.
      */}
      {currentUser && userRole !== 'ADMIN' && (
        <Navbar onOpenNotifications={() => setShowNotificationModal(true)} />
      )}

      {/* MAIN ROUTE CONTENT */}
      <main className="flex-grow">
        <Routes>
          {/* 
            ROUTE: LOGIN (/)
            If already signed in, redirect straight to their home portal
          */}
          <Route
            path="/"
            element={
              !currentUser ? (
                <Login />
              ) : (
                <Navigate to={getHomeRedirect()} replace />
              )
            }
          />

          {/* ROUTE: SIGNUP (/signup) */}
          <Route
            path="/signup"
            element={
              !currentUser ? (
                <Signup />
              ) : (
                <Navigate to={getHomeRedirect()} replace />
              )
            }
          />

          {/* ROUTE: FORGOT PASSWORD (/forgot-password) */}
          <Route
            path="/forgot-password"
            element={
              !currentUser ? (
                <ForgotPassword />
              ) : (
                <Navigate to={getHomeRedirect()} replace />
              )
            }
          />

          {/* 
            ROUTE: SUBMITTER / STUDENT PORTAL (/portal)
            Protected: Students & Admins
          */}
          <Route
            path="/portal"
            element={
              currentUser ? (
                <SubmitterDashboard />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />

          {/* 
            ROUTE: APPROVER WORKSPACE (/approver)
            Protected: Approvers & Admins
          */}
          <Route
            path="/approver"
            element={
              currentUser && (userRole === 'APPROVER' || userRole === 'ADMIN') ? (
                <ApproverDashboard />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />

          <Route
            path="/management"
            element={
              currentUser && (userRole === 'MANAGEMENT' || userRole === 'ADMIN') ? (
                <ManagementDashboard />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />

          {/* 
            ROUTE: ADMIN AREA (/admin/*)
            Protected: Admin only, using dedicated left-sidebar layout
          */}
          <Route
            path="/admin"
            element={
              currentUser && userRole === 'ADMIN' ? (
                <AdminLayout />
              ) : (
                <Navigate to="/" replace />
              )
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="reviews" element={<AdminDashboard />} />
            <Route path="offices" element={<AdminDashboard />} />
            <Route path="catalog" element={<AdminDashboard />} />
            <Route path="role-requests" element={<AdminDashboard />} />
            <Route path="users" element={<AdminDashboard />} />
          </Route>

          {/* FALLBACK: Redirect any unknown path to / */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* CLEAN MINIMALIST INSTITUTIONAL FOOTER (Shown on non-admin pages) */}
      {(!currentUser || userRole !== 'ADMIN') && (
        <footer className="py-6 border-t border-gray-100 bg-white text-center mt-auto">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            © The LNM Institute of Information Technology • Institutional Document Routing Portal
          </p>
        </footer>
      )}

      {/* In-App Notifications Modal */}
      {showNotificationModal && (
        <NotificationModal
          isOpen={showNotificationModal}
          onClose={() => setShowNotificationModal(false)}
          onSelectDocument={(docId) => {
            setShowNotificationModal(false);
            setActiveTrackingDocId(docId);
          }}
        />
      )}

      {/* Document Detail Viewer */}
      {activeTrackingDocId && (
        <ModalDocumentDetail
          documentId={activeTrackingDocId}
          isOpen={Boolean(activeTrackingDocId)}
          onClose={() => setActiveTrackingDocId(null)}
          onActionCompleted={() => setActiveTrackingDocId(null)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DigiDocRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
