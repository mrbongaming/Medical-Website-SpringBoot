import { Link } from "react-router-dom";
import { FiChevronDown } from "react-icons/fi";
import { mockUser } from "../data/mockAccount";

export default function AccountMenu() {
  function close(event) { event.currentTarget.closest("details").open = false; }
  return <details className="account-menu" onKeyDown={(event) => { if (event.key === "Escape") { event.currentTarget.open = false; event.currentTarget.querySelector("summary").focus(); } }}>
    <summary aria-label={"Tài khoản " + mockUser.name}><span className="account-avatar">{mockUser.initials}</span><span className="account-name"><small>Xin chào,</small>{mockUser.name}</span><FiChevronDown /></summary>
    <div className="account-dropdown"><strong>{mockUser.name}</strong><span className="account-status"><span /> Đã đăng nhập · tài khoản mẫu</span><Link to="/dang-nhap" onClick={close}>Giao diện đăng nhập</Link><Link to="/dang-ky" onClick={close}>Giao diện đăng ký</Link></div>
  </details>;
}
