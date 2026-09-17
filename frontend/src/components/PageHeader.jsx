import { Link } from "react-router-dom";
export default function PageHeader({ title, subtitle }) {
  return (
    <>
      <div className="container breadcrumb">
        <Link to="/">Trang chủ</Link>
        <span>›</span>
        <span>{title}</span>
      </div>
      <div className="page-heading container">
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
    </>
  );
}
