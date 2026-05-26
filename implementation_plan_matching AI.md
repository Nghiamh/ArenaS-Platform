# Kế hoạch nâng cấp hệ thống kỹ năng người chơi & ghép trận AI (MVP + Onboarding)

Kế hoạch này nhằm tái cấu trúc mô hình `UserSkill` phục vụ cho việc ghép cặp thông minh (Matchmaking) bằng AI trong giai đoạn MVP. Chúng ta loại bỏ thuộc tính "Vị trí / phong cách chơi" để giữ mô hình gọn nhẹ, tập trung thu thập 6 tín hiệu onboarding mạnh nhất và cài đặt cơ chế tự học ELO/MMR cùng thuật toán tính điểm tương đồng đa tham số (Multi-attribute matching similarity).

---

## User Review Required

> [!IMPORTANT]
> **Khởi tạo giá trị ELO & Độ tin cậy:**
> * Giá trị ELO mặc định khởi tạo sẽ là `1200`.
> * Điểm tin cậy (`confidence_score`) sẽ khởi tạo ở mức `0.5` (trên thang đo `0.0` đến `1.0`).
> * Các môn thể thao được hỗ trợ (cố định trong MVP): Bóng đá, Tennis, Pickleball, Cầu lông.

> [!WARNING]
> **Tương thích dữ liệu cũ:**
> Khi cập nhật Schema mới, các bản ghi cũ trong DB sẽ thiếu các trường onboarding mới (`experience_years`, `play_frequency`, `competitiveness`, `goals`). Chúng ta sẽ xử lý bằng cách:
> * Đặt các trường này là tùy chọn (`optional` ở model) hoặc gán giá trị mặc định hợp lý (ví dụ: `competitiveness = 3`, `play_frequency = 2`) để tránh lỗi server và matchmaking.
> * Cập nhật Controller và UI cho phép người dùng cập nhật bổ sung các thông tin này bất kỳ lúc nào.

---

## Proposed Changes

### 1. Backend Layer (BE)

#### [MODIFY] [userSkillModel.ts](file:///e:/FPT/arenas/clone2/ArenaS/BE/src/models/userSkillModel.ts)
* Cập nhật interface `IUserSkill` và `userSkillSchema` Mongoose:
  * Thêm các trường onboarding:
    * `experience_years`: Số năm kinh nghiệm (Number, optional)
    * `play_frequency`: Tần suất chơi (Number - số buổi/tuần, optional)
    * `competitiveness`: Mức độ cạnh tranh (Number từ 1-5, optional)
    * `goals`: Mục tiêu sử dụng (Array of Strings, ví dụ: `find_teammates`, `find_opponents`, `social`, `improve_skills`)
  * Cập nhật trường tự học:
    * `rating_score`: Điểm ELO (Number, required, mặc định `1200`)
    * `confidence_score`: Độ tin cậy (Number, mặc định `0.5`, khoảng `0.0` - `1.0`)
    * `survey_count`: Số khảo sát đã làm (Number, mặc định `0`)
    * `rating_history`: Lịch sử điểm số (Array of Numbers, mặc định `[]`)

#### [MODIFY] [userSkillController.ts](file:///e:/FPT/arenas/clone2/ArenaS/BE/src/controllers/userSkillController.ts)
* Cập nhật hàm `createCurrentUserSkill` và `updateCurrentUserSkill`:
  * Nhận thêm các trường mới từ request body: `experience_years`, `play_frequency`, `competitiveness`, `goals`.
  * Validate chặt chẽ:
    * `competitiveness` phải từ 1-5.
    * `play_frequency` phải là số dương hợp lệ.
    * `goals` phải là mảng chuỗi thuộc danh mục cho phép.
  * Mặc định khởi tạo `rating_score: 1200` và `confidence_score: 0.5` đối với kỹ năng mới tạo.
* Cập nhật hàm phản hồi `buildUserSkillResponse` để trả về đầy đủ các thông tin onboarding này về cho Client.
### 2. Frontend Layer (FE)

#### [MODIFY] [Axios.tsx](file:///e:/FPT/arenas/clone2/ArenaS/FE/src/Axios/Axios.tsx)
* Cập nhật định nghĩa kiểu dữ liệu `UserSkill` và `UserSkillPayload`:
  ```typescript
  export type UserSkill = {
    id: string;
    sport: string;
    level: number;
    experience_years?: number;
    play_frequency?: number;
    competitiveness?: number;
    goals?: string[];
    rating_score: number;
    confidence_score?: number;
    note?: string;
    createdAt?: string;
    updatedAt?: string;
  };

  export type UserSkillPayload = {
    sport: string;
    level: number;
    experience_years?: number;
    play_frequency?: number;
    competitiveness?: number;
    goals?: string[];
    note?: string;
  };
  ```

#### [MODIFY] [ProfilePage.tsx](file:///e:/FPT/arenas/clone2/ArenaS/FE/src/pages/Customer/ProfilePage.tsx)
* **Cập nhật State Form Kỹ Năng (`SkillFormState`):**
  * Thêm: `experienceYears`, `playFrequency`, `competitiveness`, và `goals`.
* **Cập nhật Giao Diện Thêm/Sửa Kỹ năng (Form render):**
  * Thiết kế thêm các ô nhập liệu hiện đại (dropdown/slider/checkboxes):
    * *Số năm kinh nghiệm*: Ô nhập số (Number input).
    * *Tần suất chơi*: Slider hoặc số (số buổi/tuần).
    * *Mức độ cạnh tranh*: Dropdown 1-5 từ "Giải trí vui vẻ" đến "Cực kỳ cạnh tranh/Giải đấu".
    * *Mục tiêu*: Tập hợp các checkbox chọn nhiều mục tiêu:
      * `find_teammates` (Tìm đồng đội ghép cặp)
      * `find_opponents` (Tìm đối thủ giao lưu)
      * `social` (Giao lưu kết bạn)
      * `improve_skills` (Cọ xát nâng trình)
* **Cập nhật Render Card Kỹ năng:**
  * Hiển thị thêm các tag trực quan cho `Tần suất chơi (X buổi/tuần)`, `Mức độ cạnh tranh (X/5)` và các badge mục tiêu.
  * Hiển thị điểm số ELO hiện tại của người dùng dưới dạng một chỉ số "Đánh giá thực tế từ hệ thống AI".

---

## Verification Plan

### Automated Tests
* Chạy bộ server backend để đảm bảo không lỗi khởi động và biên dịch.
* Gửi các request POST/PUT bằng Postman / curl để tạo kỹ năng mới và kiểm tra xem điểm ELO mặc định (1200) và điểm tự tin (0.5) cùng các trường onboarding được lưu chính xác trong MongoDB.
* Gọi API `/api/profile/skills` kiểm tra cấu trúc JSON phản hồi.

