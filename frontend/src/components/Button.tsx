export function Button({ text, onClick, loading }: any) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="w-full rounded-xl bg-[#57595d] py-2.5 text-sm font-semibold text-white transition hover:bg-[#5aa10f] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? "Please wait..." : text}
    </button>
  );
}

