export function Button({ text, onClick, loading }: any) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="w-full bg-blue-600 text-white py-2 rounded-lg"
    >
      {loading ? "Please wait..." : text}
    </button>
  );
}
