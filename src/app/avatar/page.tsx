export const metadata = {
  title: "F.AVA AI | Avatar",
};

import AvatarUploaderClient from "./uploader-client";

export default function AvatarPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-3xl font-bold text-foreground mb-8">Avatar</h1>
      <AvatarUploaderClient />
    </main>
  );
}
