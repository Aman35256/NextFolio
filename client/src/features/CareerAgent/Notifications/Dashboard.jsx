import { useEffect, useState } from 'react';
import { Card, Button, Badge } from '../../../components';
import { Bell, BellOff, Check, Trash2, Mail, Layout, Info } from 'lucide-react';
import { useCareerAgentStore } from '../../../store/careerAgent';
import { useResumeStore } from '../../../store';

export default function NotificationsDashboard() {
  const token = useResumeStore((state) => state.token);
  const {
    notifications,
    fetchNotifications,
    markNotificationRead,
    clearNotificationsOnServer,
    notificationPreferences,
    setNotificationPreferences,
  } = useCareerAgentStore();

  useEffect(() => {
    if (token) {
      fetchNotifications(token);
    }
  }, [token]);

  const handleMarkRead = async (id) => {
    await markNotificationRead(id, token);
  };

  const handleClearAll = async () => {
    const confirmClear = window.confirm('Are you sure you want to clear all notifications?');
    if (confirmClear) {
      await clearNotificationsOnServer(token);
    }
  };

  const handlePreferenceChange = (channel, value) => {
    setNotificationPreferences({ [channel]: value });
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Career Agent Notifications</h2>
          <p className="text-slate-600 mt-1">
            Real-time notifications triggered by autonomous application runs and matches.
          </p>
        </div>
        {notifications.length > 0 && (
          <Button variant="outline" className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200" onClick={handleClearAll}>
            <Trash2 size={16} />
            Clear All
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alerts List */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-4 space-y-4 shadow-soft-sm">
            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Bell className="text-indigo-600 animate-swing" />
              Inbox ({unreadCount} unread)
            </h3>
            
            <div className="space-y-3">
              {notifications.length === 0 ? (
                <div className="text-center py-16 text-slate-400 text-sm">
                  <BellOff className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  Your inbox is clean! No new notifications.
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-4 rounded-xl border flex items-start justify-between gap-4 transition-all ${
                      n.read ? 'bg-slate-50 border-slate-100 opacity-75' : 'bg-white border-indigo-100 shadow-soft-sm'
                    }`}
                  >
                    <div className="flex gap-3 items-start">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                        n.type === 'new_match' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'
                      }`}>
                        {n.type === 'new_match' ? '🔥' : '📮'}
                      </div>
                      <div className="space-y-1">
                        <p className={`text-xs text-slate-800 leading-relaxed ${!n.read ? 'font-semibold' : ''}`}>
                          {n.message}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {new Date(n.timestamp || n.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    
                    {!n.read && (
                      <button
                        onClick={() => handleMarkRead(n.id)}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg"
                      >
                        <Check size={14} />
                        Mark Read
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Preferences side panel */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="p-6 space-y-6 shadow-soft-sm border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Info className="text-indigo-600" />
              Delivery Channels
            </h3>

            <div className="space-y-4">
              <label className="flex items-center justify-between cursor-pointer border-b border-slate-50 pb-3">
                <div className="flex items-center gap-3">
                  <Layout size={18} className="text-slate-500" />
                  <div>
                    <span className="text-sm font-semibold text-slate-800 block">In-App Alerts</span>
                    <span className="text-[10px] text-slate-500 block">Show red dots in Dashboard sidebar.</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notificationPreferences.inApp}
                  onChange={(e) => handlePreferenceChange('inApp', e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer border-b border-slate-50 pb-3">
                <div className="flex items-center gap-3">
                  <Mail size={18} className="text-slate-500" />
                  <div>
                    <span className="text-sm font-semibold text-slate-800 block">Email Reports</span>
                    <span className="text-[10px] text-slate-500 block">Send emails via Resend service.</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notificationPreferences.email}
                  onChange={(e) => handlePreferenceChange('email', e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-3">
                  <Bell size={18} className="text-slate-500" />
                  <div>
                    <span className="text-sm font-semibold text-slate-800 block">Browser Push</span>
                    <span className="text-[10px] text-slate-500 block">Receive instant desktop notifications.</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notificationPreferences.push}
                  onChange={(e) => handlePreferenceChange('push', e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                />
              </label>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
