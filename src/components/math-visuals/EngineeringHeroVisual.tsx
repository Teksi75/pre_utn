export function EngineeringHeroVisual() {
  return (
    <div
      aria-hidden="true"
      className="app-watermark pointer-events-none absolute inset-y-0 right-0 z-0 hidden w-[62%] overflow-hidden text-slate-700 opacity-20 md:block"
    >
      <svg
        aria-hidden="true"
        className="absolute -right-12 top-1/2 h-[26rem] w-[42rem] -translate-y-1/2"
        viewBox="0 0 420 260"
        fill="none"
      >
        <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 198h376" strokeWidth="0.8" opacity="0.3" />
          <path d="M70 198 136 92l66 106 66-106 66 106" strokeWidth="1.4" opacity="0.48" />
          <path d="M70 198h264M103 145h198M136 92h132" strokeWidth="0.65" opacity="0.32" />
          <path d="M103 145l99 53M169 145l99 53M136 92l66 106M268 92l-66 106" strokeWidth="0.65" opacity="0.28" />
          <path d="M42 198c42-96 95-132 159-132 62 0 110 30 154 95" strokeWidth="1.1" opacity="0.42" />
          <path d="M42 198c51-48 104-73 158-73 60 0 111 24 154 73" strokeWidth="0.9" opacity="0.34" />
          <path d="M58 62h88M58 78h56M58 94h72" strokeWidth="0.8" opacity="0.35" />
          <path d="M266 52h72M302 28v72M278 76l24-24 24 24" strokeWidth="1" opacity="0.5" />
          <path d="M252 134h90M252 134c12-40 28-59 49-59 22 0 35 17 41 59" strokeWidth="0.9" opacity="0.42" />
          <path d="M252 134v44M342 134v44M252 178h90" strokeWidth="0.65" opacity="0.3" />
          <circle cx="302" cy="52" r="4" fill="currentColor" stroke="none" opacity="0.38" />
          <circle cx="136" cy="92" r="3.5" fill="currentColor" stroke="none" opacity="0.34" />
          <circle cx="268" cy="92" r="3.5" fill="currentColor" stroke="none" opacity="0.34" />
        </g>
        <g fill="currentColor" fontFamily="Georgia, 'Times New Roman', serif">
          <text x="58" y="50" fontSize="12" opacity="0.58">∫ f(x) dx</text>
          <text x="246" y="34" fontSize="11" opacity="0.55">v⃗</text>
          <text x="348" y="138" fontSize="11" opacity="0.52">σ = F/A</text>
          <text x="78" y="218" fontSize="10" opacity="0.45">modelos · estructuras · vectores</text>
        </g>
      </svg>
    </div>
  );
}
