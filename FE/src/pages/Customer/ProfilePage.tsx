import React, { useMemo } from 'react';

type StoredUser = {
  userName?: string;
  email?: string;
};

export const ProfilePage: React.FC = () => {
  const currentUser = useMemo(() => {
    const raw = localStorage.getItem('currentUser');

    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as StoredUser;
    } catch {
      return null;
    }
  }, []);

  const profileName = currentUser?.userName?.trim() || 'Người dùng ArenaS';
  const profileEmail = currentUser?.email?.trim() || 'Chưa có email';
  const avatarInitial = profileName.charAt(0).toUpperCase();

  return (
    <div className="relative overflow-x-clip bg-[radial-gradient(circle_at_15%_10%,rgba(37,99,235,0.22),transparent_30%),radial-gradient(circle_at_90%_10%,rgba(14,165,233,0.18),transparent_28%),linear-gradient(180deg,#020617_0%,#061136_45%,#030712_100%)] px-4 py-14 text-slate-100 md:px-8 md:py-20">
      <div className="mx-auto max-w-5xl">
        <section className="overflow-hidden rounded-3xl border border-blue-300/25 bg-slate-900/70 shadow-[0_24px_60px_-30px_rgba(2,6,23,0.95)] backdrop-blur">
          <div className="h-36 bg-[radial-gradient(circle_at_20%_30%,rgba(59,130,246,0.55),transparent_35%),radial-gradient(circle_at_80%_30%,rgba(34,211,238,0.4),transparent_32%),linear-gradient(100deg,#1d4ed8_0%,#1e40af_52%,#0f172a_100%)]" />

          <div className="px-6 pb-8 md:px-10">
            <div className="-mt-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div className="flex items-end gap-4">
                <div className="flex h-24 w-24 items-center justify-center rounded-3xl border-4 border-slate-900 bg-gradient-to-br from-blue-400 to-cyan-400 text-4xl font-black text-slate-950 shadow-[0_14px_30px_-16px_rgba(56,189,248,0.9)]">
                  {avatarInitial}
                </div>
                <div className="pb-2">
                  <h1 className="text-3xl font-black text-white md:text-4xl">{profileName}</h1>
                  <p className="mt-1 text-sm text-blue-100/85">{profileEmail}</p>
                </div>
              </div>

              <span className="inline-flex h-10 items-center rounded-full border border-emerald-300/35 bg-emerald-500/20 px-4 text-sm font-semibold text-emerald-100">
                Tài khoản đang hoạt động
              </span>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <article className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-slate-300">Trạng thái</p>
                <p className="mt-1 text-lg font-bold text-white">Đã xác thực</p>
              </article>
              <article className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-slate-300">Điểm thưởng</p>
                <p className="mt-1 text-lg font-bold text-white">1.250 CourtPoints</p>
              </article>
              <article className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-slate-300">Vai trò</p>
                <p className="mt-1 text-lg font-bold text-white">Người chơi</p>
              </article>
            </div>

            <div className="mt-6 rounded-2xl border border-blue-300/20 bg-blue-500/10 p-5">
              <h2 className="text-xl font-bold text-white">Thông tin tài khoản</h2>
              <p className="mt-2 text-sm leading-7 text-blue-100/85">
                Đây là trang hồ sơ cá nhân cơ bản. Bạn có thể mở rộng thêm các mục như lịch sử đặt sân,
                thành tích thi đấu, và cấu hình tài khoản trong bước tiếp theo.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
