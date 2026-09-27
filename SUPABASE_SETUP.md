# Lưu dữ liệu bền vững trên Render bằng Supabase

Render Free không cung cấp persistent disk cho service. Website vì vậy hỗ trợ Supabase để lưu bền vững users, sessions, chat, ranking, announcements, media links, password requests và config.

## 1. Tạo Supabase project

Tạo một project miễn phí tại https://supabase.com/ rồi mở **SQL Editor**.

## 2. Chạy SQL

```sql
create table if not exists public.nguyen_duc_state (
  id integer primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);
```

Không bật public read/write cho bảng này. Backend dùng Service Role Key nên không đưa key vào HTML/JavaScript.

## 3. Lấy biến môi trường

Trong Supabase lấy:

- Project URL → `SUPABASE_URL`
- Service Role Key → `SUPABASE_SERVICE_ROLE_KEY`

**Không gửi Service Role Key vào chat, GitHub hoặc frontend.**

## 4. Thêm vào Render

Render → Web Service → Environment → Add Environment Variable:

```text
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
ANTIBOT_SECRET=MOT_CHUOI_NGAU_NHIEN_DAI
```

Sau đó redeploy.

## 5. Kiểm tra

Mở:

```text
https://nguyen-duc-web.onrender.com/api/health
```

Kết quả mong muốn có:

```json
{"persistent":true,"storage":"supabase-persistent"}
```

Nếu `persistent` là `false`, website đang dùng database file tạm của Render và dữ liệu có thể mất khi service được thay thế.
