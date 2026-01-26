type Props = {
  quantity: number;
  onIncrease: () => void;
  onDecrease: () => void;
};

export default function QuantityControl({
  quantity,
  onIncrease,
  onDecrease,
}: Props) {
  return (
    <div className="flex items-center gap-3 mt-2">
      <button
        onClick={onDecrease}
        className="px-3 py-1 border rounded text-lg"
        disabled={quantity <= 1}
      >
        −
      </button>

      <span className="font-semibold">{quantity}</span>

      <button
        onClick={onIncrease}
        className="px-3 py-1 border rounded text-lg"
      >
        +
      </button>
    </div>
  );
}
