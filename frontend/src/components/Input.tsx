export function Input({ label, ...props }: any) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-[#8b9290]">
        {label}
      </label>
      <input
        {...props}
        className="premium-input py-2.5 placeholder:text-[#8b9290]"
      />
    </div>
  );
}


