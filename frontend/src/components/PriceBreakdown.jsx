import { money } from '../data/seed';

export function PriceBreakdown({ price, title = 'Chi phí dự kiến' }) {
  if (!price) return null;
  return (
    <section
      className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 [&_h3]:font-bold [&_h3]:text-brand-900"
      aria-label={title}
    >
      <h3>{title}</h3>
      <ul className="divide-y divide-slate-100 [&_li]:flex [&_li]:justify-between [&_li]:gap-4 [&_li]:py-3 [&_small]:block [&_small]:text-slate-500">
        {price.items.map((i) => (
          <li key={i.serviceId}>
            <span>
              {i.name}
              <small>
                {i.quantity} × {money(i.unitPrice)}
              </small>
            </span>
            <strong>{money(i.total)}</strong>
          </li>
        ))}
      </ul>
      <dl className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-3 text-sm [&_dt]:text-slate-500 [&_dd]:m-0 [&_dd]:text-right [&_dd]:font-semibold">
        <dt>Tổng dịch vụ</dt>
        <dd>{money(price.subtotal)}</dd>
        <dt>BHYT chi trả</dt>
        <dd>{price.unresolved ? 'Chưa xác định' : money(price.insurer)}</dd>
        <dt>Đồng chi trả BHYT</dt>
        <dd>{price.unresolved ? 'Chưa xác định' : money(price.copay)}</dd>
        <dt>Ngoài phạm vi BHYT</dt>
        <dd>{price.unresolved ? 'Chưa xác định' : money(price.outside)}</dd>
        <dt>
          Khuyến mãi{price.unresolved ? ' (tạm tính)' : ''}
          <small>{price.promotionName || 'Chưa có ưu đãi'}</small>
        </dt>
        <dd>−{money(price.discount)}</dd>
        <dt className="border-t border-slate-200 pt-3 text-base font-bold text-brand-900">
          Khách thanh toán
        </dt>
        <dd className="border-t border-slate-200 pt-3 text-base font-bold text-brand-900">
          {price.unresolved ? 'Chờ xác minh' : money(price.patientDue)}
        </dd>
      </dl>
      {price.unresolved && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          BHYT đang chờ kiểm tra. Ưu đãi và phần khách trả sẽ được tính lại trên từng dịch vụ sau
          xác minh.
        </p>
      )}
    </section>
  );
}
