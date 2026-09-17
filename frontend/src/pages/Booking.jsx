import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { FiCheckCircle } from "react-icons/fi";
import { hospitals, doctors, packages, specialties } from "../data/mockData";
import PageHeader from "../components/PageHeader";

export default function Booking() {
  const { slug } = useParams();
  const [params] = useSearchParams();
  const kind = params.get("kind") || "hospital";
  const item = (
    kind === "doctor" ? doctors : kind === "package" ? packages : hospitals
  ).find((x) => x.slug === slug);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [specialty, setSpecialty] = useState(specialties[0].name);
  const [confirmed, setConfirmed] = useState(false);
  const today = new Date();
  const minDate =
    today.getFullYear() +
    "-" +
    String(today.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(today.getDate()).padStart(2, "0");
  if (!item)
    return (
      <div className="empty-state">
        <h1>Không tìm thấy lịch khám</h1>
        <Link to="/co-so-y-te">Chọn cơ sở y tế</Link>
      </div>
    );
  return (
    <div className="page-background">
      <PageHeader title="Chọn lịch khám" />
      <div className="container booking-layout">
        <aside className="panel">
          <img className="booking-image" src={item.image} alt="" />
          <h2>{item.name}</h2>
          <p>{item.address || item.hospital}</p>
          <p className="notice">
            Bản xem trước giao diện. Không tạo lịch hẹn thực tế.
          </p>
        </aside>
        <section className="panel">
          {confirmed ? (
            <div className="confirmation">
              <FiCheckCircle />
              <h2>Lịch khám mẫu của bạn</h2>
              <p>{item.name}</p>
              <p>{specialty}</p>
              <strong>
                {date.split("-").reverse().join("/")} · {time}
              </strong>
              <p>
                Đây là bản xem trước. Chưa có lịch khám được gửi đến cơ sở y tế.
              </p>
              <button className="button" onClick={() => setConfirmed(false)}>
                Thay đổi lịch
              </button>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (time) setConfirmed(true);
              }}
            >
              <div className="steps">
                <span className="selected">1. Chọn lịch</span>
                <span>2. Xem thông tin</span>
              </div>
              <h2>Thông tin khám</h2>
              <label className="field">
                Chuyên khoa
                <select
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                >
                  {specialties.map((s) => (
                    <option key={s.slug}>{s.name}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                Ngày khám
                <input
                  type="date"
                  required
                  min={minDate}
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                    setTime("");
                  }}
                />
              </label>
              <h3>Giờ khám</h3>
              <p className="muted">Các khung giờ dưới đây là lịch minh họa.</p>
              <div className="time-grid">
                {[
                  "07:00",
                  "08:00",
                  "09:00",
                  "10:00",
                  "13:00",
                  "14:00",
                  "15:00",
                  "16:00",
                ].map((t) => (
                  <button
                    type="button"
                    disabled={!date}
                    aria-pressed={time === t}
                    className={time === t ? "selected" : ""}
                    key={t}
                    onClick={() => setTime(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <button
                className="button full"
                disabled={!date || !time}
                type="submit"
              >
                Xem lịch khám mẫu →
              </button>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}
