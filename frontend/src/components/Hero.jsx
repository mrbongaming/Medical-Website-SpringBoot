import { FiCheckCircle } from "react-icons/fi";
import { hero } from "../data/mockData";
import Searchbar from "./Searchbar";

export default function Hero() {
  return (
    <section className="hero" style={{ backgroundImage: "url(" + hero + ")" }}>
      <div className="hero-content">
        <h1>
          Kết nối Người Dân với
          <br />
          <strong>Cơ sở & Dịch vụ Y tế hàng đầu</strong>
        </h1>
        <Searchbar />
        <div className="hero-benefits">
          <p>
            <FiCheckCircle /> Đặt khám nhanh · Lấy số trực tuyến · Tư vấn từ xa
          </p>
          <p>
            <FiCheckCircle /> Chọn lịch khám phù hợp, chủ động thời gian của bạn
          </p>
          <p>
            <FiCheckCircle /> Tìm dịch vụ chăm sóc sức khỏe cho cả gia đình
          </p>
        </div>
      </div>
    </section>
  );
}
