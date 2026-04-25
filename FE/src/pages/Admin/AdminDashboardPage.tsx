import React from 'react';

export const AdminDashboardPage: React.FC = () => {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">Admin</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight">Admin Dashboard</h1>
        <p className="mt-4 max-w-2xl text-base text-slate-300">
          Xin chao quan tri vien. Day la trang tong quan danh cho role admin.
        </p>
      </div>
    </main>
  );
};
