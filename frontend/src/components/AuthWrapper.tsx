export default function AuthWrapper({ title, error, children }: any) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f3efe6] px-4 py-10">
      <div className="pointer-events-none absolute -left-16 top-10 h-56 w-56 rounded-full bg-[#0f4a3c]/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-10 bottom-0 h-72 w-72 rounded-full bg-[#d7a449]/20 blur-3xl" />

      <div className="relative w-full max-w-md rounded-3xl border border-[#c8d6c4] bg-white/95 p-8 shadow-[0_30px_80px_-30px_rgba(18,53,44,0.45)]">
        <p className="text-xs uppercase tracking-[0.28em] text-[#7d8f87]">The Slow Bean</p>
        <h1 className="mt-2 text-3xl font-semibold text-[#143b2f]">{title}</h1>
        {error && (
          <div className="mb-4 mt-5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        <div className="mt-6 space-y-4">{children}</div>
      </div>
    </div>
  );
}
