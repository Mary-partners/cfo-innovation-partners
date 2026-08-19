export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-900 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center justify-center gap-2 text-warm-white">
          <svg width="32" height="32" viewBox="0 0 36 36" fill="none" aria-hidden>
            <circle cx="18" cy="18" r="16" stroke="currentColor" strokeWidth="2" />
            <path
              d="M10 22 C10 14, 18 10, 18 10 C18 10, 26 14, 26 22"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
            />
            <circle cx="18" cy="22" r="2" fill="currentColor" />
          </svg>
          <span className="text-lg font-semibold">CFOIP OS</span>
        </div>
        <div className="rounded-xl bg-white p-8 shadow-xl">{children}</div>
      </div>
    </div>
  );
}
