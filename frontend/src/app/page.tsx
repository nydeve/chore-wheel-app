import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 overflow-hidden relative">
      {/* Dynamic Background Blobs */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
      <div className="absolute top-0 right-10 w-[400px] h-[400px] bg-purple-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-[600px] h-[600px] bg-pink-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>

      <main className="flex flex-col items-center justify-center w-full flex-1 px-4 text-center z-10">
        <div className="bg-white/60 backdrop-blur-xl border border-white/40 p-12 rounded-3xl shadow-2xl max-w-3xl w-full flex flex-col items-center transform transition-transform hover:scale-[1.01] duration-500">
          
          <div className="w-24 h-24 bg-gradient-to-tr from-primary to-blue-400 rounded-3xl mb-8 flex items-center justify-center shadow-lg rotate-3 hover:rotate-6 transition-transform">
             <span className="text-5xl text-white drop-shadow-md">🎡</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight text-slate-800">
            Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-500 line-clamp-1 pb-2">Chore Wheel</span>
          </h1>
          
          <p className="mt-2 text-xl md:text-2xl text-slate-600 max-w-2xl font-medium leading-relaxed">
            The fun, rewarding, and gamified way to manage family chores.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center mt-12 w-full gap-4">
            <Link href="/auth/register" className="w-full sm:w-auto px-10 py-4 bg-primary text-white font-bold rounded-2xl hover:bg-primary/90 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 text-lg shadow-lg shadow-primary/30">
              Get Started Free
            </Link>
            <Link href="/auth/login" className="w-full sm:w-auto px-10 py-4 bg-white text-slate-700 font-bold rounded-2xl hover:bg-slate-50 border-2 border-slate-100 hover:border-slate-200 hover:-translate-y-1 hover:shadow-md transition-all duration-300 text-lg">
              Sign In
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
