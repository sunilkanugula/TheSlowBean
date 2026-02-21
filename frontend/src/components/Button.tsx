export function Button({ text, onClick, loading }: any) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="w-full rounded-xl bg-[#143b2f] py-2.5 text-sm font-semibold text-white transition hover:bg-[#0f2f26] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? "Please wait..." : text}
    </button>
  );
}
