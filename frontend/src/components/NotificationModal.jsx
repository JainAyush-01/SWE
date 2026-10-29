/**
 * Modal: Notification Center
 */

import React, { useState, useEffect } from 'react';
import { api } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import { Bell, CheckCheck, Clock, ExternalLink, X } from 'lucide-react';

export default function NotificationModal({ isOpen, onClose, onSelectDocument }) {
  const { fetchNotificationCount } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.getMyNotifications();
      if (res.success) {
        setNotifications(res.notifications || []);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notifId) => {
    try {
      await api.markNotificationRead(notifId);
      setNotifications(prev =>
        prev.map(n => n.notificationId === notifId ? { ...n, readStatus: true } : n)
      );
      fetchNotificationCount();
    } catch (e) {
      // silent
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, readStatus: true })));
      fetchNotificationCount();
    } catch (e) {
      // silent
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl max-w-lg w-full p-6 sm:p-7 flex flex-col border border-gray-100 max-h-[85vh]">
        
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 text-[#005a9c] rounded-2xl flex items-center justify-center shrink-0">
              <Bell size={20} />
            </div>
            <div>
              <h3 className="text-xl font-black uppercase tracking-tight text-gray-900">Notifications</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                In-app alerts and approval status updates
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleMarkAllRead}
              className="text-xs font-bold text-[#005a9c] hover:text-blue-800 flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-blue-50 transition-colors cursor-pointer"
              title="Mark all notifications as read"
            >
              <CheckCheck size={14} /> Mark all read
            </button>
            <button 
              onClick={onClose} 
              className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* NOTIFICATIONS LIST */}
        <div className="overflow-y-auto pr-1 flex-grow max-h-[60vh] space-y-2.5">
          {loading ? (
            <div className="p-8 text-center text-gray-400 text-xs font-bold">Loading alerts...</div>
          ) : notifications.length === 0 ? (
            <div className="p-10 text-center text-gray-400 text-xs font-bold flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mb-3 text-gray-300">
                <Bell size={24} />
              </div>
              You have no notifications at this time.
            </div>
          ) : (
            <div className="divide-y divide-gray-100 rounded-2xl border border-gray-100 overflow-hidden">
              {notifications.map(notif => (
                <div
                  key={notif.notificationId}
                  className={`p-4 transition-colors hover:bg-gray-50/80 ${!(notif.readStatus ?? notif.isRead) ? 'bg-blue-50/40' : 'bg-white'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className={`text-xs leading-relaxed ${!(notif.readStatus ?? notif.isRead) ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                        {notif.message}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-400">
                        <span className="flex items-center gap-1 font-medium">
                          <Clock size={12} /> {new Date(notif.sentTimestamp).toLocaleString()}
                        </span>
                        {notif.relatedDocument && (
                          <button
                            onClick={() => {
                              onClose();
                              if (onSelectDocument) onSelectDocument(notif.relatedDocument);
                            }}
                            className="text-[#005a9c] hover:underline flex items-center gap-1 font-bold cursor-pointer"
                          >
                            <ExternalLink size={11} /> View {notif.relatedDocument}
                          </button>
                        )}
                      </div>
                    </div>
                    {!(notif.readStatus ?? notif.isRead) && (
                      <button
                        onClick={() => handleMarkAsRead(notif.notificationId)}
                        className="w-2.5 h-2.5 rounded-full bg-[#005a9c] shrink-0 mt-1 hover:scale-125 transition-transform cursor-pointer"
                        title="Mark as read"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
