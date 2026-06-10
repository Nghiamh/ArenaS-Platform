import React, { useEffect, useState } from 'react';
import type { AdminSectionKey } from '../pages/Admin/AdminSidebar';
import { AdminSidebar } from '../pages/Admin/AdminSidebar';
import { NotificationBell } from './NotificationBell';

type AdminLayoutProps = {
  activeKey: AdminSectionKey;
  children: React.ReactNode;
};

export const AdminLayout: React.FC<AdminLayoutProps> = ({ activeKey, children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const check = () => {
      const token = localStorage.getItem('accessToken')?.trim();
      setIsLoggedIn(!!token && token !== 'undefined' && token !== 'null');
    };
    check();
    window.addEventListener('currentUserUpdated', check);
    window.addEventListener('storage', check);
    return () => {
      window.removeEventListener('currentUserUpdated', check);
      window.removeEventListener('storage', check);
    };
  }, []);

  return (
    <div data-section="admin" className="flex min-h-screen flex-col bg-slate-950 text-white lg:flex-row">
      <AdminSidebar activeKey={activeKey} collapsed={collapsed} onToggleCollapse={() => setCollapsed((current) => !current)} />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar with notification bell */}
        <div className="flex shrink-0 items-center justify-end gap-3 border-b border-white/[0.06] bg-slate-950/80 px-5 py-3 backdrop-blur-sm overflow-visible">
          <NotificationBell isLoggedIn={isLoggedIn} />
          <div className="h-5 w-px bg-white/[0.08]" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Admin Panel</span>
        </div>

        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
};