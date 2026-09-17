import { useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  Link,
} from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/home";
import Hospitals from "./pages/Hospitals";
import Details from "./pages/Details";
import Services from "./pages/Services";
import Booking from "./pages/Booking";
import News from "./pages/News";
import Guide from "./pages/Guide";
import Information from "./pages/Information";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}
export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <a className="skip-link" href="#main-content">
        Đến nội dung chính
      </a>
      <Navbar />
      <main id="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/co-so-y-te" element={<Hospitals />} />
          <Route path="/co-so-y-te/:slug" element={<Details />} />
          <Route path="/dich-vu-y-te" element={<Services />} />
          <Route path="/dich-vu-y-te/:slug" element={<Services />} />
          <Route
            path="/chuyen-khoa"
            element={<Services mode="specialties" />}
          />
          <Route
            path="/chuyen-khoa/:slug"
            element={<Services mode="specialties" />}
          />
          <Route path="/bac-si" element={<Services mode="doctors" />} />
          <Route path="/bac-si/:slug" element={<Details kind="doctor" />} />
          <Route path="/goi-kham/:slug" element={<Details kind="package" />} />
          <Route path="/dat-kham/:slug" element={<Booking />} />
          <Route path="/tin-tuc" element={<News />} />
          <Route path="/tin-tuc/:slug" element={<News />} />
          <Route path="/huong-dan" element={<Guide />} />
          <Route path="/huong-dan/:slug" element={<Guide />} />
          <Route path="/lien-he" element={<Information mode="contact" />} />
          <Route
            path="/kham-suc-khoe-doanh-nghiep"
            element={<Information mode="business" />}
          />
          <Route path="/ve-medpro" element={<Information mode="about" />} />
          <Route path="/tuyen-dung" element={<Information mode="careers" />} />
          <Route
            path="/dieu-khoan-dich-vu"
            element={<Information mode="terms" />}
          />
          <Route
            path="/chinh-sach-bao-mat"
            element={<Information mode="privacy" />}
          />
          <Route
            path="/quy-dinh-su-dung"
            element={<Information mode="rules" />}
          />
          <Route
            path="*"
            element={
              <div className="empty-state">
                <h1>Không tìm thấy trang</h1>
                <p>Trang bạn đang tìm không có trong giao diện này.</p>
                <Link className="button" to="/">
                  Về trang chủ
                </Link>
              </div>
            }
          />
        </Routes>
      </main>
      <Footer />
    </BrowserRouter>
  );
}
