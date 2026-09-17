import { useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import {
  FiChevronDown,
  FiMenu,
  FiX,
  FiPhone,
  FiDownload,
} from "react-icons/fi";
import { FaFacebookF, FaYoutube, FaTiktok } from "react-icons/fa";
import { logo, guides, hospitalTypes } from "../data/mockData";
import Searchbar from "./Searchbar";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const menus = [
    {
      title: "Cơ sở y tế",
      to: "/co-so-y-te",
      children: hospitalTypes
        .slice(1)
        .map((name, i) => [name, "/co-so-y-te?type=" + (i + 1)]),
    },
    { title: "Dịch vụ y tế", to: "/dich-vu-y-te" },
    { title: "Khám sức khỏe doanh nghiệp", to: "/kham-suc-khoe-doanh-nghiep" },
    {
      title: "Tin tức",
      to: "/tin-tuc",
      children: ["Tin dịch vụ", "Tin y tế", "Y học thường thức"].map((name) => [
        name,
        "/tin-tuc?category=" + encodeURIComponent(name),
      ]),
    },
    {
      title: "Hướng dẫn",
      to: "/huong-dan/dat-lich-kham",
      children: guides.map(([slug, name]) => [name, "/huong-dan/" + slug]),
    },
    {
      title: "Liên hệ hợp tác",
      to: "/lien-he",
      children: [
        ["Cơ sở y tế", "/lien-he"],
        ["Phòng mạch", "/lien-he"],
        ["Quảng cáo", "/lien-he"],
        ["Tuyển dụng", "/tuyen-dung"],
        ["Về Medpro", "/ve-medpro"],
      ],
    },
  ];
  return (
    <header className="site-header">
      <div className="topbar container">
        <span>Kết nối sức khỏe, sẻ chia an tâm</span>
        <div>
          <FaTiktok />
          <FaFacebookF />
          <span className="zalo">Zalo</span>
          <FaYoutube />
          <Link to="/huong-dan/cai-dat-ung-dung">
            <FiDownload /> Tải ứng dụng
          </Link>
        </div>
      </div>
      <div className="header-main container">
        <Link to="/" aria-label="Medpro - Trang chủ">
          <img className="logo" src={logo} alt="Medpro" />
        </Link>
        {pathname !== "/" && (
          <div className="header-search">
            <Searchbar compact />
          </div>
        )}
        <Link className="hotline" to="/lien-he">
          <FiPhone />
          <span>
            Tư vấn / Đặt khám<strong>1900 2115</strong>
          </span>
        </Link>
        <button
          className="menu-toggle"
          aria-label={open ? "Đóng menu" : "Mở menu"}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {open ? <FiX /> : <FiMenu />}
        </button>
      </div>
      <nav
        className={"main-nav container " + (open ? "is-open" : "")}
        aria-label="Điều hướng chính"
      >
        {menus.map((menu) => (
          <div className="nav-item" key={menu.to}>
            <NavLink to={menu.to} onClick={() => setOpen(false)}>
              {menu.title}
              {menu.children && <FiChevronDown />}
            </NavLink>
            {menu.children && (
              <div className="dropdown">
                {menu.children.map(([name, to]) => (
                  <Link key={name} to={to} onClick={() => setOpen(false)}>
                    {name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    </header>
  );
}
