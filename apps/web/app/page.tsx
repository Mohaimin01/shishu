import Link from "next/link";
import { LANGS } from "@/lib/packs";
import { assetPath } from "@/lib/paths";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12 gap-8">
      <div className="text-center space-y-3">
        {/* eslint-disable-next-line @next/next/no-img-element -- static export with unoptimized images */}
        <img
          src={assetPath("/icons/icon-192.png")}
          alt=""
          aria-hidden
          width={96}
          height={96}
          className="mx-auto rounded-3xl shadow-sm"
        />
        <h1 className="text-4xl font-bold text-text tracking-tight">shishu</h1>
        <p className="text-muted text-lg">Learn gently. Grow together.</p>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Link href="/learn" className="bg-primary text-white rounded-3xl px-6 py-4 text-lg font-semibold text-center min-h-[56px] flex items-center justify-center active:scale-[0.98] transition duration-gentle hover:bg-[#4F7064]">
          Start learning
        </Link>
        <Link
          href="/parent"
          className="text-center text-muted underline-offset-4 hover:underline px-6 py-4 min-h-[48px] flex items-center justify-center"
        >
          For grown-ups
        </Link>
      </div>

      <p className="text-sm text-muted mt-8 text-center">
        Free &amp; open source · No ads · Works offline
        <br />
        {LANGS.map((l) => l.nativeName).join(" · ")} — more languages welcome
      </p>
    </main>
  );
}
