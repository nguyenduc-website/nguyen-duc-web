# Nguyen Duc Web — Self-hosted

Bản này đã bỏ Netlify Functions và Netlify Blobs. Backend là Node.js + Express, dữ liệu dùng file JSON bền vững trong `data/database.json`.

## Có sẵn
- Đăng ký / đăng nhập / đăng xuất
- Role `user`, `moderator`, `admin`
- Chat đồng bộ qua server
- Media links
- Thông báo
- Quản lý user và role
- Password-reset requests và Admin reset
- Leaderboard / visits
- Cấu hình logo + liên hệ
- Cookie session HTTP-only
- Password hash bằng scrypt

## Chạy ngay trên máy/Termux
```bash
npm install
npm start
```
Mở `http://127.0.0.1:3000`.

## Docker
```bash
docker compose up -d --build
```
Mở `http://127.0.0.1:3000`.

## Tài khoản Admin ban đầu
Mặc định:
- username: `ducadmin`
- password: giá trị `ADMIN_PASSWORD` trong `.env`

**Hãy đổi `ADMIN_PASSWORD` trước khi đưa public.** Nếu database đã được tạo thì đổi biến môi trường không tự đổi mật khẩu Admin đã tồn tại; hãy dùng chức năng reset trong Admin.

## Đưa lên GitHub
GitHub chỉ lưu mã nguồn; GitHub Pages không chạy được backend Node.js này. Để website đồng bộ nhiều thiết bị, hãy deploy cả thư mục này lên một máy chủ/host có Node.js và **persistent storage**.

Ví dụ luồng:
`GitHub repository → host Node.js → /data/database.json`

Nếu host có filesystem tạm thời, không dùng bản JSON này cho production vì dữ liệu có thể mất sau mỗi lần restart/deploy. Khi đó nên đổi storage sang PostgreSQL/SQLite persistent.

## Bảo mật
- Không commit `.env`.
- Không đưa token/API key vào GitHub.
- Đổi mật khẩu Admin mặc định.
- Nên đặt HTTPS ở reverse proxy/hosting production.
