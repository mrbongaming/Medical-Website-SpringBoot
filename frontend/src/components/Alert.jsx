export function Alert({ error, success }) {
  return (
    <>
      {error && (
        <p
          className="my-4 rounded-xl border p-4 text-sm font-medium border-red-200 bg-red-50 text-red-800"
          role="alert"
        >
          {error}
        </p>
      )}
      {success && (
        <p
          className="my-4 rounded-xl border p-4 text-sm font-medium border-emerald-200 bg-emerald-50 text-emerald-800"
          role="status"
        >
          {success}
        </p>
      )}
    </>
  );
}
