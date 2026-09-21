import { Table } from '../components/Table';

export function ReportTable({ title, headers, rows }) {
  return (
    <section className="space-y-4">
      <h2>{title}</h2>
      <Table headers={headers} empty={!rows.length}>
        {rows.map((row, i) => (
          <tr key={i}>
            {row.map((value, j) => (
              <td key={j}>{value}</td>
            ))}
          </tr>
        ))}
      </Table>
    </section>
  );
}
