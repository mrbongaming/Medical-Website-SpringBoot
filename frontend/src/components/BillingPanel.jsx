import { useState } from 'react';
import { useHospital } from '../state/context';
import { isAdmin } from '../data/domain';
import { dateKey, money } from '../data/seed';
import { financialBalance } from '../helpers/PricingHelpers';
import { insuranceStatuses } from '../helpers/InsuranceHelpers';
import { PriceBreakdown } from './PriceBreakdown';
import { InsuranceFields } from './InsuranceFields';
import { Field } from './Field';
import { Alert } from './Alert';
import { ServiceEditor } from './ServiceEditor';

const auditNames = {
  booking: 'Đặt lịch',
  receive: 'Tiếp nhận',
  'insurance-verify': 'Xác minh BHYT',
  'insurance-resubmit': 'Bổ sung BHYT',
  services: 'Dịch vụ thực hiện',
  'billing-services': 'Dịch vụ thực hiện',
  'promotion-apply': 'Áp dụng ưu đãi',
  'bill-finalize': 'Chốt bảng phí',
  pay: 'Thanh toán',
  'bill-adjust': 'Điều chỉnh thanh toán',
  'insurance-settle': 'Quyết toán BHYT',
  'appointment-status': 'Trạng thái lịch',
};

export function BillingPanel({ appointmentId }) {
  const { db, user, dispatch } = useHospital();
  const a = db.appointments.find((r) => r.id === appointmentId);
  const b = a.billing;
  const balance = financialBalance(db, a);
  const manager = isAdmin(user);
  const receptionist = manager || user.role === 'staff';
  const processor = manager || (user.role === 'staff' && a.bookingMode === 'facility');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [insurance, setInsurance] = useState({ ...b.insurance, enabled: true });
  const [services, setServices] = useState(() =>
    b.items
      .filter((item) => item.serviceId !== 'consultation' && !item.packageServiceId)
      .map((item) => ({ serviceId: item.serviceId, quantity: item.quantity })),
  );
  const [serviceReason, setServiceReason] = useState(b.serviceReason || '');
  const [promotionCode, setPromotionCode] = useState(b.promotion?.code || '');
  async function run(type, values = {}) {
    try {
      await dispatch(type, { ...values, id: a.id });
      setError('');
      setSuccess('Đã cập nhật và lưu lịch sử thao tác.');
    } catch (e) {
      setError(e.message);
      setSuccess('');
    }
  }
  function submit(type) {
    return async (e) => {
      e.preventDefault();
      await run(type, Object.fromEntries(new FormData(e.currentTarget)));
    };
  }
  const claim = db.insuranceSettlements.find((s) => s.appointmentId === a.id);
  return (
    <div className="space-y-5">
      <p>
        <strong>{a.patientName}</strong> · {a.date} · {a.time}
        <small className="break-all font-mono text-xs text-slate-600">{a.id}</small>
      </p>
      <div className="mb-4 flex flex-wrap gap-2">
        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
          {insuranceStatuses[b.insurance.status]}
        </span>
        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
          {balance.settled
            ? 'Đã hoàn tất thanh toán'
            : b.finalized
              ? 'Đã chốt phí · Chưa thu'
              : 'Chưa chốt phí'}
        </span>
        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
          {b.receivedAt ? 'Đã tiếp nhận' : 'Chưa tiếp nhận'}
        </span>
      </div>
      <Alert error={error} success={success} />
      <div className="grid gap-6 xl:grid-cols-2">
        <div>
          <PriceBreakdown
            price={balance.price}
            title={b.finalized ? 'Bảng phí đã chốt' : 'Chi phí dự kiến'}
          />
          {b.serviceReason && (
            <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              Thay đổi dịch vụ: {b.serviceReason}
            </p>
          )}
          {b.estimate.subtotal !== balance.price.subtotal && (
            <p className="text-slate-500">
              Dự toán ban đầu: {money(b.estimate.subtotal)}. Tổng dịch vụ hiện tại:{' '}
              {money(balance.price.subtotal)}.
            </p>
          )}
          {b.finalized && <p className="text-slate-500">Ghi chú chốt phí: {b.finalized.reason}</p>}
          {b.promotion && (
            <details>
              <summary>Điều khoản ưu đãi đã lưu</summary>
              <p>
                {b.promotion.name} · {b.promotion.startsOn} → {b.promotion.endsOn}
              </p>
              <p>
                Giá trị tối thiểu {money(b.promotion.minimum)} · Giảm tối đa{' '}
                {money(b.promotion.maxDiscount)}.{' '}
                {b.promotion.discountScope === 'patient'
                  ? 'Áp dụng trên phần người bệnh phải trả sau BHYT.'
                  : 'Chỉ áp dụng trên khoản ngoài phạm vi BHYT.'}
              </p>
            </details>
          )}
        </div>
        <div className="space-y-5">
          {receptionist && a.status === 'confirmed' && a.date === dateKey() && !b.receivedAt && (
            <button
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:pointer-events-none disabled:opacity-50"
              onClick={() => run('receive')}
            >
              Xác nhận tiếp nhận
            </button>
          )}
          {b.insurance.status !== 'none' && (
            <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
              <h3>Hồ sơ BHYT mô phỏng</h3>
              <dl className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-3 text-sm [&_dt]:text-slate-500 [&_dd]:m-0 [&_dd]:text-right [&_dd]:font-semibold">
                <dt>Mã mẫu</dt>
                <dd>{b.insurance.cardNumber}</dd>
                <dt>Hiệu lực</dt>
                <dd>
                  {b.insurance.validFrom} → {b.insurance.validTo}
                </dd>
                <dt>Nơi đăng ký</dt>
                <dd>{b.insurance.registeredFacility}</dd>
                <dt>Chuyển cơ sở</dt>
                <dd>{b.insurance.referral || 'Chưa khai'}</dd>
              </dl>
              {b.insurance.reason && (
                <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  Kết quả: {b.insurance.reason}
                </p>
              )}
              {b.insurance.policy && (
                <p className="text-slate-500">
                  Biểu giá mẫu v{b.insurance.policy.version} · Mức hưởng {b.insurance.rate}% × hệ số
                  điều kiện {b.insurance.routeRate}%. Không phải kết quả duyệt của BHXH.
                </p>
              )}
              {processor &&
                b.receivedAt &&
                !b.finalized &&
                ['confirmed', 'completed'].includes(a.status) && (
                  <form onSubmit={submit('insurance-verify')}>
                    <Field label="Kết quả kiểm tra">
                      <select
                        name="status"
                        defaultValue={b.insurance.status === 'verified' ? 'verified' : 'supplement'}
                      >
                        <option value="supplement">Cần bổ sung</option>
                        <option value="verified">Đủ điều kiện mô phỏng</option>
                        <option value="rejected">Không đủ điều kiện</option>
                      </select>
                    </Field>
                    <div className="grid gap-4 md:grid-cols-2">
                      <Field label="Mức hưởng theo nhóm đối tượng">
                        <select
                          name="benefitRate"
                          defaultValue={b.insurance.benefitRate || b.insurance.rate || 80}
                        >
                          <option value="80">80%</option>
                          <option value="95">95%</option>
                          <option value="100">100%</option>
                        </select>
                      </Field>
                      <Field label="Loại điều trị">
                        <select
                          name="treatmentType"
                          defaultValue={b.insurance.treatmentType || 'outpatient'}
                        >
                          <option value="outpatient">Ngoại trú</option>
                          <option value="inpatient">Nội trú</option>
                        </select>
                      </Field>
                      <Field label="Đồng chi trả lũy kế trong năm (đ)">
                        <input
                          name="annualCopayPaid"
                          type="number"
                          min="0"
                          step="1000"
                          defaultValue={b.insurance.annualCopayPaid || 0}
                        />
                      </Field>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="flex items-start gap-3 text-sm text-slate-700">
                        <input
                          name="correctRoute"
                          type="checkbox"
                          defaultChecked={b.insurance.correctRoute}
                        />
                        Đúng nơi đăng ký hoặc có chuyển cơ sở hợp lệ
                      </label>
                      <label className="flex items-start gap-3 text-sm text-slate-700">
                        <input
                          name="emergency"
                          type="checkbox"
                          defaultChecked={b.insurance.emergency}
                        />
                        Cấp cứu
                      </label>
                      <label className="flex items-start gap-3 text-sm text-slate-700">
                        <input
                          name="specialDisease"
                          type="checkbox"
                          defaultChecked={b.insurance.specialDisease}
                        />
                        Bệnh/nhóm bệnh được hưởng theo quy định chuyển cấp
                      </label>
                      <label className="flex items-start gap-3 text-sm text-slate-700">
                        <input
                          name="fiveYearExempt"
                          type="checkbox"
                          defaultChecked={b.insurance.fiveYearExempt}
                        />
                        Đủ điều kiện miễn đồng chi trả 5 năm liên tục
                      </label>
                      {!!b.medicineItems?.some((item) => item.insuranceCondition) && (
                        <label className="flex items-start gap-3 text-sm text-slate-700">
                          <input
                            name="medicineConditionsConfirmed"
                            type="checkbox"
                            defaultChecked={b.insurance.medicineConditionsConfirmed}
                          />
                          Đã đối chiếu điều kiện thanh toán của từng thuốc
                        </label>
                      )}
                    </div>
                    <Field label="Căn cứ kiểm tra / thông tin cần bổ sung">
                      <textarea
                        name="reason"
                        required
                        placeholder="Ghi kết quả kiểm tra hiệu lực, nơi đăng ký, chuyển cơ sở và căn cứ chọn mức hưởng mẫu"
                      />
                    </Field>
                    <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:pointer-events-none disabled:opacity-50 border border-sky-200 bg-white text-sky-700 shadow-none hover:border-sky-300 hover:bg-sky-50">
                      Lưu xác minh mô phỏng
                    </button>
                  </form>
                )}
              {user.role === 'patient' &&
                ['pending', 'supplement', 'rejected'].includes(b.insurance.status) &&
                ['pending', 'confirmed', 'completed'].includes(a.status) &&
                !b.finalized && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      run('insurance-resubmit', { insurance });
                    }}
                  >
                    <InsuranceFields
                      value={insurance}
                      onChange={setInsurance}
                      allowToggle={false}
                    />
                    <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:pointer-events-none disabled:opacity-50 border border-sky-200 bg-white text-sky-700 shadow-none hover:border-sky-300 hover:bg-sky-50">
                      Gửi bổ sung BHYT
                    </button>
                  </form>
                )}
            </section>
          )}
          {processor &&
            a.bookingMode === 'facility' &&
            a.status === 'confirmed' &&
            b.receivedAt &&
            !b.finalized && (
              <form
                className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5"
                onSubmit={(event) => {
                  event.preventDefault();
                  run('billing-services', { services, serviceReason });
                }}
              >
                <ServiceEditor
                  catalog={db.serviceCatalog}
                  value={services}
                  onChange={setServices}
                  reason={serviceReason}
                  onReason={setServiceReason}
                  savedItems={b.items}
                />
                <button className="inline-flex min-h-11 items-center justify-center rounded-xl bg-sky-700 px-5 py-2.5 font-semibold text-white hover:bg-sky-800">
                  Lưu dịch vụ thực hiện
                </button>
              </form>
            )}
          {processor && !b.finalized && (
            <form
              className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5"
              onSubmit={(event) => {
                event.preventDefault();
                run('promotion-apply', { code: promotionCode });
              }}
            >
              <h3>Ưu đãi trước khi chốt phí</h3>
              <Field label="Mã khuyến mãi (để trống để dùng ưu đãi tự động)">
                <input
                  value={promotionCode}
                  onChange={(event) => setPromotionCode(event.target.value.toUpperCase())}
                  maxLength={30}
                />
              </Field>
              <button className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 font-semibold text-slate-800 hover:bg-slate-50">
                Tính lại ưu đãi
              </button>
            </form>
          )}
          {processor && a.status === 'completed' && !b.finalized && (
            <form
              className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5"
              onSubmit={submit('bill-finalize')}
            >
              <h3>Đối chiếu và chốt phí</h3>
              <p className="text-slate-500">
                Xác nhận các dịch vụ đã thực hiện và giải thích chênh lệch cho người bệnh trước khi
                chốt.
              </p>
              <Field label="Ghi chú đối chiếu với khách">
                <textarea name="reason" required />
              </Field>
              <button
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:pointer-events-none disabled:opacity-50"
                disabled={balance.price.unresolved}
              >
                Chốt bảng phí
              </button>
            </form>
          )}
          {processor && b.finalized && !balance.settled && (
            <form
              className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5"
              onSubmit={submit('pay')}
            >
              <h3>Thanh toán mô phỏng</h3>
              <Field label="Phương thức">
                <select name="method">
                  <option value="cash">Tiền mặt</option>
                  <option value="transfer">Chuyển khoản đã đối chiếu</option>
                </select>
              </Field>
              <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                Chỉ xác nhận sau khi đã nhận và đối chiếu khoản tiền trong tình huống mô phỏng.
              </p>
              <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:pointer-events-none disabled:opacity-50">
                {balance.price.patientDue
                  ? `Xác nhận đã thu ${money(balance.price.patientDue)}`
                  : 'Hoàn tất nghĩa vụ 0đ'}
              </button>
            </form>
          )}
          {balance.settled && (
            <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
              <h3>Phiếu và giao dịch</h3>
              <p className="break-all font-mono text-xs text-slate-600">{b.settlementId}</p>
              <p>
                Khách thực trả sau điều chỉnh: <strong>{money(balance.paid)}</strong>
              </p>
              <p className="text-slate-500">
                Điều chỉnh nghĩa vụ thanh toán: {money(balance.delta)}. Phiếu gốc được giữ nguyên.
              </p>
              {db.payments
                .filter((p) => p.appointmentId === a.id)
                .map((p) => (
                  <p key={p.id}>
                    {p.date} · Thu {money(p.amount)} ·{' '}
                    {p.method === 'transfer' ? 'Chuyển khoản' : 'Tiền mặt'}
                  </p>
                ))}
              {balance.adjustments.map((r) => (
                <div className="rounded-xl bg-slate-50 p-4" key={r.id}>
                  <strong>
                    {r.kind === 'refund' ? 'Hoàn tiền' : 'Điều chỉnh thu thêm'}: {money(r.amount)}
                  </strong>
                  <small>
                    {r.date} · {r.method === 'cash' ? 'Tiền mặt' : 'Chuyển khoản'} · {r.id}
                  </small>
                  <p>{r.reason}</p>
                </div>
              ))}
              {manager && (
                <details>
                  <summary>Điều chỉnh / hoàn tiền</summary>
                  <form onSubmit={submit('bill-adjust')}>
                    <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                      Tạo chứng từ điều chỉnh và xác nhận giao dịch ngay. Không thay đổi phần BHYT
                      hoặc sửa phiếu gốc.
                    </p>
                    <Field label="Loại giao dịch">
                      <select name="kind">
                        <option value="refund">Giảm nghĩa vụ và hoàn tiền</option>
                        <option value="additional">Tăng nghĩa vụ và thu bổ sung</option>
                      </select>
                    </Field>
                    <Field label="Số tiền điều chỉnh">
                      <input name="amount" type="number" min="1" max="1000000000" required />
                    </Field>
                    <Field label="Phương thức điều chỉnh">
                      <select name="method">
                        <option value="cash">Tiền mặt</option>
                        <option value="transfer">Chuyển khoản</option>
                      </select>
                    </Field>
                    <Field label="Tham chiếu chứng từ điều chỉnh">
                      <input name="reference" required placeholder="Ví dụ: DC-001 (không trùng)" />
                    </Field>
                    <Field label="Lý do và căn cứ điều chỉnh">
                      <textarea name="reason" required />
                    </Field>
                    <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:pointer-events-none disabled:opacity-50 border border-sky-200 bg-white text-sky-700 shadow-none hover:border-sky-300 hover:bg-sky-50">
                      Xác nhận giao dịch điều chỉnh
                    </button>
                  </form>
                </details>
              )}
            </section>
          )}
          {b.finalized && balance.price.insurer > 0 && (
            <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
              <h3>Khoản BHYT</h3>
              <p>
                {claim ? 'Đã ghi nhận quyết toán mô phỏng' : 'Chờ quyết toán mô phỏng'}:{' '}
                {money(balance.price.insurer)}
              </p>
              {manager && !claim && (
                <form onSubmit={submit('insurance-settle')}>
                  <Field label="Tham chiếu quyết toán mẫu">
                    <input name="reason" required />
                  </Field>
                  <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:pointer-events-none disabled:opacity-50 border border-sky-200 bg-white text-sky-700 shadow-none hover:border-sky-300 hover:bg-sky-50">
                    Ghi nhận BHYT đã thanh toán
                  </button>
                </form>
              )}
            </section>
          )}
        </div>
      </div>
      <details className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
        <summary>Lịch sử xử lý</summary>
        <ol className="space-y-3 text-sm">
          {db.auditLogs
            .filter((r) => r.appointmentId === a.id)
            .map((r) => (
              <li key={r.id}>
                <strong>{auditNames[r.action] || r.action}</strong>
                <small>
                  {new Date(r.at).toLocaleString('vi-VN')} ·{' '}
                  {db.users.find((u) => u.id === r.actorId)?.name || r.actorId}
                </small>
                <p>{r.reason}</p>
              </li>
            ))}
        </ol>
      </details>
    </div>
  );
}
