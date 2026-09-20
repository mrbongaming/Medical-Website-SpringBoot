import { useEffect, useRef } from 'react';
import {
  Chart,
  CategoryScale,
  LinearScale,
  BarController,
  BarElement,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
} from 'chart.js';
Chart.register(
  CategoryScale,
  LinearScale,
  BarController,
  BarElement,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
);
export default function TrendChart({ rows, type = 'bar' }) {
  const ref = useRef(null);
  useEffect(() => {
    const chart = new Chart(ref.current, {
      type,
      data: {
        labels: rows.map((r) => r.date),
        datasets: [
          {
            label: 'Lịch hẹn',
            data: rows.map((r) => r.count),
            borderColor: '#1565D8',
            backgroundColor: '#82b7fa',
            borderRadius: 5,
            tension: 0.3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
      },
    });
    return () => chart.destroy();
  }, [rows, type]);
  return (
    <div className="chart">
      <canvas
        ref={ref}
        role="img"
        aria-label="Biểu đồ số lịch hẹn theo kỳ. Số liệu chi tiết có ở bảng bên dưới."
      />
    </div>
  );
}
