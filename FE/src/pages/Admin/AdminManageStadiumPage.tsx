import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

type StadiumStatus = 'approved' | 'pending' | 'rejected' | 'hidden';

type StadiumItem = {
  id: string;
  name: string;
  owner: string;
  sportType: string;
  location: string;
  submittedAt: string;
  pricePerHour: number;
  rating: number;
  status: StadiumStatus;
};

const mockStadiums: StadiumItem[] = [
  {
    id: 'STD-001',
    name: 'Champions Arena',
    owner: 'Nguyen Minh Tuan',
    sportType: 'Bong da',
    location: 'Quan 7, TP.HCM',
    submittedAt: '2026-05-01',
    pricePerHour: 450000,
    rating: 4.9,
    status: 'approved',
  },
  {
    id: 'STD-002',
    name: 'Victory Badminton Hub',
    owner: 'Tran Thu Ha',
    sportType: 'Cau long',
    location: 'Thu Duc, TP.HCM',
    submittedAt: '2026-05-08',
    pricePerHour: 180000,
    rating: 4.7,
    status: 'pending',
  },
  {
    id: 'STD-003',
    name: 'Neo Pickleball Court',
    owner: 'Le Quoc Bao',
    sportType: 'Pickleball',
    location: 'Binh Thanh, TP.HCM',
    submittedAt: '2026-05-09',
    pricePerHour: 210000,
    rating: 4.8,
    status: 'pending',
  },
  {
    id: 'STD-004',
    name: 'Sunrise Football Zone',
    owner: 'Pham Gia Huy',
    sportType: 'Bong da',
    location: 'Go Vap, TP.HCM',
    submittedAt: '2026-04-22',
    pricePerHour: 360000,
    rating: 4.4,
    status: 'hidden',
  },
  {
    id: 'STD-005',
    name: 'Urban MultiSport Center',
    owner: 'Do Thanh Vy',
    sportType: 'Bong ro',
    location: 'Quan 10, TP.HCM',
    submittedAt: '2026-04-29',
    pricePerHour: 280000,
    rating: 4.2,
    status: 'rejected',
  },
];

const statusLabel: Record<StadiumStatus, string> = {
  approved: 'Da duyet',
  pending: 'Cho duyet',
  rejected: 'Tu choi',
  hidden: 'Dang an',
};

const statusClass: Record<StadiumStatus, string> = {
  approved: 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/35',
  pending: 'bg-amber-500/20 text-amber-200 ring-1 ring-amber-400/35',
  rejected: 'bg-rose-500/20 text-rose-200 ring-1 ring-rose-400/35',
  hidden: 'bg-slate-500/20 text-slate-300 ring-1 ring-slate-400/25',
};

const statusPriority: Record<StadiumStatus, number> = {
  approved: 0,
  pending: 1,
  hidden: 2,
  rejected: 3,
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(value);

export const AdminManageStadiumPage: React.FC = () => {
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | StadiumStatus>('all');

  const stats = useMemo(() => {
    const approved = mockStadiums.filter((item) => item.status === 'approved').length;
    const pending = mockStadiums.filter((item) => item.status === 'pending').length;

    return {
      total: mockStadiums.length,
      approved,
      pending,
    };
  }, []);

  const stadiums = useMemo(() => {
    const q = keyword.trim().toLowerCase();

    return mockStadiums
      .filter((item) => {
        const byStatus = statusFilter === 'all' ? true : item.status === statusFilter;
        const byKeyword =
          !q ||
          item.name.toLowerCase().includes(q) ||
          item.owner.toLowerCase().includes(q) ||
          item.location.toLowerCase().includes(q) ||
          item.sportType.toLowerCase().includes(q);

        return byStatus && byKeyword;
      })
      .sort((a, b) => {
        if (a.status === b.status) {
          return b.submittedAt.localeCompare(a.submittedAt);
        }
        return statusPriority[a.status] - statusPriority[b.status];
      });
  }, [keyword, statusFilter]);

  const pendingQueue = stadiums.filter((item) => item.status === 'pending');

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-2xl border border-slate-700/50 bg-slate-900/40 p-6 backdrop-blur-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">Admin / Stadium</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Quan ly san va duyet san</h1>
              <p className="mt-2 text-sm text-slate-400">
                Giao dien quan tri doc lap, uu tien hien thi san da duyet de de theo doi va van hanh.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to="/admin/dashboard"
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
              >
                Ve dashboard
              </Link>
              <button className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400">
                Tao san moi
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-emerald-200">Da duyet</p>
              <p className="mt-2 text-3xl font-black text-emerald-100">{stats.approved}</p>
            </div>
            <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-amber-200">Cho duyet</p>
              <p className="mt-2 text-3xl font-black text-amber-100">{stats.pending}</p>
            </div>
            <div className="rounded-xl border border-slate-600/40 bg-slate-800/50 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Tong san</p>
              <p className="mt-2 text-3xl font-black text-slate-100">{stats.total}</p>
            </div>
          </div>
        </header>

        <section className="rounded-2xl border border-slate-700/50 bg-slate-900/40 p-6 backdrop-blur-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <h2 className="text-2xl font-black tracking-tight">Danh sach san</h2>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Tim theo ten san, chu san, khu vuc..."
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm outline-none placeholder:text-slate-500 sm:w-80"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | StadiumStatus)}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
              >
                <option value="all">Tat ca trang thai</option>
                <option value="approved">Da duyet</option>
                <option value="pending">Cho duyet</option>
                <option value="hidden">Dang an</option>
                <option value="rejected">Tu choi</option>
              </select>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b border-slate-700/60 text-slate-300">
                  <th className="px-3 py-3 text-left">San</th>
                  <th className="px-3 py-3 text-left">Chu san</th>
                  <th className="px-3 py-3 text-left">Loai</th>
                  <th className="px-3 py-3 text-left">Vi tri</th>
                  <th className="px-3 py-3 text-right">Gia/gio</th>
                  <th className="px-3 py-3 text-center">Danh gia</th>
                  <th className="px-3 py-3 text-center">Trang thai</th>
                  <th className="px-3 py-3 text-center">Hanh dong</th>
                </tr>
              </thead>
              <tbody>
                {stadiums.map((stadium) => (
                  <tr key={stadium.id} className="border-b border-slate-700/30 hover:bg-slate-800/40">
                    <td className="px-3 py-4 font-semibold text-white">{stadium.name}</td>
                    <td className="px-3 py-4 text-slate-300">{stadium.owner}</td>
                    <td className="px-3 py-4 text-slate-300">{stadium.sportType}</td>
                    <td className="px-3 py-4 text-slate-400">{stadium.location}</td>
                    <td className="px-3 py-4 text-right font-semibold text-emerald-300">{formatCurrency(stadium.pricePerHour)} đ</td>
                    <td className="px-3 py-4 text-center text-slate-200">★ {stadium.rating.toFixed(1)}</td>
                    <td className="px-3 py-4 text-center">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClass[stadium.status]}`}>
                        {statusLabel[stadium.status]}
                      </span>
                    </td>
                    <td className="px-3 py-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button className="rounded-lg bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/30">
                          Duyet
                        </button>
                        <button className="rounded-lg bg-rose-500/20 px-3 py-1 text-xs font-semibold text-rose-200 hover:bg-rose-500/30">
                          Tu choi
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-700/50 bg-slate-900/40 p-6 backdrop-blur-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-black tracking-tight">Hang cho duyet nhanh</h2>
            <span className="rounded-full bg-amber-500/20 px-3 py-1 text-sm font-semibold text-amber-200">
              {pendingQueue.length} san
            </span>
          </div>

          <div className="grid gap-3">
            {pendingQueue.length === 0 ? (
              <p className="text-sm text-slate-400">Khong co san nao dang cho duyet.</p>
            ) : (
              pendingQueue.map((item) => (
                <article key={item.id} className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-lg font-bold text-white">{item.name}</p>
                      <p className="text-sm text-slate-300">
                        {item.owner} · {item.location} · Gui ngay {item.submittedAt}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button className="rounded-lg bg-emerald-500 px-3 py-1 text-xs font-semibold text-slate-950 hover:bg-emerald-400">
                        Phe duyet
                      </button>
                      <button className="rounded-lg bg-rose-500 px-3 py-1 text-xs font-semibold text-white hover:bg-rose-400">
                        Tu choi
                      </button>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
};
