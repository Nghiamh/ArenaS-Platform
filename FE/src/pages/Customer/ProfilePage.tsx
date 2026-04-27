import React, { useEffect, useRef, useState } from 'react';
import {
  createCurrentUserSkill,
  deleteCurrentUserSkill,
  getCurrentUserProfile,
  getCurrentUserSkills,
  updateCurrentUserProfile,
  updateCurrentUserSkill,
  type AuthUser,
  type UserSkill,
} from '../../Axios/Axios';

const PencilIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M12 20h9" />
    <path d="m16.5 3.5 4 4L7 21H3v-4L16.5 3.5Z" />
  </svg>
);

const CameraIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M4 7h3l2-2h6l2 2h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1Z" />
    <circle cx="12" cy="13" r="3.2" />
  </svg>
);

const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M16 3v4M8 3v4M3 10h18" />
  </svg>
);

const formatDateTime = (value?: string): string => {
  if (!value) {
    return 'Chưa cập nhật';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

const formatDateOnly = (value?: string): string => {
  if (!value) {
    return 'Chưa cập nhật';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Chưa cập nhật';
  }

  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
  }).format(date);
};

const toDateInputValue = (value?: string): string => {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toISOString().slice(0, 10);
};

type ProfileTab = 'profile' | 'skills';

type SkillFormState = {
  sport: string;
  note: string;
  level: string;
  ratingScore: string;
};

const SKILL_SPORT_OPTIONS = [
  'Bóng đá',
  'Tennis',
  'Pickleball',
  'Cầu lông',
];

const ALLOWED_SKILL_SPORTS = new Set(SKILL_SPORT_OPTIONS);

const SKILL_LEVEL_OPTIONS = [
  { value: '1', label: 'Mới bắt đầu' },
  { value: '2', label: 'Cơ bản' },
  { value: '3', label: 'Khá' },
  { value: '4', label: 'Tốt' },
  { value: '5', label: 'Chuyên nghiệp' },
];

const SKILL_RATING_OPTIONS = [
  { value: '1', label: '1 - Rất thấp' },
  { value: '2', label: '2 - Thấp' },
  { value: '3', label: '3 - Trung bình' },
  { value: '4', label: '4 - Cao' },
  { value: '5', label: '5 - Rất cao' },
];

const EMPTY_SKILL_FORM: SkillFormState = {
  sport: '',
  note: '',
  level: '',
  ratingScore: '',
};

const getSkillLevelLabel = (value: number): string =>
  SKILL_LEVEL_OPTIONS.find((option) => option.value === String(value))?.label ?? String(value);

const getSkillRatingLabel = (value: number): string =>
  SKILL_RATING_OPTIONS.find((option) => option.value === String(value))?.label ?? String(value);

const getSkillToneClasses = (value: number): { panel: string; badge: string; accent: string } => {
  if (value <= 2) {
    return {
      panel: 'border-emerald-400/40 bg-gradient-to-br from-emerald-500/30 via-emerald-500/16 to-slate-950/90',
      badge: 'bg-emerald-400/30 text-emerald-50 ring-1 ring-emerald-300/40',
      accent: 'text-emerald-50',
    };
  }

  if (value === 3) {
    return {
      panel: 'border-amber-400/40 bg-gradient-to-br from-amber-500/30 via-amber-500/16 to-slate-950/90',
      badge: 'bg-amber-400/30 text-amber-50 ring-1 ring-amber-300/40',
      accent: 'text-amber-50',
    };
  }

  if (value === 4) {
    return {
      panel: 'border-violet-400/40 bg-gradient-to-br from-violet-500/30 via-violet-500/16 to-slate-950/90',
      badge: 'bg-violet-400/30 text-violet-50 ring-1 ring-violet-300/40',
      accent: 'text-violet-50',
    };
  }

  return {
    panel: 'border-rose-400/45 bg-gradient-to-br from-rose-500/30 via-rose-500/16 to-slate-950/90',
    badge: 'bg-rose-400/30 text-rose-50 ring-1 ring-rose-300/40',
    accent: 'text-rose-50',
  };
};

export const ProfilePage: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [activeTab, setActiveTab] = useState<ProfileTab>('profile');
  const [draftName, setDraftName] = useState('');
  const [draftPhone, setDraftPhone] = useState('');
  const [draftDateOfBirth, setDraftDateOfBirth] = useState('');
  const [draftAvatarUrl, setDraftAvatarUrl] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [skills, setSkills] = useState<UserSkill[]>([]);
  const [skillForm, setSkillForm] = useState<SkillFormState>(EMPTY_SKILL_FORM);
  const [editingSkillId, setEditingSkillId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSkillsLoading, setIsSkillsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSkillSubmitting, setIsSkillSubmitting] = useState(false);
  const [popupErrorMessage, setPopupErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const dateOfBirthInputRef = useRef<HTMLInputElement | null>(null);
  const isRegularUser = currentUser?.role === 'user';
  const usedSports = new Set(skills.map((skill) => skill.sport));
  const availableSports = SKILL_SPORT_OPTIONS.filter((sport) => !usedSports.has(sport));
  const canAddNewSkill = availableSports.length > 0;

  const persistCurrentUser = (user: AuthUser) => {
    if (typeof window === 'undefined') {
      return;
    }

    localStorage.setItem('currentUser', JSON.stringify(user));
    window.dispatchEvent(new Event('currentUserUpdated'));
  };

  const showErrorPopup = (message: string) => {
    const normalized = message.trim();

    if (!normalized || normalized === 'Request failed') {
      setPopupErrorMessage('Không thể lưu hồ sơ lúc này. Vui lòng kiểm tra kết nối server và thử lại.');
      return;
    }

    setPopupErrorMessage(normalized);
  };

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      try {
        setIsLoading(true);

        const response = await getCurrentUserProfile();

        if (isMounted) {
          setCurrentUser(response.user);
          setDraftName(response.user.name ?? '');
          setDraftPhone(response.user.phone ?? '');
          setDraftDateOfBirth(toDateInputValue(response.user.dateOfBirth));
          setDraftAvatarUrl(response.user.avatarUrl ?? '');
          persistCurrentUser(response.user);
        }
      } catch (error: unknown) {
        if (isMounted) {
          const message = error instanceof Error ? error.message : 'Không tải được hồ sơ.';
          showErrorPopup(message);

          const raw = localStorage.getItem('currentUser');
          if (raw) {
            try {
              const fallbackUser = JSON.parse(raw) as AuthUser;
              setCurrentUser(fallbackUser);
              setDraftName(fallbackUser.name ?? fallbackUser.userName ?? '');
              setDraftPhone(fallbackUser.phone ?? '');
              setDraftDateOfBirth(toDateInputValue(fallbackUser.dateOfBirth));
              setDraftAvatarUrl(fallbackUser.avatarUrl ?? '');
            } catch {
              setCurrentUser(null);
            }
          }

          setIsSkillsLoading(false);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadSkills = async () => {
      if (!currentUser) {
        return;
      }

      if (currentUser.role !== 'user') {
        setSkills([]);
        setIsSkillsLoading(false);
        return;
      }

      try {
        setIsSkillsLoading(true);
        const response = await getCurrentUserSkills();

        if (isMounted) {
          setSkills(response.skills);
        }
      } catch (error: unknown) {
        if (isMounted) {
          const message = error instanceof Error ? error.message : 'Không tải được kỹ năng.';
          showErrorPopup(message);
        }
      } finally {
        if (isMounted) {
          setIsSkillsLoading(false);
        }
      }
    };

    void loadSkills();

    return () => {
      isMounted = false;
    };
  }, [currentUser?.role]);

  useEffect(() => {
    if (currentUser?.role !== 'user' && activeTab === 'skills') {
      setActiveTab('profile');
    }
  }, [activeTab, currentUser?.role]);

  const profileName = currentUser?.name?.trim() || currentUser?.userName?.trim() || 'Người dùng ArenaS';
  const profileEmail = currentUser?.email?.trim() || 'Chưa có email';
  const profilePhone = currentUser?.phone?.trim() || 'Chưa cập nhật';
  const profileDateOfBirth = formatDateOnly(currentUser?.dateOfBirth);
  const profileAvatarUrl = (currentUser?.avatarUrl ?? '').trim();
  const currentAvatarUrl = isEditing ? draftAvatarUrl.trim() : profileAvatarUrl;
  const profileRole = currentUser?.role === 'owner' ? 'Chủ sân' : currentUser?.role === 'admin' ? 'Quản trị viên' : 'Người chơi';
  const profileCreatedAt = formatDateTime(currentUser?.createdAt);
  const avatarInitial = profileName.charAt(0).toUpperCase();

  const handleStartEditing = () => {
    setDraftName(currentUser?.name ?? currentUser?.userName ?? '');
    setDraftPhone(currentUser?.phone ?? '');
    setDraftDateOfBirth(toDateInputValue(currentUser?.dateOfBirth));
    setDraftAvatarUrl(currentUser?.avatarUrl ?? '');
    setSuccessMessage('');
    setPopupErrorMessage('');
    setIsEditing(true);
  };

  const handleCancelEditing = () => {
    setDraftName(currentUser?.name ?? currentUser?.userName ?? '');
    setDraftPhone(currentUser?.phone ?? '');
    setDraftDateOfBirth(toDateInputValue(currentUser?.dateOfBirth));
    setDraftAvatarUrl(currentUser?.avatarUrl ?? '');
    setSuccessMessage('');
    setPopupErrorMessage('');
    setIsEditing(false);
  };

  const handlePickAvatar = () => {
    avatarInputRef.current?.click();
  };

  const handleAvatarFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      showErrorPopup('Vui lòng chọn đúng file ảnh cho avatar.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showErrorPopup('Ảnh avatar tối đa 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setDraftAvatarUrl(reader.result);
        setPopupErrorMessage('');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {

    if (draftDateOfBirth) {
      const selectedDate = new Date(draftDateOfBirth);
      if (Number.isNaN(selectedDate.getTime())) {
        showErrorPopup('Ngày sinh không hợp lệ. Vui lòng chọn lại.');
        return;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate > today) {
        showErrorPopup('Ngày sinh không được lớn hơn ngày hiện tại.');
        return;
      }

      const minimumDate = new Date('1900-01-01');
      if (selectedDate < minimumDate) {
        showErrorPopup('Ngày sinh quá xa trong quá khứ. Vui lòng kiểm tra lại.');
        return;
      }
    }

    try {
      setIsSaving(true);
      setSuccessMessage('');
      setPopupErrorMessage('');

      const response = await updateCurrentUserProfile({
        name: draftName.trim(),
        phone: draftPhone.trim(),
        dateOfBirth: draftDateOfBirth,
        avatarUrl: draftAvatarUrl,
      });

      setCurrentUser(response.user);
      setDraftName(response.user.name ?? '');
      setDraftPhone(response.user.phone ?? '');
      setDraftDateOfBirth(toDateInputValue(response.user.dateOfBirth));
      setDraftAvatarUrl(response.user.avatarUrl ?? '');
      persistCurrentUser(response.user);
      setSuccessMessage('Đã lưu thông tin hồ sơ.');
      setIsEditing(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Không lưu được hồ sơ.';
      showErrorPopup(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkillFormChange = (field: keyof SkillFormState, value: string) => {
    setSkillForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const resetSkillForm = () => {
    setSkillForm(EMPTY_SKILL_FORM);
    setEditingSkillId(null);
  };

  const handleStartSkillEdit = (skill: UserSkill) => {
    setSkillForm({
      sport: skill.sport,
      note: skill.note ?? '',
      level: String(skill.level),
      ratingScore: String(skill.rating_score),
    });
    setEditingSkillId(skill.id);
    setSuccessMessage('');
    setPopupErrorMessage('');
  };

  const handleCancelSkillEdit = () => {
    resetSkillForm();
    setSuccessMessage('');
    setPopupErrorMessage('');
  };

  const handleStartSkillCreate = () => {
    if (!canAddNewSkill) {
      showErrorPopup('Bạn đã thêm đủ 4 bộ môn.');
      return;
    }

    const nextSport = availableSports[0] ?? '';

    setSkillForm({
      sport: nextSport,
      note: '',
      level: '',
      ratingScore: '',
    });
    setEditingSkillId('new');
    setSuccessMessage('');
    setPopupErrorMessage('');
    setActiveTab('skills');
  };

  const handleSaveSkill = async () => {
    const sport = skillForm.sport.trim();
    const note = skillForm.note.trim();

    if (!sport || !ALLOWED_SKILL_SPORTS.has(sport)) {
      showErrorPopup('Môn thể thao là bắt buộc.');
      return;
    }

    if (editingSkillId === 'new' && usedSports.has(sport)) {
      showErrorPopup('Môn này đã có rồi. Bạn hãy sửa trực tiếp trên card hiện tại.');
      return;
    }

    const level = Number(skillForm.level);
    const ratingScore = Number(skillForm.ratingScore);

    if (!Number.isInteger(level) || level < 1 || level > 5) {
      showErrorPopup('Level phải là số nguyên từ 1 đến 5.');
      return;
    }

    if (!Number.isInteger(ratingScore) || ratingScore < 1 || ratingScore > 5) {
      showErrorPopup('Tự đánh giá phải là số nguyên từ 1 đến 5.');
      return;
    }

    try {
      setIsSkillSubmitting(true);
      setSuccessMessage('');
      setPopupErrorMessage('');

      const payload = {
        sport,
        note,
        level,
        rating_score: ratingScore,
      };

      const skillToUpdate = editingSkillId && editingSkillId !== 'new'
        ? skills.find((item) => item.id === editingSkillId) ?? null
        : null;

      if (skillToUpdate) {
        const response = await updateCurrentUserSkill(skillToUpdate.id, payload);
        setSkills((prev) =>
          prev.map((item) => (item.id === skillToUpdate.id ? response.skill : item))
        );
        setSuccessMessage('Đã cập nhật kỹ năng.');
      } else {
        const response = await createCurrentUserSkill(payload);
        setSkills((prev) => [response.skill, ...prev]);
        setSuccessMessage('Đã thêm kỹ năng mới.');
      }

      resetSkillForm();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Không thể lưu kỹ năng.';
      showErrorPopup(message);
    } finally {
      setIsSkillSubmitting(false);
    }
  };

  const handleDeleteSkill = async (skillId: string) => {
    const confirmed = window.confirm('Bạn có chắc muốn xóa kỹ năng này?');
    if (!confirmed) {
      return;
    }

    try {
      setIsSkillSubmitting(true);
      setSuccessMessage('');
      setPopupErrorMessage('');

      await deleteCurrentUserSkill(skillId);
      setSkills((prev) => prev.filter((item) => item.id !== skillId));

      if (editingSkillId === skillId) {
        resetSkillForm();
      }

      setSuccessMessage('Đã xóa kỹ năng.');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Không thể xóa kỹ năng.';
      showErrorPopup(message);
    } finally {
      setIsSkillSubmitting(false);
    }
  };

  return (
    <div className="relative overflow-x-clip bg-[radial-gradient(circle_at_15%_10%,rgba(37,99,235,0.22),transparent_30%),radial-gradient(circle_at_90%_10%,rgba(14,165,233,0.18),transparent_28%),linear-gradient(180deg,#020617_0%,#061136_45%,#030712_100%)] px-4 py-14 text-slate-100 md:px-8 md:py-20">
      <div className="mx-auto max-w-5xl">
        <section className="overflow-hidden rounded-3xl border border-blue-300/25 bg-slate-900/70 shadow-[0_24px_60px_-30px_rgba(2,6,23,0.95)] backdrop-blur">
          <div className="h-36 bg-[radial-gradient(circle_at_20%_30%,rgba(59,130,246,0.55),transparent_35%),radial-gradient(circle_at_80%_30%,rgba(34,211,238,0.4),transparent_32%),linear-gradient(100deg,#1d4ed8_0%,#1e40af_52%,#0f172a_100%)]" />

          <div className="px-6 pb-8 md:px-10">
            <div className="-mt-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div className="flex items-end gap-4">
                <div className="relative">
                  <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl border-4 border-slate-900 bg-gradient-to-br from-blue-400 to-cyan-400 text-4xl font-black text-slate-950 shadow-[0_14px_30px_-16px_rgba(56,189,248,0.9)]">
                    {currentAvatarUrl ? (
                      <img src={currentAvatarUrl} alt="avatar" className="h-full w-full object-cover" />
                    ) : (
                      avatarInitial
                    )}
                  </div>

                  {isEditing ? (
                    <button
                      type="button"
                      onClick={handlePickAvatar}
                      className="absolute -bottom-2 -right-2 inline-flex h-8 w-8 items-center justify-center rounded-full border border-blue-200/40 bg-blue-500 text-white transition hover:bg-blue-400"
                      aria-label="Đổi avatar"
                      title="Đổi avatar"
                    >
                      <CameraIcon />
                    </button>
                  ) : null}

                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarFileChange}
                    className="hidden"
                  />
                </div>
                <div className="pb-2">
                  <h1 className="text-2xl font-black text-white md:text-3xl">{profileName}</h1>
                  <p className="mt-1 text-sm text-blue-100/85">{profileEmail}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex h-10 items-center rounded-full border border-emerald-300/35 bg-emerald-500/20 px-4 text-sm font-semibold text-emerald-100">
                  {isLoading ? 'Đang tải hồ sơ' : 'Tài khoản đang hoạt động'}
                </span>

                {!isEditing ? (
                  <button
                    type="button"
                    onClick={handleStartEditing}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-blue-300/35 bg-blue-500/15 text-blue-100 transition hover:bg-blue-500/30"
                    aria-label="Chỉnh sửa hồ sơ"
                    title="Chỉnh sửa hồ sơ"
                  >
                    <PencilIcon />
                  </button>
                ) : null}
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('profile')}
                  className={`inline-flex h-10 items-center rounded-full px-4 text-sm font-bold transition ${
                    activeTab === 'profile'
                      ? 'bg-blue-500 text-white'
                      : 'border border-white/20 text-blue-100 hover:bg-white/10'
                  }`}
                >
                  Hồ sơ
                </button>
                {isRegularUser ? (
                  <button
                    type="button"
                    onClick={() => setActiveTab('skills')}
                    className={`inline-flex h-10 items-center rounded-full px-4 text-sm font-bold transition ${
                      activeTab === 'skills'
                        ? 'bg-blue-500 text-white'
                        : 'border border-white/20 text-blue-100 hover:bg-white/10'
                    }`}
                  >
                    Skill
                  </button>
                ) : null}
              </div>

              {isRegularUser && activeTab === 'skills' ? (
                <button
                  type="button"
                  onClick={handleStartSkillCreate}
                  disabled={!canAddNewSkill}
                  className="inline-flex h-10 items-center justify-center rounded-full bg-blue-500 px-5 text-sm font-bold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Thêm skill
                </button>
              ) : null}
            </div>

            <div className="mt-5 grid gap-5 lg:grid-cols-2">
              {activeTab === 'profile' ? (
                <>
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                      <p className="text-sm text-slate-300">Tên</p>
                      {isEditing ? (
                        <input
                          value={draftName}
                          onChange={(event) => setDraftName(event.target.value)}
                          placeholder="Nhập họ và tên"
                          className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 text-base font-semibold text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400/70"
                        />
                      ) : (
                        <p className="mt-1 text-xl font-bold text-white">{profileName}</p>
                      )}
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                      <p className="text-sm text-slate-300">Số điện thoại</p>
                      {isEditing ? (
                        <input
                          value={draftPhone}
                          onChange={(event) => setDraftPhone(event.target.value)}
                          placeholder="Nhập số điện thoại"
                          className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 text-base font-semibold text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400/70"
                        />
                      ) : (
                        <p className="mt-1 text-xl font-bold text-white">{profilePhone}</p>
                      )}
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                      <p className="text-sm text-slate-300">Ngày sinh</p>
                      {isEditing ? (
                        <div className="mt-2 flex items-center gap-2">
                          <input
                            ref={dateOfBirthInputRef}
                            type="date"
                            value={draftDateOfBirth}
                            onChange={(event) => setDraftDateOfBirth(event.target.value)}
                            max={new Date().toISOString().slice(0, 10)}
                            min="1900-01-01"
                            className="h-11 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 text-base font-semibold text-white outline-none transition focus:border-blue-400/70"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const input = dateOfBirthInputRef.current as (HTMLInputElement & {
                                showPicker?: () => void;
                              }) | null;
                              input?.showPicker?.();
                              input?.focus();
                            }}
                            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-slate-900/70 text-blue-100 transition hover:bg-slate-800"
                            aria-label="Mở lịch chọn ngày sinh"
                            title="Chọn ngày sinh"
                          >
                            <CalendarIcon />
                          </button>
                        </div>
                      ) : (
                        <p className="mt-1 text-xl font-bold text-white">{profileDateOfBirth}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                      <p className="text-sm text-slate-300">Email</p>
                      <p className="mt-1 truncate text-xl font-bold text-white" title={profileEmail}>{profileEmail}</p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                      <p className="text-sm text-slate-300">Vai trò</p>
                      <p className="mt-1 text-xl font-bold text-white">{profileRole}</p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                      <p className="text-sm text-slate-300">Ngày tạo</p>
                      <p className="mt-1 text-xl font-bold text-white">{profileCreatedAt}</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="lg:col-span-2 space-y-5">
                  <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,rgba(15,23,42,0.96),rgba(30,41,59,0.9))] shadow-[0_20px_50px_-30px_rgba(15,23,42,0.95)]">
                    <div className="flex flex-col gap-4 border-b border-white/10 px-5 py-5 md:flex-row md:items-end md:justify-between md:px-6">
                      <div>
                        <h3 className="text-2xl font-black text-white">Kỹ năng của bạn</h3>
                        {skills.length === 0 ? (
                          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                            Thêm skill để tìm đối thủ phù hợp hơn.
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <div className="px-5 py-5 md:px-6">
                      {isSkillsLoading ? (
                        <div className="rounded-3xl border border-white/10 bg-white/5 px-5 py-10 text-sm text-slate-300">
                          Đang tải kỹ năng...
                        </div>
                      ) : skills.length === 0 && editingSkillId !== 'new' ? (
                        <div className="rounded-3xl border border-dashed border-cyan-300/25 bg-slate-950/45 px-6 py-10 text-center">
                          <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-200/70">Chưa có skill</p>
                          <h4 className="mt-3 text-2xl font-black text-white">Thêm skill để tìm đối thủ phù hợp hơn</h4>
                          <p className="mt-3 text-sm leading-6 text-slate-300">
                            Bạn có thể thêm tối đa 4 môn. Nhấn "Thêm skill" để bắt đầu.
                          </p>
                        </div>
                      ) : (
                        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-2">
                          {editingSkillId === 'new' ? (
                            <article className="relative min-h-[340px] overflow-hidden rounded-[28px] border border-cyan-300/25 bg-[linear-gradient(135deg,rgba(15,23,42,0.96),rgba(20,184,166,0.16))] p-6 shadow-[0_22px_50px_-30px_rgba(15,23,42,0.95)] transition hover:animate-pulse">
                              <div className="relative flex h-full flex-col gap-4">
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">Thêm mới</p>
                                    <h4 className="mt-2 text-xl font-bold text-white">Chọn bộ môn</h4>
                                  </div>
                                  <span className="inline-flex h-9 items-center rounded-full bg-cyan-400/25 px-4 text-xs font-semibold text-cyan-50 ring-1 ring-cyan-300/35">
                                    {availableSports.length} môn trống
                                  </span>
                                </div>

                                <select
                                  value={skillForm.sport}
                                  onChange={(event) => handleSkillFormChange('sport', event.target.value)}
                                  className="h-12 rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-base font-semibold text-white outline-none transition focus:border-cyan-300/70"
                                >
                                  {SKILL_SPORT_OPTIONS.map((sport) => (
                                    <option key={sport} value={sport} disabled={usedSports.has(sport)}>
                                      {sport}{usedSports.has(sport) ? ' (đã có)' : ''}
                                    </option>
                                  ))}
                                </select>

                                <textarea
                                  value={skillForm.note}
                                  onChange={(event) => handleSkillFormChange('note', event.target.value)}
                                  placeholder="Ghi chú (không bắt buộc)"
                                  rows={3}
                                  className="min-h-24 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-base font-medium text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/70"
                                />

                                <div className="grid grid-cols-2 gap-3 text-sm">
                                  <select
                                    value={skillForm.level}
                                    onChange={(event) => handleSkillFormChange('level', event.target.value)}
                                    className="h-12 rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-base font-semibold text-white outline-none transition focus:border-cyan-300/70"
                                  >
                                    <option value="">Chọn mức độ</option>
                                    {SKILL_LEVEL_OPTIONS.map((option) => (
                                      <option key={option.value} value={option.value}>
                                        {option.label}
                                      </option>
                                    ))}
                                  </select>

                                  <select
                                    value={skillForm.ratingScore}
                                    onChange={(event) => handleSkillFormChange('ratingScore', event.target.value)}
                                    className="h-12 rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-base font-semibold text-white outline-none transition focus:border-cyan-300/70"
                                  >
                                    <option value="">Chọn tự đánh giá</option>
                                    {SKILL_RATING_OPTIONS.map((option) => (
                                      <option key={option.value} value={option.value}>
                                        {option.label}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                <div className="mt-auto flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    onClick={handleSaveSkill}
                                    disabled={isSkillSubmitting}
                                    className="inline-flex h-10 items-center justify-center rounded-full bg-cyan-500 px-5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    {isSkillSubmitting ? 'Đang lưu...' : 'Lưu skill'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={handleCancelSkillEdit}
                                    disabled={isSkillSubmitting}
                                    className="inline-flex h-10 items-center justify-center rounded-full border border-white/20 bg-white/10 px-5 text-sm font-semibold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    Hủy
                                  </button>
                                </div>
                              </div>
                            </article>
                          ) : null}

                          {skills.map((currentSkill) => {
                            const isEditingCard = editingSkillId === currentSkill.id;

                            if (isEditingCard) {
                              return (
                                <article
                                  key={currentSkill.id}
                                  className="relative min-h-[340px] overflow-hidden rounded-[28px] border border-cyan-300/25 bg-[linear-gradient(135deg,rgba(15,23,42,0.96),rgba(20,184,166,0.16))] p-6 shadow-[0_22px_50px_-30px_rgba(15,23,42,0.95)] transition hover:animate-pulse"
                                >
                                  <div className="relative flex h-full flex-col gap-4">
                                    <div className="flex items-start justify-between gap-3">
                                      <div>
                                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">Đang sửa</p>
                                        <h4 className="mt-2 text-xl font-bold text-white">{currentSkill.sport}</h4>
                                      </div>
                                      <span className="inline-flex h-9 items-center rounded-full bg-cyan-400/25 px-4 text-xs font-semibold text-cyan-50 ring-1 ring-cyan-300/35">
                                        Đã có skill
                                      </span>
                                    </div>

                                    <textarea
                                      value={skillForm.note}
                                      onChange={(event) => handleSkillFormChange('note', event.target.value)}
                                      placeholder="Ghi chú (không bắt buộc)"
                                      rows={3}
                                      className="min-h-24 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-base font-medium text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/70"
                                    />

                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                      <select
                                        value={skillForm.level}
                                        onChange={(event) => handleSkillFormChange('level', event.target.value)}
                                        className="h-12 rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-base font-semibold text-white outline-none transition focus:border-cyan-300/70"
                                      >
                                        <option value="">Chọn mức độ</option>
                                        {SKILL_LEVEL_OPTIONS.map((option) => (
                                          <option key={option.value} value={option.value}>
                                            {option.label}
                                          </option>
                                        ))}
                                      </select>

                                      <select
                                        value={skillForm.ratingScore}
                                        onChange={(event) => handleSkillFormChange('ratingScore', event.target.value)}
                                        className="h-12 rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-base font-semibold text-white outline-none transition focus:border-cyan-300/70"
                                      >
                                        <option value="">Chọn tự đánh giá</option>
                                        {SKILL_RATING_OPTIONS.map((option) => (
                                          <option key={option.value} value={option.value}>
                                            {option.label}
                                          </option>
                                        ))}
                                      </select>
                                    </div>

                                    <div className="mt-auto flex flex-wrap gap-2">
                                      <button
                                        type="button"
                                        onClick={handleSaveSkill}
                                        disabled={isSkillSubmitting}
                                        className="inline-flex h-10 items-center justify-center rounded-full bg-cyan-500 px-5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                                      >
                                        {isSkillSubmitting ? 'Đang lưu...' : 'Lưu skill'}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={handleCancelSkillEdit}
                                        disabled={isSkillSubmitting}
                                        className="inline-flex h-10 items-center justify-center rounded-full border border-white/20 bg-white/10 px-5 text-sm font-semibold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
                                      >
                                        Hủy
                                      </button>
                                    </div>
                                  </div>
                                </article>
                              );
                            }

                            const tone = getSkillToneClasses(currentSkill.level);

                            return (
                              <article
                                key={currentSkill.id}
                                className={`relative min-h-[340px] overflow-hidden rounded-[28px] border p-6 shadow-[0_22px_50px_-30px_rgba(15,23,42,0.95)] transition hover:animate-pulse ${tone.panel}`}
                              >
                                <div className="absolute right-0 top-0 h-24 w-24 rounded-bl-full bg-white/10 blur-2xl" />
                                <div className="relative flex h-full flex-col gap-4">
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">Bộ môn</p>
                                      <h4 className="mt-2 text-xl font-bold text-white">{currentSkill.sport}</h4>
                                    </div>
                                    <span className={`inline-flex h-9 items-center rounded-full px-4 text-xs font-semibold ${tone.badge}`}>
                                      {getSkillLevelLabel(currentSkill.level)}
                                    </span>
                                  </div>

                                  <div className={`rounded-2xl border border-white/10 bg-slate-950/35 p-4 ${tone.accent}`}>
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">Ghi chú</p>
                                    <p className="mt-2 text-base leading-6 text-white/85">
                                      {currentSkill.note?.trim() || 'Chưa có ghi chú'}
                                    </p>
                                  </div>

                                  <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
                                      <p className="text-xs uppercase tracking-[0.18em] text-white/55">Level</p>
                                      <p className="mt-1 text-base font-semibold text-white">{getSkillLevelLabel(currentSkill.level)}</p>
                                    </div>
                                    <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
                                      <p className="text-xs uppercase tracking-[0.18em] text-white/55">Tự đánh giá</p>
                                      <p className="mt-1 text-base font-semibold text-white">{getSkillRatingLabel(currentSkill.rating_score)}</p>
                                    </div>
                                  </div>

                                  <div className="mt-auto flex flex-wrap gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleStartSkillEdit(currentSkill)}
                                      className="inline-flex h-10 items-center justify-center rounded-full border border-white/20 bg-white/10 px-5 text-sm font-semibold text-white transition hover:bg-white/20"
                                    >
                                      Sửa
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteSkill(currentSkill.id)}
                                      className="inline-flex h-10 items-center justify-center rounded-full border border-white/15 bg-slate-950/35 px-5 text-sm font-semibold text-white/85 transition hover:bg-slate-950/55"
                                    >
                                      Xóa
                                    </button>
                                  </div>
                                </div>
                              </article>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {activeTab === 'profile' && isEditing ? (
              <div className="mt-5 flex flex-wrap items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCancelEditing}
                  disabled={isSaving}
                  className="inline-flex h-11 items-center justify-center rounded-full border border-white/20 px-5 text-sm font-bold text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="inline-flex h-11 items-center justify-center rounded-full bg-blue-500 px-5 text-sm font-bold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving ? 'Đang lưu...' : 'Lưu thông tin'}
                </button>
              </div>
            ) : null}

            <div className="mt-4 min-h-6">
              {successMessage ? <p className="text-sm font-medium text-emerald-200">{successMessage}</p> : null}
            </div>
          </div>
        </section>

        {popupErrorMessage ? (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 px-4">
            <div className="w-full max-w-md rounded-2xl border border-amber-300/30 bg-slate-900 p-5 shadow-[0_28px_70px_-35px_rgba(2,6,23,0.95)]">
              <h3 className="text-lg font-bold text-amber-100">Không thể lưu hồ sơ</h3>
              <p className="mt-2 text-sm leading-6 text-slate-200">{popupErrorMessage}</p>
              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={() => setPopupErrorMessage('')}
                  className="inline-flex h-10 items-center justify-center rounded-full bg-amber-500 px-5 text-sm font-bold text-slate-950 transition hover:bg-amber-400"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
