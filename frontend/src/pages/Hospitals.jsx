import { useSearchParams } from "react-router-dom";
import { FiSearch, FiMapPin } from "react-icons/fi";
import { hospitals, hospitalTypes, normalize } from "../data/mockData";
import HospitalCard from "../components/HospitalCard";
import PageHeader from "../components/PageHeader";

export default function Hospitals() {
  const [params, setParams] = useSearchParams();
  const query = params.get("q") || "";
  const type = Number(params.get("type") || 0);
  const city = params.get("city") || "";
  const filtered = hospitals.filter(
    (h) =>
      (!type || h.type === type) &&
      (!city || h.city === city) &&
      normalize(h.name + " " + h.address).includes(normalize(query)),
  );
  const pageCount = Math.max(1, Math.ceil(filtered.length / 6));
  const page = Math.min(
    pageCount,
    Math.max(1, Number(params.get("page")) || 1),
  );
  function update(key, value) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    setParams(next, { replace: key === "q" });
  }
  return (
    <div className="page-background">
      <PageHeader
        title="Cơ sở y tế"
        subtitle="Tìm cơ sở y tế phù hợp và chủ động lựa chọn lịch khám của bạn"
      />
      <div className="container">
        <div className="filter-bar">
          <label className="input-icon">
            <FiSearch />
            <input
              aria-label="Tìm kiếm cơ sở y tế"
              placeholder="Tìm kiếm cơ sở y tế..."
              value={query}
              onChange={(e) => update("q", e.target.value)}
            />
          </label>
          <label className="input-icon">
            <FiMapPin />
            <select
              aria-label="Chọn khu vực"
              value={city}
              onChange={(e) => update("city", e.target.value)}
            >
              <option value="">Tất cả khu vực</option>
              {[...new Set(hospitals.map((h) => h.city))].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="directory-layout">
          <aside className="sidebar">
            <h3>Loại cơ sở y tế</h3>
            {hospitalTypes.map((t, i) => (
              <button
                key={t}
                className={type === i ? "selected" : ""}
                onClick={() => update("type", i ? String(i) : "")}
              >
                {t}
                <span>
                  {i
                    ? hospitals.filter((h) => h.type === i).length
                    : hospitals.length}
                </span>
              </button>
            ))}
          </aside>
          <div>
            <p className="result-count">
              Tìm thấy <strong>{filtered.length}</strong> cơ sở y tế
            </p>
            <div className="hospital-list">
              {filtered.slice((page - 1) * 6, page * 6).map((h) => (
                <HospitalCard key={h.slug} hospital={h} list />
              ))}
            </div>
            {!filtered.length && (
              <div className="empty-state">
                <FiSearch />
                <h2>Chưa tìm thấy cơ sở phù hợp</h2>
                <p>Thử một từ khóa hoặc khu vực khác.</p>
                <button className="button" onClick={() => setParams({})}>
                  Xóa bộ lọc
                </button>
              </div>
            )}
            {pageCount > 1 && (
              <nav className="pagination" aria-label="Trang kết quả">
                {Array.from({ length: pageCount }, (_, i) => (
                  <button
                    key={i}
                    className={page === i + 1 ? "selected" : ""}
                    aria-current={page === i + 1 ? "page" : undefined}
                    onClick={() => update("page", String(i + 1))}
                  >
                    {i + 1}
                  </button>
                ))}
              </nav>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
