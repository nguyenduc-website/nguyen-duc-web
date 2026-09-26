# Chế độ bảo trì Nguyễn Đức

Admin có thể bật/tắt chế độ bảo trì tại **Quản trị → Bảo trì**.

- **BẬT BẢO TRÌ:** khách và User thấy màn hình `SYSTEM MAINTENANCE NOTICE`.
- **Admin/Moderator:** vẫn truy cập được để quản trị.
- **RELOAD WEBSITE / TẮT BẢO TRÌ:** chỉ Admin có quyền tắt chế độ bảo trì.
- Trạng thái lưu trong `data/database.json`, vì vậy được dùng chung cho mọi thiết bị khi server có persistent storage.

Nút **RELOAD WEBSITE** trên màn hình bảo trì chỉ tải lại trang; nó không tự tắt bảo trì. Chỉ Admin mới có thể tắt để tránh một người truy cập tự bỏ qua chế độ bảo trì.
