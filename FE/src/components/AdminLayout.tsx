import React, { useState } from 'react';
import type { AdminSectionKey } from '../pages/Admin/AdminSidebar';
import { AdminSidebar } from '../pages/Admin/AdminSidebar';

type AdminLayoutProps = {
  activeKey: AdminSectionKey;
  children: React.ReactNode;
};

export const AdminLayout: React.FC<AdminLayoutProps> = ({ activeKey, children }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div data-section="admin" className="flex min-h-screen flex-col bg-slate-950 text-white lg:flex-row">
      <AdminSidebar activeKey={activeKey} collapsed={collapsed} onToggleCollapse={() => setCollapsed((current) => !current)} />

      <div className="flex-1">{children}</div>
    </div>
  );
};