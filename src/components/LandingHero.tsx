interface LandingHeroProps {
  onCreate: () => void;
  onJoin: () => void;
}

export const LandingHero = ({ onCreate, onJoin }: LandingHeroProps) => {
  return (
    <section className="mx-auto mt-6 max-w-6xl px-4 pb-8 md:mt-14">
      <div className="overflow-hidden rounded-[2rem] bg-hero p-8 text-white shadow-soft md:p-16">
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.22em] text-white/85">Primory</p>
        <h1 className="max-w-xl text-4xl font-extrabold leading-tight md:text-6xl">Relive your event forever.</h1>
        <p className="mt-4 max-w-2xl text-lg text-white/90 md:text-xl">One link. Every memory. Every moment.</p>
        <p className="mt-4 max-w-2xl text-sm text-white/85 md:text-base">
          Create a private event space where loved ones can leave heartfelt notes, share photos/videos, join the live
          stream, and send gifts in a few taps.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            className="rounded-full bg-white px-6 py-3 text-base font-semibold text-brand-violet transition hover:-translate-y-0.5"
            onClick={onCreate}
          >
            Create Event
          </button>
          <button
            className="rounded-full border border-white/70 px-6 py-3 text-base font-semibold text-white transition hover:bg-white/10"
            onClick={onJoin}
          >
            Join with Code
          </button>
        </div>
      </div>
    </section>
  );
};
