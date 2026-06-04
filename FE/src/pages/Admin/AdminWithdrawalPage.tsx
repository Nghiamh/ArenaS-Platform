import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminSidebar } from './AdminSidebar';
import { getWithdrawalRequests, processWithdrawal, type WithdrawalRequestInfo } from '../../Axios/walletApi';
import { NotificationBell } from '../../components/NotificationBell';

export const AdminWithdrawalPage: React.FC = () => {
  const [requests, setRequests] = useState<WithdrawalRequestInfo[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Process Modal
  const [selectedRequest, setSelectedRequest] = useState<WithdrawalRequestInfo | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionType, setActionType] = useState<'approved' | 'rejected' | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await getWithdrawalRequests();
      setRequests(res.requests);
    } catch (error) {
      console.error("Lỗi lấy danh sách rút tiền:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleProcess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest || !actionType) return;
    
    if (actionType === 'rejected' && !adminNote.trim()) {
      alert("Vui lòng nhập lý do từ chối");
      return;
    }

    setIsProcessing(true);
    try {
      await processWithdrawal(selectedRequest._id, actionType, adminNote);
      await fetchRequests();
      setSelectedRequest(null);
      setAdminNote('');
      setActionType(null);
    } catch (error: any) {
      alert(error.message || "Lỗi xử lý yêu cầu");
    } finally {
      setIsProcessing(false);
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
      default: return 'Chờ xử lý';
    }
  };

  const openProcessModal = (req: WithdrawalRequestInfo, action: 'approved' | 'rejected') => {
    setSelectedRequest(req);
    setActionType(action);
    setAdminNote('');
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#020B1F] text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(37,99,235,0.1),transparent_50%),radial-gradient(circle_at_100%_100%,rgba(14,165,233,0.05),transparent_50%)]" />

      <div className="relative z-10 grid min-h-screen w-full grid-cols-1 xl:grid-cols-[280px_minmax(0,1fr)]">
        <AdminSidebar activeKey="withdrawals" />

        <main className="arena-scroll min-h-screen px-4 py-6 md:px-6 lg:px-8 xl:max-h-screen xl:overflow-y-auto">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-6xl mx-auto space-y-8">
            <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div className="flex-1">
                <div className="flex items-center gap-4">
                  <h1 className="text-3xl font-black tracking-tight text-white">Duyệt Rút Tiền</h1>
                  <button
                    onClick={fetchRequests}
                    disabled={loading}
                    className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition disabled:opacity-50"
                    title="Làm mới dữ liệu"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                </div>
                <p className="mt-1 text-sm text-slate-400">Quản lý và xử lý các yêu cầu rút tiền từ chủ sân.</p>
              </div>
              <NotificationBell isLoggedIn={true} />
            </header>

            {loading ? (
              <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" /></div>
            ) : (
              <section className="rounded-3xl border border-white/10 bg-[#081734]/85 shadow-[0_20px_45px_-30px_rgba(2,6,23,0.9)] overflow-hidden">
                <div className="overflow-x-auto arena-scroll">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-white/5 text-slate-300">
                      <tr>
                        <th className="px-6 py-4 font-semibold">Ngày tạo</th>
                        <th className="px-6 py-4 font-semibold">Chủ sân</th>
                        <th className="px-6 py-4 font-semibold text-right">Số tiền</th>
                        <th className="px-6 py-4 font-semibold">Ngân hàng</th>
                        <th className="px-6 py-4 font-semibold">Trạng thái</th>
                        <th className="px-6 py-4 font-semibold text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {requests.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                            Không có yêu cầu rút tiền nào.
                          </td>
                        </tr>
                      ) : (
                        requests.map((req) => (
                          <tr key={req._id} className="hover:bg-white/[0.02] transition">
                            <td className="px-6 py-4 text-slate-300">
                              <div>{new Date(req.createdAt).toLocaleDateString('vi-VN')}</div>
                              <div className="text-xs text-slate-500">{new Date(req.createdAt).toLocaleTimeString('vi-VN')}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="font-medium text-white">{typeof req.ownerId === 'object' ? req.ownerId.name || req.ownerId.userName : 'Unknown'}</div>
                              <div className="text-xs text-slate-400">{typeof req.ownerId === 'object' ? req.ownerId.email : ''}</div>
                            </td>
                            <td className="px-6 py-4 font-bold text-white text-right">
                              {req.amount.toLocaleString('vi-VN')} đ
                            </td>
                            <td className="px-6 py-4">
                              <div className="font-medium text-white">{req.bankName}</div>
                              <div className="text-xs text-slate-300">{req.bankAccountName}</div>
                              <div className="text-xs font-mono text-slate-400">{req.bankAccountNumber}</div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(req.status)}`}>
                                {getStatusLabel(req.status)}
                              </span>
                              {req.adminNote && (
                                <div className="mt-1 text-xs text-slate-500 max-w-[200px] truncate" title={req.adminNote}>
                                  Lý do: {req.adminNote}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right">
                              {req.status === 'pending' && (
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() => openProcessModal(req, 'approved')}
                                    className="px-3 py-1.5 rounded bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition text-xs font-bold"
                                  >
                                    Duyệt
                                  </button>
                                  <button
                                    onClick={() => openProcessModal(req, 'rejected')}
                                    className="px-3 py-1.5 rounded bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 transition text-xs font-bold"
                                  >
                                    Từ chối
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </motion.div>
        </main>
      </div>

      {/* Process Modal */}
      <AnimatePresence>
        {selectedRequest && actionType && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedRequest(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-[#081734] p-6 shadow-2xl"
            >
              <h2 className="text-2xl font-black text-white">
                {actionType === 'approved' ? 'Duyệt yêu cầu rút tiền' : 'Từ chối yêu cầu'}
              </h2>
              
              <div className="mt-4 rounded-xl bg-white/5 p-4 space-y-2 text-sm text-slate-300">
                <p>Số tiền: <strong className="text-white text-lg">{selectedRequest.amount.toLocaleString('vi-VN')} đ</strong></p>
                <p>Ngân hàng: <strong className="text-white">{selectedRequest.bankName}</strong></p>
                <p>Chủ tài khoản: <strong className="text-white">{selectedRequest.bankAccountName}</strong></p>
                <p>Số tài khoản: <strong className="text-white font-mono">{selectedRequest.bankAccountNumber}</strong></p>
              </div>

              {actionType === 'approved' && (
                <p className="mt-4 text-sm text-amber-400/90 font-medium">
                  ⚠️ Lưu ý: Vui lòng chuyển khoản cho chủ sân TRƯỚC KHI bấm Duyệt.
                </p>
              )}

              <form onSubmit={handleProcess} className="mt-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Lý do / Lời nhắn (Tùy chọn)</label>
                  <textarea
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder={actionType === 'rejected' ? "Bắt buộc nhập lý do từ chối..." : "Đã chuyển khoản (UNC: ...)"}
                    rows={3}
                    required={actionType === 'rejected'}
                    className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white placeholder:text-slate-500 focus:border-white/30 focus:outline-none focus:ring-1 focus:ring-white/30 transition resize-none"
                  />
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedRequest(null)}
                    className="flex-1 rounded-xl bg-white/5 py-3 text-sm font-bold text-white hover:bg-white/10 transition"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className={`flex-1 rounded-xl py-3 text-sm font-bold shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed ${
                      actionType === 'approved' 
                        ? 'bg-emerald-500 text-white hover:bg-emerald-400' 
                        : 'bg-rose-500 text-white hover:bg-rose-400'
                    }`}
                  >
                    {isProcessing ? 'Đang xử lý...' : actionType === 'approved' ? 'Đã Chuyển Khoản & Duyệt' : 'Từ Chối'}
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
