import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import api from "../services/api";
import clsx from "clsx";
import Modal from "../components/ui/Modal";

export default function MyTrainingProgramsPage() {
  const navigate = useNavigate();
  const [programs, setPrograms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [activeWeek, setActiveWeek] = useState(1);

  useEffect(() => { fetchPrograms(); }, []);

  const fetchPrograms = async () => {
    try {
      const res = await api.get("/training-program");
      setPrograms(res.data.data);
    } catch (e) { toast.error("Failed to load training programs."); } finally { setIsLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Hapus program ini secara permanen?")) return;
    try {
      await api.delete(`/training-program/${id}`);
      setPrograms(programs.filter(p => p.id !== id));
      toast.success("Program deleted.");
    } catch (e) { toast.error("Error deleting."); }
  };

  return (
    <section className="max-w-6xl mx-auto px-4 pt-36 pb-24">
      <h1 className="font-retro text-5xl text-retro-white mb-10">MY PROGRAMS<span className="text-retro-green animate-blink">_</span></h1>
      {isLoading ? <div className="text-center py-20 text-retro-green font-retro text-2xl">LOADING...</div> : programs.length === 0 ? (
        <div className="card-retro p-10 text-center"><p className="mb-6 text-retro-white/40 font-retro text-xl">NO PROGRAMS SAVED YET.</p><button onClick={() => navigate("/calculator")} className="btn-retro bg-retro-green px-8 py-3 text-retro-black font-retro">CREATE NEW PROGRAM</button></div>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          {programs.map(p => (
            <div key={p.id} className="card-retro p-6 flex flex-col h-full">
              <span className="text-[10px] font-mono text-retro-green border border-retro-green/40 px-2 py-1 self-start mb-4 uppercase tracking-widest">{p.status}</span>
              <h3 className="font-retro text-2xl text-retro-white mb-2 uppercase">{p.name}</h3>
              <p className="text-xs text-retro-white/50 mb-6 font-mono">{p.race_event} · {p.level.toUpperCase()} · {p.prep_months} MONTHS</p>
              <div className="mt-auto flex gap-2 pt-6 border-t border-retro-white/10">
                <button onClick={() => { setSelectedProgram(p); setActiveWeek(1); setIsDetailOpen(true); }} className="btn-retro flex-1 text-[10px] border border-retro-white/30 text-retro-white py-2 tracking-widest hover:border-retro-white">VIEW</button>
                <button onClick={() => handleDelete(p.id)} className="btn-retro flex-1 text-[10px] border border-red-500/50 text-red-500 py-2 tracking-widest hover:bg-red-500 hover:text-white">DELETE</button>
              </div>
            </div>
          ))}
        </div>
      )}
      <Modal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} title={selectedProgram?.name.toUpperCase()}>
        {selectedProgram && (
          <div className="space-y-6">
             <div className="flex gap-2 overflow-x-auto border-b border-retro-gray-light/20 pb-2">
                {selectedProgram.program_data.map(w => <button key={w.week} onClick={() => setActiveWeek(w.week)} className={clsx("px-3 py-1 border text-xs font-retro transition-all", activeWeek === w.week ? "bg-retro-green text-retro-black border-retro-green" : "text-retro-white/40 border-transparent")}>W{w.week}</button>)}
             </div>
             {selectedProgram.program_data.filter(w => w.week === activeWeek).map(week => (
                <div key={week.week} className="space-y-4">
                  <div className="flex justify-between items-center"><h4 className="font-retro text-lg text-retro-white">WEEK {week.week}</h4><span className="text-retro-green text-xs font-mono">{week.mileage} Km</span></div>
                  <table className="w-full text-left text-xs">
                    <thead><tr className="border-b border-retro-white/10 text-retro-white/30"><th className="pb-2">Day</th><th className="pb-2">Activity</th><th className="pb-2 text-right">Distance</th></tr></thead>
                    <tbody>{week.days.map((d, i) => <tr key={i} className="border-b border-retro-gray-light/5 last:border-0"><td className="py-3 text-retro-white font-retro">{d.day}</td><td className="py-3 text-retro-green">{d.activity}</td><td className="py-3 text-retro-white text-right font-mono">{d.distance}</td></tr>)}</tbody>
                  </table>
                </div>
             ))}
          </div>
        )}
      </Modal>
    </section>
  );
}