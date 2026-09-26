import { appointmentPrice } from '../helpers/PricingHelpers';
import { useState } from 'react';
import { useHospital } from '../state/context';
import { dateKey, relativeDate, money, statuses } from '../data/seed';
import { inBranch } from '../data/domain';
import { report } from '../data/reports';
import { Empty } from '../components/Empty';
import { Field } from '../components/Field';
import { PageTitle } from '../components/PageTitle';
import { Select } from '../components/Select';
import { Stat } from '../components/Stat';
import TrendChart from '../components/TrendChart';
import { ReportTable } from './ReportTable';

export default function ReportsPage() {
  const { db, user } = useHospital();
  const [filters, setFilters] = useState({
    from: dateKey().slice(0, 8) + '01',
    to: dateKey(),
    branchId: user.branchId || '',
    doctorId: '',
    departmentId: '',
    status: '',
    group: 'day',
  });
  const [tab, setTab] = useState('appointments');
  const set = (key, value) =>
    setFilters((f) => ({
      ...f,
      [key]: value,
      ...(key === 'branchId' ? { doctorId: '', departmentId: '' } : {}),
      ...(key === 'departmentId' ? { doctorId: '' } : {}),
    }));
  const valid = filters.from && filters.to && filters.from <= filters.to;
  const data = valid ? report(db, user, filters) : null;
  const name = (collection, id) => db[collection].find((r) => r.id === id)?.name || id;
  const fieldCollection = {
    branchId: 'branches',
    doctorId: 'doctors',
    departmentId: 'departments',
    packageId: 'packages',
  };
  const fieldLabel = {
    branchId: 'Cơ sở',
    doctorId: 'Bác sĩ',
    departmentId: 'Khoa/phòng',
    packageId: 'Gói khám',
  };
  const d = data;
  const tables = d
    ? {
        appointments: [
          {
            title: 'Trạng thái lịch hẹn',
            headers: ['Trạng thái', 'Số lượng', 'Tỷ lệ'],
            rows: Object.entries(d.breakdown).map(([s, n]) => [
              statuses[s],
              n,
              (d.appointments.length ? (n * 100) / d.appointments.length : 0).toFixed(1) + '%',
            ]),
          },
          {
            title: 'Chi tiết lịch hẹn · theo ngày khám',
            headers: ['Ngày / giờ', 'Bệnh nhân', 'Cơ sở', 'Bác sĩ', 'Dịch vụ', 'Trạng thái'],
            rows: d.appointments.map((a) => [
              a.date + ' ' + a.time,
              a.patientName,
              name('branches', a.branchId),
              name('doctors', a.doctorId),
              a.serviceName,
              statuses[a.status],
            ]),
          },
        ],
        staff: [
          {
            title: 'Bác sĩ · theo ngày khám',
            headers: [
              'Bác sĩ',
              'Cơ sở',
              'Khoa',
              'Lịch',
              'Hoàn tất',
              'Từ chối',
              'Phút dự kiến',
              'Đã dùng / mở',
              'Tỷ lệ',
              'Đã thu',
            ],
            rows: d.staff.map((s) => [
              s.name,
              name('branches', s.branchId),
              name('departments', s.departmentId),
              s.appointments,
              s.completed,
              s.rejected,
              s.minutes,
              `${s.used}/${s.open}`,
              (s.open ? (s.used * 100) / s.open : 0).toFixed(1) + '%',
              money(s.paid),
            ]),
          },
          {
            title: 'Tổng hợp theo khoa/phòng',
            headers: ['Khoa', 'Cơ sở', 'Lịch', 'Hoàn tất', 'Từ chối', 'Đã thu'],
            rows: [...new Set(d.staff.map((s) => s.departmentId))].map((id) => {
              const rows = d.staff.filter((s) => s.departmentId === id);
              return [
                name('departments', id),
                name('branches', rows[0].branchId),
                rows.reduce((s, r) => s + r.appointments, 0),
                rows.reduce((s, r) => s + r.completed, 0),
                rows.reduce((s, r) => s + r.rejected, 0),
                money(rows.reduce((s, r) => s + r.paid, 0)),
              ];
            }),
          },
        ],
        finance: [
          {
            title: 'Điều chỉnh và hoàn tiền · theo ngày giao dịch',
            headers: ['Mã', 'Ngày', 'Loại', 'Số tiền', 'Lý do'],
            rows: d.adjustments.map((r) => [
              r.id,
              r.date,
              r.kind === 'refund' ? 'Hoàn tiền' : 'Thu bổ sung',
              money(r.amount),
              r.reason,
            ]),
          },
          {
            title: 'BHYT chờ quyết toán · theo ngày khám',
            headers: ['Lịch hẹn', 'Ngày khám', 'Bệnh nhân', 'Khoản BHYT'],
            rows: d.insurancePending.map((a) => [
              a.id,
              a.date,
              a.patientName,
              money(a.billing.finalized.price.insurer),
            ]),
          },
          {
            title: 'BHYT đã thanh toán mô phỏng · theo ngày nhận',
            headers: ['Tham chiếu', 'Ngày', 'Số tiền'],
            rows: d.insuranceReceipts.map((r) => [r.reason, r.date, money(r.amount)]),
          },
          {
            title: 'Phân bổ tiền khách thực trả ròng',
            headers: ['Nhóm', 'Tên', 'Đã thu'],
            rows: d.finance.map((f) => [
              fieldLabel[f.field],
              name(fieldCollection[f.field], f.id),
              money(f.amount),
            ]),
          },
          {
            title: 'Phiếu thu mô phỏng · theo ngày thu',
            headers: ['Mã phiếu', 'Ngày thu', 'Cơ sở', 'Lịch hẹn', 'Số tiền'],
            rows: d.payments.map((p) => [
              p.id,
              p.date,
              name('branches', p.branchId),
              p.appointmentId,
              money(p.amount),
            ]),
          },
          {
            title: 'Buổi khám hoàn tất chưa thu · theo ngày khám',
            headers: ['Mã lịch', 'Ngày khám', 'Bệnh nhân', 'Cơ sở', 'Phí'],
            rows: d.unpaid.map((a) => [
              a.id,
              a.date,
              a.patientName,
              name('branches', a.branchId),
              a.billing.finalized ? money(appointmentPrice(a).patientDue) : 'Chưa chốt phí',
            ]),
          },
        ],
      }
    : {};
  return (
    <>
      <PageTitle
        title="Tổng quan & thống kê"
        description={
          user.role === 'superAdmin'
            ? 'Góc nhìn toàn hệ thống, chi tiết đến từng cơ sở.'
            : name('branches', user.branchId)
        }
      />
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 [&>h2]:mb-4 [&>h2]:text-xl [&>h2]:font-bold [&>h2]:text-brand-900 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <strong>Khoảng thời gian</strong>
          {[
            ['Hôm nay', dateKey()],
            ['7 ngày', relativeDate(-6)],
            ['Tháng này', dateKey().slice(0, 8) + '01'],
          ].map(([label, from]) => (
            <button
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-600 hover:border-sky-300 hover:text-sky-700"
              key={label}
              onClick={() => setFilters((f) => ({ ...f, from, to: dateKey() }))}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Từ ngày">
            <input type="date" value={filters.from} onChange={(e) => set('from', e.target.value)} />
          </Field>
          <Field label="Đến ngày">
            <input type="date" value={filters.to} onChange={(e) => set('to', e.target.value)} />
          </Field>
          <Select
            label="Cơ sở"
            value={filters.branchId}
            onChange={(v) => set('branchId', v)}
            options={db.branches.filter((b) => inBranch(user, b.id))}
            disabled={user.role !== 'superAdmin'}
            placeholder="Toàn hệ thống"
          />
          <Select
            label="Khoa / phòng (lịch & tài chính)"
            value={filters.departmentId}
            onChange={(v) => set('departmentId', v)}
            options={db.departments.filter(
              (d) =>
                inBranch(user, d.branchId) &&
                (!filters.branchId || d.branchId === filters.branchId),
            )}
            placeholder="Tất cả khoa/phòng"
          />
          <Select
            label="Bác sĩ (lịch & tài chính)"
            value={filters.doctorId}
            onChange={(v) => set('doctorId', v)}
            options={db.doctors.filter(
              (d) =>
                inBranch(user, d.branchId) &&
                (!filters.branchId || d.branchId === filters.branchId) &&
                (!filters.departmentId || d.departmentId === filters.departmentId),
            )}
            placeholder="Tất cả bác sĩ"
          />
          <Select
            label="Trạng thái lịch hẹn"
            value={filters.status}
            onChange={(v) => set('status', v)}
            options={Object.entries(statuses)
              .slice(0, 6)
              .map(([id, name]) => ({ id, name }))}
            placeholder="Tất cả trạng thái"
          />
        </div>
      </section>
      {!d ? (
        <p className="my-4 rounded-xl border p-4 text-sm font-medium border-red-200 bg-red-50 text-red-800">
          Chọn khoảng ngày hợp lệ: từ ngày không được sau đến ngày.
        </p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 sm:grid-cols-2 xl:grid-cols-4">
            <Stat label="Tổng lịch hẹn" value={d.appointments.length} note="Theo ngày khám" />
            <Stat
              label="Bệnh nhân duy nhất"
              value={d.patients.length}
              note={`${d.first.length} khám lần đầu · ${d.returning.length} quay lại đã khám trong kỳ`}
            />
            <Stat
              label="Khách thực trả ròng"
              value={money(d.revenue)}
              note={`${d.payments.length} phiếu · Bao gồm điều chỉnh/hoàn trong kỳ`}
            />
            <Stat
              label="Khách còn phải trả"
              value={money(d.debt)}
              note={`${d.unfinalized.length} buổi chưa chốt phí chưa cộng vào công nợ`}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 sm:grid-cols-2 xl:grid-cols-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Stat label="Đã hoàn khách" value={money(d.refunds)} note="Theo ngày hoàn tiền" />
            <Stat
              label="Ưu đãi đã chốt"
              value={money(d.discounts)}
              note="Theo ngày khám hoàn tất"
            />
            <Stat
              label="BHYT chờ quyết toán"
              value={money(d.insuranceDebt)}
              note="Buổi khám trong kỳ · Không cộng vào tiền thực thu"
            />
            <Stat
              label="BHYT đã nhận mô phỏng"
              value={money(d.insuranceReceived)}
              note="Theo ngày nhận · Tách khỏi tiền khách trả"
            />
          </div>
          <nav
            className="flex gap-2 overflow-x-auto border-b border-slate-200 pb-2"
            aria-label="Nhóm báo cáo"
          >
            {[
              ['appointments', 'Lịch hẹn & bệnh nhân'],
              ['staff', 'Bác sĩ & khoa'],
              ['finance', 'Tài chính'],
            ].map(([key, text]) => (
              <button
                className={
                  tab === key
                    ? 'min-h-10 shrink-0 rounded-lg bg-sky-700 px-4 font-semibold text-white'
                    : 'min-h-10 shrink-0 rounded-lg border border-slate-200 bg-white px-4 font-semibold text-slate-600 hover:border-sky-300 hover:text-sky-700'
                }
                onClick={() => setTab(key)}
                key={key}
              >
                {text}
              </button>
            ))}
          </nav>
          {tab === 'appointments' && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 [&>h2]:mb-4 [&>h2]:text-xl [&>h2]:font-bold [&>h2]:text-brand-900">
              <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:tracking-tight [&_h2]:text-brand-900 sm:[&_h2]:text-3xl [&_p]:mt-2 [&_p]:max-w-2xl [&_p]:text-slate-600">
                <h2>Xu hướng lịch hẹn</h2>
                <Select
                  label="Gộp dữ liệu"
                  value={filters.group}
                  onChange={(v) => set('group', v)}
                  options={[
                    { id: 'day', name: 'Theo ngày' },
                    { id: 'month', name: 'Theo tháng' },
                  ]}
                  required
                />
              </div>
              {d.trend.length ? (
                <TrendChart rows={d.trend} type={filters.group === 'day' ? 'line' : 'bar'} />
              ) : (
                <Empty />
              )}
              <details>
                <summary>Số liệu biểu đồ</summary>
                <ReportTable
                  title="Xu hướng"
                  headers={['Kỳ', 'Số lịch']}
                  rows={d.trend.map((t) => [t.date, t.count])}
                />
              </details>
            </div>
          )}
          {tab === 'staff' && (
            <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              Mỗi khung giờ dài 30 phút. Đã dùng gồm chờ duyệt, xác nhận, hoàn tất và vắng mặt. Lọc
              trạng thái thu hẹp tử số sử dụng.
            </p>
          )}
          {tab === 'finance' && (
            <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              Tiền khách thực trả tính theo ngày giao dịch, trừ hoàn tiền và cộng thu bổ sung. Công
              nợ chỉ gồm bảng phí đã chốt của buổi khám trong kỳ. BHYT được theo dõi riêng.
            </p>
          )}
          {tables[tab].map((table) => (
            <ReportTable key={table.title} {...table} />
          ))}
        </>
      )}
    </>
  );
}
