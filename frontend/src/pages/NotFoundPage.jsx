// src/pages/NotFoundPage.jsx
import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
      <div className="font-retro text-[clamp(6rem,20vw,16rem)] text-retro-green/10 leading-none select-none">
        404
      </div>
      <h1 className="font-retro text-4xl md:text-6xl text-retro-white -mt-8 mb-4">
        PAGE NOT FOUND
      </h1>
      <p className="font-sport text-retro-white/40 mb-10 tracking-wide">
        The route you're looking for doesn't exist.
      </p>
      <Link to="/">
        <button className="btn-retro bg-retro-green text-retro-black font-retro tracking-widest px-8 py-3 text-lg">
          ← GO HOME
        </button>
      </Link>
    </div>
  );
}
