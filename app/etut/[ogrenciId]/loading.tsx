export default function Loading() {
  return (
    <div className="flex min-h-screen flex-wrap bg-bg">
      <aside className="flex-[1_1_236px] p-3" />
      <main className="m-2 flex-[999_1_560px] rounded-2xl border border-line bg-surface p-7">
        <div className="flex max-w-[800px] flex-col gap-[18px]">
          <div className="h-[60px] w-[60px] animate-pulse rounded-full bg-sunken" />
          <div className="h-8 w-64 animate-pulse rounded-lg bg-sunken" />
          <div className="h-72 w-full animate-pulse rounded-2xl bg-sunken" />
        </div>
      </main>
    </div>
  );
}
