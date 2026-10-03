import React from 'react';
import { X, Bell, ShieldAlert, FileText, Sparkles } from 'lucide-react';
import { AppNotification } from '../../types';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  notifications
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 select-none">
      <div className="relative w-full max-w-[420px] bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-blue-50 text-upayBlue">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 font-bengali">নোটিফিকেশনসমূহ</h3>
              <p className="text-xs text-slate-400 font-bengali">সর্বশেষ আপডেট ও নিরাপত্তা সতর্কতা</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notification List */}
        <div className="overflow-y-auto py-3 space-y-2.5 flex-1 no-scrollbar">
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm font-bengali">
              কোনো নতুন নোটিফিকেশন নেই
            </div>
          ) : (
            notifications.map((n) => {
              const isSecurity = n.type === 'SECURITY';
              const isCase = n.type === 'CASE';
              return (
                <div 
                  key={n.notification_id}
                  className={`p-3.5 rounded-2xl border transition ${
                    isSecurity 
                      ? 'bg-rose-50/70 border-rose-200 text-rose-950'
                      : isCase
                      ? 'bg-blue-50/70 border-blue-200 text-blue-950'
                      : 'bg-slate-50 border-slate-200/80 text-slate-900'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="p-1.5 rounded-lg shrink-0 mt-0.5">
                      {isSecurity ? (
                        <ShieldAlert className="w-4 h-4 text-rose-600" />
                      ) : isCase ? (
                        <FileText className="w-4 h-4 text-upayBlue" />
                      ) : (
                        <Sparkles className="w-4 h-4 text-amber-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold font-sans">{n.title}</h4>
                        <span className="text-[10px] text-slate-400">এখনই</span>
                      </div>
                      <p className="text-xs text-slate-600 font-bengali mt-1 leading-snug">
                        {n.message}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold font-bengali transition"
          >
            বন্ধ করুন
          </button>
        </div>

      </div>
    </div>
  );
};
