# 📸 Online Photo Collage Tool

> Người Thực Hiện: **Lý Minh Phước**  
> 🛠️ Dự án: Công cụ ghép ảnh trực tuyến  
> Link Deploy: https://full-stack-online-photo-collage-too-two.vercel.app
---

## 🚀 Giới thiệu

Nhiều người muốn ghép ảnh nhanh để đăng lên mạng xã hội nhưng không muốn mở phần mềm phức tạp. Dự án này là một **công cụ web** giúp người dùng **tải ảnh lên và ghép chúng lại** thành một bức ảnh duy nhất — theo **hàng ngang** hoặc **cột dọc**, với tuỳ chọn **viền ảnh** rõ ràng.

---

## 🧩 Tính năng

- ✅ Tải nhiều hình ảnh lên **không cần tài khoản**
- ✅ Chọn **kiểu ghép**: Ngang hoặc Dọc
- ✅ Tuỳ chỉnh **viền ảnh**: độ dày, màu sắc
- ✅ Nút `Make Collage` để xử lý ảnh
- ✅ Hiển thị trạng thái **đang xử lý**
- ✅ Tải về ảnh kết quả sau khi xử lý

---

## ⚙️ Kiến trúc hệ thống

Dự án gồm 4 phần chính:

| Thành phần             | Công nghệ                | Vai trò                                  |
|------------------------|--------------------------|-------------------------------------------|
| Frontend UI            | React.js / Vue.js        | Giao diện người dùng                      |
| Backend API            | Flask / Express.js       | Xử lý API và quản lý tác vụ               |
| Task Queue             | Celery + Redis           | Chạy tác vụ xử lý ảnh bất đồng bộ         |
| Storage (tuỳ chọn)     | File system / Amazon S3  | Lưu trữ ảnh tạm thời hoặc lâu dài         |

---

## 🛠️ Các kỹ năng rèn luyện

### 📌 Backend & DevOps
- Xây dựng REST API với Flask/Express
- Upload và lưu trữ ảnh tạm thời
- Giao tiếp với **Celery Task Queue**
- Chạy ứng dụng bằng **Docker**
- Xoá ảnh định kỳ bằng **cron job/Celery**

### 🧮 Xử lý ảnh
- Resize ảnh giữ đúng tỉ lệ
- Ghép ảnh theo chiều ngang hoặc dọc
- Thêm viền màu cho ảnh
- Lưu ảnh kết quả và trả về frontend

### 💡 Frontend
- Upload và preview ảnh
- Gửi ảnh và tuỳ chọn lên API
- Theo dõi tiến trình xử lý ảnh qua `task_id`
- Hiển thị ảnh kết quả và tải xuống

---
## 🚀 Cách chạy dự án

### Yêu cầu
- [Docker](https://www.docker.com/) và [Docker Compose](https://docs.docker.com/compose/) (cho phương án dùng Docker)
- Node.js, Python, Redis (cho phương án không dùng Docker)

### Cấu hình `.env`
Tạo file `.env` trong cả frontend và backend.

#### backend/.env
```plaintext
REDIS_URL=redis://localhost:6379/0
UPLOAD_FOLDER=./uploads
RESULT_FOLDER=./results
```
#### frontend/.env
```plaintext
REACT_APP_API_URL=http://localhost:5000
```
### Chạy với docker
```plaintext
docker-compose up --build
```
### Truy cập
- 🖥 Frontend: http://localhost:3000
- 🔧 Backend API: http://localhost:5000

