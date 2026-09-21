export function Empty({ text = 'Chưa có dữ liệu phù hợp.' }) {
  return (
    <div
      data-testid="empty-state"
      className="rounded-2xl border-2 border-dashed border-slate-200 bg-white px-5 py-12 text-center [&>span]:mx-auto [&>span]:mb-4 [&>span]:grid [&>span]:size-14 [&>span]:place-items-center [&>span]:rounded-full [&>span]:bg-slate-100 [&>span]:text-2xl [&_h3]:font-bold [&_h3]:text-brand-900 [&_p]:mt-2 [&_p]:text-slate-500"
    >
      <span>＋</span>
      <h3>{text}</h3>
      <p>Thử thay đổi bộ lọc hoặc tạo dữ liệu mới.</p>
    </div>
  );
}
