# Ta Mô Phỏng Trường Sinh Lộ

Trò chơi roguelite mô phỏng tu tiên dạng văn bản (text-based).

Lối chơi cốt lõi:
- Người chơi trải qua nhiều kiếp sống khác nhau.
- Mỗi lượt chơi là một quá trình mô phỏng cuộc đời.
- Cái chết là vĩnh viễn, nhưng một số di sản thừa kế vẫn được lưu giữ.
- Người chơi dần dần khám phá ra chân tướng của sự trường sinh.

Vòng lặp trò chơi chính:
1. Bắt đầu kiếp sống mới
2. Các sự kiện ngẫu nhiên xảy ra theo độ tuổi
3. Người chơi đưa ra lựa chọn
4. Chỉ số nhân vật thay đổi
5. Người chơi tử vong
6. Điểm di sản thừa kế được lưu lại
7. Bắt đầu một mô phỏng (lượt chơi) mới

Phong cách trò chơi:
- Thế giới tu chân u tối (dark xianxia)
- Bí ẩn, huyền bí
- Khả năng chơi lại cao (replayable)
- Giao diện tối giản (minimalist UI)
- Thân thiện với thiết bị di động (mobile-friendly)

Các hệ thống cốt lõi:
- Tiến trình tuổi tác (age progression)
- Sự kiện (events)
- Lựa chọn (choices)
- Thuộc tính/Chỉ số (stats)
- Cảnh giới tu vi (cultivation realm)
- Hệ thống thừa kế di sản (inheritance system)

Chỉ số/Thuộc tính:
- Khí huyết / Sinh mệnh (health)
- Khí vận / May mắn (luck)
- Ngộ tính (comprehension)
- Nghiệp lực (karma)
- Tu vi (cultivation)

Cảnh giới tu luyện:
- Phàm nhân (Mortal - Tu vi từ 0 đến 9.99)
- Luyện Khí (Qi Refinement - chia làm 9 tầng từ 1->9, với tầng 9 là Viên Mãn. Yêu cầu đột phá tiểu bình cảnh 3->4, 6->7 và đại bình cảnh 9->Trúc Cơ. Ngưỡng tu vi các tầng tăng theo cấp số nhân với hệ số x, mặc định 1.3)
- Trúc Cơ (Foundation Establishment - chia làm 3 giai đoạn: Sơ kỳ, Trung kỳ, Hậu kỳ. Khi đột phá lên Trúc Cơ, tu vi reset về 0, giới hạn tu vi từ 0 đến 20)
- Kim Đan (Golden Core - chia làm 4 giai đoạn: Sơ kỳ, Trung kỳ, Hậu kỳ, Viên Mãn. Đột phá lên Kim Đan reset tu vi về 0, giới hạn từ 0 đến 40)
- Nguyên Anh (Nascent Soul - chia làm 4 giai đoạn: Sơ kỳ, Trung kỳ, Hậu kỳ, Viên Mãn. Đột phá lên Nguyên Anh reset tu vi về 0)
- Hệ thống công pháp: Đột phá/nâng cấp công pháp tiêu tốn tu vi của nhân vật. Công pháp càng tốt hao tốn tu vi càng cao hơn tâm pháp thông thường y% (Ví dụ y = 10%).

Cảm nhận của người chơi:
- Mỗi cái chết đều có giá trị
- Mỗi lượt chơi đều hé lộ những bí mật mới
- NPC có thể nhớ được các vòng lặp (kiếp sống) trước đó
