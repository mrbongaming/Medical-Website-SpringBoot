import { useMemo, useState } from 'react';
import { useHospital } from '../state/context';
import { availableStock, inventorySummary, settingRow } from '../data/inventory';
import { money } from '../data/seed';
import { normalize } from '../data/domain';
import { Alert } from '../components/Alert';
import { Field } from '../components/Field';
import { PageTitle } from '../components/PageTitle';
import { Select } from '../components/Select';
import { Stat } from '../components/Stat';
import { Table } from '../components/Table';
import { Modal } from '../components/Modal';
import TrendChart from '../components/TrendChart';

const requestStatuses = {
  pending: 'Chờ duyệt',
  approved: 'Đã duyệt',
  rejected: 'Từ chối',
  cancelled: 'Đã hủy',
};
const weekdays = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
const button =
  'inline-flex min-h-11 items-center justify-center rounded-xl bg-sky-600 px-4 font-semibold text-white hover:bg-sky-700 disabled:opacity-50';

function requestRowsFromWorksheet(worksheet, db) {
  const rows = [];
  const errors = [];
  const seen = new Set();
  const limit = Math.min(worksheet.rowCount, 501);
  if (worksheet.rowCount > 501) errors.push('File vượt quá giới hạn 500 dòng dữ liệu.');
  for (let rowNumber = 2; rowNumber <= limit; rowNumber += 1) {
    const row = worksheet.getRow(rowNumber);
    const code = String(row.getCell(1).text || '')
      .trim()
      .toUpperCase();
    const quantity = Number(row.getCell(2).value);
    const purchasePrice = Number(row.getCell(3).value);
    if (!code && !row.getCell(2).text && !row.getCell(3).text) continue;
    const medicine = db.medicines.find((m) => m.code === code);
    if (!medicine) errors.push(`Dòng ${rowNumber}: mã thuốc ${code || '(trống)'} không tồn tại.`);
    if (seen.has(code)) errors.push(`Dòng ${rowNumber}: mã thuốc ${code} bị trùng.`);
    if (!Number.isSafeInteger(quantity) || quantity <= 0)
      errors.push(`Dòng ${rowNumber}: số lượng phải là số nguyên dương.`);
    if (!Number.isSafeInteger(purchasePrice) || purchasePrice <= 0)
      errors.push(`Dòng ${rowNumber}: đơn giá nhập không hợp lệ.`);
    seen.add(code);
    if (medicine) rows.push({ medicineId: medicine.id, quantity, purchasePrice });
  }
  if (!rows.length) errors.push('File chưa có dòng thuốc hợp lệ.');
  return { rows, errors };
}

export function InventoryPage() {
  const { db, user, dispatch } = useHospital();
  const [tab, setTab] = useState('stock');
  const [branchId, setBranchId] = useState(user.branchId || '');
  const scopeBranch = user.role === 'superAdmin' ? branchId : user.branchId;
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState('');
  const [stockState, setStockState] = useState('');
  const [settingsQuery, setSettingsQuery] = useState('');
  const [medicineStatus, setMedicineStatus] = useState('');
  const [kind, setKind] = useState('normal');
  const [requestStatus, setRequestStatus] = useState('');
  const [requestDate, setRequestDate] = useState('');
  const [reason, setReason] = useState('');
  const [items, setItems] = useState([{ medicineId: '', quantity: 1, purchasePrice: 1 }]);
  const [errors, setErrors] = useState([]);
  const [success, setSuccess] = useState('');
  const [reviewAction, setReviewAction] = useState(null);
  const summary = inventorySummary(db, scopeBranch);
  const groups = [...new Set(db.medicines.map((m) => m.group))].sort();
  const stocks = useMemo(
    () =>
      summary.stocks.filter((row) => {
        const medicine = db.medicines.find((m) => m.id === row.medicineId);
        const setting = settingRow(db, row.branchId, row.medicineId);
        const available = availableStock(row);
        return (
          (!query ||
            normalize(`${medicine.code} ${medicine.name} ${medicine.activeIngredient}`).includes(
              normalize(query),
            )) &&
          (!group || medicine.group === group) &&
          (!stockState ||
            (stockState === 'out'
              ? available === 0
              : stockState === 'low'
                ? available < setting.min
                : available >= setting.min))
        );
      }),
    [summary.stocks, db, query, group, stockState],
  );
  const configuredMedicines = useMemo(
    () =>
      db.medicines.filter(
        (medicine) =>
          normalize(`${medicine.code} ${medicine.name} ${medicine.activeIngredient}`).includes(
            normalize(settingsQuery),
          ) &&
          (!medicineStatus || (medicineStatus === 'active' ? medicine.active : !medicine.active)),
      ),
    [db.medicines, medicineStatus, settingsQuery],
  );
  const settingBranches = scopeBranch
    ? db.branches.filter((branch) => branch.id === scopeBranch)
    : db.branches;
  const name = (collection, id) => db[collection].find((r) => r.id === id)?.name || id;
  const clearMessage = () => {
    setErrors([]);
    setSuccess('');
  };
  const updateItem = (index, key, value) =>
    setItems(items.map((item, i) => (i === index ? { ...item, [key]: value } : item)));

  async function createRequest(e) {
    e.preventDefault();
    clearMessage();
    try {
      await dispatch('stock-request-create', { kind, reason, items });
      setSuccess('Đã gửi yêu cầu nhập thuốc chờ admin tổng phê duyệt.');
      setItems([{ medicineId: '', quantity: 1, purchasePrice: 1 }]);
      setReason('');
    } catch (error) {
      setErrors([error.message]);
    }
  }
  async function review(id, status, reviewReason = '') {
    clearMessage();
    try {
      await dispatch('stock-request-review', { id, status, reason: reviewReason });
      setSuccess('Đã cập nhật yêu cầu nhập thuốc.');
      setReviewAction(null);
    } catch (error) {
      setErrors([error.message]);
    }
  }
  async function cancel(id) {
    clearMessage();
    try {
      await dispatch('stock-request-cancel', { id, reason: 'Admin cơ sở hủy yêu cầu.' });
      setSuccess('Đã hủy yêu cầu.');
    } catch (error) {
      setErrors([error.message]);
    }
  }
  async function importExcel(file) {
    clearMessage();
    if (!file || file.size > 5 * 1024 * 1024) {
      setErrors(['File Excel phải nhỏ hơn hoặc bằng 5 MB.']);
      return;
    }
    try {
      const ExcelJS = await import('exceljs');
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(await file.arrayBuffer());
      const result = requestRowsFromWorksheet(workbook.worksheets[0], db);
      setErrors(result.errors);
      if (!result.errors.length) {
        setItems(result.rows);
        setSuccess(`Đã đọc ${result.rows.length} dòng. Kiểm tra trước khi gửi.`);
      }
    } catch {
      setErrors(['Không đọc được file .xlsx. Hãy dùng file mẫu của hệ thống.']);
    }
  }
  async function downloadTemplate() {
    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Yeu cau nhap thuoc');
    sheet.columns = [
      { header: 'Mã thuốc', key: 'code', width: 18 },
      { header: 'Số lượng', key: 'quantity', width: 16 },
      { header: 'Đơn giá nhập', key: 'purchasePrice', width: 20 },
    ];
    sheet.addRow({ code: 'MED001', quantity: 100, purchasePrice: 700 });
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF075985' } };
    sheet.views = [{ state: 'frozen', ySplit: 1 }];
    const buffer = await workbook.xlsx.writeBuffer();
    const url = URL.createObjectURL(
      new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }),
    );
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'mau-yeu-cau-nhap-thuoc.xlsx';
    anchor.click();
    URL.revokeObjectURL(url);
  }
  const chartRows = db.branches.map((branch) => ({
    date: branch.name.replace('An Tâm · ', ''),
    count: inventorySummary(db, branch.id).low.length,
  }));
  return (
    <div className="space-y-6">
      <PageTitle
        title="Quản lý kho thuốc"
        description="Dữ liệu mô phỏng theo từng cơ sở, liên kết với yêu cầu nhập và đơn thuốc."
      />
      <div className="flex gap-2 overflow-x-auto border-b border-slate-200 pb-px">
        {[
          ['stock', 'Tồn kho'],
          ['requests', 'Yêu cầu nhập'],
          ['reports', 'Thống kê'],
          ...(user.role === 'superAdmin' ? [['settings', 'Cấu hình & danh mục']] : []),
        ].map(([id, label]) => (
          <button
            key={id}
            className={`min-h-11 shrink-0 border-b-2 px-4 font-semibold ${tab === id ? 'border-sky-600 text-sky-700' : 'border-transparent text-slate-500'}`}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>
      {user.role === 'superAdmin' && (
        <Select
          label="Cơ sở"
          value={branchId}
          onChange={setBranchId}
          options={db.branches}
          placeholder="Toàn hệ thống"
        />
      )}
      <Alert error={errors.join(' ')} success={success} />
      {tab === 'stock' && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Stat label="Mặt hàng" value={summary.stocks.length} />
            <Stat label="Dưới ngưỡng" value={summary.low.length} />
            <Stat label="Hết khả dụng" value={summary.out.length} />
            <Stat label="Đang chờ duyệt" value={summary.pending} />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Tìm thuốc">
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Mã, tên, hoạt chất"
              />
            </Field>
            <Select
              label="Nhóm thuốc"
              value={group}
              onChange={setGroup}
              options={groups.map((value) => ({ id: value, name: value }))}
              placeholder="Tất cả nhóm"
            />
            <Select
              label="Tình trạng"
              value={stockState}
              onChange={setStockState}
              options={[
                { id: 'out', name: 'Hết khả dụng' },
                { id: 'low', name: 'Dưới ngưỡng' },
                { id: 'ok', name: 'Đủ tồn' },
              ]}
              placeholder="Tất cả"
            />
          </div>
          <Table
            headers={['Thuốc', 'Cơ sở', 'Tồn thực tế', 'Đang giữ', 'Khả dụng', 'Ngưỡng']}
            empty={!stocks.length}
          >
            {stocks.map((row) => {
              const medicine = db.medicines.find((m) => m.id === row.medicineId);
              const setting = settingRow(db, row.branchId, row.medicineId);
              return (
                <tr key={row.id}>
                  <td>
                    <strong>
                      {medicine.code} · {medicine.name}
                    </strong>
                    <small className="block text-slate-500">
                      {medicine.activeIngredient} · {medicine.group}
                    </small>
                  </td>
                  <td>{name('branches', row.branchId)}</td>
                  <td>
                    {row.quantity} {medicine.unit}
                  </td>
                  <td>
                    {row.reserved} {medicine.unit}
                  </td>
                  <td>
                    <strong>
                      {availableStock(row)} {medicine.unit}
                    </strong>
                  </td>
                  <td>
                    {setting.min}–{setting.max}
                  </td>
                </tr>
              );
            })}
          </Table>
        </>
      )}
      {tab === 'requests' && (
        <div className="grid items-start gap-6 xl:grid-cols-[minmax(20rem,26rem)_1fr]">
          {user.role === 'branchAdmin' && (
            <form
              className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5"
              onSubmit={createRequest}
            >
              <h2 className="text-xl font-bold text-brand-900">Tạo yêu cầu nhập</h2>
              <Select
                label="Loại yêu cầu"
                value={kind}
                onChange={setKind}
                options={[
                  { id: 'normal', name: 'Thường' },
                  { id: 'urgent', name: 'Khẩn' },
                ]}
              />
              {kind === 'urgent' && (
                <Field label="Lý do khẩn">
                  <textarea value={reason} onChange={(e) => setReason(e.target.value)} required />
                </Field>
              )}
              <div className="flex flex-wrap gap-2">
                <button type="button" className={button} onClick={downloadTemplate}>
                  Tải file mẫu Excel
                </button>
                <label
                  className={`${button} cursor-pointer bg-white text-sky-700 ring-1 ring-sky-200`}
                >
                  Đọc file .xlsx
                  <input
                    className="sr-only"
                    type="file"
                    accept=".xlsx"
                    onChange={(e) => importExcel(e.target.files[0])}
                  />
                </label>
              </div>
              {items.map((item, index) => (
                <div className="space-y-3 rounded-xl bg-slate-50 p-3" key={index}>
                  <Select
                    label={`Thuốc ${index + 1}`}
                    value={item.medicineId}
                    onChange={(value) => updateItem(index, 'medicineId', value)}
                    options={db.medicines
                      .filter((m) => m.active)
                      .map((m) => ({ id: m.id, name: `${m.code} · ${m.name}` }))}
                    required
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Số lượng">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                        required
                      />
                    </Field>
                    <Field label="Đơn giá nhập">
                      <input
                        type="number"
                        min="1"
                        value={item.purchasePrice}
                        onChange={(e) => updateItem(index, 'purchasePrice', e.target.value)}
                        required
                      />
                    </Field>
                  </div>
                  {items.length > 1 && (
                    <button
                      type="button"
                      className="text-sm font-semibold text-red-600"
                      onClick={() => setItems(items.filter((_, i) => i !== index))}
                    >
                      Xóa dòng
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                className="font-semibold text-sky-700"
                onClick={() =>
                  setItems([...items, { medicineId: '', quantity: 1, purchasePrice: 1 }])
                }
              >
                + Thêm thuốc
              </button>
              <button className={`${button} w-full`}>Gửi yêu cầu</button>
            </form>
          )}
          <div className="space-y-4">
            <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2">
              <Select
                label="Trạng thái phiếu"
                value={requestStatus}
                onChange={setRequestStatus}
                options={Object.entries(requestStatuses).map(([id, name]) => ({ id, name }))}
                placeholder="Tất cả trạng thái"
              />
              <Field label="Ngày tạo">
                <input
                  type="date"
                  value={requestDate}
                  onChange={(e) => setRequestDate(e.target.value)}
                />
              </Field>
            </div>
            {summary.requests
              .filter(
                (request) =>
                  (!requestStatus || request.status === requestStatus) &&
                  (!requestDate || request.createdAt.slice(0, 10) === requestDate),
              )
              .slice()
              .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
              .map((request) => (
                <article
                  key={request.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <strong>
                        {request.kind === 'urgent' ? 'Yêu cầu khẩn' : 'Yêu cầu thường'} ·{' '}
                        {name('branches', request.branchId)}
                      </strong>
                      <small className="block text-slate-500">
                        {new Date(request.createdAt).toLocaleString('vi-VN')} · {request.id}
                      </small>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold">
                      {requestStatuses[request.status]}
                    </span>
                  </div>
                  <p>{request.reason || 'Không có ghi chú.'}</p>
                  <ul className="my-3 space-y-1 text-sm">
                    {request.items.map((item) => {
                      const medicine = db.medicines.find((m) => m.id === item.medicineId);
                      return (
                        <li key={item.medicineId}>
                          {medicine.code} · {medicine.name}:{' '}
                          <strong>
                            {item.quantity} {medicine.unit}
                          </strong>{' '}
                          · {money(item.purchasePrice)}/{medicine.unit}
                        </li>
                      );
                    })}
                  </ul>
                  {request.reviewReason && (
                    <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
                      {request.reviewReason}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {user.role === 'superAdmin' && request.status === 'pending' && (
                      <>
                        <button className={button} onClick={() => review(request.id, 'approved')}>
                          Phê duyệt & cộng kho
                        </button>
                        <button
                          className={`${button} bg-red-600`}
                          onClick={() => setReviewAction({ id: request.id, status: 'rejected' })}
                        >
                          Từ chối
                        </button>
                      </>
                    )}
                    {user.role === 'branchAdmin' && request.status === 'pending' && (
                      <button className={`${button} bg-red-600`} onClick={() => cancel(request.id)}>
                        Hủy yêu cầu
                      </button>
                    )}
                  </div>
                </article>
              ))}
          </div>
        </div>
      )}
      {tab === 'reports' && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Stat label="Giá trị nhập đã duyệt" value={money(summary.importValue)} />
            <Stat
              label="Số lượng đã cấp"
              value={summary.dispensed}
              note="Tổng theo giao dịch; xem bảng để phân biệt đơn vị"
            />
            <Stat label="Phiếu chờ" value={summary.pending} />
            <Stat label="Ngày đối chiếu" value={summary.asOf} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Object.entries(requestStatuses).map(([status, label]) => (
              <Stat
                key={status}
                label={`Phiếu ${label.toLowerCase()}`}
                value={summary.requests.filter((request) => request.status === status).length}
              />
            ))}
          </div>
          <div>
            <h2 className="mb-3 text-xl font-bold text-brand-900">
              Số mặt hàng dưới ngưỡng theo cơ sở
            </h2>
            <TrendChart rows={chartRows} />
          </div>
          <Table headers={['Cơ sở', 'Mặt hàng', 'Dưới ngưỡng', 'Hết khả dụng', 'Phiếu chờ']}>
            {db.branches
              .filter((b) => !scopeBranch || b.id === scopeBranch)
              .map((branch) => {
                const data = inventorySummary(db, branch.id);
                return (
                  <tr key={branch.id}>
                    <td>{branch.name}</td>
                    <td>{data.stocks.length}</td>
                    <td>{data.low.length}</td>
                    <td>{data.out.length}</td>
                    <td>{data.pending}</td>
                  </tr>
                );
              })}
          </Table>
          <Table
            headers={['Thời gian', 'Loại', 'Thuốc', 'Cơ sở', 'Số lượng', 'Người xử lý']}
            empty={!db.inventoryTransactions.length}
          >
            {db.inventoryTransactions
              .filter((row) => !scopeBranch || row.branchId === scopeBranch)
              .slice()
              .sort((a, b) => b.at.localeCompare(a.at))
              .map((row) => {
                const medicine = db.medicines.find((m) => m.id === row.medicineId);
                return (
                  <tr key={row.id}>
                    <td>{new Date(row.at).toLocaleString('vi-VN')}</td>
                    <td>{row.type === 'restock' ? 'Nhập kho' : 'Cấp thuốc'}</td>
                    <td>
                      {medicine.code} · {medicine.name}
                    </td>
                    <td>{name('branches', row.branchId)}</td>
                    <td>
                      {row.quantity > 0 ? '+' : ''}
                      {row.quantity} {medicine.unit}
                    </td>
                    <td>{name('users', row.actorId)}</td>
                  </tr>
                );
              })}
          </Table>
          <Table headers={['Thuốc đã cấp', 'Đơn vị', 'Số lượng']}>
            {db.medicines
              .map((medicine) => ({
                medicine,
                quantity: db.inventoryTransactions
                  .filter(
                    (row) =>
                      row.type === 'dispense' &&
                      row.medicineId === medicine.id &&
                      (!scopeBranch || row.branchId === scopeBranch),
                  )
                  .reduce((sum, row) => sum + Math.abs(row.quantity), 0),
              }))
              .filter((row) => row.quantity > 0)
              .sort((a, b) => b.quantity - a.quantity)
              .slice(0, 10)
              .map(({ medicine, quantity }) => (
                <tr key={medicine.id}>
                  <td>
                    {medicine.code} · {medicine.name}
                  </td>
                  <td>{medicine.unit}</td>
                  <td>{quantity}</td>
                </tr>
              ))}
          </Table>
        </>
      )}
      {tab === 'settings' && (
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-xl font-bold text-brand-900">Kỳ tạo yêu cầu nhập thường</h2>
            <p className="text-slate-500">Múi giờ Asia/Ho_Chi_Minh</p>
            <div className="flex flex-wrap gap-3">
              {weekdays.map((label, day) => (
                <label
                  className="flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 px-3"
                  key={label}
                >
                  <input
                    type="checkbox"
                    checked={db.stockSchedule.weekdays.includes(day)}
                    onChange={async (e) => {
                      const next = e.target.checked
                        ? [...db.stockSchedule.weekdays, day]
                        : db.stockSchedule.weekdays.filter((d) => d !== day);
                      try {
                        await dispatch('inventory-settings-save', { weekdays: next });
                      } catch (error) {
                        setErrors([error.message]);
                      }
                    }}
                  />
                  {label}
                </label>
              ))}
            </div>
          </section>
          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_16rem_auto] md:items-end">
              <Field label="Tìm trong danh mục thuốc">
                <input
                  type="search"
                  value={settingsQuery}
                  onChange={(event) => setSettingsQuery(event.target.value)}
                  placeholder="Mã, tên hoặc hoạt chất"
                />
              </Field>
              <Select
                label="Trạng thái"
                value={medicineStatus}
                onChange={setMedicineStatus}
                options={[
                  { id: 'active', name: 'Đang hoạt động' },
                  { id: 'inactive', name: 'Ngừng sử dụng' },
                ]}
                placeholder="Tất cả trạng thái"
              />
              <button
                type="button"
                className="min-h-11 rounded-xl border border-slate-300 bg-white px-4 font-semibold text-slate-700 hover:border-sky-400 hover:text-sky-700"
                onClick={() => {
                  setSettingsQuery('');
                  setMedicineStatus('');
                }}
              >
                Xóa bộ lọc
              </button>
            </div>
          </section>
          <Table
            headers={['Thuốc', 'Giá bán & trạng thái', 'Ngưỡng theo cơ sở']}
            empty={!configuredMedicines.length}
            paginationKey={`${settingsQuery}|${medicineStatus}|${scopeBranch}`}
          >
            {configuredMedicines.map((medicine) => (
              <tr key={medicine.id}>
                <td className="min-w-64">
                  <strong className="block text-slate-950">
                    {medicine.code} · {medicine.name}
                  </strong>
                  <small className="mt-1 block text-slate-500">
                    {medicine.activeIngredient} · {medicine.form} · {medicine.unit}
                  </small>
                </td>
                <td>
                  <form
                    className="grid min-w-64 gap-3"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const form = new FormData(e.currentTarget);
                      try {
                        await dispatch('medicine-save', {
                          id: medicine.id,
                          salePrice: form.get('salePrice'),
                          active: form.get('active') === 'on',
                        });
                        setSuccess('Đã cập nhật danh mục thuốc.');
                      } catch (error) {
                        setErrors([error.message]);
                      }
                    }}
                  >
                    <Field label="Giá bán">
                      <input
                        name="salePrice"
                        type="number"
                        min="1"
                        defaultValue={medicine.salePrice}
                      />
                    </Field>
                    <label className="flex min-h-11 items-center gap-2 text-sm text-slate-700">
                      <input name="active" type="checkbox" defaultChecked={medicine.active} /> Hoạt
                      động
                    </label>
                    <button className="min-h-10 w-fit rounded-lg border border-sky-200 px-3 font-semibold text-sky-700 hover:bg-sky-50">
                      Lưu thuốc
                    </button>
                  </form>
                </td>
                <td>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {settingBranches.map((branch) => {
                      const setting = settingRow(db, branch.id, medicine.id);
                      return (
                        <form
                          className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                          key={branch.id}
                          onSubmit={async (e) => {
                            e.preventDefault();
                            const form = Object.fromEntries(new FormData(e.currentTarget));
                            try {
                              await dispatch('inventory-settings-save', {
                                branchId: branch.id,
                                medicineId: medicine.id,
                                min: form.min,
                                max: form.max,
                              });
                              setSuccess('Đã lưu ngưỡng tồn.');
                            } catch (error) {
                              setErrors([error.message]);
                            }
                          }}
                        >
                          <small className="mb-2 block font-medium text-slate-700">
                            {branch.name}
                          </small>
                          <div className="grid grid-cols-[minmax(5rem,1fr)_minmax(5rem,1fr)_auto] gap-2">
                            <input
                              aria-label={`Tối thiểu ${branch.name} ${medicine.code}`}
                              className="min-h-10 min-w-0 rounded-lg border border-slate-300 bg-white px-2"
                              name="min"
                              type="number"
                              min="0"
                              defaultValue={setting.min}
                            />
                            <input
                              aria-label={`Tối đa ${branch.name} ${medicine.code}`}
                              className="min-h-10 min-w-0 rounded-lg border border-slate-300 bg-white px-2"
                              name="max"
                              type="number"
                              min="1"
                              defaultValue={setting.max}
                            />
                            <button className="rounded-lg px-2 font-semibold text-sky-700 hover:bg-sky-100">
                              Lưu
                            </button>
                          </div>
                        </form>
                      );
                    })}
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        </div>
      )}
      {reviewAction && (
        <Modal title="Từ chối yêu cầu nhập thuốc" close={() => setReviewAction(null)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              review(
                reviewAction.id,
                reviewAction.status,
                new FormData(e.currentTarget).get('reason'),
              );
            }}
          >
            <Field label="Lý do từ chối">
              <textarea name="reason" required />
            </Field>
            <button className={`${button} bg-red-600`}>Xác nhận từ chối</button>
          </form>
        </Modal>
      )}
    </div>
  );
}
