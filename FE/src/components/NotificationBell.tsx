import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getMyNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
  type FENotification,
} from '../Axios/Axios';
import { useSocket } from '../hooks/useSocket';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} giờ trước`;
  const days = Math.floor(hrs / 24);
  return `${days} ngày trước`;
}

// ─── Notification type → icon/color ───────────────────────────────────────────

function getNotificationStyle(type: FENotification['type']) {
  switch (type) {
    case 'owner_application_approved':
    case 'court_approved':
    case 'subscription_activated':
      return { dot: 'bg-emerald-400', icon: '✓', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' };
    case 'booking_created':
      return { dot: 'bg-emerald-400', icon: '🗓', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' };
    case 'owner_application_rejected':
    case 'court_rejected':
      return { dot: 'bg-rose-400', icon: '✗', bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20' };
    case 'booking_cancelled':
      return { dot: 'bg-rose-400', icon: '✕', bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20' };
    case 'owner_application_submitted':
    case 'court_submitted':
      return { dot: 'bg-amber-400', icon: '📋', bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' };
    case 'deposit_received':
      return { dot: 'bg-blue-400', icon: '💰', bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' };
    default:
      return { dot: 'bg-slate-400', icon: '•', bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/20' };
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

type Props = { isLoggedIn: boolean };

export const NotificationBell: React.FC<Props> = ({ isLoggedIn }) => {
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<FENotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

	// Poll unread count every 15s for near-realtime feel
	const pollCount = useCallback(async () => {
		if (!isLoggedIn) return;
		try {
			const count = await getUnreadNotificationCount();
			setUnreadCount(count);
		} catch {
			// ignore auth/network errors silently
		}
	}, [isLoggedIn]);

	useEffect(() => {
		if (!isLoggedIn) return;
		// initial fetch right away
		pollCount();
		const id = setInterval(pollCount, 15_000);
		return () => clearInterval(id);
	}, [isLoggedIn, pollCount]);

	const { onNewNotification } = useSocket();
	useEffect(() => {
		const unsubscribe = onNewNotification(() => {
			pollCount();
			if (open) {
				getMyNotifications({ limit: 20 })
					.then((res) => {
						setNotifications(res.notifications);
						setUnreadCount(res.unreadCount);
					})
					.catch(() => {});
			}
		});
		return unsubscribe;
	}, [onNewNotification, pollCount, open]);

	// Close on outside click
	useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleOpen = async () => {
    if (!open) {
      setOpen(true);
      setLoading(true);
      try {
        const res = await getMyNotifications({ limit: 20 });
        setNotifications(res.notifications);
        setUnreadCount(res.unreadCount);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    } else {
      setOpen(false);
    }
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const handleClickNotification = async (noti: FENotification) => {
    if (!noti.read) {
      await markNotificationRead(noti._id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === noti._id ? { ...n, read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    }
    setOpen(false);
    if (noti.link) navigate(noti.link);
  };

  if (!isLoggedIn) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        type="button"
        onClick={handleOpen}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl transition-all hover:scale-105 active:scale-95"
        style={{
          border: `1px solid ${unreadCount > 0 ? 'rgba(var(--accent-primary-rgb),0.5)' : 'rgba(255,255,255,0.12)'}`,
          backgroundColor: open
            ? 'rgba(var(--accent-primary-rgb),0.15)'
            : unreadCount > 0
              ? 'rgba(var(--accent-primary-rgb),0.10)'
              : 'rgba(255,255,255,0.06)',
          boxShadow: unreadCount > 0 ? '0 0 12px rgba(var(--accent-primary-rgb),0.25)' : 'none',
        }}
        title="Thông báo"
      >
        <svg
          viewBox="0 0 24 24"
          className={`h-[18px] w-[18px] transition-all ${unreadCount > 0 ? 'animate-[wiggle_1s_ease-in-out]' : ''}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          style={{ color: unreadCount > 0 ? 'var(--accent-primary)' : 'rgba(255,255,255,0.7)' }}
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          {unreadCount > 0 && <circle cx="18" cy="6" r="3" fill="currentColor" stroke="none" />}
        </svg>
        {unreadCount > 0 && (
          <span
            className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-black text-white leading-none"
            style={{ backgroundColor: '#ef4444', boxShadow: '0 0 6px rgba(239,68,68,0.6)' }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="fixed z-[9999] w-80 overflow-hidden rounded-xl shadow-2xl"
          style={{
            top: dropdownRef.current ? dropdownRef.current.getBoundingClientRect().bottom + 8 : 'auto',
            right: dropdownRef.current ? window.innerWidth - dropdownRef.current.getBoundingClientRect().right : 0,
            backgroundColor: 'var(--bg-deep)',
            border: '1px solid rgba(var(--accent-primary-rgb), 0.2)',
            boxShadow: '0 20px 40px -10px rgba(0,0,0,0.7)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: '1px solid rgba(var(--accent-primary-rgb),0.1)' }}>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">Thông báo</span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-black text-white">
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-xs font-semibold transition"
                style={{ color: 'var(--accent-primary)' }}
              >
                Đọc tất cả
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[360px] overflow-y-auto arena-scroll">
            {loading ? (
              <div className="py-10 text-center text-sm text-white/40">Đang tải...</div>
            ) : notifications.length === 0 ? (
              <div className="py-10 text-center">
                <svg viewBox="0 0 24 24" className="mx-auto mb-2 h-8 w-8 text-white/20" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                <p className="text-sm text-white/40">Chưa có thông báo nào</p>
              </div>
            ) : (
              <div>
                {notifications.map((noti) => {
                  const style = getNotificationStyle(noti.type);
                  return (
                    <button
                      key={noti._id}
                      type="button"
                      onClick={() => handleClickNotification(noti)}
                      className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors"
                      style={{
                        backgroundColor: noti.read ? '' : 'rgba(var(--accent-primary-rgb),0.04)',
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                        borderLeft: noti.read ? '3px solid transparent' : `3px solid ${style.dot.includes('emerald') ? '#34d399' : style.dot.includes('rose') ? '#f87171' : style.dot.includes('amber') ? '#fbbf24' : style.dot.includes('blue') ? '#60a5fa' : '#94a3b8'}`,
                      }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(var(--accent-primary-rgb),0.08)')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = noti.read ? '' : 'rgba(var(--accent-primary-rgb),0.04)')}
                    >
                      {/* Icon */}
                      <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-base ${style.bg} ${style.text} border ${style.border}`}>
                        {style.icon}
                      </div>
                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm font-semibold leading-tight ${noti.read ? 'text-white/60' : 'text-white'}`}>
                            {noti.title}
                          </p>
                          {!noti.read && (
                            <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${style.dot} animate-pulse`} />
                          )}
                        </div>
                        <p className="mt-0.5 text-xs leading-relaxed text-white/50">{noti.message}</p>
                        <p className="mt-1 text-[10px] text-white/30">{timeAgo(noti.createdAt)}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
