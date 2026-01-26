export function Input({ label, ...props }: any) {
  return (
    <div>
      <label className="block text-sm mb-1">{label}</label>
      <input
        {...props}
        className="w-full border px-4 py-2 rounded-lg"
      />
    </div>
  );
}
