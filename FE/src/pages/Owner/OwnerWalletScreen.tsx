import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { OwnerSidebar } from './OwnerSidebar';
import { NotificationBell } from '../../components/NotificationBell';
import { getMyWallet, getWithdrawalRequests, requestWithdrawal, type WalletInfo, type WithdrawalRequestInfo } from '../../Axios/walletApi';

export const OwnerWalletScreen: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => localStorage.getItem('ownerSidebarCollapsed') === '1');
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequestInfo[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    localStorage.setItem('ownerSidebarCollapsed', sidebarCollapsed ? '1' : '0');
  }, [sidebarCollapsed]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [walletRes, withdrawRes] = await Promise.all([
        getMyWallet(),
        getWithdrawalRequests()
      ]);
      setWallet(walletRes.wallet);
      setWithdrawals(withdrawRes.requests);
    } catch (error) {
      console.error("Error loading wallet data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRequestWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    
    const numAmount = Number(amount.replace(/,/g, ''));
    if (!numAmount || numAmount < 10000) {
      setErrorMsg('Số tiền rút tối thiểu là 10.000đ');
      return;
    }
    
    if (wallet && numAmount > wallet.balance) {
      setErrorMsg('Số dư không đủ');
      return;
    }

    if (!bankName.trim() || !bankAccountName.trim() || !bankAccountNumber.trim()) {
      setErrorMsg('Vui lòng điền đầy đủ thông tin ngân hàng');
      return;
    }

    setIsSubmitting(true);
    try {
      await requestWithdrawal(numAmount, bankName, bankAccountName, bankAccountNumber);
      await loadData();
      setIsModalOpen(false);
      setAmount('');
      setBankName('');
      setBankAccountName('');
      setBankAccountNumber('');
    } catch (error: any) {
      setErrorMsg(error.message || 'Có lỗi xảy ra khi tạo yêu cầu rút tiền');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      case 'rejected': return 'text-rose-400 bg-rose-400/10 border-rose-400/20';
      default: return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved': return 'Đã duyệt';
      case 'rejected': return 'Từ chối';
      default: return 'Đang xử lý';
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#020B1F] text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(37,99,235,0.16),transparent_32%),radial-gradient(circle_at_80%_10%,rgba(14,165,233,0.1),transparent_28%)]" />

      <div
        className="relative z-10 grid min-h-screen w-full grid-cols-1 transition-[grid-template-columns] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-[grid-template-columns] xl:[grid-template-columns:var(--owner-sidebar-width)_minmax(0,1fr)]"
        style={{ ['--owner-sidebar-width' as string]: sidebarCollapsed ? '92px' : '300px' } as React.CSSProperties}
      >
        <OwnerSidebar
          activeKey="wallet"
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
        />

        <main className="arena-scroll min-h-screen px-4 py-6 md:px-6 lg:px-8 xl:max-h-screen xl:overflow-y-auto">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-5xl mx-auto space-y-8">
            <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <h1 className="text-3xl font-black tracking-tight text-white">Ví Của Tôi</h1>
                <p className="mt-1 text-sm text-slate-400">Quản lý số dư và tạo lệnh rút tiền.</p>
              </div>
              <NotificationBell isLoggedIn={true} />
            </header>

            {loading ? (
              <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" /></div>
            ) : (
              <>
                {/* Balance Card */}
                <section className="rounded-3xl border border-white/10 bg-[#081734]/85 p-6 shadow-[0_20px_45px_-30px_rgba(2,6,23,0.9)] overflow-hidden relative">
                  <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                    <svg className="w-32 h-32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M21 12V7H5a2 2 0 0 1 0-4h14v4M3 5v14a2 2 0 0 0 2 2h16v-5M18 12a2 2 0 0 0 0 4h4v-4Z" />
                    </svg>
                  </div>
                  <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div>
                      <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">Số dư hiện tại</p>
                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-4xl sm:text-5xl font-black text-white">{wallet?.balance?.toLocaleString('vi-VN')}</span>
                        <span className="text-xl font-bold text-slate-400">VND</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="shrink-0 px-6 py-3 rounded-xl bg-white text-black font-bold tracking-wide hover:bg-slate-200 transition shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                    >
                      Tạo Lệnh Rút Tiền
                    </button>
                  </div>
                </section>

                {/* Withdrawals List */}
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-white">Lịch sử rút tiền</h2>
                    <button
                      onClick={loadData}
                      disabled={loading}
                      className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white transition disabled:opacity-50"
                      title="Làm mới dữ liệu"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span className="hidden sm:inline">Làm mới</span>
                    </button>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-[#081734]/50 overflow-hidden">
                    {withdrawals.length === 0 ? (
                      <div className="p-8 text-center text-slate-400">
                        Chưa có yêu cầu rút tiền nào.
                      </div>
                    ) : (
                      <div className="overflow-x-auto arena-scroll">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                          <thead className="bg-white/5 text-slate-300">
                            <tr>
                              <th className="px-4 py-4 font-semibold">Mã yêu cầu</th>
                              <th className="px-4 py-4 font-semibold">Ngày tạo</th>
                              <th className="px-4 py-4 font-semibold text-right">Số tiền</th>
                              <th className="px-4 py-4 font-semibold">Ngân hàng</th>
                              <th className="px-4 py-4 font-semibold">Trạng thái</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {withdrawals.map((req) => (
                              <tr key={req._id} className="hover:bg-white/[0.02] transition">
                                <td className="px-4 py-4 font-mono text-slate-400">{req._id.substring(req._id.length - 8)}</td>
                                <td className="px-4 py-4 text-slate-300">{new Date(req.createdAt).toLocaleString('vi-VN')}</td>
                                <td className="px-4 py-4 font-bold text-white text-right">{req.amount.toLocaleString('vi-VN')} đ</td>
                                <td className="px-4 py-4">
                                  <div className="text-white">{req.bankName}</div>
                                  <div className="text-xs text-slate-400">{req.bankAccountNumber}</div>
                                </td>
                                <td className="px-4 py-4">
                                  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(req.status)}`}>
                                    {getStatusLabel(req.status)}
                                  </span>
                                  {req.adminNote && (
                                    <div className="mt-1 text-xs text-slate-500 max-w-[200px] truncate" title={req.adminNote}>
                                      Lý do: {req.adminNote}
                                    </div>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </section>
              </>
            )}
          </motion.div>
        </main>
      </div>

      {/* Withdraw Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-[#081734] p-6 shadow-2xl"
            >
              <h2 className="text-2xl font-black text-white">Yêu cầu rút tiền</h2>
              <p className="mt-2 text-sm text-slate-400 mb-6">
                Vui lòng điền thông tin tài khoản nhận tiền. Admin sẽ kiểm tra và chuyển khoản trong vòng 24h.
              </p>

              <form onSubmit={handleRequestWithdraw} className="space-y-4">
                {errorMsg && (
                  <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-sm text-rose-400">
                    {errorMsg}
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Số tiền rút (VND)</label>
                  <input
                    type="text"
                    required
                    value={amount}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setAmount(val ? Number(val).toLocaleString('en-US') : '');
                    }}
                    placeholder="VD: 500,000"
                    className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white placeholder:text-slate-500 focus:border-white/30 focus:outline-none focus:ring-1 focus:ring-white/30 transition"
                  />
                  <div className="mt-1 text-right text-xs text-slate-500">
                    Tối đa: <button type="button" onClick={() => setAmount(wallet?.balance.toLocaleString('en-US') || '')} className="text-emerald-400 font-medium hover:underline">{wallet?.balance?.toLocaleString('vi-VN')} đ</button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Ngân hàng thụ hưởng</label>
                  <input
                    type="text"
                    required
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="VD: Vietcombank, Techcombank..."
                    className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white placeholder:text-slate-500 focus:border-white/30 focus:outline-none focus:ring-1 focus:ring-white/30 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Tên chủ tài khoản</label>
                  <input
                    type="text"
                    required
                    value={bankAccountName}
                    onChange={(e) => setBankAccountName(e.target.value.toUpperCase())}
                    placeholder="VD: NGUYEN VAN A"
                    className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white placeholder:text-slate-500 focus:border-white/30 focus:outline-none focus:ring-1 focus:ring-white/30 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Số tài khoản</label>
                  <input
                    type="text"
                    required
                    value={bankAccountNumber}
                    onChange={(e) => setBankAccountNumber(e.target.value)}
                    placeholder="VD: 0123456789"
                    className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white placeholder:text-slate-500 focus:border-white/30 focus:outline-none focus:ring-1 focus:ring-white/30 transition font-mono"
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 rounded-xl bg-white/5 py-3 text-sm font-bold text-white hover:bg-white/10 transition"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 rounded-xl bg-white py-3 text-sm font-bold text-black shadow-lg hover:bg-slate-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Đang gửi...' : 'Gửi Yêu Cầu'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
