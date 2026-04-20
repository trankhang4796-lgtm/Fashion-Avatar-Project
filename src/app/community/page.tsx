export const metadata = {
  title: "F.AVA AI | Community",
};

export default function CommunityPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Community Feed</h1>
        <p className="mt-2 max-w-2xl text-base text-slate-600">
          Get inspired by outfits created by other F.AVA AI users.
        </p>
      </div>

      {/* Placeholder for future community posts */}
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
        <h3 className="text-lg font-semibold text-slate-800">Coming Soon!</h3>
        <p className="mt-2 text-sm text-slate-600">
          We are currently building the infrastructure to let you publish your
          saved outfits here.
        </p>
      </div>
    </main>
  );
}

