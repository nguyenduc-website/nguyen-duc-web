# Nguyen Duc Web — Self-hosted + NgducAntiBot

Website Node.js + Express cho Nguyễn Đức. Bản này bổ sung lớp **NgducAntiBot** 10–15 giây, popup thông báo Admin sau xác minh, rate-limit API và storage bền vững qua Supabase.

## Chức năng
- Đăng ký / đăng nhập / đăng xuất
- Session cookie HTTP-only, thời hạn 30 ngày
- Role `user`, `moderator`, `admin`
- Chat đồng bộ server
- Media Links đồng bộ server
- Thông báo
- Quản lý user/role
- Password reset request + Admin reset
- Leaderboard / visits
- Cấu hình logo/liên hệ
- Chế độ bảo trì
- NgducAntiBot 10–15 giây
- Popup thông báo Admin sau xác minh
- Rate-limit cho API để giảm abuse

## Deploy Render + Supabase (khuyến nghị)

Render Free không có persistent disk. Nếu muốn **user, session, chat, ranking, media, thông báo và cấu hình không mất sau redeploy/restart**, hãy dùng Supabase theo `SUPABASE_SETUP.md`.

Thêm vào Render Environment Variables:

```text
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVER_ONLY_KEY
ANTIBOT_SECRET=YOUR_LONG_RANDOM_SECRET
ADMIN_USERNAME=ducadmin
ADMIN_EMAIL=admin@nguyenduc.local
ADMIN_PASSWORD=CHANGE_THIS
```

Sau deploy kiểm tra:

```text
https://nguyen-duc-web.onrender.com/api/health
```

Phải có:

```json
{"persistent":true,"storage":"supabase-persistent"}
```

Nếu `persistent:false`, website đang dùng fallback JSON và dữ liệu có thể mất khi Render thay container.

## NgducAntiBot

Khi truy cập các trang HTML chính, website hiển thị màn hình xác minh 12 giây (nằm trong yêu cầu 10–15 giây). Sau khi server cấp cookie xác minh, website chuyển về trang chính và hiển thị popup thông báo Admin một lần cho mỗi phiên trình duyệt.

Đây là lớp chống bot ở **application layer**, không phải dịch vụ chống DDoS lưu lượng lớn. Rate-limit cũng được bật ở API.

## Chạy Termux/local

```bash
npm install
npm start
```

Mở `http://127.0.0.1:3000`.

## Docker

```bash
docker compose up -d --build
```

## Bảo mật
- Không commit `.env`.
- Không đưa `SUPABASE_SERVICE_ROLE_KEY` lên GitHub/frontend.
- Đổi mật khẩu Admin trước khi public.
- Đặt `ANTIBOT_SECRET` cố định trên Render để cookie xác minh không bị vô hiệu sau restart.
- Lớp NgducAntiBot/rate-limit không thay thế DDoS protection của hạ tầng.
