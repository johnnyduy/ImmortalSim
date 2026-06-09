# Đề Xuất Ý Tưởng Vận Hành Hệ Thống Ngoại Môn & Lịch Luyện
## Dự án: ImmortalSim - Trình giả lập tu tiên roguelite

Tài liệu này đề xuất các ý tưởng thiết kế game, quy tắc vận hành và phương án tích hợp kỹ thuật vào mã nguồn Next.js hiện tại để hiện thực hóa 5 hoạt động cốt lõi của nhân vật chính ở Ngoại Môn theo yêu cầu.

---

## 1. Hệ Thống Tu Luyện Đa Dạng (Cultivation & Crafting)

Hiện tại, việc tu luyện chủ yếu diễn ra thụ động theo từng tháng (`+0.02 tu vi`) hoặc thông qua lựa chọn sự kiện ngẫu nhiên. Để tăng tính chủ động, chúng tôi đề xuất mở rộng tính năng này thành 3 nhánh hành động chính:

### A. Tĩnh Tu (Closed-door Cultivation)
*   **Mô tả**: Nhân vật đóng cửa động phủ, tập trung đột phá hoặc hấp thu linh khí thiên địa.
*   **Vận hành**: Tiêu tốn 1 tháng thời gian.
    *   Tăng tu vi đáng kể: `+0.2 đến +0.8 tu vi` (cộng thêm bonus dựa trên **Ngộ Tính**).
    *   Có `5%` tỷ lệ kích hoạt sự kiện "Tẩu hỏa nhập ma" (nếu Đạo Tâm thấp) hoặc "Ngộ đạo đột phá" (nội suy ra công pháp mới hoặc nhận ngẫu nhiên mảnh tàn quyển).
*   **Tích hợp code**:
    *   Thêm nút **Tĩnh Tu** bên cạnh nút **Trị Thương** trong [page.tsx](file:///c:/Users/ADMIN/Documents/ImmortalSim/app/page.tsx).
    *   Tạo hàm `handleQuietMeditation()` trong `engine.ts` để nhảy tháng và cộng chỉ số tương ứng.

### B. Luyện Đan (Alchemy)
*   **Mô tả**: Sử dụng các loại **Linh Thảo** thu thập được để luyện chế đan dược hỗ trợ tu hành.
*   **Vận hành**: Tiêu tốn 1 tháng thời gian và nguyên liệu:
    *   *Ngưng Khí Đan* (Tăng tu vi): Cần `3x Linh Thảo`.
    *   *Trúc Cơ Đan* (Tăng tỷ lệ đột phá Trúc Cơ thành công): Cần `5x Linh Thảo + 1x Tuyết Liên`.
    *   *Hồi Huyết Đan* (Hồi phục HP ngay lập tức): Cần `2x Linh Thảo`.
    *   Tỷ lệ thành công phụ thuộc vào chỉ số **Ngộ Tính** và **Vận May**. Luyện đan thất bại sẽ mất nguyên liệu hoặc nổ lò (gây `-HP`).
*   **Tích hợp code**:
    *   Định nghĩa thêm các vật phẩm nguyên liệu trong `combat-config.json` (ví dụ: `material_linh_thao`, `material_tuyet_lien`).
    *   Thêm panel chế tạo đan dược trong UI để người chơi sử dụng vật phẩm từ túi đồ (`inventory`).

### C. Chế Tạo Vũ Khí (Weapon Crafting)
*   **Mô tả**: Đúc vũ khí, giáp trụ bằng **Linh Quặng** thu hoạch được để tăng thuộc tính chiến đấu.
*   **Vận hành**: Tiêu tốn 1 tháng và nguyên liệu:
    *   *Thiết Kiếm* (Tăng công vật lý): Cần `3x Linh Quặng`.
    *   *Huyền Thiết Giáp* (Tăng phòng thủ): Cần `5x Linh Quặng`.
    *   Trang bị chế tạo ra sẽ tự động thêm vào `inventory` và có thể kích hoạt trang bị để tăng sức mạnh chiến đấu phục vụ cho Lịch Luyện và Thi Đấu.

---

## 2. Nhiệm Vụ Tông Môn & Áp Lực Hàng Năm (Mandatory Sect Quests)

Để tạo cảm giác áp lực của một đệ tử ngoại môn (phải làm việc vặt cho tông môn đổi lấy tài nguyên), chúng ta sẽ áp đặt quy tắc bắt buộc cho cảnh giới Luyện Khí.

### A. Quy Tắc Vận Hành
*   Khi ở cảnh giới **Luyện Khí** (Qi Refinement), mỗi năm (12 tháng) nhân vật bắt buộc phải hoàn thành **ít nhất 1 nhiệm vụ tông môn**.
*   Nếu đến tháng 12 (tháng Hợi 🐷) mà chưa hoàn thành nhiệm vụ nào trong năm đó, sang năm mới (tháng Tý 🐀) sẽ lập tức kích hoạt sự kiện phạt: **"Tông Môn Trừng Phạt"**.

### B. Hình Phạt
Người chơi phải chọn 1 trong các hình thức chịu phạt:
1.  **Chấp nhận lao dịch khổ sai**: Giảm mạnh sức khỏe (`-15 HP`), tăng `1` năm thọ nguyên lão hóa nhưng giữ lại Linh thạch.
2.  **Nộp phạt bằng tiền tài**: Giảm `100 Linh Thạch` (nếu không đủ linh thạch thì bị ép chọn cách 1 hoặc bị trừ điểm cống hiến âm).
3.  **Bị phạt roi da pháp luật**: Giảm tu vi (`-2.0 tu vi`) và giảm điểm Đạo Tâm (`-5 Đạo Tâm`).

### C. Ý Tưởng Tích Hợp Code
*   Thêm chỉ số `questsCompletedThisYear: number` vào `GameState` trong [types/index.ts](file:///c:/Users/ADMIN/Documents/ImmortalSim/types/index.ts).
*   Trong hàm `tickMonth()` ở [lib/engine.ts](file:///c:/Users/ADMIN/Documents/ImmortalSim/lib/engine.ts), tại đoạn kiểm tra đổi năm:
    ```typescript
    if (nextMonth === 1) { // Bắt đầu năm mới
      if (state.realm === 'Qi Refinement' && (state.questsCompletedThisYear ?? 0) === 0) {
        // Kích hoạt Sự kiện Tông Môn Phạt
        const punishmentEvent = buildSectPunishmentEvent();
        return {
          ...state,
          currentEvent: punishmentEvent,
          isTicking: false,
          questsCompletedThisYear: 0 // Reset
        };
      }
      // Reset bộ đếm hàng năm nếu bình an vô sự
      state.questsCompletedThisYear = 0;
    }
    ```
*   Khi người chơi hoàn thành nhiệm vụ tông môn thông qua `buildQuestCompleteEvent()`, tăng `questsCompletedThisYear` lên 1.

### D. Các Nhiệm Vụ Ngoại Môn Đa Dạng
Thêm các nhiệm vụ mới vào `data/sect-quests.json`:
*   **Chăn nuôi Linh Thú**:
    *   *Yêu cầu*: Cần Đạo Tâm hoặc Vận May tốt để không bị thú dữ cắn.
    *   *Tiến độ*: Có logs mô tả việc cho ăn, tắm rửa cho linh thú.
    *   *Thưởng*: Điểm cống hiến tông môn, nguyên liệu lông/da linh thú để chế đồ.
*   **Đào Quặng dưới Linh Quặng Hầm**:
    *   *Yêu cầu*: Sức khỏe tốt (HP > 15).
    *   *Tiến độ*: Đục đẽo trong hầm tối, nguy cơ sập hầm giảm HP.
    *   *Thưởng*: Nhận linh thạch và Linh quặng thô.
*   **Hái Linh Thảo ở Dược Viên**:
    *   *Yêu cầu*: Ngộ Tính hoặc Vận May.
    *   *Thưởng*: Linh Thảo thô dùng cho Luyện Đan.

---

## 3. Ra Ngoài Lịch Luyện (Adventure & Random Encounters)

Tính năng "Xuống núi chu du" hiện tại chỉ lấy sự kiện ngẫu nhiên chung chung. Chúng ta sẽ nâng cấp nó thành tính năng **Lịch Luyện Dã Ngoại** có chọn lọc địa điểm.

### A. Chọn Địa Điểm Lịch Luyện
Người chơi click vào nút **Lịch Luyện** và chọn một trong các bản đồ:
1.  **Vạn Thú Sơn Mạch (Beast Mountain Range)**: Nhiều dã thú hung dữ, rủi ro giao chiến cao nhưng thu được nhiều linh thú nguyên liệu và nhân sâm cổ.
2.  **Cổ Nhân Động Phủ (Ancient Ruins)**: Nơi ẩn cư của cổ tu sĩ sĩ. Rủi ro bẫy rập cao, nhưng cơ hội nhặt được công pháp cổ thất truyền rất cao.
3.  **Tế Đàn Ma Đạo (Demonic Alter)**: Vùng đất nguy hiểm đầy ma khí, nơi thường xuyên đụng độ Ma tu.

### B. Các Sự Kiện Đặc Sắc Khi Lịch Luyện
*   **Ma Tu Cướp Đường (Demonic Ambush)**:
    *   *Cơ chế*: Kích hoạt trận chiến thực tế bằng **Hệ Thống Chiến Đấu** (Combat Engine) với một Ma Tu ngẫu nhiên.
    *   *Thắng*: Nhận túi trữ vật của Ma tu (vũ khí quý, linh thạch lớn).
    *   *Thua*: Bị cướp hết Linh thạch hiện có, bị thương nặng hoặc tử vong vĩnh viễn.
*   **Cổ Nhân Di Tích (Ancient Cave Dwelling)**:
    *   Kiểm tra Ngộ tính/Vận may. Đưa ra các câu đố trận pháp cổ.
    *   Lựa chọn phá trận bằng vũ lực (cần Chiến lực cao) hoặc bằng trí tuệ (cần Ngộ tính cao). Thưởng: bí kíp công pháp tối thượng.
*   **Hỗ Trợ Đạo Hữu (Helping Hand)**:
    *   Gặp đạo hữu phe chính đạo bị thương hoặc bị vây hãm bởi dã thú.
    *   *Lựa chọn cứu giúp*: Mất máu hỗ trợ chiến đấu, nhận lại Điểm Nghiệp Lực thiện quả (+5) và sau này đạo hữu này có thể xuất hiện cứu mạng người chơi trong các sự kiện hiểm nghèo khác.
    *   *Lựa chọn làm ngơ / hôi của*: Cướp đoạt bảo vật của họ, nhận Linh thạch nhưng bị trừ Nghiệp Lực nghiêm trọng (-10 Nghiệp Lực - dễ thu hút Thiên Lôi đánh chết khi đột phá).

---

## 4. Đại Hội Tỷ Thí Xếp Hạng (Sect Tournaments)

Mỗi 5 hoặc 10 năm một lần (khi nhân vật đạt tuổi 15, 25, 35...), tông môn sẽ mở **Đại Hội Tỷ Thí Ngoại Môn**.

### A. Quy Trình Vận Hành
1.  Đến năm diễn ra đại hội, một sự kiện cố định xuất hiện thông báo: "Đại Hội Tỷ Thí Sơn Môn khai mở". Người chơi có quyền chọn:
    *   **Tham gia thi đấu**: Tiến vào vòng đấu.
    *   **Tọa sơn quan hổ đấu (Làm khán giả)**: Không thi đấu, chỉ quan sát học hỏi (Nhận `+3 Ngộ tính` nhưng không có phần thưởng hiện kim).
2.  Nếu tham gia, người chơi sẽ lần lượt giao chiến với **3 NPC** đệ tử ngoại môn khác có chỉ số tăng dần (Vòng loại, Bán kết, Chung kết). Trận chiến diễn ra tự động thông qua Text Combat Engine.
3.  Kết quả xếp hạng quyết định phần thưởng.

### B. Cơ Cấu Giải Thưởng
*   **Hạng 1 (Quán Quân)**: Nhận `1x Trúc Cơ Đan` (Đặc biệt quý, giúp tăng 100% tỷ lệ đột phá lên Trúc Cơ thành công không lo thất bại) + `100 Linh Thạch` + `200 Cống hiến`.
*   **Hạng 2 - 3 (Top 3)**: Nhận `3x Ngưng Khí Đan` + `50 Linh Thạch` + `100 Cống Hiến`.
*   **Tham gia dự thi**: Nhận `20 Cống Hiến`.

---

## 5. Đặc Cách Vào Nội Môn Sớm (Early Inner Sect Promotion)

Thông thường, đệ tử ngoại môn phải đột phá thành công cảnh giới **Trúc Cơ** (Foundation Establishment) thì mới được thăng cấp lên Đệ tử Nội Môn (`nội_môn`). Tuy nhiên, có những thiên tài hoặc người cống hiến lớn sẽ được đặc cách vào sớm khi vẫn ở cảnh giới **Luyện Khí**:

### A. Phương Thức Đặc Cách
1.  **Con đường Cống Hiến**: Đạt tích lũy `300 điểm Cống hiến Tông Môn` thông qua chăm chỉ làm nhiệm vụ hàng năm. Sự kiện đặc cách "Ngoại môn trưởng lão đề cử" sẽ tự động kích hoạt.
2.  **Con đường Võ Lực**: Đoạt giải **Quán Quân** trong Đại hội Tỷ Thí Ngoại Môn ở cảnh giới Luyện Khí. Tông chủ hoặc Nội môn Trưởng lão sẽ nhìn trúng thiên phú và đặc cách thu nhận làm đệ tử nội môn.

### B. Quyền Lợi Khi Vào Nội Môn Sớm
*   **Tăng tốc độ hấp thu linh khí**: Mỗi tháng tĩnh tu/meditate nhận tu vi nhiều hơn (`+0.05 tu vi/tháng` thay vì `+0.02`).
*   **Mở khóa công pháp cao cấp**: Tiếp cận các tàn quyển công pháp cấp Địa, Thiên tại Tàng Kinh Các nội môn.
*   **Nhiệm vụ phong phú**: Nhận được các nhiệm vụ cấp cao hơn (phần thưởng linh thạch và linh dược đột phá dồi dào hơn) mà đệ tử ngoại môn thường không được phép tiếp cận.
*   **Nhận Sư Phụ**: Được bái một Trưởng lão nội môn làm thầy, nhận được sự chỉ điểm hàng năm (tăng Ngộ tính miễn phí).

---

## Lộ Trình Hiện Thực Hóa (Implementation Steps)

Để lập trình các tính năng trên vào codebase, chúng ta cần đi theo các bước sau:

1.  **Cập nhật cấu hình dữ liệu**:
    *   Bổ sung đan dược, vũ khí, linh thảo, linh quặng vào `data/combat-config.json` dưới dạng `items`.
    *   Thêm các nhiệm vụ Ngoại môn mới vào `data/sect-quests.json`.
    *   Thêm các sự kiện Lịch luyện đặc thù (Ma tu cướp đường, Động phủ cổ) vào `locales/vi/events.json`.
2.  **Bổ sung logic vào Core Engine (`lib/engine.ts`)**:
    *   Cập nhật `GameState` hỗ trợ đếm nhiệm vụ hàng năm (`questsCompletedThisYear`).
    *   Viết logic xử lý trừng phạt tông môn hàng năm khi đổi năm mới.
    *   Cập nhật hàm `applyChoiceToState()` để hỗ trợ chế tạo vật phẩm (lấy nguyên liệu từ inventory chế ra trang bị/đan dược).
3.  **Tích hợp hệ thống Combat vào Sự kiện (Adventure Combat integration)**:
    *   Khi sự kiện "Gặp Ma Tu" kích hoạt, thay vì kết thúc bằng lựa chọn, giao diện sẽ gọi sang `docs/useCombatEngine.ts` để chạy giả lập trận đấu tự động.
4.  **Cải tiến Giao diện người dùng (`app/page.tsx`)**:
    *   Tạo panel phụ cho phép người chơi thực hiện "Luyện Đan / Chế Khí" khi có đủ nguyên liệu.
    *   Thêm hiển thị bộ đếm nhiệm vụ hàng năm trong StatsPanel để người chơi theo dõi.
