import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminSidebar } from './AdminSidebar';
import { getWithdrawalRequests, processWithdrawal, resolveReport, type WithdrawalRequestInfo } from '../../Axios/walletApi';
import { NotificationBell } from '../../components/NotificationBell';
import { useSocket } from '../../hooks/useSocket';

export const AdminWithdrawalPage: React.FC = () => {
  const [requests, setRequests] = useState<WithdrawalRequestInfo[]>([]);
  const [loading, setLoading] = useState(true);

  // Process Modal
  const [selectedRequest, setSelectedRequest] = useState<WithdrawalRequestInfo | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionType, setActionType] = useState<'approved' | 'rejected' | null>(null);

  // View Report Modal
  const [viewReportModalOpen, setViewReportModalOpen] = useState(false);
  const [reportReq, setReportReq] = useState<WithdrawalRequestInfo | null>(null);
  const [resolutionMessage, setResolutionMessage] = useState('');
  const [isResolving, setIsResolving] = useState(false);

  // Toast Notification State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

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

  const { onNewNotification } = useSocket();
  useEffect(() => {
    const unsubscribe = onNewNotification((payload) => {
      if (
        payload.type === 'withdrawal_requested' || 
        payload.type === 'withdrawal_reported' ||
        payload.type === 'withdrawal_receipt_confirmed'
      ) {
        fetchRequests();
      }
    });
    return unsubscribe;
  }, [onNewNotification]);

  const handleProcess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest || !actionType) return;

    if (actionType === 'rejected' && !adminNote.trim()) {
      showToast("Vui lòng nhập lý do từ chối", "error");
      return;
    }

    setIsProcessing(true);
    try {
      await processWithdrawal(selectedRequest._id, actionType, adminNote);
      await fetchRequests();
      setSelectedRequest(null);
      setAdminNote('');
      setActionType(null);
      showToast(actionType === 'approved' ? 'Đã duyệt yêu cầu rút tiền' : 'Đã từ chối yêu cầu rút tiền', 'success');
    } catch (error: any) {
      showToast(error.message || "Lỗi xử lý yêu cầu", "error");
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

  const openViewReportModal = (req: WithdrawalRequestInfo) => {
    setReportReq(req);
    setResolutionMessage('');
    setViewReportModalOpen(true);
  };

  const handleResolveReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportReq) return;
    setIsResolving(true);
    try {
      await resolveReport(reportReq._id, resolutionMessage);
      await fetchRequests();
      setViewReportModalOpen(false);
      showToast('Đã xử lý báo cáo thành công!', 'success');
    } catch (error: any) {
      showToast(error.message || 'Có lỗi xảy ra khi xử lý báo cáo', 'error');
    } finally {
      setIsResolving(false);
    }
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
                              {req.isReported && (
                                <div className="mt-1 text-xs max-w-[200px] truncate" title={req.reportMessage}>
                                  <span className={req.isReceiptConfirmed ? "text-blue-400" : req.isReportResolved ? "text-emerald-400" : "text-rose-400"}>
                                    {req.isReceiptConfirmed ? '✔️ Đã nhận tiền' : req.isReportResolved ? ' Đã xử lý báo cáo' : `⚠️ Báo cáo: ${req.reportMessage}`}
                                  </span>
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
                              {req.isReported && (
                                <div className="flex justify-end mt-2">
                                  <button
                                    onClick={() => openViewReportModal(req)}
                                    className={`px-3 py-1.5 rounded transition text-xs font-bold ${req.isReportResolved
                                        ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                                        : "bg-white/10 text-white hover:bg-white/20"
                                      }`}
                                  >
                                    {req.isReportResolved ? 'Xem lại xử lý' : 'Xử lý báo cáo'}
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
                    className={`flex-1 rounded-xl py-3 text-sm font-bold shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed ${actionType === 'approved'
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

      {/* View Report Modal */}
      <AnimatePresence>
        {viewReportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewReportModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md overflow-hidden rounded-3xl border border-rose-500/20 bg-[#081734] p-6 shadow-2xl"
            >
              <div className="flex items-center gap-3 text-rose-400 mb-6">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h2 className="text-2xl font-black text-white">Nội dung báo cáo</h2>
              </div>

              <div className="rounded-xl bg-white/5 border border-white/10 p-4 text-sm text-white/90 whitespace-pre-wrap leading-relaxed mb-6">
                {reportReq?.reportMessage || 'Không có nội dung.'}
              </div>

              {reportReq?.isReportResolved ? (
                <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4">
                  <div className="text-emerald-400 font-bold mb-1">Lời nhắn đã gửi:</div>
                  <div className="text-sm text-emerald-300/90 whitespace-pre-wrap">
                    {reportReq.reportResolutionMessage}
                  </div>
                </div>
              ) : (
                <form onSubmit={handleResolveReport} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Lời nhắn phản hồi Chủ sân</label>
                    <textarea
                      required
                      rows={3}
                      value={resolutionMessage}
                      onChange={(e) => setResolutionMessage(e.target.value)}
                      placeholder="VD: Đã kiểm tra lại hệ thống và hoàn tiền..."
                      className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition resize-none"
                    />
                  </div>
                  <div className="pt-2 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setViewReportModalOpen(false)}
                      className="flex-1 rounded-xl bg-white/5 py-3 text-sm font-bold text-white hover:bg-white/10 transition"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={isResolving}
                      className="flex-1 rounded-xl bg-emerald-500 py-3 text-sm font-bold text-white shadow-lg hover:bg-emerald-400 transition disabled:opacity-50"
                    >
                      {isResolving ? 'Đang xử lý...' : 'Xử lý & Gửi'}
                    </button>
                  </div>
                </form>
              )}

              {reportReq?.isReportResolved && (
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => setViewReportModalOpen(false)}
                    className="w-full rounded-xl bg-white/10 py-3 text-sm font-bold text-white hover:bg-white/20 transition"
                  >
                    Đóng
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-2xl shadow-2xl font-bold flex items-center gap-3 ${
              toast.type === 'success' 
                ? 'bg-emerald-500 text-white shadow-emerald-500/20' 
                : 'bg-rose-500 text-white shadow-rose-500/20'
            }`}
          >
            {toast.type === 'success' ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            )}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
