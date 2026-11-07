/**
 * Shared court/sport utility functions – single source of truth.
 * Import from here instead of redefining in each screen.
 */

export const SPORT_ICONS = {
    football: "soccer",
    badminton: "badminton",
    tennis: "tennis",
    pickleball: "table-tennis",
    basketball: "basketball",
    volleyball: "volleyball",
    default: "soccer",
};

export const SPORT_TONES = {
    football: "bg-[#1A4D63]",
    badminton: "bg-[#5B3D77]",
    tennis: "bg-[#14532D]",
    pickleball: "bg-[#1D4ED8]",
    basketball: "bg-[#B45309]",
    volleyball: "bg-[#9333EA]",
    default: "bg-[#334155]",
};

export const SPORT_NAMES_VI = {
    football: "Bóng đá",
    football_5: "Bóng đá 5",
    football_7: "Bóng đá 7",
    football_11: "Bóng đá 11",
    badminton: "Cầu lông",
    tennis: "Tennis",
    pickleball: "Pickleball",
    basketball: "Bóng rổ",
    volleyball: "Bóng chuyền",
};

export const PLACEHOLDER_IMAGE =
    "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?q=80&w=400&auto=format&fit=crop";

export function getSportIcon(sportKey) {
    if (!sportKey) return SPORT_ICONS.default;
    return SPORT_ICONS[sportKey.toLowerCase()] || SPORT_ICONS.default;
}

export function getSportTone(sportKey) {
    if (!sportKey) return SPORT_TONES.default;
    return SPORT_TONES[sportKey.toLowerCase()] || SPORT_TONES.default;
}

export function getSportNameVI(sportKey) {
    if (!sportKey) return "Khác";
    return SPORT_NAMES_VI[sportKey.toLowerCase()] || sportKey;
}

/** Lấy ảnh đại diện của sân (fallback về placeholder) */
export function getCourtImage(court) {
    if (court.images && court.images.length > 0) return court.images[0];
    if (court.image) return court.image;
    if (court.photos && court.photos.length > 0) return court.photos[0];
    if (court.thumbnail) return court.thumbnail;
    return PLACEHOLDER_IMAGE;
}

/** Lấy môn thể thao chính của sân */
export function getCourtSport(court) {
    if (court.sports && court.sports.length > 0) return court.sports[0];
    return court.sport || court.sportType || court.type || court.category || "";
}

/**
 * Format số tiền VNĐ.
 * @param {number|string} price
 * @param {string} [suffix="đ"] - hậu tố, vd: "đ", "đ/giờ"
 */
export function formatPrice(price, suffix = "đ") {
    if (!price && price !== 0) return "Liên hệ";
    const num = typeof price === "string" ? parseInt(price, 10) : price;
    if (isNaN(num)) return String(price);
    return num.toLocaleString("vi-VN") + suffix;
}

/** Nhóm danh sách sân theo môn thể thao */
export function groupBySport(courts) {
    const sportMap = {};
    courts.forEach((court) => {
        const sports =
            court.sports && court.sports.length > 0
                ? court.sports
                : [getCourtSport(court) || "other"];
        sports.forEach((sport) => {
            const key = sport.toLowerCase();
            if (!sportMap[key]) {
                sportMap[key] = { key, name: getSportNameVI(key), count: 0 };
            }
            sportMap[key].count++;
        });
    });
    return Object.values(sportMap);
}
