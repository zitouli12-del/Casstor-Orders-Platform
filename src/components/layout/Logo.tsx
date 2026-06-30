export default function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center font-black text-black shadow-md select-none">
        C
      </div>

      <span className="font-black text-lg tracking-wider text-white">
        CASTTOR <span className="text-orange-500">ORDERS</span>
      </span>
    </div>
  );
}