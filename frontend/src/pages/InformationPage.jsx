import { Link } from 'react-router-dom';
import { FiArrowRight, FiPhone } from 'react-icons/fi';
import { useHospital } from '../state/context';
import { hospital } from '../data/seed';
import { PageTitle } from '../components/PageTitle';

export function InformationPage({ mode }) {
  const { db } = useHospital();
  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 min-h-[55vh] py-10 sm:py-14">
      <PageTitle
        title={
          {
            about: 'Về Bệnh viện Đa khoa An Tâm',
            guide: 'Hướng dẫn đặt lịch',
            contact: 'Kết nối với An Tâm',
          }[mode]
        }
      />
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 [&>h2]:mb-4 [&>h2]:text-xl [&>h2]:font-bold [&>h2]:text-brand-900 space-y-4 text-slate-600 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-brand-900 [&_h3]:font-bold [&_h3]:text-brand-900 [&_li]:ml-5 [&_li]:list-disc">
        {mode === 'about' ? (
          <>
            <h2>Một hệ thống, nhiều điểm chăm sóc</h2>
            <p>
              An Tâm kết nối đội ngũ bác sĩ tại bốn cơ sở, giúp bạn tìm hiểu chuyên môn và chủ động
              lựa chọn lịch khám.
            </p>
            <h3>Chuyên khoa đang phục vụ</h3>
            <ul>
              {db.specialties
                .filter((item) => item.active)
                .map((item) => (
                  <li key={item.id}>{item.name}</li>
                ))}
            </ul>
            <h3>Tiếp cận dịch vụ</h3>
            <p>
              Bạn có thể chọn bác sĩ và giờ khám, hoặc chỉ chọn cơ sở, chuyên khoa và ngày để nhân
              viên sắp xếp giờ tiếp nhận. Quyền lợi BHYT được kiểm tra theo từng dịch vụ và thuốc.
            </p>
            <p>
              Thương hiệu, ảnh, hồ sơ, địa chỉ và thông tin y tế trong bản demo đều mang tính minh
              họa.
            </p>
          </>
        ) : mode === 'guide' ? (
          <>
            <h2>Đặt lịch trong vài bước</h2>
            <ol>
              <li>Chọn cơ sở thuận tiện, chuyên khoa hoặc gói khám và bác sĩ.</li>
              <li>Chọn ngày và khung giờ còn trống.</li>
              <li>Đăng nhập tài khoản bệnh nhân demo, kiểm tra thông tin người khám.</li>
              <li>Xác nhận yêu cầu và theo dõi trạng thái trong “Lịch hẹn”.</li>
            </ol>
            <p>
              Bác sĩ sẽ duyệt yêu cầu. Sau khi khám hoàn tất, kết quả xuất hiện trong “Lịch sử
              khám”.
            </p>
          </>
        ) : (
          <>
            <h2>{hospital.name}</h2>
            <p>
              <FiPhone /> {hospital.phone} · {hospital.email}
            </p>
            {db.branches
              .filter((b) => b.active)
              .map((b) => (
                <div key={b.id}>
                  <h3>
                    <Link to={'/co-so/' + b.slug}>{b.name}</Link>
                  </h3>
                  <p>{b.address}</p>
                  <p>
                    <a href={'tel:' + b.phone}>{b.phone}</a> · {b.hours}
                  </p>
                </div>
              ))}
          </>
        )}
        <Link
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:pointer-events-none disabled:opacity-50"
          to="/dat-lich"
        >
          Chọn lịch khám <FiArrowRight />
        </Link>
      </div>
    </div>
  );
}
