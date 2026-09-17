import { Link, useParams, useSearchParams } from "react-router-dom";
import { articles } from "../data/mockData";
import PageHeader from "../components/PageHeader";

export default function News() {
  const { slug } = useParams();
  const [params, setParams] = useSearchParams();
  const category = params.get("category") || "Tất cả";
  const article = articles.find((a) => a.slug === slug);
  if (slug && !article)
    return (
      <div className="empty-state">
        <h1>Không tìm thấy bài viết</h1>
        <Link to="/tin-tuc">Quay lại tin tức</Link>
      </div>
    );
  return (
    <div className="page-background">
      <PageHeader
        title={article ? article.title : "Tin tức"}
        subtitle={
          article ? undefined : "Thông tin dịch vụ và góc chăm sóc sức khỏe"
        }
      />
      <div className="container">
        {article ? (
          <div className="article-layout">
            <article className="panel prose">
              <span className="eyebrow">
                {article.category} · {article.date}
              </span>
              <img className="article-image" src={article.image} alt="" />
              <h2>{article.title}</h2>
              <p>{article.summary}</p>
              <h3>Chủ động chuẩn bị cho lịch hẹn</h3>
              <p>
                Bạn có thể bắt đầu bằng cách xem danh sách cơ sở y tế, tìm dịch
                vụ cần quan tâm và chọn thời gian phù hợp. Ghi lại những câu hỏi
                muốn trao đổi để buổi tư vấn thuận tiện hơn.
              </p>
              <p>
                Các thông tin trong bài viết này là nội dung mẫu dành cho bản
                giao diện thực hành.
              </p>
              <Link className="button" to="/co-so-y-te">
                Tìm cơ sở y tế
              </Link>
            </article>
            <aside className="panel">
              <h3>Bài viết liên quan</h3>
              {articles
                .filter((a) => a.slug !== slug)
                .slice(0, 4)
                .map((a) => (
                  <Link
                    className="related-article"
                    key={a.slug}
                    to={"/tin-tuc/" + a.slug}
                  >
                    <img src={a.image} alt="" />
                    <span>{a.title}</span>
                  </Link>
                ))}
            </aside>
          </div>
        ) : (
          <>
            <div className="tabs">
              {["Tất cả", "Tin dịch vụ", "Tin y tế", "Y học thường thức"].map(
                (c) => (
                  <button
                    key={c}
                    className={c === category ? "selected" : ""}
                    onClick={() =>
                      setParams(c === "Tất cả" ? {} : { category: c })
                    }
                  >
                    {c}
                  </button>
                ),
              )}
            </div>
            <div className="news-grid">
              {articles
                .filter((a) => category === "Tất cả" || a.category === category)
                .map((a) => (
                  <Link
                    key={a.slug}
                    className="news-card"
                    to={"/tin-tuc/" + a.slug}
                  >
                    <img src={a.image} alt="" />
                    <div className="card-body">
                      <span className="eyebrow">
                        {a.category} · {a.date}
                      </span>
                      <h3>{a.title}</h3>
                      <p>{a.summary}</p>
                      <span className="text-link">Đọc tiếp →</span>
                    </div>
                  </Link>
                ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
