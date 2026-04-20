export default function AuthWrapper({ title, error, children }: any) {
  return (
    <div className="premium-page flex items-center justify-center">
      <div className="premium-card relative w-full max-w-md p-8">
        <p className="premium-kicker">The Slow Bean</p>
        <h1 className="mt-2 text-3xl font-semibold text-[#202326]">{title}</h1>
        {error && (
          <div className="mb-4 mt-5 rounded-lg border border-[#d9dfd8] bg-[#edf2ee] px-3 py-2 text-sm text-[#5f6568]">
            {error}
          </div>
        )}
        <div className="mt-6 space-y-4">{children}</div>
      </div>
    </div>
  );
}




