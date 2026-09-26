# GitHub + chạy backend

## 1. GitHub
Upload repository này lên GitHub. `.gitignore` đã loại `node_modules/`, `.env` và database runtime.

## 2. Chạy server
GitHub Pages **không chạy Node.js backend**. Muốn đăng nhập/chat/role đồng bộ nhiều thiết bị, cần một host chạy Node.js.

```bash
npm install
npm start
```

Mặc định: `http://localhost:3000`

## 3. Docker

```bash
docker compose up -d --build
```

Dữ liệu được giữ trong Docker volume `app_data`.

## 4. Hosting production
Chọn host có Node.js và **persistent disk/volume**. Build command:

```bash
npm ci
```

Start command:

```bash
npm start
```

Biến môi trường tối thiểu:

```text
NODE_ENV=production
PORT=3000
DATA_DIR=/app/data
ADMIN_USERNAME=ducadmin
ADMIN_EMAIL=admin@nguyenduc.local
ADMIN_PASSWORD=<mật khẩu mạnh>
```

Không đưa `.env` hoặc mật khẩu vào GitHub.

## 5. Database
Bản này dùng `data/database.json` để có thể chạy ngay mà không cần cài database server. Multi-device hoạt động vì mọi thiết bị gọi cùng backend. Production cần persistent storage; nếu host dùng filesystem tạm thời thì dữ liệu có thể mất khi deploy/restart.
