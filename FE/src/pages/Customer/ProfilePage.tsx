import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createCurrentUserSkill,
  deleteCurrentUserSkill,
  getCurrentUserProfile,
  getCurrentUserSkills,
  updateCurrentUserProfile,
  updateCurrentUserSkill,
  type AuthUser,
  type UserSkill,
} from "../../Axios/Axios";
import { useWallet } from "../../hooks/useWallet";
import { DepositModal } from "../WalletPage/DepositModal";

// ─── ICON COMPONENTS ──────────────────────────────────────────────────────────

const PencilIcon = () => (
  <svg
    viewBox="0 0 24 24"
    className="h-4 w-4"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 20h9" />
    <path d="m16.5 3.5 4 4L7 21H3v-4L16.5 3.5Z" />
  </svg>
);

const CameraIcon = () => (
  <svg
    viewBox="0 0 24 24"
    className="h-5 w-5"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

const CalendarIcon = () => (
  <svg
    viewBox="0 0 24 24"
    className="h-4 w-4"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const RacketIcon = () => (
  <svg
    viewBox="0 0 24 24"
    className="h-5 w-5 text-blue-400"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="16" cy="8" r="6" />
    <line x1="11.5" y1="12.5" x2="4" y2="20" />
    <line x1="4" y1="20" x2="7" y2="23" />
    <path d="M7 17l4 4" />
    <line x1="13" y1="5" x2="19" y2="11" />
    <line x1="19" y1="5" x2="13" y2="11" />
  </svg>
);

const TrendUpIcon = () => (
  <svg
    viewBox="0 0 24 24"
    className="h-5 w-5 text-emerald-400"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

const StarIcon = () => (
  <svg
    viewBox="0 0 24 24"
    className="h-5 w-5 text-amber-400"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const TrophyIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5 text-blue-400" fill="currentColor">
    <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v3c0 2.21 1.79 4 4 4h1.09c.72 1.54 2.13 2.68 3.91 2.91V20H9v2h6v-2h-3v-3.09c1.78-.23 3.19-1.37 3.91-2.91H17c2.21 0 4-1.79 4-4V7c0-1.1-.9-2-2-2zM5 10V7h2v3c0 .55-.45 1-1 1s-1-.45-1-1zm14 0c0 .55-.45 1-1 1s-1-.45-1-1V7h2v3z" />
  </svg>
);

const BoltIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5 text-amber-500" fill="currentColor">
    <polygon points="11.5 1 2 13 10.5 13 8.5 23 22 10 13.5 10 15.5 1" />
  </svg>
);

const MedalIcon = () => (
  <svg
    viewBox="0 0 24 24"
    className="h-4 w-4"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="8" r="7" />
    <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
  </svg>
);

const CheckedVerifiedIcon = () => (
  <svg
    viewBox="0 0 24 24"
    className="h-3.5 w-3.5 text-white"
    fill="none"
    stroke="currentColor"
    strokeWidth="3.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const toDateInputValue = (value?: string): string => {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toISOString().slice(0, 10);
};

const formatVND = (amount: number): string =>
  amount.toLocaleString("vi-VN") + "đ";

const formatJoinDate = (isoString?: string): string => {
  if (!isoString) return "—";
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return "—";
  const months = [
    "Thg 1",
    "Thg 2",
    "Thg 3",
    "Thg 4",
    "Thg 5",
    "Thg 6",
    "Thg 7",
    "Thg 8",
    "Thg 9",
    "Thg 10",
    "Thg 11",
    "Thg 12",
  ];
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
};

const formatTxSimpleDate = (isoString?: string): string => {
  if (!isoString) return "—";
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return "—";
  const months = [
    "Thg 1",
    "Thg 2",
    "Thg 3",
    "Thg 4",
    "Thg 5",
    "Thg 6",
    "Thg 7",
    "Thg 8",
    "Thg 9",
    "Thg 10",
    "Thg 11",
    "Thg 12",
  ];
  return `${d.getDate()} ${months[d.getMonth()]}, ${d.getFullYear()}`;
};

const formatTxTime = (isoString?: string): string => {
  if (!isoString) return "—";
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getTypeBadge = (type: string) => {
  switch (type) {
    case "deposit":
      return {
        label: "Nạp tiền",
        color: "text-emerald-400",
        bg: "bg-emerald-500/10",
        icon: "↓",
      };
    case "payment":
      return {
        label: "Thanh toán",
        color: "text-rose-400",
        bg: "bg-rose-500/10",
        icon: "↑",
      };
    case "refund":
      return {
        label: "Hoàn tiền",
        color: "text-blue-400",
        bg: "bg-blue-500/10",
        icon: "↩",
      };
    default:
      return {
        label: type,
        color: "text-slate-400",
        bg: "bg-slate-500/10",
        icon: "•",
      };
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "completed":
      return {
        label: "Thành công",
        color: "text-emerald-400",
        bg: "bg-emerald-500/15",
      };
    case "pending":
      return {
        label: "Đang chờ",
        color: "text-amber-400",
        bg: "bg-amber-500/15",
      };
    case "expired":
      return {
        label: "Hết hạn",
        color: "text-slate-400",
        bg: "bg-slate-500/15",
      };
    case "failed":
      return {
        label: "Thất bại",
        color: "text-red-400",
        bg: "bg-red-500/15",
      };
    default:
      return {
        label: status,
        color: "text-slate-400",
        bg: "bg-slate-500/15",
      };
  }
};



type SkillFormState = {
  sport: string;
  note: string;
  level: string;
  ratingScore: string;
};

const SKILL_SPORT_OPTIONS = ["Bóng đá", "Tennis", "Pickleball", "Cầu lông"];

const ALLOWED_SKILL_SPORTS = new Set(SKILL_SPORT_OPTIONS);

const SKILL_LEVEL_OPTIONS = [
  { value: "1", label: "Mới bắt đầu" },
  { value: "2", label: "Cơ bản" },
  { value: "3", label: "Khá" },
  { value: "4", label: "Tốt" },
  { value: "5", label: "Chuyên nghiệp" },
];

const SKILL_RATING_OPTIONS = [
  { value: "1", label: "1 - Rất thấp" },
  { value: "2", label: "2 - Thấp" },
  { value: "3", label: "3 - Trung bình" },
  { value: "4", label: "4 - Cao" },
  { value: "5", label: "5 - Rất cao" },
];

const EMPTY_SKILL_FORM: SkillFormState = {
  sport: "",
  note: "",
  level: "",
  ratingScore: "",
};

const getSkillLevelLabel = (value: number): string =>
  SKILL_LEVEL_OPTIONS.find((option) => option.value === String(value))?.label ??
  String(value);

const isAuthError = (message: string): boolean => {
  const norm = message.toLowerCase().trim();
  return (
    norm === "missing_token" ||
    norm === "unauthorized" ||
    norm.includes("unauthorized") ||
    norm.includes("token")
  );
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [draftName, setDraftName] = useState("");
  const [draftPhone, setDraftPhone] = useState("");
  const [draftAddress, setDraftAddress] = useState("");
  const [draftDateOfBirth, setDraftDateOfBirth] = useState("");
  const [draftAvatarUrl, setDraftAvatarUrl] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [skills, setSkills] = useState<UserSkill[]>([]);
  const [skillForm, setSkillForm] = useState<SkillFormState>(EMPTY_SKILL_FORM);
  const [editingSkillId, setEditingSkillId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSkillsLoading, setIsSkillsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSkillSubmitting, setIsSkillSubmitting] = useState(false);
  const [popupErrorMessage, setPopupErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const dateOfBirthInputRef = useRef<HTMLInputElement | null>(null);

  const usedSports = new Set(skills.map((skill) => skill.sport));
  const availableSports = SKILL_SPORT_OPTIONS.filter(
    (sport) => !usedSports.has(sport),
  );
  const canAddNewSkill = availableSports.length > 0;

  // Wallet state & modals
  const {
    wallet,
    transactions: walletTransactions,
    loading: walletLoading,
    fetchWallet,
  } = useWallet();
  const [showDeposit, setShowDeposit] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const handleDepositSuccess = () => {
    setShowDeposit(false);
    void fetchWallet();
  };

  const persistCurrentUser = (user: AuthUser) => {
    if (typeof window === "undefined") {
      return;
    }
    localStorage.setItem("currentUser", JSON.stringify(user));
    window.dispatchEvent(new Event("currentUserUpdated"));
  };

  const showErrorPopup = (message: string) => {
    const normalized = message.trim();
    if (!normalized || normalized === "Request failed") {
      setPopupErrorMessage(
        "Không thể lưu hồ sơ lúc này. Vui lòng kiểm tra kết nối server và thử lại.",
      );
      return;
    }
    setPopupErrorMessage(normalized);
  };

  useEffect(() => {
    let isMounted = true;
    const token = localStorage.getItem("accessToken")?.trim();
    if (!token || token === "undefined" || token === "null") {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("currentUser");
      window.dispatchEvent(new Event("currentUserUpdated"));
      navigate("/login");
      return;
    }

    const loadProfile = async () => {
      try {
        setIsLoading(true);
        const response = await getCurrentUserProfile();
        if (isMounted) {
          setCurrentUser(response.user);
          setDraftName(response.user.name ?? "");
          setDraftPhone(response.user.phone ?? "");
          setDraftAddress(response.user.address ?? "");
          setDraftDateOfBirth(toDateInputValue(response.user.dateOfBirth));
          setDraftAvatarUrl(response.user.avatarUrl ?? "");
          persistCurrentUser(response.user);
        }
      } catch (error: unknown) {
        if (isMounted) {
          const message =
            error instanceof Error ? error.message : "Không tải được hồ sơ.";
          if (isAuthError(message)) {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("currentUser");
            window.dispatchEvent(new Event("currentUserUpdated"));
            navigate("/login");
            return;
          }
          showErrorPopup(message);
          const raw = localStorage.getItem("currentUser");
          if (raw) {
            try {
              const fallbackUser = JSON.parse(raw) as AuthUser;
              setCurrentUser(fallbackUser);
              setDraftName(fallbackUser.name ?? fallbackUser.userName ?? "");
              setDraftPhone(fallbackUser.phone ?? "");
              setDraftAddress(fallbackUser.address ?? "");
              setDraftDateOfBirth(toDateInputValue(fallbackUser.dateOfBirth));
              setDraftAvatarUrl(fallbackUser.avatarUrl ?? "");
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
      if (currentUser.role === "owner" || currentUser.role === "admin") {
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
          const message =
            error instanceof Error ? error.message : "Không tải được kỹ năng.";
          if (!isAuthError(message)) {
            showErrorPopup(message);
          }
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

  const profileName =
    currentUser?.name?.trim() ||
    currentUser?.userName?.trim() ||
    "Người dùng ArenaS";
  const profileEmail = currentUser?.email?.trim() || "Chưa có email";
  const profilePhone = currentUser?.phone?.trim() || "Chưa cập nhật";
  const profileAvatarUrl = (currentUser?.avatarUrl ?? "").trim();
  const currentAvatarUrl = isEditing ? draftAvatarUrl.trim() : profileAvatarUrl;
  const profileRole =
    currentUser?.role === "owner"
      ? "Chủ sân"
      : currentUser?.role === "admin"
        ? "Admin"
        : "Elite";
  const avatarInitial = profileName.charAt(0).toUpperCase();

  const handleStartEditing = () => {
    setDraftName(currentUser?.name ?? currentUser?.userName ?? "");
    setDraftPhone(currentUser?.phone ?? "");
    setDraftAddress(currentUser?.address ?? "");
    setDraftDateOfBirth(toDateInputValue(currentUser?.dateOfBirth));
    setDraftAvatarUrl(currentUser?.avatarUrl ?? "");
    setSuccessMessage("");
    setPopupErrorMessage("");
    setIsEditing(true);
  };

  const handleCancelEditing = () => {
    setDraftName(currentUser?.name ?? currentUser?.userName ?? "");
    setDraftPhone(currentUser?.phone ?? "");
    setDraftAddress(currentUser?.address ?? "");
    setDraftDateOfBirth(toDateInputValue(currentUser?.dateOfBirth));
    setDraftAvatarUrl(currentUser?.avatarUrl ?? "");
    setSuccessMessage("");
    setPopupErrorMessage("");
    setIsEditing(false);
  };

  const handlePickAvatar = () => {
    avatarInputRef.current?.click();
  };

  const handleAvatarFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    if (!file.type.startsWith("image/")) {
      showErrorPopup("Vui lòng chọn đúng file ảnh cho avatar.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showErrorPopup("Ảnh avatar tối đa 2MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setDraftAvatarUrl(reader.result);
        setPopupErrorMessage("");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    if (draftDateOfBirth) {
      const selectedDate = new Date(draftDateOfBirth);
      if (Number.isNaN(selectedDate.getTime())) {
        showErrorPopup("Ngày sinh không hợp lệ. Vui lòng chọn lại.");
        return;
      }
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate > today) {
        showErrorPopup("Ngày sinh không được lớn hơn ngày hiện tại.");
        return;
      }
      const minimumDate = new Date("1900-01-01");
      if (selectedDate < minimumDate) {
        showErrorPopup(
          "Ngày sinh quá xa trong quá khứ. Vui lòng kiểm tra lại.",
        );
        return;
      }
    }
    try {
      setIsSaving(true);
      setSuccessMessage("");
      setPopupErrorMessage("");
      const response = await updateCurrentUserProfile({
        name: draftName.trim(),
        phone: draftPhone.trim(),
        address: draftAddress.trim(),
        dateOfBirth: draftDateOfBirth,
        avatarUrl: draftAvatarUrl,
      });
      setCurrentUser(response.user);
      setDraftName(response.user.name ?? "");
      setDraftPhone(response.user.phone ?? "");
      setDraftAddress(response.user.address ?? "");
      setDraftDateOfBirth(toDateInputValue(response.user.dateOfBirth));
      setDraftAvatarUrl(response.user.avatarUrl ?? "");
      persistCurrentUser(response.user);
      setSuccessMessage("Đã lưu thông tin hồ sơ.");
      setIsEditing(false);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Không lưu được hồ sơ.";
      showErrorPopup(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkillFormChange = (
    field: keyof SkillFormState,
    value: string,
  ) => {
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
      note: skill.note ?? "",
      level: String(skill.level),
      ratingScore: String(skill.rating_score),
    });
    setEditingSkillId(skill.id);
    setSuccessMessage("");
    setPopupErrorMessage("");
  };

  const handleCancelSkillEdit = () => {
    resetSkillForm();
    setSuccessMessage("");
    setPopupErrorMessage("");
  };

  const handleStartSkillCreate = () => {
    if (!canAddNewSkill) {
      showErrorPopup("Bạn đã thêm đủ 4 bộ môn.");
      return;
    }
    const nextSport = availableSports[0] ?? "";
    setSkillForm({
      sport: nextSport,
      note: "",
      level: "",
      ratingScore: "",
    });
    setEditingSkillId("new");
    setSuccessMessage("");
    setPopupErrorMessage("");
  };

  const handleSaveSkill = async () => {
    const sport = skillForm.sport.trim();
    const note = skillForm.note.trim();
    if (!sport || !ALLOWED_SKILL_SPORTS.has(sport)) {
      showErrorPopup("Môn thể thao là bắt buộc.");
      return;
    }
    if (editingSkillId === "new" && usedSports.has(sport)) {
      showErrorPopup(
        "Môn này đã có rồi. Bạn hãy sửa trực tiếp trên card hiện tại.",
      );
      return;
    }
    const level = Number(skillForm.level);
    const ratingScore = Number(skillForm.ratingScore);
    if (!Number.isInteger(level) || level < 1 || level > 5) {
      showErrorPopup("Level phải là số nguyên từ 1 đến 5.");
      return;
    }
    if (!Number.isInteger(ratingScore) || ratingScore < 1 || ratingScore > 5) {
      showErrorPopup("Tự đánh giá phải là số nguyên từ 1 đến 5.");
      return;
    }
    try {
      setIsSkillSubmitting(true);
      setSuccessMessage("");
      setPopupErrorMessage("");
      const payload = {
        sport,
        note,
        level,
        rating_score: ratingScore,
      };
      const skillToUpdate =
        editingSkillId && editingSkillId !== "new"
          ? (skills.find((item) => item.id === editingSkillId) ?? null)
          : null;
      if (skillToUpdate) {
        const response = await updateCurrentUserSkill(
          skillToUpdate.id,
          payload,
        );
        setSkills((prev) =>
          prev.map((item) =>
            item.id === skillToUpdate.id ? response.skill : item,
          ),
        );
        setSuccessMessage("Đã cập nhật kỹ năng.");
      } else {
        const response = await createCurrentUserSkill(payload);
        setSkills((prev) => [response.skill, ...prev]);
        setSuccessMessage("Đã thêm kỹ năng mới.");
      }
      resetSkillForm();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Không thể lưu kỹ năng.";
      showErrorPopup(message);
    } finally {
      setIsSkillSubmitting(false);
    }
  };

  const handleDeleteSkill = async (skillId: string) => {
    const confirmed = window.confirm("Bạn có chắc muốn xóa kỹ năng này?");
    if (!confirmed) {
      return;
    }
    try {
      setIsSkillSubmitting(true);
      setSuccessMessage("");
      setPopupErrorMessage("");
      await deleteCurrentUserSkill(skillId);
      setSkills((prev) => prev.filter((item) => item.id !== skillId));
      if (editingSkillId === skillId) {
        resetSkillForm();
      }
      setSuccessMessage("Đã xóa kỹ năng.");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Không thể xóa kỹ năng.";
      showErrorPopup(message);
    } finally {
      setIsSkillSubmitting(false);
    }
  };

  // Compute stats based on skills
  const calculatedSkillPoints =
    skills.length > 0
      ? skills.reduce(
          (sum, s) => sum + s.level * 1000 + s.rating_score * 500,
          0,
        )
      : 0;
  const formattedSkillPoints =
    calculatedSkillPoints > 0
      ? calculatedSkillPoints.toLocaleString()
      : "—";

  const getLevelColorInfo = (level: number) => {
    if (level <= 2) {
      return {
        barClass: "from-emerald-500 to-teal-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]",
        textClass: "text-emerald-400",
      };
    }
    if (level === 3) {
      return {
        barClass: "from-amber-500 to-orange-500 shadow-[0_0_8px_rgba(245,158,11,0.3)]",
        textClass: "text-amber-400",
      };
    }
    return {
      barClass: "from-cyan-500 to-blue-500 shadow-[0_0_8px_rgba(6,182,212,0.3)]",
      textClass: "text-cyan-400",
    };
  };

  return (
    <div className="relative min-h-screen bg-[#08090d] text-slate-100 px-4 py-8 md:px-8 md:py-12 selection:bg-blue-500/30 overflow-x-hidden">
      {/* Background glow elements */}
      <div className="absolute top-[-10%] left-[-5%] w-[45vw] h-[45vw] rounded-full bg-blue-900/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-indigo-900/8 blur-[130px] pointer-events-none" />

      <div className="mx-auto max-w-7xl">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400">
            <div className="w-12 h-12 rounded-full border-4 border-t-blue-500 border-white/10 animate-spin mb-4" />
            <p className="font-semibold text-sm tracking-wider">
              ĐANG TẢI THÔNG TIN HỒ SƠ...
            </p>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* ─── LEFT SIDEBAR ────────────────────────────────────────────── */}
            <aside className="w-full lg:w-80 shrink-0 flex flex-col gap-6">
              {/* Profile Main Info */}
              <div className="bg-[#10111a] border border-white/[0.05] rounded-3xl p-6 flex flex-col items-center text-center shadow-[0_8px_30px_rgb(0,0,0,0.15)] relative overflow-hidden group">
                <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500/25 to-transparent" />

                {/* Avatar Frame with Stars & Verified Check */}
                <div className="relative w-28 h-28 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border border-blue-500/40 shadow-[0_0_20px_rgba(59,130,246,0.25)] animate-pulse" />
                  <div className="absolute inset-[3px] rounded-full border border-white/[0.04]" />
                  <div className="w-[100px] h-[100px] rounded-full overflow-hidden border border-slate-900 bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-3xl font-black text-white relative shadow-inner">
                    {currentAvatarUrl ? (
                      <img
                        src={currentAvatarUrl}
                        alt="avatar"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      avatarInitial
                    )}
                  </div>
                  {/* Verified Check Badge */}
                  <div className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-blue-500 border-2 border-[#10111a] flex items-center justify-center shadow-lg">
                    <CheckedVerifiedIcon />
                  </div>

                  {/* Pick Avatar Button overlay when editing */}
                  {isEditing ? (
                    <button
                      type="button"
                      onClick={handlePickAvatar}
                      className="absolute inset-[3px] rounded-full bg-black/75 flex flex-col items-center justify-center text-white transition hover:bg-black/80 cursor-pointer"
                      title="Đổi ảnh đại diện"
                    >
                      <CameraIcon />
                      <span className="text-[9px] font-bold mt-1 tracking-wider uppercase">
                        SỬA
                      </span>
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

                <h2 className="mt-4 text-xl font-bold text-white tracking-wide truncate max-w-full">
                  {profileName}
                </h2>
                <p className="text-xs text-slate-400 mt-1 truncate max-w-full font-mono">
                  {profileEmail}
                </p>

                {/* Level / Role Badge */}
                <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 px-4 py-1 text-xs font-extrabold text-blue-300 tracking-wide uppercase">
                  <MedalIcon />
                  <span>{profileRole} LEVEL</span>
                </div>

                {/* Edit Profile Action Button */}
                <button
                  type="button"
                  onClick={
                    isEditing ? handleCancelEditing : handleStartEditing
                  }
                  className={`mt-6 w-full py-2.5 rounded-xl border text-xs font-bold tracking-wide uppercase transition-all flex items-center justify-center gap-2 ${
                    isEditing
                      ? "bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20"
                      : "bg-white/[0.02] border-white/10 text-slate-200 hover:bg-white/[0.05] hover:border-white/20"
                  }`}
                >
                  <PencilIcon />
                  <span>{isEditing ? "HỦY CHỈNH SỬA" : "CHỈNH SỬA HỒ SƠ"}</span>
                </button>
              </div>

              {/* Statistics Cards list */}
              <div className="flex flex-col gap-3">
                {/* Matches Card */}
                <div className="bg-[#10111a] border border-white/[0.05] rounded-2xl p-5 flex items-center justify-between shadow-[0_4px_20px_rgba(0,0,0,0.15)] hover:border-white/10 transition duration-300">
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 tracking-[0.18em] uppercase">
                      TRẬN ĐẤU
                    </p>
                    <p className="text-2xl font-extrabold text-white mt-1">
                      —
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                    <RacketIcon />
                  </div>
                </div>

                {/* Win Rate Card */}
                <div className="bg-[#10111a] border border-white/[0.05] rounded-2xl p-5 flex items-center justify-between shadow-[0_4px_20px_rgba(0,0,0,0.15)] hover:border-white/10 transition duration-300">
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 tracking-[0.18em] uppercase">
                      TỈ LỆ THẮNG
                    </p>
                    <p className="text-2xl font-extrabold text-white mt-1">
                      —
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <TrendUpIcon />
                  </div>
                </div>

                {/* Skill Points Card */}
                <div className="bg-[#10111a] border border-white/[0.05] rounded-2xl p-5 flex items-center justify-between shadow-[0_4px_20px_rgba(0,0,0,0.15)] hover:border-white/10 transition duration-300">
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 tracking-[0.18em] uppercase">
                      DIỂM KỸ NĂNG
                    </p>
                    <p className="text-2xl font-extrabold text-white mt-1">
                      {formattedSkillPoints}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                    <StarIcon />
                  </div>
                </div>
              </div>

              {/* Achievements Card */}
              <div className="bg-[#10111a] border border-white/[0.05] rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.15)]">
                <p className="text-[10px] font-bold text-slate-500 tracking-[0.18em] uppercase mb-4">
                  THÀNH TÍCH
                </p>
                <div className="flex gap-3.5">
                  <div
                    className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shadow-[0_0_12px_rgba(59,130,246,0.1)] hover:scale-105 transition cursor-help"
                    title="Cúp Danh Hiệu"
                  >
                    <TrophyIcon />
                  </div>
                  <div
                    className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shadow-[0_0_12px_rgba(245,158,11,0.1)] hover:scale-105 transition cursor-help"
                    title="Người Chơi Tích Cực"
                  >
                    <BoltIcon />
                  </div>
                  <div
                    className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-[0_0_12px_rgba(16,185,129,0.1)] hover:scale-105 transition cursor-help"
                    title="Kỹ Năng Được Kiểm Chứng"
                  >
                    <MedalIcon />
                  </div>
                </div>
              </div>
            </aside>

            {/* ─── RIGHT MAIN CONTENT ───────────────────────────────────────── */}
            <main className="flex-1 min-w-0 flex flex-col gap-6">
              {/* Row 1: Two cards grid (Personal Info + Wallet Balance) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Information Card */}
                <div className="bg-[#10111a] border border-white/[0.05] rounded-3xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.15)] flex flex-col justify-between relative overflow-hidden group">
                  <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500/15 to-transparent" />

                  <div>
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-white/[0.05] pb-4 mb-5">
                      <div className="flex items-center gap-2.5">
                        <svg
                          viewBox="0 0 24 24"
                          className="h-5 w-5 text-blue-400"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                        <h3 className="text-base font-bold text-white tracking-wide">
                          Thông tin cá nhân
                        </h3>
                      </div>
                      {isEditing && (
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold uppercase tracking-wider">
                          Đang sửa
                        </span>
                      )}
                    </div>

                    {/* Fields list */}
                    <div className="grid grid-cols-2 gap-x-5 gap-y-4">
                      {/* Name */}
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">
                          HỌ VÀ TÊN
                        </p>
                        {isEditing ? (
                          <input
                            value={draftName}
                            onChange={(e) => setDraftName(e.target.value)}
                            placeholder="Nhập họ và tên"
                            className="mt-1 h-9 w-full rounded-xl border border-white/10 bg-slate-900 px-3 text-xs font-semibold text-white outline-none focus:border-blue-500/50 transition"
                          />
                        ) : (
                          <p className="mt-1.5 text-sm font-semibold text-slate-200">
                            {profileName}
                          </p>
                        )}
                      </div>

                      {/* Phone */}
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">
                          SỐ ĐIỆN THOẠI
                        </p>
                        {isEditing ? (
                          <input
                            value={draftPhone}
                            onChange={(e) => setDraftPhone(e.target.value)}
                            placeholder="Số điện thoại"
                            className="mt-1 h-9 w-full rounded-xl border border-white/10 bg-slate-900 px-3 text-xs font-semibold text-white outline-none focus:border-blue-500/50 transition"
                          />
                        ) : (
                          <p className="mt-1.5 text-sm font-semibold text-slate-200">
                            {profilePhone}
                          </p>
                        )}
                      </div>

                      {/* Email */}
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">
                          EMAIL
                        </p>
                        <p
                          className="mt-1.5 text-sm font-semibold text-slate-200 truncate"
                          title={profileEmail}
                        >
                          {profileEmail}
                        </p>
                      </div>

                      {/* Address */}
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">
                          ĐỊA CHỈ
                        </p>
                        {isEditing ? (
                          <input
                            type="text"
                            value={draftAddress}
                            onChange={(e) => setDraftAddress(e.target.value)}
                            className="mt-1 h-9 w-full rounded-xl border border-white/10 bg-slate-900 px-3 text-xs font-semibold text-white outline-none focus:border-blue-500/50 transition"
                            placeholder="Nhập địa chỉ"
                          />
                        ) : (
                          <p className="mt-1.5 text-sm font-semibold text-slate-200 truncate" title={currentUser?.address || "Chưa cập nhật"}>
                            {currentUser?.address || "—"}
                          </p>
                        )}
                      </div>

                      {/* Join Date */}
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">
                          NGÀY THAM GIA
                        </p>
                        <p className="mt-1.5 text-sm font-semibold text-slate-200">
                          {formatJoinDate(currentUser?.createdAt)}
                        </p>
                      </div>
                    </div>

                    {/* Date of birth inline editing field if editing */}
                    {isEditing && (
                      <div className="mt-4 border-t border-white/[0.04] pt-4">
                        <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">
                          NGÀY SINH
                        </label>
                        <div className="mt-1.5 flex items-center gap-2">
                          <input
                            ref={dateOfBirthInputRef}
                            type="date"
                            value={draftDateOfBirth}
                            onChange={(e) =>
                              setDraftDateOfBirth(e.target.value)
                            }
                            max={new Date().toISOString().slice(0, 10)}
                            min="1900-01-01"
                            className="h-9 w-full rounded-xl border border-white/10 bg-slate-900 px-3 text-xs font-semibold text-white outline-none focus:border-blue-500/50 transition"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const input = dateOfBirthInputRef.current as
                                | (HTMLInputElement & {
                                    showPicker?: () => void;
                                  })
                                | null;
                              input?.showPicker?.();
                              input?.focus();
                            }}
                            className="h-9 w-9 rounded-xl border border-white/10 bg-slate-800 text-blue-100 flex items-center justify-center transition hover:bg-slate-700 active:scale-95"
                            aria-label="Chọn ngày sinh"
                            title="Chọn ngày sinh"
                          >
                            <CalendarIcon />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions when editing */}
                  {isEditing && (
                    <div className="mt-6 border-t border-white/[0.05] pt-4 flex items-center justify-end gap-3.5">
                      <button
                        type="button"
                        onClick={handleCancelEditing}
                        disabled={isSaving}
                        className="px-4 py-2 rounded-xl border border-white/10 bg-white/[0.01] text-xs font-bold text-slate-300 transition hover:bg-white/[0.05]"
                      >
                        Hủy
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveProfile}
                        disabled={isSaving}
                        className="px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-400 text-xs font-bold text-white transition flex items-center gap-1.5"
                      >
                        {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
                      </button>
                    </div>
                  )}
                </div>

                {/* Wallet Balance Card */}
                <div
                  onClick={() => setShowHistoryModal(true)}
                  className="bg-gradient-to-br from-blue-600 to-indigo-900 border border-blue-400/20 rounded-3xl p-6 shadow-[0_12px_40px_-10px_rgba(37,99,235,0.35)] flex flex-col justify-between text-white relative overflow-hidden group cursor-pointer hover:shadow-[0_15px_45px_-5px_rgba(37,99,235,0.45)] transition duration-300"
                >
                  {/* Glowing background bubble */}
                  <div className="absolute -right-16 -top-16 w-48 h-48 rounded-full bg-sky-400/15 blur-3xl pointer-events-none group-hover:scale-110 transition duration-500" />

                  <div>
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold tracking-[0.2em] text-blue-200/80 uppercase">
                        SỐ DƯ VÍ
                      </p>
                      
                      <div className="flex items-center gap-2.5">
                        {/* Shrunk Wallet Refresh Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            void fetchWallet();
                          }}
                          className="w-6 h-6 rounded bg-white/10 hover:bg-white/20 active:scale-90 text-white flex items-center justify-center transition"
                          title="Làm mới số dư"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            className="h-3 w-3"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                          </svg>
                        </button>

                        <svg
                          viewBox="0 0 24 24"
                          className="h-6 w-6 text-blue-100"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.2"
                        >
                          <rect x="3" y="5" width="18" height="14" rx="2.5" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                          <circle cx="7" cy="15" r="1.2" />
                        </svg>
                      </div>
                    </div>

                    {/* Balance */}
                    <div className="mt-4">
                      {walletLoading ? (
                        <div className="h-9 w-32 bg-white/10 rounded animate-pulse" />
                      ) : (
                        <p className="text-3xl font-extrabold tracking-tight text-white drop-shadow-sm">
                          {formatVND(wallet?.balance ?? 0)}
                        </p>
                      )}
                    </div>

                    {/* Masked Card Number */}
                    <div className="mt-6">
                      <p className="text-xs font-semibold font-mono tracking-[0.25em] text-blue-200/50">
                        **** **** **** {wallet?.id?.slice(-4) ?? "4829"}
                      </p>
                    </div>
                  </div>

                  {/* Actions inside card */}
                  <div className="mt-6 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDeposit(true);
                      }}
                      className="flex-1 py-2.5 rounded-xl bg-white text-xs font-bold text-[#08090d] transition duration-200 hover:bg-slate-100 active:scale-95 shadow-md uppercase tracking-wider"
                    >
                      Nạp tiền
                    </button>
                    <button
                      type="button"
                      disabled
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 py-2.5 rounded-xl bg-white/10 border border-white/20 text-xs font-bold text-white/50 transition cursor-not-allowed uppercase tracking-wider flex items-center justify-center"
                      title="Tính năng rút tiền sắp ra mắt"
                    >
                      Rút tiền
                    </button>
                  </div>
                </div>
              </div>

              {/* Row 2: Performance Analytics Section (Skills list & management) */}
              <div className="bg-[#10111a] border border-white/[0.05] rounded-3xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.15)] relative overflow-hidden group">
                <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500/15 to-transparent" />

                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/[0.05] pb-4 mb-5">
                  <div className="flex items-center gap-2.5">
                    <svg
                      viewBox="0 0 24 24"
                      className="h-5 w-5 text-indigo-400"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <rect x="3" y="3" width="7" height="9" rx="1" />
                      <rect x="14" y="3" width="7" height="5" rx="1" />
                      <rect x="14" y="12" width="7" height="9" rx="1" />
                      <rect x="3" y="16" width="7" height="5" rx="1" />
                    </svg>
                    <h3 className="text-base font-bold text-white tracking-wide">
                      Skill
                    </h3>
                  </div>

                  {editingSkillId === null && (
                    <button
                      type="button"
                      onClick={handleStartSkillCreate}
                      disabled={!canAddNewSkill}
                      className="px-4 py-1.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-xs font-bold text-white transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                    >
                      + Thêm kỹ năng
                    </button>
                  )}
                </div>

                {/* Inline Skill Edit/Create Form */}
                {editingSkillId !== null ? (
                  <div className="bg-slate-950/40 border border-white/[0.04] rounded-2xl p-5 mb-6 space-y-4 shadow-inner">
                    <div className="flex items-center justify-between border-b border-white/[0.04] pb-3 mb-1">
                      <h4 className="text-xs font-extrabold tracking-wide uppercase text-slate-200">
                        {editingSkillId === "new"
                          ? "Thêm Kỹ Năng Mới"
                          : `Sửa Kỹ Năng: ${skillForm.sport}`}
                      </h4>
                      <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">
                        Cấp độ 1 - 5
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Sport dropdown */}
                      {editingSkillId === "new" ? (
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">
                            Bộ môn
                          </label>
                          <select
                            value={skillForm.sport}
                            onChange={(e) =>
                              handleSkillFormChange("sport", e.target.value)
                            }
                            className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-slate-900 px-3 text-xs font-semibold text-white outline-none focus:border-blue-500/50"
                          >
                            {SKILL_SPORT_OPTIONS.map((sport) => (
                              <option
                                key={sport}
                                value={sport}
                                disabled={usedSports.has(sport)}
                              >
                                {sport}{" "}
                                {usedSports.has(sport) ? "(đã có)" : ""}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">
                            Bộ môn
                          </label>
                          <div className="mt-2.5 text-sm font-bold text-white">
                            {skillForm.sport}
                          </div>
                        </div>
                      )}

                      {/* Level */}
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">
                          Cấp độ
                        </label>
                        <select
                          value={skillForm.level}
                          onChange={(e) =>
                            handleSkillFormChange("level", e.target.value)
                          }
                          className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-slate-900 px-3 text-xs font-semibold text-white outline-none focus:border-blue-500/50"
                        >
                          <option value="">Chọn cấp độ</option>
                          {SKILL_LEVEL_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Rating Score */}
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">
                          Tự đánh giá
                        </label>
                        <select
                          value={skillForm.ratingScore}
                          onChange={(e) =>
                            handleSkillFormChange(
                              "ratingScore",
                              e.target.value,
                            )
                          }
                          className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-slate-900 px-3 text-xs font-semibold text-white outline-none focus:border-blue-500/50"
                        >
                          <option value="">Chọn tự đánh giá</option>
                          {SKILL_RATING_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Note */}
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">
                          Ghi chú (không bắt buộc)
                        </label>
                        <input
                          value={skillForm.note}
                          onChange={(e) =>
                            handleSkillFormChange("note", e.target.value)
                          }
                          placeholder="Kinh nghiệm chơi, thời gian tham gia..."
                          className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-slate-900 px-3 text-xs font-semibold text-white outline-none focus:border-blue-500/50"
                        />
                      </div>
                    </div>

                    {/* Form actions */}
                    <div className="flex items-center justify-end gap-3.5 border-t border-white/[0.04] pt-4 mt-3">
                      <button
                        type="button"
                        onClick={handleCancelSkillEdit}
                        disabled={isSkillSubmitting}
                        className="px-4 py-2 rounded-xl border border-white/10 bg-white/[0.01] text-xs font-bold text-slate-300 transition hover:bg-white/[0.05]"
                      >
                        Hủy
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveSkill}
                        disabled={isSkillSubmitting}
                        className="px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-400 text-xs font-bold text-white transition flex items-center gap-1.5 shadow-md"
                      >
                        {isSkillSubmitting ? "Đang lưu..." : "Lưu kỹ năng"}
                      </button>
                    </div>
                  </div>
                ) : null}

                {/* Skills progress bar grid */}
                {isSkillsLoading ? (
                  <div className="text-center py-6 text-sm text-slate-400 animate-pulse">
                    Đang tải kỹ năng...
                  </div>
                ) : skills.length === 0 ? (
                  <div className="text-center py-10 bg-slate-950/20 border border-dashed border-white/10 rounded-2xl">
                    <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-500">
                      Chưa có kỹ năng
                    </p>
                    <p className="text-xs leading-5 text-slate-400 mt-2 max-w-sm mx-auto">
                      Nhấp vào "Thêm kỹ năng" ở trên để hiển thị biểu đồ hiệu
                      suất.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    {skills.map((skill) => {
                      const percent = skill.level * 20; // 1-5 maps to 20-100%
                      const { barClass, textClass } = getLevelColorInfo(skill.level);
                      return (
                        <div key={skill.id} className="group relative">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-slate-300 tracking-wide">
                              {skill.sport}
                            </span>
                            <div className="flex items-center gap-3">
                              <span className={`text-xs font-bold ${textClass}`}>
                                {getSkillLevelLabel(skill.level)} ({percent}
                                %)
                              </span>

                              {/* Hover actions trigger */}
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <button
                                  type="button"
                                  onClick={() => handleStartSkillEdit(skill)}
                                  className={`p-1 text-slate-400 hover:${textClass} transition`}
                                  title="Sửa"
                                >
                                  <svg
                                    viewBox="0 0 24 24"
                                    className="h-3.5 w-3.5"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                  >
                                    <path d="M12 20h9" />
                                    <path d="m16.5 3.5 4 4L7 21H3v-4L16.5 3.5Z" />
                                  </svg>
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDeleteSkill(skill.id)
                                  }
                                  className="p-1 text-slate-400 hover:text-rose-400 transition"
                                  title="Xóa"
                                >
                                  <svg
                                    viewBox="0 0 24 24"
                                    className="h-3.5 w-3.5"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                  >
                                    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Beautiful glowing progress bar */}
                          <div className="h-2 w-full bg-slate-900/60 rounded-full overflow-hidden border border-white/[0.04] relative">
                            <div
                              className={`h-full bg-gradient-to-r ${barClass} rounded-full transition-all duration-700 ease-out`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          {skill.note?.trim() && (
                            <p className="text-[11px] text-slate-500 italic mt-1.5 truncate max-w-full">
                              "{skill.note.trim()}"
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Row 3: Recent Bookings Section (Placeholder, developed later) */}
              <div className="bg-[#10111a] border border-white/[0.05] rounded-3xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.15)] relative overflow-hidden group">
                <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500/10 to-transparent" />

                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/[0.05] pb-4 mb-5">
                  <div className="flex items-center gap-2.5">
                    <svg
                      viewBox="0 0 24 24"
                      className="h-5 w-5 text-blue-400"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    <h3 className="text-base font-bold text-white tracking-wide">
                      Đặt sân gần đây
                    </h3>
                  </div>

                  <span className="text-xs font-bold text-slate-500 hover:text-slate-500 transition cursor-not-allowed select-none">
                    Xem tất cả
                  </span>
                </div>

                {/* Booking list empty placeholder as requested */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/[0.04]">
                        <th className="text-[10px] font-bold text-slate-500 tracking-wider uppercase py-3.5">
                          SÂN THỂ THAO
                        </th>
                        <th className="text-[10px] font-bold text-slate-500 tracking-wider uppercase py-3.5">
                          NGÀY ĐẶT
                        </th>
                        <th className="text-[10px] font-bold text-slate-500 tracking-wider uppercase py-3.5">
                          KHUNG GIỜ
                        </th>
                        <th className="text-[10px] font-bold text-slate-500 tracking-wider uppercase py-3.5">
                          TRẠNG THÁI
                        </th>
                        <th className="text-[10px] font-bold text-slate-500 tracking-wider uppercase py-3.5 text-right">
                          CHI PHÍ
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td
                          colSpan={5}
                          className="text-center py-10 text-xs font-semibold text-slate-500 italic uppercase tracking-wider"
                        >
                          Chưa có dữ liệu đặt sân (Tính năng đang phát triển)
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </main>
          </div>
        )}

        {/* Global Notification Success block */}
        <div className="mt-4 min-h-6">
          {successMessage ? (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>{successMessage}</span>
            </div>
          ) : null}
        </div>

        {/* Error Modal Popup */}
        {popupErrorMessage ? (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm transition duration-200">
            <div className="w-full max-w-md rounded-2xl border border-rose-500/20 bg-[#121320] p-6 shadow-[0_28px_70px_-35px_rgba(0,0,0,0.9)] relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-rose-500/40 to-transparent" />
              <h3 className="text-lg font-bold text-rose-300">
                Không thể thực hiện tác vụ
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">
                {popupErrorMessage}
              </p>
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => setPopupErrorMessage("")}
                  className="px-5 py-2 rounded-xl bg-rose-500/10 border border-rose-500/25 hover:bg-rose-500/20 text-rose-300 text-xs font-bold uppercase transition"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {/* Deposit QR Modal Popup */}
        <DepositModal
          isOpen={showDeposit}
          onClose={() => setShowDeposit(false)}
          onSuccess={handleDepositSuccess}
        />

        {/* Deposit/Transaction History Modal Popup */}
        {showHistoryModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm transition duration-200">
            <div className="w-full max-w-2xl rounded-3xl border border-white/[0.05] bg-[#10111a] p-6 shadow-[0_28px_70px_-35px_rgba(0,0,0,0.9)] relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500/25 to-transparent" />

              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/[0.05] pb-4 mb-5">
                <div className="flex items-center gap-2.5">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5 text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                  <h3 className="text-base font-bold text-white tracking-wide">
                    Lịch sử giao dịch ví
                  </h3>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => void fetchWallet()}
                    className="w-6 h-6 rounded bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition active:scale-95"
                    title="Làm mới lịch sử"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-3.5 w-3.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                    </svg>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowHistoryModal(false)}
                    className="text-slate-400 hover:text-white transition-all text-sm font-extrabold px-1.5"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Transactions List */}
              <div className="overflow-y-auto max-h-[50vh] pr-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/[0.04]">
                      <th className="text-[10px] font-bold text-slate-500 tracking-wider uppercase py-3.5">
                        LOẠI GIAO DỊCH
                      </th>
                      <th className="text-[10px] font-bold text-slate-500 tracking-wider uppercase py-3.5">
                        NGÀY GIAO DỊCH
                      </th>
                      <th className="text-[10px] font-bold text-slate-500 tracking-wider uppercase py-3.5">
                        TRẠNG THÁI
                      </th>
                      <th className="text-[10px] font-bold text-slate-500 tracking-wider uppercase py-3.5 text-right">
                        SỐ TIỀN
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {walletLoading ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="text-center py-8 text-sm text-slate-400 animate-pulse"
                        >
                          Đang tải giao dịch...
                        </td>
                      </tr>
                    ) : walletTransactions.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="text-center py-8 text-sm text-slate-500"
                        >
                          Chưa có lịch sử giao dịch ví nào
                        </td>
                      </tr>
                    ) : (
                      walletTransactions.map((tx) => {
                        const isPositive =
                          tx.type === "deposit" || tx.type === "refund";
                        const typeBadge = getTypeBadge(tx.type);
                        const statusBadge = getStatusBadge(tx.status);

                        let statusClass = "";
                        if (tx.status === "completed") {
                          statusClass =
                            "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
                        } else if (tx.status === "pending") {
                          statusClass =
                            "bg-amber-500/10 text-amber-400 border border-amber-500/20";
                        } else {
                          statusClass =
                            "bg-slate-500/10 text-slate-400 border border-white/[0.05]";
                        }

                        return (
                          <tr
                            key={tx.id}
                            className="border-b border-white/[0.02] hover:bg-white/[0.01] transition duration-150"
                          >
                            <td className="py-4 flex items-center gap-3">
                              <div
                                className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${typeBadge.bg} ${typeBadge.color}`}
                              >
                                {typeBadge.icon}
                              </div>
                              <div className="min-w-0">
                                <span className="text-sm font-semibold text-slate-200 block truncate">
                                  {tx.type === "deposit"
                                    ? "Nạp tiền vào ví"
                                    : tx.type === "refund"
                                      ? "Hoàn tiền đặt sân"
                                      : "Thanh toán đặt sân"}
                                </span>
                                {tx.transferCode && (
                                  <span className="text-[10px] font-mono text-slate-500 mt-0.5 block">
                                    Mã: {tx.transferCode}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-4 text-sm font-semibold text-slate-300">
                              {formatTxSimpleDate(tx.createdAt)}
                              <span className="text-[10px] font-mono text-slate-500 block mt-0.5">
                                {formatTxTime(tx.createdAt)}
                              </span>
                            </td>
                            <td className="py-4">
                              <span
                                className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold ${statusClass}`}
                              >
                                {statusBadge.label}
                              </span>
                            </td>
                            <td className="py-4 text-sm font-bold text-right text-white">
                              <span
                                className={
                                  isPositive
                                    ? "text-emerald-400"
                                    : "text-slate-200"
                                }
                              >
                                {isPositive ? "+" : "-"}
                                {formatVND(tx.amount)}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Close footer action */}
              <div className="mt-6 flex justify-end border-t border-white/[0.05] pt-4">
                <button
                  type="button"
                  onClick={() => setShowHistoryModal(false)}
                  className="px-5 py-2 rounded-xl bg-white/[0.02] border border-white/10 hover:bg-white/[0.05] text-slate-200 text-xs font-bold uppercase transition"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
