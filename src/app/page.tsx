import Link from "next/link";

const rotations = ["rotate-2", "-rotate-3", "rotate-1", "-rotate-2", "rotate-3"];

function ClothingCard({ i }: { i: number }) {
  return (
    <div
      className={[
        "h-64 w-48 rounded-2xl bg-slate-200 shadow-lg ring-1 ring-black/5",
        rotations[i % rotations.length],
      ].join(" ")}
    />
  );
}

function ClothingCardSet() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <ClothingCard key={i} i={i} />
      ))}
    </>
  );
}

export default function LandingPage() {
  return (
    <main className="relative min-h-[calc(100vh-73px)] w-full overflow-hidden bg-brand-cream flex flex-col items-center justify-center">
      {/* Background marquee */}
      <div className="absolute inset-0 z-0 flex flex-col justify-center gap-12 opacity-30 pointer-events-none overflow-hidden">
        <div className="flex w-max animate-marquee gap-8">
          <ClothingCardSet />
          <ClothingCardSet />
        </div>
        <div className="flex w-max animate-marquee-reverse gap-8 -ml-48">
          <ClothingCardSet />
          <ClothingCardSet />
        </div>
      </div>

      {/* Foreground hero */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-3xl">
        <h1 className="font-serif text-5xl text-brand-forest md:text-7xl">
          Generate realistic images of your outfit, imagine how other clothes will look on you.
        </h1>
        <p className="mx-auto mt-6 max-w-md text-black">
          F.AVA_AI will help you visualize your own apparel and
          accessories for premium try-on experiences with an extensive wardrobe and avatar feature.
        </p>

        <Link
          href="/dashboard"
          className="mt-8 inline-block rounded-full bg-brand-mint px-8 py-4 font-semibold text-white transition-all hover:bg-brand-forest opacity-100"
        >
          Get started for free -&gt;
        </Link>
        <p className="mt-3 text-sm text-slate-500">No credit card required.</p>
      </div>
    </main>
  );
}
