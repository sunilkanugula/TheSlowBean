export function Button({ text, onClick, loading }: any) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="premium-button w-full py-2.5"
    >
      {loading ? "Please wait..." : text}
    </button>
  );
}

