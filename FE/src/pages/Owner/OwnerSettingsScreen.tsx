import React from 'react';
import { motion } from 'framer-motion';
import { OwnerSidebar } from './OwnerSidebar';

export const OwnerSettingsScreen: React.FC = () => {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#020B1F] text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(37,99,235,0.16),transparent_32%),radial-gradient(circle_at_80%_10%,rgba(14,165,233,0.1),transparent_28%)]" />

      <div className="relative z-10 grid min-h-screen w-full grid-cols-1 xl:grid-cols-[300px_minmax(0,1fr)]">
        <OwnerSidebar activeKey="settings" />

        <main className="arena-scroll min-h-screen px-4 py-6 md:px-6 lg:px-8 xl:max-h-screen xl:overflow-y-auto">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full space-y-6">
            <header className="border-b border-white/10 pb-4">
              <h1 className="text-4xl font-black tracking-tight text-white sm:text-3xl">Cai Dat</h1>
              <p className="mt-1 text-sm text-slate-400">Cap nhat thong tin he thong va tai khoan chu san.</p>
            </header>

            <section className="grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-[#081734]/85 p-5">
                <p className="text-sm text-slate-400">Ten chu san</p>
                <p className="mt-2 text-xl font-bold text-white">Minh Tuan</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-[#081734]/85 p-5">
                <p className="text-sm text-slate-400">Email</p>
                <p className="mt-2 text-xl font-bold text-white">minhtuan@arenas.vn</p>
              </div>
            </section>
          </motion.div>
        </main>
      </div>
    </div>
  );
};
