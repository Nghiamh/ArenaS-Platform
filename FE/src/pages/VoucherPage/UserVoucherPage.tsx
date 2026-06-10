import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUserProfile, type AuthUser } from '../../Axios/Axios';
import {
  getPublicVouchers,
  redeemVoucher,
  type VoucherItem,
  type DiscountType,
} from '../../Axios/voucherApi';

const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n);

function discountLabel(type: DiscountType, value: number) {
  return type === 'percent' ? `Giảm ${value}%` : `Giảm ${fmt(value)}đ`;
}

type Toast = { msg: string; type: 'success' | 'error' };

const EARN_RULES = [
  { action: 'Hoàn thành trận đấu', pts: 20, xp: 30, icon: '⚔️' },
  { action: 'Đặt sân thành công', pts: 10, xp: 15, icon: '🏟️' },
  { action: 'Review đối thủ sau trận', pts: 5, xp: 10, icon: '⭐' },
];

export const UserVoucherPage: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [vouchers, setVouchers] = useState<VoucherItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [redeemed, setRedeemed] = useState<Set<string>>(new Set());
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [tab, setTab] = useState<'redeemable' | 'all'>('all');

  const showToast = useCallback((msg: string, type: Toast['type']) => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [profileRes, vouchersRes] = await Promise.all([
        getCurrentUserProfile(),
        getPublicVouchers(),
      ]);
      setUser(profileRes.user);
      setVouchers(vouchersRes);
    } catch (err: any) {
      if (err?.response?.status === 401) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('currentUser');
        window.dispatchEvent(new Event('currentUserUpdated'));
        navigate('/login', { replace: true });
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRedeem = async (voucher: VoucherItem) => {
    if (!user) return;
    if ((user.points ?? 0) < voucher.pointsCost) {
      showToast(`Cần thêm ${voucher.pointsCost - (user.points ?? 0)} điểm để đổi voucher này`, 'error');
      return;
    }
    setRedeeming(voucher._id);
    try {
      const res = await redeemVoucher(voucher._id);
      setUser(prev => prev ? { ...prev, points: res.remainingPoints } : prev);
      setRedeemed(prev => new Set([...prev, voucher._id]));
      showToast(`Đổi thành công! Mã: ${res.voucher.code} — đã trừ ${res.pointsDeducted} điểm`, 'success');
      // Refresh voucher list (usedCount may have changed)
      getPublicVouchers().then(setVouchers).catch(() => {});
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Đổi voucher thất bại';
      showToast(msg, 'error');
    } finally {
      setRedeeming(null);
    }
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    });
  };

  const redeemableVouchers = vouchers.filter(v => (v.pointsCost ?? 0) > 0);
  const freeVouchers = vouchers.filter(v => (v.pointsCost ?? 0) === 0);
  const displayedVouchers = tab === 'redeemable' ? redeemableVouchers : freeVouchers;

  const userPoints = user?.points ?? 0;

  return (
    <div className="relative min-h-screen bg-[#0A0B12] text-slate-100 px-4 py-10 md:px-8 selection:bg-violet-500/30">
      {/* Background glows */}
      <div className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-[80vw] h-[40vh] rounded-full bg-violet-900/10 blur-[120px]" />
      <div className="pointer-events-none fixed bottom-0 right-0 w-[50vw] h-[50vh] rounded-full bg-purple-900/8 blur-[140px]" />

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-8 right-6 z-[9999] flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl border-l-4 animate-[slideIn_0.3s_ease-out] ${
          toast.type === 'success'
            ? 'bg-[#0f1a10] border-l-emerald-500 border-y border-r border-white/10'
            : 'bg-[#1a0f10] border-l-rose-500 border-y border-r border-white/10'
        }`}>
          <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${toast.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
            {toast.type === 'success'
              ? <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              : <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            }
          </div>
          <span className="text-sm font-semibold text-white">{toast.msg}</span>
        </div>
      )}

      <div className="mx-auto max-w-5xl relative z-10">

        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-violet-500/15 border border-violet-500/25 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="h-5 w-5 text-violet-400" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 12V22H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/>
                <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
                <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">Đổi Điểm Lấy Voucher</h1>
              <p className="text-sm text-slate-400">Dùng điểm thưởng tích lũy để đổi voucher giảm giá</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
            <div className="h-12 w-12 rounded-full border-[3px] border-violet-500/30 border-t-violet-400 animate-spin" />
            <p className="text-slate-400 text-sm font-semibold">Đang tải...</p>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6">

            {/* ── LEFT: Points card + earn rules ── */}
            <aside className="w-full lg:w-72 shrink-0 flex flex-col gap-4">

              {/* Points balance card */}
              <div className="rounded-3xl bg-gradient-to-br from-violet-600/20 to-purple-700/10 border border-violet-500/25 p-6 relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-violet-500/60 to-transparent" />
                <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-violet-500/10 blur-2xl" />
                <p className="text-[10px] font-bold text-violet-400 tracking-widest uppercase mb-3">Điểm của bạn</p>
                <div className="flex items-end gap-2 mb-1">
                  <span className="text-5xl font-black text-white leading-none">{fmt(userPoints)}</span>
                  <span className="text-lg font-bold text-violet-400 mb-1">pts</span>
                </div>
                <p className="text-xs text-slate-500 mt-2">XP: <span className="text-amber-400 font-bold">{fmt(user?.xp ?? 0)}</span></p>
                <button
                  onClick={() => navigate('/profile')}
                  className="mt-4 w-full rounded-xl bg-violet-500/15 hover:bg-violet-500/25 border border-violet-500/25 py-2 text-xs font-bold text-violet-300 transition"
                >
                  Xem hồ sơ →
                </button>
              </div>

              {/* How to earn */}
              <div className="rounded-3xl bg-[#10111a] border border-white/[0.05] p-5">
                <p className="text-[10px] font-bold text-slate-500 tracking-widest uppercase mb-4">Cách tích điểm</p>
                <div className="space-y-3">
                  {EARN_RULES.map(r => (
                    <div key={r.action} className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="text-base">{r.icon}</span>
                        <span className="text-xs font-semibold text-slate-300">{r.action}</span>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <span className="text-xs font-black text-violet-300">+{r.pts} pts</span>
                        <span className="text-[10px] text-slate-600 block">+{r.xp} XP</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-white/[0.05]">
                  <p className="text-[10px] text-slate-600">Điểm không có hạn sử dụng. Hủy sân không được cộng điểm.</p>
                </div>
              </div>

              {/* Recently redeemed */}
              {redeemed.size > 0 && (
                <div className="rounded-3xl bg-emerald-500/5 border border-emerald-500/20 p-5">
                  <p className="text-[10px] font-bold text-emerald-400 tracking-widest uppercase mb-3">Đã đổi trong phiên</p>
                  <div className="space-y-2">
                    {[...redeemed].map(id => {
                      const v = vouchers.find(x => x._id === id);
                      if (!v) return null;
                      return (
                        <div key={id} className="flex items-center justify-between">
                          <span className="text-xs text-slate-300 font-semibold truncate">{v.name}</span>
                          <code className="text-[11px] font-black text-emerald-400 ml-2">{v.code}</code>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </aside>

            {/* ── RIGHT: Voucher list ── */}
            <main className="flex-1 min-w-0">

              {/* Tabs */}
              <div className="flex gap-1 mb-5 bg-[#10111a] border border-white/[0.05] rounded-2xl p-1 w-fit">
                {([
                  { key: 'all', label: `Voucher miễn phí (${freeVouchers.length})` },
                  { key: 'redeemable', label: `Đổi bằng điểm (${redeemableVouchers.length})` },
                ] as const).map(t => (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                      tab === t.key
                        ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {displayedVouchers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="h-16 w-16 rounded-2xl bg-slate-800/50 border border-white/5 flex items-center justify-center mb-4">
                    <svg viewBox="0 0 24 24" className="h-8 w-8 text-slate-600" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M20 12V22H4V12"/><path d="M22 7H2v5h20V7z"/>
                    </svg>
                  </div>
                  <p className="text-slate-500 font-semibold">Chưa có voucher trong mục này</p>
                  <p className="text-xs text-slate-600 mt-1">Hãy quay lại sau nhé!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {displayedVouchers.map(v => {
                    const isSystem = v.source === 'system';
                    const canAfford = userPoints >= v.pointsCost;
                    const alreadyRedeemed = redeemed.has(v._id);
                    const remaining = v.maxUses - v.usedCount;
                    const expDate = new Date(v.expiryDate).toLocaleDateString('vi-VN');
                    const isRedeeming = redeeming === v._id;

                    return (
                      <div
                        key={v._id}
                        className={`relative rounded-3xl border overflow-hidden transition-all ${
                          alreadyRedeemed
                            ? 'border-emerald-500/30 bg-gradient-to-br from-emerald-900/10 to-[#10111a]'
                            : 'border-white/[0.07] bg-gradient-to-br from-[#141e2b] to-[#10111a] hover:border-violet-500/30'
                        }`}
                      >
                        {/* Top accent line */}
                        <div className={`h-[2px] w-full ${isSystem ? 'bg-gradient-to-r from-transparent via-violet-500/50 to-transparent' : 'bg-gradient-to-r from-transparent via-amber-500/50 to-transparent'}`} />

                        <div className="p-5">
                          {/* Header row */}
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex items-center gap-2.5">
                              <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${isSystem ? 'bg-violet-500/15 border border-violet-500/25' : 'bg-amber-500/15 border border-amber-500/25'}`}>
                                <svg viewBox="0 0 24 24" className={`h-4.5 w-4.5 ${isSystem ? 'text-violet-400' : 'text-amber-400'}`} fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M20 12V22H4V12"/><path d="M22 7H2v5h20V7z"/>
                                </svg>
                              </div>
                              <div>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isSystem ? 'bg-violet-500/15 text-violet-400' : 'bg-amber-500/15 text-amber-400'}`}>
                                  {isSystem ? 'ArenaS' : (v.partnerName || 'Đối tác')}
                                </span>
                                <p className="text-sm font-bold text-white mt-1 leading-snug">{v.name}</p>
                              </div>
                            </div>
                            {alreadyRedeemed && (
                              <div className="shrink-0 h-6 w-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                              </div>
                            )}
                          </div>

                          {/* Discount value */}
                          <p className="text-2xl font-black text-[#c7f200] mb-1">{discountLabel(v.discountType, v.discountValue)}</p>
                          {v.minOrderValue > 0 && (
                            <p className="text-[11px] text-slate-500 mb-3">Đơn tối thiểu {fmt(v.minOrderValue)}đ</p>
                          )}

                          {/* Code row */}
                          <div className="flex items-center gap-2 mb-4">
                            <code className="flex-1 text-center text-sm font-black tracking-[0.2em] text-white bg-white/[0.06] border border-white/10 rounded-xl px-3 py-1.5">
                              {v.code}
                            </code>
                            <button
                              onClick={() => handleCopy(v.code)}
                              title="Sao chép mã"
                              className="h-9 w-9 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:border-white/20 transition shrink-0"
                            >
                              {copiedCode === v.code
                                ? <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                                : <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                              }
                            </button>
                          </div>

                          {/* Footer: cost + expiry + CTA */}
                          <div className="flex items-center justify-between text-[11px] text-slate-500 mb-4">
                            <span>HSD: {expDate}</span>
                            <span>Còn {remaining} lượt</span>
                          </div>

                          {v.pointsCost > 0 ? (
                            alreadyRedeemed ? (
                              <div className="w-full rounded-xl bg-emerald-500/10 border border-emerald-500/20 py-2.5 text-center text-xs font-bold text-emerald-400">
                                ✓ Đã đổi thành công
                              </div>
                            ) : (
                              <button
                                onClick={() => handleRedeem(v)}
                                disabled={!canAfford || isRedeeming}
                                className={`w-full rounded-xl py-2.5 text-xs font-bold transition flex items-center justify-center gap-2 ${
                                  canAfford
                                    ? 'bg-violet-500/20 hover:bg-violet-500/30 border border-violet-500/30 text-violet-300'
                                    : 'bg-white/[0.03] border border-white/10 text-slate-600 cursor-not-allowed'
                                }`}
                              >
                                {isRedeeming ? (
                                  <div className="h-3.5 w-3.5 rounded-full border-2 border-violet-400/40 border-t-violet-400 animate-spin" />
                                ) : (
                                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                                  </svg>
                                )}
                                <span>
                                  {canAfford
                                    ? `Đổi ngay — ${fmt(v.pointsCost)} điểm`
                                    : `Thiếu ${fmt(v.pointsCost - userPoints)} điểm`
                                  }
                                </span>
                              </button>
                            )
                          ) : (
                            <div className="w-full rounded-xl bg-emerald-500/10 border border-emerald-500/20 py-2.5 text-center text-xs font-bold text-emerald-400">
                              Miễn phí — dùng khi đặt sân
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </main>
          </div>
        )}
      </div>
    </div>
  );
};
