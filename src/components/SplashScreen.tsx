import { useState, useEffect } from "react";
import logo from "@/assets/logo.png";

export default function SplashScreen({ children }: { children: React.ReactNode }) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShow(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (!show) return <>{children}</>;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-primary via-orange-600 to-orange-800">
      <div className="animate-pulse">
        <div className="w-24 h-24 rounded-3xl overflow-hidden shadow-2xl ring-4 ring-white/20 mb-6 mx-auto">
          <img src={logo} alt="FundiPlug" className="w-full h-full object-cover" />
        </div>
      </div>
      <h1 className="text-3xl font-bold text-white tracking-tight mb-2">FundiPlug</h1>
      <p className="text-white/70 text-sm">Skilled Workers Marketplace</p>
      <div className="mt-8 flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-2 h-2 rounded-full bg-white/60 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}
