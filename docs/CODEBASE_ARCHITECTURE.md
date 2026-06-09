# BÁO CÁO REVIEW CODE & CHI TIẾT KIẾN TRÚC HỆ THỐNG (CODEBASE ARCHITECTURE)
## Dự án: ImmortalSim - Trình giả lập tu tiên roguelite

Tài liệu này cung cấp một bản phân tích kiến trúc chuyên sâu, đánh giá chi tiết cấu trúc mã nguồn, và tài liệu hóa mục đích hoạt động của từng thành phần trong dự án **ImmortalSim**.

---

## I. KIẾN TRÚC TỔNG THỂ HỆ THỐNG (SYSTEM ARCHITECTURE)

Dự án **ImmortalSim** được xây dựng theo kiến trúc **Mô phỏng Dữ liệu hướng Sự kiện (Event-driven Data Simulation)** kết hợp với khối **Chiến đấu Giả lập động theo thời gian (Tick-based Narrative Combat)** ở Client. 

### 1. Luồng dữ liệu và Tương tác giữa các Phân hệ

```mermaid
graph TD
    %% Subsystems
    subgraph Client UI (React/Next.js)
        A[HomePage / app/page.tsx] -->|Sử dụng| B(components/StatsPanel)
        A -->|Sử dụng| C(components/EventLog)
        A -->|Sử dụng| D(components/ChoiceButtons)
        A -->|Sử dụng| E(components/AtmosphereBackground)
        A -->|Kích hoạt| F(components/TestCombatPanel)
    end

    subgraph Simulation Core (Life Engine)
        G[lib/engine.ts] -->|Cung cấp logic| A
        H[lib/i18n.ts] -->|Dịch thuật/Template| A
        I[hooks/useAtmosphere.ts] -->|Đồng bộ trạng thái| A
        I -->|Điều khiển| J[lib/atmosphere/audioManager]
        I -->|Điều khiển| K[lib/atmosphere/backgroundManager]
    end

    subgraph Combat Engine (docs/)
        F -->|Bắt đầu| L[docs/useCombatEngine.ts]
        L -->|Sắp xếp Sự kiện| M[docs/TimelineEngine.ts]
        L -->|Quyết định Chiêu| N[docs/AIEngine.ts]
        L -->|Thực thi Hành động| O[docs/SkillProcessor.ts]
        O -->|Phân tích biểu thức| P[docs/FormulaEvaluator.ts]
        O -->|Phản ứng| Q[docs/TriggerEngine.ts]
        L -->|Tạo cốt truyện| R[docs/NarrativeCombatEngine.ts]
        R -->|Lưu cảm xúc| S[docs/NarrativeMemory.ts]
        R -->|Chọn từ vựng| T[docs/NarrativeTemplateSelector.ts]
        T -->|Kho từ| U[docs/NarrativeTemplatePool.ts]
    end

    subgraph Database Schema (data/)
        V[data/20260520040712_init_schema.sql] -.->|Thiết lập Schema tương lai| W[Supabase Backend]
    end
```

---

## II. CHI TIẾT TỪNG THÀNH PHẦN MÃ NGUỒN (SOURCE CODE COMPONENT DETAILS)

### 1. Phân hệ Giao diện chính (Client UI Components)

Các components chịu trách nhiệm kết xuất (render) trạng thái trò chơi trực quan và tạo cảm giác tĩnh mịch, thiền định theo phong cách truyện chữ kiếm hiệp.

*   #### [page.tsx](file:///c:/Users/ADMIN/Documents/ImmortalSim/app/page.tsx) (Trang chủ trò chơi)
    *   **Mục đích**: Đóng vai trò là Bộ điều khiển Trung tâm (Core Controller). Quản lý state toàn cục của kiếp sống hiện tại (`GameState`), lưu trữ thừa kế (`Inheritance`), ngôn ngữ, trạng thái âm thanh và chuyển đổi giữa giao diện mô phỏng cuộc đời và giao diện thử nghiệm chiến đấu.
    *   **Luồng hoạt động**: Đọc/ghi các thuộc tính của người chơi vào `window.localStorage` để lưu game tự động. Nhận phản hồi lựa chọn sự kiện của người chơi để gọi sang thư viện engine để tiến trình hóa trò chơi.

*   #### [AtmosphereBackground.tsx](file:///c:/Users/ADMIN/Documents/ImmortalSim/components/AtmosphereBackground.tsx) (Nền cảnh động)
    *   **Mục đích**: Vẽ hiệu ứng thời tiết, mây trôi và sương khói dựa theo Cảnh giới (`Realm`) và các chỉ số nghiệp lực (`Karma`).
    *   **Logic chính**: Áp dụng hiệu ứng parallax (cuộn nền nhiều lớp) từ tệp CSS sương mù, mưa, hoặc phát sáng lấp lánh (khi chết/đầu thai) tương ứng với cảnh giới từ Phàm Nhân cho tới Kim Đan.

*   #### [AudioControls.tsx](file:///c:/Users/ADMIN/Documents/ImmortalSim/components/AudioControls.tsx) (Bảng điều khiển âm thanh)
    *   **Mục đích**: Cung cấp giao diện trực quan cho phép bật/tắt âm thanh nền, tắt tiếng (mute) và điều chỉnh thanh trượt volume âm lượng.

*   #### [ChoiceButtons.tsx](file:///c:/Users/ADMIN/Documents/ImmortalSim/components/ChoiceButtons.tsx) (Nút lựa chọn sự kiện)
    *   **Mục đích**: Kết xuất các sự lựa chọn của sự kiện hiện tại, đi kèm hiệu ứng Framer Motion mượt mà xuất hiện từ dưới lên.
    *   **Mỹ thuật**: Sử dụng viền gạo nhạt `rice-400` mảnh mai, tự động đổi màu khi di chuột qua để tăng tính tương tác.

*   #### [EventLog.tsx](file:///c:/Users/ADMIN/Documents/ImmortalSim/components/EventLog.tsx) (Nhật ký sự kiện cuộc đời)
    *   **Mục đích**: Hiển thị dòng thời gian cuộc đời của tu sĩ trong kiếp này.
    *   **Đặc điểm**: Giới hạn hiển thị 6 sự kiện gần nhất đảo ngược (sự kiện mới nhất xếp trên đầu), gắn kết với nhau bằng một trục dọc phát sáng mờ mô tả các mảnh ký ức (Memory Fragments).

*   #### [StatsPanel.tsx](file:///c:/Users/ADMIN/Documents/ImmortalSim/components/StatsPanel.tsx) (Bảng thuộc tính tu sĩ)
    *   **Mục đích**: Thể hiện các chỉ số năng lực của nhân vật: Health (Sinh lực), Cultivation (Tu vi), Luck (Khí vận), Karma (Nghiệp), Comprehension (Ngộ tính) và các chỉ số luân hồi.
    *   **Đặc điểm**: Vẽ thanh tiến trình chỉ bằng một pixel đường kẻ ngang đen tối giản (`h-[1px]`), thanh tiến độ là một vệt sáng gradient lướt chậm tạo phong vị thiền định tao nhã.

*   #### [TestCombatPanel.tsx](file:///c:/Users/ADMIN/Documents/ImmortalSim/components/TestCombatPanel.tsx) (Giao diện Chiến đấu thử nghiệm)
    *   **Mục đích**: Cung cấp giao diện cấu hình hai bên (chọn cảnh giới, thuộc tính thể chất, công pháp chủ đạo và chiến thuật) và màn hình hiển thị logs chiến đấu động.
    *   **Bổ sung mới**: Tích hợp hàm `handleExportLogs()` để đóng gói lịch sử trận đấu thành tệp `.txt` tải trực tiếp về thiết bị của người dùng khi trận đấu kết thúc.

---

### 2. Phân hệ Mô phỏng Đời sống (Simulation Engine)

Nằm trong `/lib` và `/hooks`, chịu trách nhiệm vận hành dòng chảy cuộc đời của nhân vật theo thời gian (tuổi tác) và đồng bộ nhạc nền tương ứng.

*   #### [engine.ts](file:///c:/Users/ADMIN/Documents/ImmortalSim/lib/engine.ts) (Linh hồn mô phỏng)
    *   **createNewGame**: Khởi tạo kiếp mới. Đọc điểm `Inheritance` chuyển hóa thành bonus điểm thuộc tính gốc ban đầu.
    *   **applyChoiceToState**: Tính toán tuổi nhảy tiếp theo (1-3 năm), cộng/trừ chỉ số của lựa chọn, cập nhật cảnh giới mới và kiểm tra trạng thái sống sót. Nếu HP hoặc Karma cạn kiệt, tính toán nguyên nhân tử vong và sinh log chết.
    *   **reincarnate**: Kết thúc kiếp hiện tại, tính toán điểm thừa kế dựa trên thành tựu tu vi/ngộ tính/khí vận đạt được của kiếp đó để đưa vào kiếp kế tiếp.

*   #### [i18n.ts](file:///c:/Users/ADMIN/Documents/ImmortalSim/lib/i18n.ts) (Bản địa hóa đa ngôn ngữ)
    *   **Mục đích**: Xử lý đa ngôn ngữ động cho giao diện Anh/Việt.
    *   **Hàm quan trọng**:
        *   `renderText`: Sử dụng regex thay thế tham số động dạng `{age}` hay `{event}` bằng giá trị cụ thể.
        *   `renderLocalizedTemplate`: Trả về một object cục bộ hóa tương ứng với ngôn ngữ của người dùng trên toàn bộ tham số truyền vào.

*   #### [useAtmosphere.ts](file:///c:/Users/ADMIN/Documents/ImmortalSim/hooks/useAtmosphere.ts) (Đồng bộ âm thanh nền)
    *   **Mục đích**: Hook trung gian lắng nghe sự thay đổi của `GameState` để tính toán ra hoàn cảnh (Atmosphere Mode) tương ứng, gọi sang `audioManager` để chuyển tiếp bài nhạc nền.

*   #### [backgroundManager.ts](file:///c:/Users/ADMIN/Documents/ImmortalSim/lib/atmosphere/backgroundManager.ts) (Quản lý hình nền)
    *   **Mục đích**: Quyết định mã CSS và thuộc tính HSL nền chuyển tiếp mượt mà khi người chơi thay đổi hoàn cảnh sống (ví dụ: cảnh giới Kim Đan sẽ đổi sang tông màu cấm kỵ bí ẩn `forbidden`).

*   #### [audioManager.ts](file:///c:/Users/ADMIN/Documents/ImmortalSim/lib/atmosphere/audioManager.ts) (Bộ phát nhạc Howler)
    *   **Mục đích**: Thực thi tải trước nhạc nền (mp3) và xử lý hiệu ứng làm mờ âm thanh cũ để tăng âm thanh mới (crossfade) kéo dài 2 giây.

---

### 3. Phân hệ Động cơ Chiến đấu & Kể chuyện (Combat & Narrative Engine)

Nằm toàn bộ trong thư mục `docs/`. Phân hệ này là trái tim công nghệ của cơ chế giao tranh tick-based và tường thuật chữ tự động.

*   #### [TimelineEngine.ts](file:///c:/Users/ADMIN/Documents/ImmortalSim/docs/TimelineEngine.ts) (Bộ điều phối thời gian)
    *   **Mục đích**: Thay vì đi theo lượt (turn-based) truyền thống, lớp này quản lý danh sách sự kiện sắp xếp theo thời gian Tick tăng dần.
    *   **Cơ chế**: Khi hành động chạy, nó sẽ tự tính toán lượng Tick cần để hồi chiêu tiếp theo dựa trên chỉ số `speed` (Tốc độ) của đấu sĩ.

*   #### [FormulaEvaluator.ts](file:///c:/Users/ADMIN/Documents/ImmortalSim/docs/FormulaEvaluator.ts) (Trình biên dịch công thức toán)
    *   **Mục đích**: Tính toán sát thương hoặc biểu thức boolean động từ chuỗi config JSON mà không dùng `eval()` nguy hiểm.
    *   **Giải pháp an toàn**: Tích hợp lớp **SafeExpressionParser** sử dụng kỹ thuật phân tích cú pháp **Recursive Descent Parsing** để biên dịch các chuỗi toán học và logic một cách cô lập và an toàn tuyệt đối.

*   #### [SkillProcessor.ts](file:///c:/Users/ADMIN/Documents/ImmortalSim/docs/SkillProcessor.ts) (Thực thi Kỹ năng)
    *   **Mục đích**: Xử lý logic cơ học của kỹ năng: kiểm tra có đủ linh lực (Qi cost) để xuất chiêu không, áp dụng sát thương/hồi phục lên base stats, cộng dồn điểm căng thẳng `tension` cho võ đài, và phát tín hiệu cho các trigger phản ứng.

*   #### [AIEngine.ts](file:///c:/Users/ADMIN/Documents/ImmortalSim/docs/AIEngine.ts) (Trí tuệ nhân tạo đối thủ)
    *   **Mục đích**: Lọc danh sách quy tắc AI (`ai_rules`) của đối thủ, kiểm tra tính hợp lệ của điều kiện bằng `FormulaEvaluator`, sau đó chọn ra hành động có độ ưu tiên (weight) cao nhất.

*   #### [TriggerEngine.ts](file:///c:/Users/ADMIN/Documents/ImmortalSim/docs/TriggerEngine.ts) (Xử lý Phản xạ)
    *   **Mục đích**: Kiểm tra các sự kiện phản ứng (như `on_take_damage`) của nhân vật, tính toán tỉ lệ kích hoạt (`chance`), và trả về lựa chọn hành động phản công đặc biệt bổ sung vào UI người chơi.

*   #### [ModifierPipeline.ts](file:///c:/Users/ADMIN/Documents/ImmortalSim/docs/ModifierPipeline.ts) (Đường dẫn tính toán chỉ số)
    *   **Mục đích**: Lấy chỉ số gốc ban đầu cộng/trừ các ảnh hưởng từ các Buff trạng thái và Aura môi trường tại Tick hiện tại, xuất ra chỉ số thực tế phục vụ tính sát thương.

*   #### [NarrativeCombatEngine.ts](file:///c:/Users/ADMIN/Documents/ImmortalSim/docs/NarrativeCombatEngine.ts) (Biên dịch truyện chữ)
    *   **Mục đích**: Tiếp nhận các sự kiện cơ học (như gây 30 damage bằng kiếm) và dịch chuyển chúng thành các dòng văn kể chuyện kiếm hiệp giàu cảm xúc.
    *   **Luồng xử lý**: Quyết định độ dày của dòng log (Line density) dựa trên giai đoạn căng thẳng của trận đấu (ví dụ: giai đoạn Climax sẽ vẽ thêm dòng sụp đổ linh khí và tâm ma trỗi dậy).

*   #### [NarrativeMemory.ts](file:///c:/Users/ADMIN/Documents/ImmortalSim/docs/NarrativeMemory.ts) (Bộ nhớ tâm trạng trận đấu)
    *   **Mục đích**: Theo dõi xem ai đang kiểm soát nhịp độ trận đấu, lượng sát thương dồn dập, và tính toán chỉ số cảm xúc: Nỗi sợ (Fear), Nộ khí (Rage), Đạo tâm ổn định (Dao Stability) của đấu sĩ để dịch chuyển trận đấu sang các phân đoạn cao trào phù hợp.

*   #### [NarrativeTemplatePool.ts](file:///c:/Users/ADMIN/Documents/ImmortalSim/docs/NarrativeTemplatePool.ts) (Kho từ vựng tiếng Việt)
    *   **Mục đích**: Định nghĩa các câu văn kiếm hiệp tu tiên mẫu bằng tiếng Việt mang sắc thái u tối (dark xianxia) để máy chủ ghép từ động (ví dụ: *"{targetName} run rẩy, khí huyết đảo lộn sau một kích của {actorName}"*).

---

### 4. Cơ sở Dữ liệu & Cấu hình Backend (Database & Backend Configuration)

Nằm trong `/data` và `/supabase`, phục vụ cho các tính năng trực tuyến mở rộng của dự án.

*   #### [20260520040712_init_schema.sql](file:///c:/Users/ADMIN/Documents/ImmortalSim/data/20260520040712_init_schema.sql) (Schema Supabase)
    *   **Mục đích**: Bản thiết kế bảng SQL quan hệ trên Supabase PostgreSQL.
    *   **Các bảng quan trọng**:
        *   `profiles`: Quản lý tài khoản người chơi.
        *   `legacies`: Quản lý thuộc tính thừa kế bền vững tích lũy qua các kiếp.
        *   `incarnations`: Nhật ký danh sách các kiếp sống (run) của một tài khoản.
        *   `characters`: Lưu chỉ số tu vi chi tiết của nhân vật trong kiếp đó.
        *   `event_logs`: Ghi dấu lịch sử quyết định sự kiện của người chơi để vẽ cây cốt truyện.
        *   `npcs` & `relationships`: Hỗ trợ cho hệ thống NPC sinh bằng AI và điểm tình cảm sư đồ/kẻ thù.

*   #### [database.ts](file:///c:/Users/ADMIN/Documents/ImmortalSim/data/database.ts) (Kiểu dữ liệu DB)
    *   **Mục đích**: Khai báo các interface TypeScript khớp hoàn toàn với schema SQL trên Supabase, giúp lập trình viên viết code tương tác DB an toàn mà không sợ sai kiểu dữ liệu.

---

## III. TỔNG KẾT ĐÁNH GIÁ MÃ NGUỒN (CODE REVIEW SUMMARY)

Sau khi kiểm tra toàn diện mã nguồn của dự án, tôi đánh giá chất lượng codebase như sau:

| Tiêu chí | Điểm số | Nhận xét chi tiết |
| :--- | :--- | :--- |
| **Tính Mô-đun (Modularity)** | **9/10** | Rất tốt. Vòng lặp mô phỏng chính và hệ thống chiến đấu được chia nhỏ thành các lớp riêng biệt có chức năng độc lập (như `SkillProcessor`, `TimelineEngine`, `AIEngine`), giúp việc sửa đổi mã nguồn không ảnh hưởng đến các phân hệ khác. |
| **Mỹ thuật & Trải nghiệm (Aesthetics)** | **9.5/10** | Xuất sắc. Sự kết hợp giữa Tailwind CSS trầm ấm tối giản và hiệu ứng mây mưa trôi động của `atmosphere.css` cùng framer-motion tạo cảm giác thiền định rất cao cấp và lôi cuốn người chơi. |
| **Độ tin cậy của mã nguồn (Type Safety)** | **9/10** | TypeScript được áp dụng triệt để ở cả giao diện, mô phỏng cuộc sống và hệ thống chiến đấu. Việc loại bỏ `eval()` đã triệt tiêu hoàn toàn nguy cơ mất an toàn dữ liệu và lỗi runtime không mong muốn. |
| **Khả năng mở rộng (Extensibility)** | **8.5/10** | Dễ dàng bổ sung thêm các sự kiện cuộc đời mới thông qua thư mục `/locales` và các công pháp chiến đấu mới thông qua file cấu hình JSON trong components/TestCombatPanel. |

### Đề xuất lộ trình phát triển kế tiếp (Next Steps Roadmap)
1.  **Tích hợp hệ thống Combat vào Sự kiện Cuộc đời**:
    *   Hiện tại chế độ combat đang nằm biệt lập ở nút "Test Combat". Đề xuất tích hợp nó vào các sự kiện ngẫu nhiên trong kiếp sống thực tế (ví dụ: đến tuổi 20 gặp địch nhân đột kích, giao diện chuyển tiếp sang màn hình combat. Nếu thua sẽ kích hoạt tử vong và luân hồi kiếp mới).
2.  **Đồng bộ Supabase Database**:
    *   Sử dụng schema SQL đã có sẵn trong `/data` kết hợp với thư viện `@supabase/supabase-js` để đồng bộ chỉ số luân hồi (`legacies`) trực tuyến, mở đường cho việc lưu game đa nền tảng (Cloud Save) và bảng xếp hạng kiếp tu chân của người chơi.
3.  **Tạo NPC ngẫu nhiên bằng Trí tuệ nhân tạo (Emergent AI NPCs)**:
    *   Sử dụng cấu hình bảng `npcs` và prompt gợi ý có sẵn để kết nối API LLM (như Gemini API) tạo ra các đối thủ ngẫu nhiên có tính cách và phong cách xuất chiêu biến ảo tùy thuộc vào hành động của người chơi.
