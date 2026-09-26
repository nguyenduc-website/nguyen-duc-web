# Đưa project lên GitHub và chạy

1. Tạo repository mới.
2. Upload toàn bộ project này lên repository.
3. Không upload `.env`.
4. Trên server/hosting Node.js:
```bash
git clone <URL_REPOSITORY>
cd <REPOSITORY>
npm ci
cp .env.example .env
# sửa .env, đặc biệt ADMIN_PASSWORD
npm start
```

GitHub không phải server backend. Nếu chỉ bật GitHub Pages, đăng nhập/chat/role/password reset sẽ không hoạt động vì Pages chỉ phục vụ file tĩnh.
