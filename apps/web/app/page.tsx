export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12 gap-8">
      <div className="text-center space-y-3">
        <div
          aria-hidden
          className="mx-auto w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center text-5xl"
        >
          🌱
        </div>
        <h1 className="text-4xl font-bold text-text tracking-tight">shishu</h1>
        <p className="text-muted text-lg">Learn gently. Grow together.</p>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <a
          href="/learn"
          className="btn-primary text-center"
        >
          Start learning
        </a>
        <a
          href="/parent"
          className="text-center text-muted underline-offset-4 hover:underline"
        >
          For parents
        </a>
      </div>

      <p className="text-sm text-muted/70 mt-8">
        Free &amp; open source · No ads · Works offline
      </p>
    </main>
  );
}
