export function Input({ label, ...props }: any) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-[#6c7f77]">
        {label}
      </label>
      <input
        {...props}
        className="w-full rounded-xl border border-[#c8d6c4] bg-[#fcfdfb] px-4 py-2.5 text-sm text-[#143b2f] transition placeholder:text-[#97a8a1] focus:border-[#1d6e5a] focus:bg-white focus:outline-none"
      />
    </div>
  );
}
