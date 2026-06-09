# Công Thức Tính Chiến Lực (CP) (ImmortalSim)

Tài liệu này mô tả chi tiết cách tính toán chỉ số chiến đấu và điểm Chiến Lực (Combat Power - CP) dựa trên các thuộc tính giả lập cốt lõi của tu sĩ tương ứng với từng cảnh giới và phân tầng.

---

## 1. Ánh Xạ Thuộc Tính sang Chỉ Số Chiến Đấu

Để phục vụ giao chiến, các thuộc tính giả lập (simulation stats) được chuyển đổi sang chỉ số chiến đấu (combat stats) như sau:

*   **Max HP**: Đại diện cho khí huyết và sức bền nhục thân của tu sĩ.
    $$\text{Max HP} = 20 + \lfloor\frac{\text{Blessing (Phúc trạch)}}{2}\rfloor + \text{Bonus HP Cảnh giới} + \text{Bonus HP Trang bị}$$
*   **Max Qi**: Dung lượng linh hải/đan điền chứa đựng linh khí.
    $$\text{Max Qi} = 60 + \text{Bonus Qi Cảnh giới} + \text{Bonus Qi Trang bị}$$
*   **Attack**: Sức sát thương chân khí hoặc nhục thân khi tung chiêu.
    $$\text{Attack} = 15 + \lfloor\text{Cultivation (Tu vi)} \times 0.4\rfloor + \text{Bonus Công Cảnh giới} + \text{Bonus Công Trang bị}$$
*   **Speed**: Tốc độ xuất chiêu, giảm độ trễ giữa các hành động.
    $$\text{Speed} = 10 + \lfloor\text{Luck (Vận may)} \times 0.2\rfloor + \text{Bonus Tốc Trang bị}$$
*   **Qi Control**: Khả năng kiểm soát khí mạch, tăng hiệu quả của hộ thể chân khí và kỹ năng.
    $$\text{Qi Control} = 10 + \lfloor\text{Dao Heart (Đạo tâm)} \times 0.15\rfloor + \text{Bonus Thủ Trang bị}$$
*   **Comprehension**: Lấy trực tiếp từ thuộc tính ngộ tính giả lập (`comprehension`).
    $$\text{Comprehension} = \text{Comprehension}$$

---

## 2. Công Thức Chiến Lực (Combat Power - CP)

Điểm Chiến Lực tổng hợp được tính theo công thức thống nhất dưới đây:

$$CP = \text{Max HP} \times 0.5 + \text{Attack} \times 3.0 + \text{Speed} \times 2.0 + \text{Qi Control} \times 1.5 + \text{Comprehension} \times 1.0 + \text{Max Qi} \times 0.3 + \text{SubStageIndex} \times 25$$

Trong đó, `SubStageIndex` là chỉ số phân đoạn cảnh giới của tu sĩ trên thang từ `0` đến `24`:

| Chỉ số | Cảnh Giới Lớn | Phân Đoạn / Tầng |
| :--- | :--- | :--- |
| **0** | Phàm Nhân | Phàm Nhân (Mortal) |
| **1 - 11** | Luyện Khí | Luyện Khí Tầng 1 đến Tầng 11 |
| **12** | Luyện Khí | Luyện Khí Tầng 12 (Viên Mãn) |
| **13** | Trúc Cơ | Trúc Cơ Sơ Kỳ |
| **14** | Trúc Cơ | Trúc Cơ Trung Kỳ |
| **15** | Trúc Cơ | Trúc Cơ Hậu Kỳ |
| **16** | Trúc Cơ | Trúc Cơ Viên Mãn |
| **17** | Kim Đan | Kim Đan Sơ Kỳ |
| **18** | Kim Đan | Kim Đan Trung Kỳ |
| **19** | Kim Đan | Kim Đan Hậu Kỳ |
| **20** | Kim Đan | Kim Đan Viên Mãn |
| **21** | Nguyên Anh | Nguyên Anh Sơ Kỳ |
| **22** | Nguyên Anh | Nguyên Anh Trung Kỳ |
| **23** | Nguyên Anh | Nguyên Anh Hậu Kỳ |
| **24** | Nguyên Anh | Nguyên Anh Viên Mãn |

---

## 3. Chỉ Số Cộng Thêm của Từng Cảnh Giới

Mỗi phân đoạn cảnh giới/tầng tăng thêm chỉ số tĩnh tương ứng:

*   **Phàm Nhân** (Tu vi 0 - 14):
    *   HP: +0, Qi: +0, Công: +0
*   **Luyện Khí** (Tu vi 15 - 29):
    *   HP tăng thêm: $+\text{Tầng} \times 2$
    *   Qi tăng thêm: $+\text{Tầng} \times 2$
    *   Công tăng thêm: $+\text{Tầng} \times 0.5$
*   **Trúc Cơ** (Tu vi 30 - 49):
    *   *Sơ Kỳ*: HP +35, Qi +30, Công +8
    *   *Trung Kỳ*: HP +45, Qi +40, Công +10.5
    *   *Hậu Kỳ*: HP +55, Qi +50, Công +13
    *   *Viên Mãn*: HP +65, Qi +60, Công +15.5
*   **Kim Đan** (Tu vi 50 - 89):
    *   *Sơ Kỳ*: HP +80, Qi +70, Công +18
    *   *Trung Kỳ*: HP +95, Qi +85, Công +21.5
    *   *Hậu Kỳ*: HP +110, Qi +100, Công +25
    *   *Viên Mãn*: HP +125, Qi +115, Công +28.5
*   **Nguyên Anh** (Tu vi 90 trở lên):
    *   *Sơ Kỳ*: HP +150, Qi +140, Công +35
    *   *Trung Kỳ*: HP +180, Qi +170, Công +42
    *   *Hậu Kỳ*: HP +210, Qi +200, Công +49
    *   *Viên Mãn*: HP +250, Qi +240, Công +58
