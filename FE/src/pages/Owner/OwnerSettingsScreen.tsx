import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { OwnerSidebar } from './OwnerSidebar';
import { 
  getCurrentUserProfile, 
  getMySubscription, 
  cancelMySubscription, 
  type AuthUser, 
  type FESubscription 
} from '../../Axios/Axios';

export const OwnerSettingsScreen: React.FC = () => {
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => localStorage.getItem('ownerSidebarCollapsed') === '1');
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [subscription, setSubscription] = useState<FESubscription | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<boolean>(false);

  useEffect(() => {
    localStorage.setItem('ownerSidebarCollapsed', sidebarCollapsed ? '1' : '0');
  }, [sidebarCollapsed]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load user profile
      const profileResponse = await getCurrentUserProfile();
      setCurrentUser(profileResponse.user);

      // Load active subscription details
      try {
        const subData = await getMySubscription();
        setSubscription(subData);
      } catch (subErr) {
        // If 404 or no active subscription, it will return error - we catch and set subscription to null
        setSubscription(null);
      }
    } catch (err: any) {
      console.error('Error loading settings data:', err);
      setError('Không thể tải thông tin cài đặt. Vui lòng đăng nhập lại.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();

    // Listen to currentUserUpdated event
    const handleUpdate = () => {
      void loadData();
    };
    window.addEventListener('currentUserUpdated', handleUpdate);
    return () => {
      window.removeEventListener('currentUserUpdated', handleUpdate);
    };
  }, []);

  const handleCancelSubscription = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy gói đăng ký hiện tại? Giới hạn tính năng của bạn sẽ bị hạ về mặc định sau khi gói hết hạn.')) {
      return;
    }

    try {
      setCancelling(true);
      await cancelMySubscription();
      alert('Đã hủy gia hạn gói thành công. Quyền lợi của bạn vẫn được giữ nguyên cho đến hết chu kỳ.');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Hủy đăng ký thất bại. Vui lòng liên hệ hỗ trợ.');
    } finally {
      setCancelling(false);
    }
  };

  const getStatusBadge = (status: FESubscription['status']) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-300 ring-1 ring-emerald-400/30">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Đang Hoạt Động
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 px-3 py-1 text-xs font-bold text-amber-300 ring-1 ring-amber-400/30">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            Đã Hủy Tự Động Gia Hạn
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/20 px-3 py-1 text-xs font-bold text-rose-300 ring-1 ring-rose-400/30">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
            Hết Hạn
          </span>
        );
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#020B1F] text-slate-100 font-sans">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(37,99,235,0.16),transparent_32%),radial-gradient(circle_at_80%_10%,rgba(14,165,233,0.1),transparent_28%)]" />

      <div
        className="relative z-10 grid min-h-screen w-full grid-cols-1 transition-[grid-template-columns] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-[grid-template-columns] xl:[grid-template-columns:var(--owner-sidebar-width)_minmax(0,1fr)]"
        style={{ ['--owner-sidebar-width' as string]: sidebarCollapsed ? '92px' : '300px' } as React.CSSProperties}
      >
        <OwnerSidebar
          activeKey="settings"
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
        />

        <main className="arena-scroll min-h-screen px-4 py-6 md:px-6 lg:px-8 xl:max-h-screen xl:overflow-y-auto">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full space-y-8">
            
            {/* Header */}
            <header className="border-b border-white/10 pb-5">
              <h1 className="text-4xl font-black tracking-tight text-white sm:text-3xl">Cài Đặt Hệ Thống</h1>
              <p className="mt-1 text-sm text-slate-400">Cập nhật cấu hình, thông tin tài khoản và kiểm soát gói dịch vụ chủ sân.</p>
            </header>

            {loading ? (
              <div className="flex h-96 flex-col items-center justify-center space-y-4 rounded-3xl border border-white/10 bg-[#081734]/50 backdrop-blur-md">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
                <p className="text-slate-400 font-semibold text-sm">Đang đồng bộ hóa dữ liệu từ máy chủ...</p>
              </div>
            ) : error ? (
              <div className="flex h-96 flex-col items-center justify-center p-6 text-center rounded-3xl border border-rose-500/20 bg-rose-500/5">
                <span className="text-4xl mb-4">⚠️</span>
                <h3 className="text-lg font-bold text-rose-300">{error}</h3>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/20 px-6 py-2.5 text-xs font-semibold text-rose-200 transition hover:bg-rose-500/30"
                >
                  Thử lại
                </button>
              </div>
            ) : (
              <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
                
                {/* Left Section - Profile Info */}
                <div className="space-y-6">
                  <h2 className="text-[22px] font-black text-white tracking-tight flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 text-sm">👤</span>
                    Thông Tin Chủ Sân
                  </h2>

                  <section className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-[#081734]/85 p-5 shadow-sm">
                      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">Tên chủ sân</p>
                      <p className="mt-2 text-lg font-extrabold text-white">
                        {currentUser?.name || currentUser?.userName || 'Chưa cập nhật'}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-[#081734]/85 p-5 shadow-sm">
                      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">Địa chỉ Email</p>
                      <p className="mt-2 text-lg font-extrabold text-white truncate">
                        {currentUser?.email || 'Chưa cập nhật'}
                      </p>
                    </div>
                  </section>

                  <section className="rounded-2xl border border-white/10 bg-[#081734]/85 p-5">
                    <h3 className="text-lg font-bold text-white mb-4">Bảo Mật & Tài Khoản</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-sm">
                        <div>
                          <p className="font-semibold text-slate-200">Vai trò người dùng</p>
                          <p className="text-xs text-slate-400">Quyền phân vùng quản trị của bạn</p>
                        </div>
                        <span className="rounded-lg bg-blue-500/25 px-3 py-1 text-xs font-bold text-blue-200 border border-blue-400/20 uppercase">
                          {currentUser?.role || 'owner'}
                        </span>
                      </div>
                      
                      <div className="h-px bg-white/10" />

                      <div className="flex items-center justify-between text-sm">
                        <div>
                          <p className="font-semibold text-slate-200">Mật khẩu</p>
                          <p className="text-xs text-slate-400">Thay đổi thông tin đăng nhập định kỳ</p>
                        </div>
                        <button 
                          onClick={() => alert('Chức năng đổi mật khẩu đang được phát triển.')}
                          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
                        >
                          Cập Nhật
                        </button>
                      </div>
                    </div>
                  </section>
                </div>

                {/* Right Section - Subscription Dashboard */}
                <div className="space-y-6">
                  <h2 className="text-[22px] font-black text-white tracking-tight flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 text-sm">💎</span>
                    Gói Đăng Ký Hệ Thống
                  </h2>

                  <AnimatePresence mode="wait">
                    {subscription ? (
                      <motion.div
                        key="active-sub"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className="relative overflow-hidden rounded-3xl border border-blue-400/40 bg-[linear-gradient(180deg,rgba(8,23,52,0.95),rgba(4,14,35,0.95))] p-6 shadow-[0_22px_60px_-25px_rgba(37,99,235,0.45)]"
                      >
                        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400" />
                        
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <span className="inline-flex rounded-full border border-blue-400/30 bg-blue-500/10 px-3.5 py-0.5 text-[10px] font-extrabold tracking-[0.2em] text-blue-200 uppercase">
                              GÓI KHÁCH HÀNG PREMIUM
                            </span>
                            <h3 className="mt-2 text-3xl font-black text-white bg-gradient-to-r from-white via-slate-100 to-blue-200 bg-clip-text text-transparent">
                              {subscription.plan.displayName || subscription.plan.name.toUpperCase()}
                            </h3>
                          </div>
                          {getStatusBadge(subscription.status)}
                        </div>

                        {/* Usage statistics bar */}
                        <div className="mt-8 space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium text-slate-300">
                              Thời gian sử dụng còn lại: <strong className="text-white font-bold">{subscription.daysRemaining} ngày</strong>
                            </span>
                            <span className="text-xs font-semibold text-blue-300">
                              {Math.max(0, Math.round((subscription.daysRemaining / (subscription.billingCycle === 'yearly' ? 365 : 30)) * 100))}%
                            </span>
                          </div>
                          
                          <div className="h-3 w-full overflow-hidden rounded-full bg-white/10">
                            <motion.div
                              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(100, Math.max(0, Math.round((subscription.daysRemaining / (subscription.billingCycle === 'yearly' ? 365 : 30)) * 100)))}%` }}
                              transition={{ duration: 1.2, ease: 'easeOut' }}
                            />
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-slate-400">
                            <span>Bắt đầu: {new Date(subscription.startDate).toLocaleDateString('vi-VN')}</span>
                            <span>Hết hạn: {new Date(subscription.endDate).toLocaleDateString('vi-VN')}</span>
                          </div>
                        </div>

                        {/* Plan Specs snapshot */}
                        <div className="mt-8 rounded-2xl border border-white/5 bg-slate-900/60 p-4">
                          <h4 className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400 mb-3">Thông số giới hạn được cấp</h4>
                          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 text-xs">
                            <div className="flex items-center gap-2 text-slate-200">
                              <span className="text-emerald-400 text-base">✓</span>
                              Tối đa: <strong>{subscription.currentFeatures.max_locations === -1 ? 'Không giới hạn' : `${subscription.currentFeatures.max_locations} cơ sở`}</strong>
                            </div>
                            <div className="flex items-center gap-2 text-slate-200">
                              <span className="text-emerald-400 text-base">✓</span>
                              Tối đa: <strong>{subscription.currentFeatures.max_courts === -1 ? 'Không giới hạn' : `${subscription.currentFeatures.max_courts} sân bóng`}</strong>
                            </div>
                            <div className="flex items-center gap-2 text-slate-200">
                              <span className="text-emerald-400 text-base">✓</span>
                              Đặt sân online 24/7: <strong>{subscription.currentFeatures.online_booking ? 'Bật' : 'Tắt'}</strong>
                            </div>
                            <div className="flex items-center gap-2 text-slate-200">
                              <span className="text-emerald-400 text-base">✓</span>
                              Ghép đội AI Matchmaking: <strong>{subscription.currentFeatures.ai_matchmaking ? 'Bật' : 'Tắt'}</strong>
                            </div>
                          </div>
                        </div>

                        {/* Cancel Button */}
                        {subscription.status === 'active' && (
                          <div className="mt-8 flex justify-end">
                            <button
                              type="button"
                              onClick={handleCancelSubscription}
                              disabled={cancelling}
                              className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-5 py-3 text-xs font-bold text-rose-300 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {cancelling ? 'Đang hủy...' : 'Hủy gia hạn tự động'}
                            </button>
                          </div>
                        )}
                      </motion.div>
                    ) : (
                      <motion.div
                        key="no-sub"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className="rounded-3xl border border-white/10 bg-[#081734]/75 p-6 text-center space-y-6 shadow-md"
                      >
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-3xl">
                          ⚠️
                        </div>
                        
                        <div>
                          <h3 className="text-xl font-bold text-white">Chưa Đăng Ký Gói Dịch Vụ</h3>
                          <p className="mt-2 text-sm leading-relaxed text-slate-400">
                            Bạn đang sử dụng hệ thống ArenaS ở chế độ cơ bản giới hạn. Đăng ký gói Premium ngay hôm nay để mở khóa không giới hạn cơ sở, sân bóng, các tính năng thống kê chuyên sâu và ghép cặp thông minh!
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => navigate('/bang-gia')}
                          className="w-full rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 py-3.5 text-sm font-bold tracking-wide text-white shadow-[0_12px_30px_-15px_rgba(59,130,246,0.85)] transition hover:from-blue-500 hover:to-blue-400 hover:scale-[1.01]"
                        >
                          Xem Bảng Giá & Nâng Cấp Ngay
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

              </div>
            )}

          </motion.div>
        </main>
      </div>
    </div>
  );
};
