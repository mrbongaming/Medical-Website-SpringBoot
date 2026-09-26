import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useHospital } from '../state/context';
import { availableStock, settingRow } from '../data/inventory';
import { PageTitle } from '../components/PageTitle';
import { Table } from '../components/Table';

export function AlertsPage() {
  const { db, user } = useHospital();
  const [now] = useState(() => Date.now());
  const allowed = (branchId) => user.role === 'superAdmin' || branchId === user.branchId;
  const alerts = [];
  for (const stock of db.inventory.filter((row) => allowed(row.branchId))) {
    const medicine = db.medicines.find((row) => row.id === stock.medicineId);
    const setting = settingRow(db, stock.branchId, stock.medicineId);
    const available = availableStock(stock);
    if (available < setting.min)
      alerts.push({
        id: `stock-${stock.id}`,
        severity: available === 0 ? 'high' : 'medium',
        title: available === 0 ? 'Thuốc đã hết khả dụng' : 'Thuốc dưới ngưỡng tồn',
        detail: `${medicine.code} · ${medicine.name}: còn ${available} ${medicine.unit}, ngưỡng tối thiểu ${setting.min}.`,
        branchId: stock.branchId,
        at: db.seededAt,
        to: '/quan-tri/kho-thuoc',
      });
  }
  for (const request of db.stockRequests.filter(
    (row) => allowed(row.branchId) && row.kind === 'urgent' && row.status === 'pending',
  )) {
    alerts.push({
      id: `request-${request.id}`,
      severity: 'high',
      title: 'Yêu cầu nhập khẩn chờ duyệt',
      detail: request.reason,
      branchId: request.branchId,
      at: request.createdAt,
      to: '/quan-tri/kho-thuoc',
    });
  }
  const soon = now + 2 * 86400000;
  for (const appointment of db.appointments.filter(
    (row) => allowed(row.branchId) && row.status === 'pending',
  )) {
    const time = new Date(`${appointment.date}T23:59:00+07:00`).getTime();
    if (time <= soon && time >= now)
      alerts.push({
        id: `appointment-${appointment.id}`,
        severity: 'medium',
        title: 'Lịch sắp tới chưa xác nhận',
        detail: `${appointment.id} · ${appointment.patientName} · ${appointment.date}`,
        branchId: appointment.branchId,
        at: appointment.createdAt,
        to: '/quan-tri/lich-hen',
      });
  }
  alerts.sort((a, b) =>
    a.severity === b.severity
      ? String(b.at).localeCompare(String(a.at))
      : a.severity === 'high'
        ? -1
        : 1,
  );
  return (
    <div className="space-y-5">
      <PageTitle
        title="Cảnh báo vận hành"
        description="Các cảnh báo được tính trực tiếp từ tồn kho, phiếu nhập và lịch hẹn trong phạm vi quản lý."
      />
      <Table headers={['Mức độ', 'Cảnh báo', 'Cơ sở', 'Phát hiện', 'Xử lý']} empty={!alerts.length}>
        {alerts.map((alert) => (
          <tr key={alert.id}>
            <td>
              <span
                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${alert.severity === 'high' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}
              >
                {alert.severity === 'high' ? 'Quan trọng' : 'Cần chú ý'}
              </span>
            </td>
            <td className="min-w-80">
              <strong className="block">{alert.title}</strong>
              <small className="mt-1 block leading-5 text-slate-500">{alert.detail}</small>
            </td>
            <td>{db.branches.find((row) => row.id === alert.branchId)?.name}</td>
            <td className="whitespace-nowrap">
              {alert.at ? new Date(alert.at).toLocaleString('vi-VN') : 'Hiện tại'}
            </td>
            <td>
              <Link className="font-semibold text-sky-700 hover:underline" to={alert.to}>
                Mở màn hình xử lý
              </Link>
            </td>
          </tr>
        ))}
      </Table>
    </div>
  );
}
