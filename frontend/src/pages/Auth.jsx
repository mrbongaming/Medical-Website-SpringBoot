import { useState } from "react";
import { Link } from "react-router-dom";
import { FiCheckCircle, FiEye, FiEyeOff, FiShield, FiUser } from "react-icons/fi";
import { Field } from "../components/ServiceUI";
import { mockUser } from "../data/mockAccount";

export default function Auth({ register = false }) {
  return <AuthForm key={register ? "register" : "login"} register={register} />;
}
function AuthForm({ register }) {
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  function submit(event) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    if (register && !String(values.get("name")).trim()) { setError("Vui lòng nhập họ tên."); return; }
    if (register && values.get("password") !== values.get("confirmPassword")) { setError("Mật khẩu xác nhận chưa trùng khớp."); return; }
    setError("");
    setMessage(register ? "Bạn đã xem thử giao diện đăng ký. Không có tài khoản mới được tạo." : "Bạn đã xem thử giao diện đăng nhập. Tài khoản mẫu vẫn được giữ nguyên.");
    event.currentTarget.reset();
  }
  return <div className="auth-page"><div className="container auth-layout">
    <section className="auth-intro"><span className="service-kicker">MEDPRO · CHĂM SÓC SỨC KHỎE</span><div className="auth-symbol"><FiShield /></div><h1>An tâm chăm sóc<br />cả gia đình</h1><p>Tìm dịch vụ phù hợp, chọn lịch thuận tiện và xem thông tin trong một không gian.</p><ul className="included-list"><li><FiCheckCircle />Khám phá dịch vụ theo nhu cầu</li><li><FiCheckCircle />Chủ động lựa chọn thời gian</li><li><FiCheckCircle />Thông tin rõ ràng, dễ theo dõi</li></ul><div className="auth-demo-user"><FiUser /><span>Đang dùng tài khoản mẫu<strong>{mockUser.name}</strong></span></div></section>
    <section className="panel auth-panel">
      <div className="auth-tabs"><Link to="/dang-nhap" aria-current={!register ? "page" : undefined} className={!register ? "selected" : ""}>Đăng nhập</Link><Link to="/dang-ky" aria-current={register ? "page" : undefined} className={register ? "selected" : ""}>Đăng ký</Link></div>
      <h2>{register ? "Tạo tài khoản" : "Chào mừng bạn trở lại"}</h2><p className="muted">{register ? "Bắt đầu hành trình chăm sóc sức khỏe của bạn." : "Nhập thông tin để trải nghiệm biểu mẫu."}</p>
      <form onSubmit={submit} onChange={() => { setError(""); setMessage(""); }}>
        {register && <Field label="Họ và tên"><input name="name" required autoComplete="name" placeholder="Nhập họ và tên" /></Field>}
        <Field label="Số điện thoại"><input name="phone" required type="tel" autoComplete="tel" pattern="0[0-9]{9}" title="10 số, bắt đầu bằng 0" placeholder="Nhập số điện thoại" /></Field>
        <Field label="Mật khẩu"><span className="password-field"><input name="password" required minLength="6" autoComplete={register ? "new-password" : "current-password"} type={showPassword ? "text" : "password"} placeholder="Ít nhất 6 ký tự" /><button type="button" aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <FiEyeOff /> : <FiEye />}</button></span></Field>
        {register && <><Field label="Xác nhận mật khẩu"><input name="confirmPassword" required minLength="6" autoComplete="new-password" type={showPassword ? "text" : "password"} placeholder="Nhập lại mật khẩu" /></Field><div className="auth-consent"><label className="check-field"><input type="checkbox" required /> Tôi đồng ý với điều khoản sử dụng</label><Link to="/dieu-khoan-dich-vu" target="_blank" rel="noopener noreferrer">Xem điều khoản ↗</Link></div></>}
        {error && <p className="form-error" role="alert">{error}</p>}
        {message && <p className="notice" role="status">{message}</p>}
        <button className="button full" type="submit">{register ? "Đăng ký" : "Đăng nhập"}</button>
      </form>
      <p className="demo-caption">Giao diện demo, không xác thực hoặc lưu mật khẩu. Mặc định bạn đã đăng nhập bằng tài khoản mẫu.</p>
      <Link className="text-link" to="/">← Về trang chủ</Link>
    </section>
  </div></div>;
}
