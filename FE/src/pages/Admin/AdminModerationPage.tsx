import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '../../components';

// ─── Types ────────────────────────────────────────────────────────────────────

type ModerationTab = 'reviews' | 'chat' | 'reports';
type ItemStatus    = 'pending' | 'approved' | 'removed' | 'dismissed' | 'resolved';

type ReviewItem = { id: string; reviewer: string; stadiumName: string; rating: number; content: string; flagReason: string; reportedAt: string; status: ItemStatus };
type ChatItem   = { id: string; sender: string; receiver: string; content: string; flagReason: string; reportedAt: string; status: ItemStatus };
type ReportItem = { id: string; reporterName: string; targetName: string; targetType: 'user' | 'stadium'; reason: string; description: string; reportedAt: string; status: ItemStatus };

// ─── Mock data ────────────────────────────────────────────────────────────────

const mockReviews: ReviewItem[] = [
  { id: 'RV-001', reviewer: 'Nguyễn Văn A', stadiumName: 'Champions Arena',       rating: 1, content: 'Sân này rất tệ, chủ sân lừa đảo, tiền mất tật mang!!!',         flagReason: 'Ngôn từ xúc phạm',   reportedAt: '2026-05-20', status: 'pending'  },
  { id: 'RV-002', reviewer: 'Trần Thị B',   stadiumName: 'Victory Badminton Hub', rating: 1, content: 'Không bao giờ đặt sân này nữa. Chủ sân thái độ rất xấu.',        flagReason: 'Nội dung tiêu cực',   reportedAt: '2026-05-19', status: 'pending'  },
  { id: 'RV-003', reviewer: 'Lê Quốc C',    stadiumName: 'Neo Pickleball Court',  rating: 2, content: 'Sân bình thường nhưng vệ sinh kém.',                             flagReason: 'Báo cáo sai',         reportedAt: '2026-05-18', status: 'dismissed'},
  { id: 'RV-004', reviewer: 'Phạm Minh D',  stadiumName: 'Sunrise Football Zone', rating: 1, content: 'Bọn này quảng cáo sai sự thật! Sân không đúng như hình ảnh!!!',  flagReason: 'Thông tin sai lệch',  reportedAt: '2026-05-17', status: 'removed'  },
  { id: 'RV-005', reviewer: 'Vũ Thị E',     stadiumName: 'Champions Arena',       rating: 1, content: 'Tệ nhất từ trước đến giờ, đừng ai đặt sân này!',                flagReason: 'Ngôn từ xúc phạm',   reportedAt: '2026-05-16', status: 'pending'  },
];
const mockChats: ChatItem[] = [
  { id: 'CH-001', sender: 'Nguyễn Văn A', receiver: 'Chủ sân Champions', content: 'Tôi sẽ kiện ông ra tòa nếu không hoàn tiền ngay!',       flagReason: 'Đe dọa',            reportedAt: '2026-05-20', status: 'pending'  },
  { id: 'CH-002', sender: 'Trần Thị B',   receiver: 'Lê Quốc C',        content: 'Link cờ bạc online siêu hot: http://xxx...',              flagReason: 'Spam / Link xấu',   reportedAt: '2026-05-19', status: 'removed'  },
  { id: 'CH-003', sender: 'Phạm Minh D',  receiver: 'Hỗ trợ khách hàng',content: 'Tại sao hệ thống không hoàn tiền? Tôi rất tức giận!!!',  flagReason: 'Ngôn từ thô tục',   reportedAt: '2026-05-18', status: 'dismissed'},
  { id: 'CH-004', sender: 'Hoàng Anh T',  receiver: 'Vũ Thị H',         content: 'Mua bán tài khoản giá rẻ, liên hệ Zalo: 09xxxxxxxx',    flagReason: 'Vi phạm chính sách',reportedAt: '2026-05-17', status: 'pending'  },
];
const mockReports: ReportItem[] = [
  { id: 'RP-001', reporterName: 'Nguyễn Văn A', targetName: 'Phạm Minh D',           targetType: 'user',    reason: 'Lừa đảo',              description: 'Người dùng này nhận tiền đặt sân rồi biến mất.',             reportedAt: '2026-05-21', status: 'pending'  },
  { id: 'RP-002', reporterName: 'Trần Thị B',   targetName: 'Sunrise Football Zone', targetType: 'stadium', reason: 'Thông tin sai',         description: 'Sân quảng cáo sức chứa 11v11 nhưng thực tế chỉ 7v7.',       reportedAt: '2026-05-20', status: 'pending'  },
  { id: 'RP-003', reporterName: 'Lê Quốc C',    targetName: 'Hoàng Anh T',           targetType: 'user',    reason: 'Spam',                  description: 'Tài khoản này liên tục gửi link quảng cáo vào chat của tôi.',reportedAt: '2026-05-19', status: 'resolved' },
  { id: 'RP-004', reporterName: 'Vũ Thị H',     targetName: 'Champions Arena',       targetType: 'stadium', reason: 'Nội dung không phù hợp',description: 'Ảnh sân chứa nội dung quảng cáo sản phẩm không liên quan.',  reportedAt: '2026-05-18', status: 'dismissed'},
  { id: 'RP-005', reporterName: 'Đỗ Thanh L',   targetName: 'Trần Thị B',           targetType: 'user',    reason: 'Quấy rối',              description: 'Người dùng này liên tục nhắn tin gây phiền nhiễu.',          reportedAt: '2026-05-17', status: 'pending'  },
];

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<ItemStatus, string> = { pending: 'Chờ duyệt', approved: 'Đã duyệt', removed: 'Đã xóa', dismissed: 'Bỏ qua', resolved: 'Đã xử lý' };
const STATUS_CLS:   Record<ItemStatus, string> = {
  pending:   'bg-amber-500/15 text-amber-200 ring-1 ring-amber-400/30',
  approved:  'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30',
  removed:   'bg-rose-500/15 text-rose-200 ring-1 ring-rose-400/30',
  dismissed: 'bg-slate-500/15 text-slate-400 ring-1 ring-slate-500/20',
  resolved:  'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30',
};
const fmtDate = (iso: string) => { const [y,m,d] = iso.split('-'); return `${d}/${m}/${y}`; };

// ─── Icons ────────────────────────────────────────────────────────────────────

const TrashIcon = () => (
  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);
const CheckIcon = () => (
  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2"><path d="m5 12 5 5L20 7" /></svg>
);
const MinusIcon = () => (
  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14" /></svg>
);
const FlagIcon = () => (
  <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" />
  </svg>
);
const StarIcon = ({ filled }: { filled: boolean }) => (
  <svg viewBox="0 0 24 24" className="h-3 w-3" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);
const XCloseIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

// ─── Shared components ────────────────────────────────────────────────────────

const FlagBadge: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2 py-0.5 text-[11px] font-semibold text-rose-300 ring-1 ring-rose-400/20">
    <FlagIcon />{children}
  </span>
);

const StatusBadge: React.FC<{ status: ItemStatus }> = ({ status }) => (
  <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_CLS[status]}`}>
    {STATUS_LABEL[status]}
  </span>
);

type ActionSet = { onApprove?: () => void; onRemove: () => void; onDismiss: () => void; status: ItemStatus };
const ActionButtons: React.FC<ActionSet> = ({ onApprove, onRemove, onDismiss, status }) => {
  if (status !== 'pending') return <span className="text-xs text-slate-600 italic">Đã xử lý</span>;
  return (
    <div className="flex items-center gap-1.5">
      {onApprove && (
        <button onClick={onApprove} className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-500/30">
          <CheckIcon /> Duyệt
        </button>
      )}
      <button onClick={onRemove} className="inline-flex items-center gap-1 rounded-lg bg-rose-500/15 px-2.5 py-1 text-xs font-semibold text-rose-200 transition hover:bg-rose-500/30">
        <TrashIcon /> Xóa
      </button>
      <button onClick={onDismiss} className="inline-flex items-center gap-1 rounded-lg bg-slate-500/15 px-2.5 py-1 text-xs font-semibold text-slate-300 transition hover:bg-slate-500/25">
        <MinusIcon /> Bỏ qua
      </button>
    </div>
  );
};

// ─── Detail Modal ─────────────────────────────────────────────────────────────

type DetailPayload =
  | { type: 'review'; item: ReviewItem }
  | { type: 'chat';   item: ChatItem   }
  | { type: 'report'; item: ReportItem };

const DetailModal: React.FC<{ payload: DetailPayload; onClose: () => void }> = ({ payload, onClose }) => {
  const { type, item } = payload;
  const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div className="flex gap-4">
      <span className="w-36 shrink-0 text-xs font-semibold text-slate-500 pt-0.5">{label}</span>
      <span className="flex-1 text-slate-200 text-sm">{children}</span>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl border border-white/[0.08] bg-[#0D1220] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/[0.07] px-6 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
              {type === 'review' ? 'Chi tiết đánh giá' : type === 'chat' ? 'Chi tiết tin nhắn' : 'Chi tiết báo cáo'}
            </p>
            <p className="mt-0.5 font-bold text-white">{item.id}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/[0.08] hover:text-white">
            <XCloseIcon />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          {type === 'review' && (
            <>
              <Row label="Người đánh giá">{item.reviewer}</Row>
              <Row label="Sân">{item.stadiumName}</Row>
              <Row label="Điểm">
                <span className="flex items-center gap-0.5 text-amber-400">
                  {[1,2,3,4,5].map(i => <StarIcon key={i} filled={i <= item.rating} />)}
                  <span className="ml-1 text-slate-300 text-xs">{item.rating}/5</span>
                </span>
              </Row>
              <Row label="Nội dung">
                <span className="italic text-slate-300">"{item.content}"</span>
              </Row>
              <Row label="Lý do gắn cờ"><FlagBadge>{item.flagReason}</FlagBadge></Row>
              <Row label="Ngày báo cáo">{fmtDate(item.reportedAt)}</Row>
              <Row label="Trạng thái"><StatusBadge status={item.status} /></Row>
            </>
          )}
          {type === 'chat' && (
            <>
              <Row label="Người gửi">{item.sender}</Row>
              <Row label="Người nhận">{item.receiver}</Row>
              <Row label="Nội dung">
                <span className="block rounded-lg border border-white/[0.06] bg-white/[0.04] px-3 py-2 font-mono text-xs text-slate-300">"{item.content}"</span>
              </Row>
              <Row label="Lý do gắn cờ"><FlagBadge>{item.flagReason}</FlagBadge></Row>
              <Row label="Ngày báo cáo">{fmtDate(item.reportedAt)}</Row>
              <Row label="Trạng thái"><StatusBadge status={item.status} /></Row>
            </>
          )}
          {type === 'report' && (
            <>
              <Row label="Người báo cáo">{item.reporterName}</Row>
              <Row label="Đối tượng">
                <span className="mr-2">{item.targetName}</span>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${item.targetType === 'user' ? 'bg-blue-500/20 text-blue-300' : 'bg-violet-500/20 text-violet-300'}`}>
                  {item.targetType === 'user' ? 'Người dùng' : 'Sân'}
                </span>
              </Row>
              <Row label="Lý do"><FlagBadge>{item.reason}</FlagBadge></Row>
              <Row label="Mô tả"><span className="text-slate-300">{item.description}</span></Row>
              <Row label="Ngày báo cáo">{fmtDate(item.reportedAt)}</Row>
              <Row label="Trạng thái"><StatusBadge status={item.status} /></Row>
            </>
          )}
        </div>

        <div className="border-t border-white/[0.07] px-6 py-4 flex justify-end">
          <button onClick={onClose} className="rounded-xl border border-white/10 bg-white/[0.04] px-5 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.08]">
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Card wrapper ─────────────────────────────────────────────────────────────

const ItemCard: React.FC<{ pending?: boolean; accent?: string; children: React.ReactNode }> = ({ pending, accent = 'border-white/[0.06]', children }) => (
  <article className={`rounded-xl border p-4 transition-colors ${pending ? `${accent} bg-white/[0.025]` : 'border-white/[0.04] bg-white/[0.015]'}`}>
    {children}
  </article>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

export const AdminModerationPage: React.FC = () => {
  const [tab,          setTab]          = useState<ModerationTab>('reviews');
  const [statusFilter, setStatusFilter] = useState<'all' | ItemStatus>('all');
  const [reviews,      setReviews]      = useState<ReviewItem[]>(mockReviews);
  const [chats,        setChats]        = useState<ChatItem[]>(mockChats);
  const [reports,      setReports]      = useState<ReportItem[]>(mockReports);
  const [detail,       setDetail]       = useState<DetailPayload | null>(null);
  const [toast,        setToast]        = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const updateReview = (id: string, status: ItemStatus) => {
    setReviews(p => p.map(r => r.id === id ? { ...r, status } : r));
    const m: Record<string, string> = { approved: 'Đã duyệt đánh giá.', removed: 'Đã xóa đánh giá.', dismissed: 'Đã bỏ qua.' };
    showToast(m[status] ?? '');
  };
  const updateChat = (id: string, status: ItemStatus) => {
    setChats(p => p.map(c => c.id === id ? { ...c, status } : c));
    const m: Record<string, string> = { removed: 'Đã xóa tin nhắn.', dismissed: 'Đã bỏ qua.' };
    showToast(m[status] ?? '');
  };
  const updateReport = (id: string, status: ItemStatus) => {
    setReports(p => p.map(r => r.id === id ? { ...r, status } : r));
    const m: Record<string, string> = { resolved: 'Đã xử lý báo cáo.', removed: 'Đã xóa báo cáo.', dismissed: 'Đã bỏ qua.' };
    showToast(m[status] ?? '');
  };

  const stats = useMemo(() => ({
    pendingReviews: reviews.filter(r => r.status === 'pending').length,
    pendingChats:   chats.filter(c => c.status === 'pending').length,
    pendingReports: reports.filter(r => r.status === 'pending').length,
  }), [reviews, chats, reports]);

  const totalPending = stats.pendingReviews + stats.pendingChats + stats.pendingReports;

  const filteredReviews = useMemo(() => statusFilter === 'all' ? reviews : reviews.filter(r => r.status === statusFilter), [reviews, statusFilter]);
  const filteredChats   = useMemo(() => statusFilter === 'all' ? chats   : chats.filter(c => c.status === statusFilter),   [chats, statusFilter]);
  const filteredReports = useMemo(() => statusFilter === 'all' ? reports : reports.filter(r => r.status === statusFilter), [reports, statusFilter]);

  const TABS: { key: ModerationTab; label: string; count: number; emoji: string }[] = [
    { key: 'reviews', label: 'Đánh giá',   count: stats.pendingReviews, emoji: '⭐' },
    { key: 'chat',    label: 'Tin nhắn',   count: stats.pendingChats,   emoji: '💬' },
    { key: 'reports', label: 'Báo cáo',    count: stats.pendingReports, emoji: '🚨' },
  ];

  return (
    <AdminLayout activeKey="moderation">
      <div className="min-h-screen bg-gradient-to-br from-[#070B14] via-[#0A0F1E] to-[#080C17] px-4 sm:px-6 lg:px-8 py-8 text-white">
        <div className="mx-auto max-w-7xl space-y-6">

          {/* ── Header ── */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-cyan-400">Admin / Kiểm duyệt</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight">Kiểm duyệt nội dung</h1>
              <p className="mt-1 text-sm text-slate-400">Xét duyệt đánh giá, tin nhắn và xử lý báo cáo vi phạm</p>
            </div>
            <div className="flex items-center gap-3">
              {totalPending > 0 && (
                <span className="rounded-full border border-amber-400/30 bg-amber-500/15 px-3 py-1.5 text-sm font-bold text-amber-200">
                  {totalPending} chờ xử lý
                </span>
              )}
              <Link to="/admin/dashboard" className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.08]">
                ← Dashboard
              </Link>
            </div>
          </div>

          {/* ── Stat Cards ── */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Đánh giá chờ duyệt', value: stats.pendingReviews, grad: 'from-amber-500/15 to-orange-600/10', border: 'border-amber-500/20',  text: 'text-amber-100'  },
              { label: 'Tin nhắn bị báo cáo', value: stats.pendingChats,   grad: 'from-blue-500/15 to-indigo-600/10',  border: 'border-blue-500/20',   text: 'text-blue-100'   },
              { label: 'Báo cáo mới',         value: stats.pendingReports, grad: 'from-rose-500/15 to-red-600/10',     border: 'border-rose-500/20',   text: 'text-rose-100'   },
            ].map(s => (
              <div key={s.label} className={`rounded-2xl border ${s.border} bg-gradient-to-br ${s.grad} p-5`}>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">{s.label}</p>
                <p className={`mt-2 text-3xl font-black ${s.text}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* ── Content ── */}
          <section className="rounded-2xl border border-white/[0.07] bg-white/[0.025] overflow-hidden">
            {/* Tab bar */}
            <div className="flex flex-col gap-3 border-b border-white/[0.06] px-6 pt-4 pb-0 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex">
                {TABS.map(t => (
                  <button
                    key={t.key}
                    onClick={() => { setTab(t.key); setStatusFilter('all'); }}
                    className={`relative flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-colors ${tab === t.key ? 'text-white' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    <span>{t.emoji}</span>
                    {t.label}
                    {t.count > 0 && (
                      <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${tab === t.key ? 'bg-amber-500/25 text-amber-200' : 'bg-white/10 text-slate-400'}`}>{t.count}</span>
                    )}
                    {tab === t.key && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 rounded-t-full" />}
                  </button>
                ))}
              </div>
              <div className="pb-3">
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value as 'all' | ItemStatus)}
                  className="rounded-xl border border-white/10 bg-[#0A0F1E] px-3 py-2 text-sm text-white outline-none"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="pending">Chờ duyệt</option>
                  <option value="approved">Đã duyệt</option>
                  <option value="removed">Đã xóa</option>
                  <option value="dismissed">Bỏ qua</option>
                  <option value="resolved">Đã xử lý</option>
                </select>
              </div>
            </div>

            <div className="p-5 space-y-3">

              {/* ── Reviews ── */}
              {tab === 'reviews' && (
                filteredReviews.length === 0 ? <EmptyState /> : filteredReviews.map(item => (
                  <ItemCard key={item.id} pending={item.status === 'pending'} accent="border-amber-500/15">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="font-bold text-white">{item.reviewer}</span>
                          <span className="text-slate-500 text-xs">→</span>
                          <span className="text-slate-300 text-sm">{item.stadiumName}</span>
                          <span className="flex items-center gap-0.5 text-amber-400">
                            {[1,2,3,4,5].map(i => <StarIcon key={i} filled={i <= item.rating} />)}
                          </span>
                          <StatusBadge status={item.status} />
                        </div>
                        <p className="text-sm text-slate-400 line-clamp-2 italic">"{item.content}"</p>
                        <div className="mt-2 flex flex-wrap items-center gap-3">
                          <FlagBadge>{item.flagReason}</FlagBadge>
                          <span className="text-xs text-slate-600">{fmtDate(item.reportedAt)}</span>
                          <button onClick={() => setDetail({ type: 'review', item })} className="text-xs text-cyan-400 hover:underline transition">
                            Chi tiết
                          </button>
                        </div>
                      </div>
                      <ActionButtons
                        status={item.status}
                        onApprove={() => updateReview(item.id, 'approved')}
                        onRemove={() => updateReview(item.id, 'removed')}
                        onDismiss={() => updateReview(item.id, 'dismissed')}
                      />
                    </div>
                  </ItemCard>
                ))
              )}

              {/* ── Chat ── */}
              {tab === 'chat' && (
                filteredChats.length === 0 ? <EmptyState /> : filteredChats.map(item => (
                  <ItemCard key={item.id} pending={item.status === 'pending'} accent="border-blue-500/15">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="font-bold text-white">{item.sender}</span>
                          <span className="text-slate-500 text-xs">→</span>
                          <span className="text-slate-300 text-sm">{item.receiver}</span>
                          <StatusBadge status={item.status} />
                        </div>
                        <p className="text-sm text-slate-400 line-clamp-2 font-mono rounded-lg bg-white/[0.04] px-3 py-2">{item.content}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-3">
                          <FlagBadge>{item.flagReason}</FlagBadge>
                          <span className="text-xs text-slate-600">{fmtDate(item.reportedAt)}</span>
                          <button onClick={() => setDetail({ type: 'chat', item })} className="text-xs text-cyan-400 hover:underline transition">Chi tiết</button>
                        </div>
                      </div>
                      <ActionButtons status={item.status} onRemove={() => updateChat(item.id, 'removed')} onDismiss={() => updateChat(item.id, 'dismissed')} />
                    </div>
                  </ItemCard>
                ))
              )}

              {/* ── Reports ── */}
              {tab === 'reports' && (
                filteredReports.length === 0 ? <EmptyState /> : filteredReports.map(item => (
                  <ItemCard key={item.id} pending={item.status === 'pending'} accent="border-rose-500/15">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="font-bold text-white">{item.reporterName}</span>
                          <span className="text-slate-500 text-xs">báo cáo</span>
                          <span className="font-semibold text-slate-200">{item.targetName}</span>
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${item.targetType === 'user' ? 'bg-blue-500/20 text-blue-300' : 'bg-violet-500/20 text-violet-300'}`}>
                            {item.targetType === 'user' ? 'Người dùng' : 'Sân'}
                          </span>
                          <StatusBadge status={item.status} />
                        </div>
                        <p className="text-sm text-slate-400 line-clamp-2">{item.description}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-3">
                          <FlagBadge>{item.reason}</FlagBadge>
                          <span className="text-xs text-slate-600">{fmtDate(item.reportedAt)}</span>
                          <button onClick={() => setDetail({ type: 'report', item })} className="text-xs text-cyan-400 hover:underline transition">Chi tiết</button>
                        </div>
                      </div>
                      <ActionButtons
                        status={item.status}
                        onRemove={() => updateReport(item.id, 'removed')}
                        onDismiss={() => updateReport(item.id, 'dismissed')}
                      />
                    </div>
                  </ItemCard>
                ))
              )}
            </div>
          </section>
        </div>
      </div>

      {detail && <DetailModal payload={detail} onClose={() => setDetail(null)} />}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[60] rounded-xl border border-emerald-400/30 bg-emerald-500/20 px-4 py-3 text-sm font-semibold text-emerald-200 shadow-xl backdrop-blur-sm">
          ✓ {toast}
        </div>
      )}
    </AdminLayout>
  );
};

const EmptyState = () => (
  <div className="py-20 text-center">
    <p className="text-5xl mb-3">✓</p>
    <p className="font-semibold text-slate-400">Không có nội dung nào cần xử lý.</p>
  </div>
);
