export function Input({ label, ...props }: any) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-[#8d9197]">
        {label}
      </label>
      <input
        {...props}
        className="w-full rounded-xl border border-[#d7dad7] bg-[#f5f6f5] px-4 py-2.5 text-sm text-[#57595d] transition placeholder:text-[#a5a8ad] focus:border-[#69b317] focus:bg-white focus:outline-none"
      />
    </div>
  );
}


