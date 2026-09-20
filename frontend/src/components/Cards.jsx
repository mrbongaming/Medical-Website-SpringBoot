import { Link } from 'react-router-dom';
import { FiArrowRight, FiClock, FiMapPin, FiPhone } from 'react-icons/fi';
import { useHospital } from '../state/context';
import { money } from '../data/seed';

export function Photo({ src, alt, className = '', fallback = '/images/hospital.jpg' }) {
  return (
    <img
      className={className}
      src={src || fallback}
      alt={alt}
      loading="lazy"
      onError={(e) => {
        e.currentTarget.onerror = null;
        if (!e.currentTarget.src.endsWith(fallback)) e.currentTarget.src = fallback;
      }}
    />
  );
}

export function Rating({ doctorId }) {
  const { db } = useHospital();
  const scores = db.appointments.filter(
    (a) =>
      a.doctorId === doctorId &&
      a.status === 'completed' &&
      Number.isInteger(a.rating) &&
      a.rating >= 1 &&
      a.rating <= 5,
  );
  if (!scores.length) return <span className="rating unrated">Chưa có đánh giá</span>;
  const average = scores.reduce((sum, a) => sum + a.rating, 0) / scores.length;
  return (
    <span
      className="rating"
      aria-label={`${average.toFixed(1)} trên 5 sao, ${scores.length} lượt đánh giá`}
    >
      <span aria-hidden="true">★</span> <strong>{average.toFixed(1)}/5</strong>{' '}
      <span className="muted">({scores.length} lượt đánh giá)</span>
    </span>
  );
}

export function BranchCard({ branch }) {
  return (
    <article className="branch-card">
      <Link
        className="card-image-link"
        to={'/co-so/' + branch.slug}
        aria-label={'Xem ' + branch.name}
      >
        <Photo src={branch.image} alt={'Ảnh minh họa ' + branch.name} className="branch-photo" />
        <span className="photo-label">CƠ SỞ AN TÂM</span>
      </Link>
      <div className="card-body">
        <h3>
          <Link to={'/co-so/' + branch.slug}>{branch.name}</Link>
        </h3>
        <p>
          <FiMapPin /> {branch.address}
        </p>
        <p>
          <FiClock /> {branch.hours}
        </p>
        <p>
          <FiPhone /> <a href={'tel:' + branch.phone}>{branch.phone}</a>
        </p>
        <div className="card-actions">
          <Link to={'/co-so/' + branch.slug}>
            Xem chi tiết <FiArrowRight />
          </Link>
          <Link className="button small" to={'/dat-lich?branchId=' + branch.id}>
            Đặt khám
          </Link>
        </div>
      </div>
    </article>
  );
}

export function DoctorCard({ doctor }) {
  const { db } = useHospital();
  return (
    <article className="doctor-card">
      <Link
        to={'/bac-si/' + doctor.slug}
        className="card-image-link"
        aria-label={'Hồ sơ ' + doctor.name}
      >
        <Photo
          src={doctor.image}
          fallback="/images/doctor-male.jpg"
          alt={'Ảnh minh họa ' + doctor.name}
          className="doctor-photo"
        />
      </Link>
      <div className="card-body">
        <span className="eyebrow">
          {db.specialties.find((s) => s.id === doctor.specialtyId)?.name}
        </span>
        <h3>
          <Link to={'/bac-si/' + doctor.slug}>{doctor.name}</Link>
        </h3>
        <p className="doctor-qualification">{doctor.qualification || 'Bác sĩ'}</p>
        <Rating doctorId={doctor.id} />
        <p>
          <FiMapPin /> {db.branches.find((b) => b.id === doctor.branchId)?.name}
        </p>
        <p>
          {doctor.experience ?? 0} năm kinh nghiệm · {money(doctor.price)}
        </p>
        <div className="card-actions">
          <Link to={'/bac-si/' + doctor.slug}>Hồ sơ bác sĩ</Link>
          <Link className="button small" to={'/dat-lich?doctorId=' + doctor.id}>
            Đặt khám
          </Link>
        </div>
      </div>
    </article>
  );
}
