import Image from "next/image";

export default function Home() {
  return (
    <div className="relative min-h-screen text-white">
      {/* Background image */}
      <Image
        src="/landpage-bg.jpg"
        alt="Airplane background"
        fill
        priority
        className="object-cover -z-20"
      />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/70 -z-10" />

      {/* Logo */}
      <header className="px-6 py-4">
        <div className="flex items-center">
          <div className="relative h-10 w-40 md:h-12 md:w-48 lg:h-14 lg:w-56">
            <Image
              src="/paperplane-logo.svg"
              alt="PaperPlane Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>
      </header>

      {/* Hero section */}
      <main className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
        <h1 className="text-4xl font-bold mb-6">
          Pilot Logbook, Reimagined.
        </h1>
        <p className="text-lg text-gray-300 max-w-lg mb-10">
          Track your flights, verify your hours, and streamline your aviation journey.
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <a
            href="/login"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-md font-semibold text-white transition"
          >
            Log In
          </a>

          <a
            href="/signup"
            className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-md font-semibold text-white transition"
          >
            Sign Up
          </a>
        </div>
      </main>
    </div>
  );
}
