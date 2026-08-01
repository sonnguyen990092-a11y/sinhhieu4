# App nhập chỉ số sức khỏe — lưu online bằng Netlify Blobs

## Cấu trúc project
```
public/index.html            -> trang nhập phiếu (dùng chung, ai cũng nhập được)
public/admin.html            -> trang quản trị (cần đăng nhập) — xem, xóa, xuất Excel
netlify/functions/entries.js -> function xử lý lưu/đọc/xóa dữ liệu (Netlify Blobs) + kiểm tra đăng nhập admin
netlify.toml                  -> cấu hình build cho Netlify
package.json + node_modules   -> thư viện @netlify/blobs đã cài sẵn
```

`node_modules` đã được cài sẵn trong project này, nên bạn **không cần GitHub, không cần chạy lệnh gì** — chỉ cần kéo-thả cả thư mục lên Netlify.

## Tài khoản quản trị (mặc định)
- Trang quản trị: `<link-site-cua-ban>.netlify.app/admin.html`
- Tài khoản: `admin`
- Mật khẩu: `duc123`

**Nên đổi mật khẩu trước khi dùng thật:** vào Netlify → site vừa deploy → **Site settings → Environment variables**, thêm 2 biến:
- `ADMIN_USER` = tài khoản bạn muốn
- `ADMIN_PASS` = mật khẩu bạn muốn

Sau khi thêm biến môi trường, vào **Deploys → Trigger deploy → Deploy site** để function đọc giá trị mới (kéo-thả lại thư mục cũng được).

## Cách deploy — kéo thả trực tiếp (2 phút)
1. Giải nén file `netlify-project.zip` ra một thư mục trên máy.
2. Vào https://app.netlify.com/drop
3. Kéo **cả thư mục `netlify-project`** (thư mục ngoài cùng, chứa `public`, `netlify`, `netlify.toml`...) thả vào ô upload. (Không kéo file zip, phải giải nén trước.)
4. Netlify tự build và bật Function trong khoảng 30–60 giây. Xong sẽ có link dạng `random-name-xxxx.netlify.app`.
   - Trang nhập phiếu: `.../index.html` (hoặc chỉ mở link gốc)
   - Trang quản trị: `.../admin.html`

Muốn đổi lại tên miền phụ dễ nhớ hơn: vào **Site settings → Change site name** sau khi deploy xong.

## Cập nhật sau này
Nếu muốn sửa giao diện hay thêm trường mới, sửa file rồi vào lại https://app.netlify.com/drop kéo-thả thư mục lần nữa — Netlify sẽ deploy đè lên bản cũ (dữ liệu đã lưu trong Blobs không bị mất, vì Blobs là kho lưu trữ tách riêng khỏi mỗi lần deploy).

## Lưu ý
- Netlify Blobs là kho lưu trữ gắn theo từng site — không cần tạo database riêng, không tốn thêm chi phí ở gói miễn phí cho lượng dữ liệu nhỏ như form này.
- Trang `index.html` chỉ dùng để **nhập phiếu**, không hiển thị hay xóa được dữ liệu — an toàn cho người dùng thường.
- Trang `admin.html` yêu cầu đăng nhập (kiểm tra ở function phía server, không thể bỏ qua bằng cách sửa HTML). Phiên đăng nhập lưu tạm trong `sessionStorage`, tự đăng xuất khi đóng tab.
- Đây là xác thực đơn giản (1 tài khoản dùng chung), phù hợp cho nội bộ nhỏ. Nếu cần nhiều tài khoản/phân quyền chi tiết, cần nâng cấp thêm ngoài phạm vi bản này.
- Nút "Xuất Excel" xuất toàn bộ dữ liệu đang có trên server ra file `.xlsx`.


