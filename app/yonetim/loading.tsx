export default function Loading() {
  return (
    <div className="flex min-h-screen flex-wrap bg-bg">
      <aside className="flex-[1_1_236px] p-3" />
      <main className="m-2 flex-[999_1_560px] rounded-2xl border border-line bg-surface p-6">
        <div className="flex flex-col gap-4">
          <div className="h-8 w-56 animate-pulse rounded-lg bg-sunken" />
          <div className="h-32 w-full animate-pulse rounded-2xl bg-sunken" />
          <div className="h-80 w-full animate-pulse rounded-2xl bg-sunken" />
        </div>
      </main>
    </div>
  );
}
