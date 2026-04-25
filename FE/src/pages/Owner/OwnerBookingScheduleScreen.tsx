import React from 'react';
import { motion } from 'framer-motion';
import { OwnerSidebar } from './OwnerSidebar';

const bookings = [
  { customer: 'Nguyen Van An', court: 'San A', time: '18:00 - 19:00', status: 'Da xac nhan' },
  { customer: 'Tran Minh Quan', court: 'San B', time: '19:00 - 20:00', status: 'Cho thanh toan' },
  { customer: 'Hoang Gia Bao', court: 'San C', time: '20:00 - 21:00', status: 'Da hoan tat' },
];

export const OwnerBookingScheduleScreen: React.FC = () => {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#020B1F] text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(37,99,235,0.16),transparent_32%),radial-gradient(circle_at_80%_10%,rgba(14,165,233,0.1),transparent_28%)]" />

      <div className="relative z-10 grid min-h-screen w-full grid-cols-1 xl:grid-cols-[300px_minmax(0,1fr)]">
        <OwnerSidebar activeKey="bookings" />

        <main className="arena-scroll min-h-screen px-4 py-6 md:px-6 lg:px-8 xl:max-h-screen xl:overflow-y-auto">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full space-y-6">
            <header className="border-b border-white/10 pb-4">
              <h1 className="text-4xl font-black tracking-tight text-white sm:text-3xl">Lich Dat San</h1>
              <p className="mt-1 text-sm text-slate-400">Tong hop cac lich dat moi nhat theo tung khung gio.</p>
            </header>

            <section className="overflow-x-auto rounded-3xl border border-white/10 bg-[#081734]/85">
              <table className="min-w-full text-left">
                <thead className="border-b border-white/10 text-xs uppercase tracking-[0.12em] text-slate-500">
                  <tr>
                    <th className="px-5 py-4">Khach hang</th>
                    <th className="px-5 py-4">San</th>
                    <th className="px-5 py-4">Khung gio</th>
                    <th className="px-5 py-4">Trang thai</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => (
                    <tr key={`${booking.customer}-${booking.time}`} className="border-b border-white/5 text-slate-200">
                      <td className="px-5 py-4 font-semibold text-white">{booking.customer}</td>
                      <td className="px-5 py-4">{booking.court}</td>
                      <td className="px-5 py-4">{booking.time}</td>
                      <td className="px-5 py-4 text-blue-200">{booking.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </motion.div>
        </main>
      </div>
    </div>
  );
};
