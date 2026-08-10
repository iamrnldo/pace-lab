import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import api from "../services/api";
import clsx from "clsx";
import { getTrainingType } from "../utils/trainingTypes";
import Modal from "../components/ui/Modal";
import ExportModal from "../components/training/ExportModal";

export default function MyTrainingProgramsPage() {
  const navigate = useNavigate();
  const [programs, setPrograms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [activeWeek, setActiveWeek] = useState(1);
  const [isExportOpen, setIsExportOpen] = useState(false);

  const handleStatusChange = async () => {
    if (!selectedProgram) return;
    const nextStatus = selectedProgram.status === "done" ? "progress" : "done";
    try {
      const response = await api.patch(`/training-program/${selectedProgram.id}/status`, { status: nextStatus });
      const updated = response.data.data;
      setSelectedProgram(updated);
      setPrograms((items) => items.map((item) => item.id === updated.id ? updated : item));
      toast.success(`Status diubah menjadi ${nextStatus === "done" ? "Selesai" : "Progres"}.`);
    } catch (error) { toast.error("Gagal mengubah status program."); }
  };

  useEffect(() => { fetchPrograms(); }, []);

  const fetchPrograms = async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/training-program");
      setPrograms(response.data.data);
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Failed to load training programs.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Hapus program ini secara permanen?")) return;
    try {
      await api.delete(`/training-program/${id}`);
      toast.success("Program deleted.");
      setPrograms(programs.filter((p) => p.id !== id));
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete program.");
    }
  };

  const openDetail = (program) => {
    setSelectedProgram(program);
    setActiveWeek(1);
    setIsDetailOpen(true);
  };

  return (
    <section className="max-w-6xl mx-auto px-4 pt-36 pb-24">
      <div className="mb-10 animate-slide-up">
        <span className="font-mono text-retro-green text-xs tracking-[0.3em]">
          // USER DASHBOARD
        </span>
        <h1 className="font-retro text-5xl md:text-7xl text-retro-white mt-1 leading-none">
          MY PROGRAMS<span className="text-retro-green animate-blink">_</span>
        </h1>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin h-10 w-10 border-4 border-retro-green border-t-transparent rounded-full"></div>
        </div>
      ) : programs.length === 0 ? (
        <div className="card-retro p-10 text-center">
          <p className="font-retro text-2xl text-retro-white/40 mb-6">NO PROGRAMS SAVED YET</p>
          <button
            onClick={() => navigate("/calculator")}
            className="btn-retro bg-retro-green px-8 py-3 text-retro-black"
          >
            CREATE YOUR FIRST PROGRAM
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {programs.map((program) => (
            <div key={program.id} className="card-retro p-6 flex flex-col h-full">
              <div className="flex justify-between items-start mb-4">
                <span className={clsx(
                    "font-mono text-[10px] px-2 py-1 uppercase tracking-widest border",
                    program.status === 'done'
                      ? "border-retro-green bg-retro-green text-retro-black"
                      : "border-orange-400 bg-orange-400 text-retro-black"
                )}>
                  {program.status}
                </span>
                <span className="font-mono text-[10px] text-retro-white/30 italic">
                  {new Date(program.created_at).toLocaleDateString()}
                </span>
              </div>
              <h3 className="font-retro text-2xl text-retro-white mb-2 uppercase">{program.name}</h3>
              <p className="font-mono text-xs text-retro-white/50 mb-6">
                {program.race_event} · {program.level.toUpperCase()} · {program.prep_months} MONTHS · {program.prep_days || "-"} DAYS
              </p>
              
              <div className="mt-auto pt-6 flex gap-3 border-t border-retro-gray-light/20">
                <button
                  onClick={() => openDetail(program)}
                  className="btn-retro flex-1 border-retro-white/30 text-retro-white py-2 text-xs tracking-widest hover:border-retro-white"
                >
                  VIEW DETAIL
                </button>
                <button
                  onClick={() => handleDelete(program.id)}
                  className="btn-retro flex-1 border-red-500/50 text-red-500 py-2 text-xs tracking-widest hover:bg-red-500 hover:text-white"
                >
                  DELETE
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title={selectedProgram?.name.toUpperCase()}
      >
        {selectedProgram && (
          <div className="space-y-8 animate-fade-in">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="font-retro text-2xl text-retro-green">
                  {selectedProgram.name.toUpperCase()}
                </h2>
                <p className="font-mono text-xs text-retro-white/60">
                  {selectedProgram.race_event} · {selectedProgram.prep_months} Bulan
                </p>
              </div>
            </div>

            <div className="mb-8 flex gap-0 overflow-x-auto border-b-2 border-retro-gray-light">
              {selectedProgram.program_data.map((week) => (
                <button
                  key={week.week}
                  onClick={() => setActiveWeek(week.week)}
                  className={clsx(
                    "font-retro whitespace-nowrap border-b-2 -mb-0.5 px-5 py-3 text-xs tracking-widest transition-all duration-150",
                    activeWeek === week.week
                      ? "border-retro-green bg-retro-green text-retro-black"
                      : "border-transparent text-retro-white/50 hover:bg-retro-gray-mid hover:text-retro-white"
                  )}
                >
                  MINGGU {week.week}
                </button>
              ))}
            </div>

            <div className="space-y-12">
              {selectedProgram.program_data
                .filter((w) => w.week === activeWeek)
                .map((week) => (
                  <div
                    key={week.week}
                    className="card-retro overflow-hidden animate-fade-in"
                  >
                    <div className="bg-retro-gray-mid/50 px-6 py-4 flex justify-between items-center border-b border-retro-gray-light">
                      <div>
                        <span className="font-retro text-2xl text-retro-white">
                          MINGGU {week.week}
                        </span>
                        <p className="font-mono text-[10px] text-retro-white/50 mt-1 uppercase tracking-widest">
                          Total Mileage: {week.mileage} Km
                        </p>
                      </div>
                      <span className="font-mono text-xs text-retro-green px-3 py-1 border border-retro-green/30 text-right">
                        {week.isRecoveryWeek
                          ? "MINGGU PEMULIHAN (Recovery)"
                          : `FASE ${week.phase}: ${
                              week.phase === 1
                                ? "General Preparation"
                                : week.phase === 2
                                ? "Specific Preparation"
                                : week.phase === 3
                                ? "Pre Competition (Tapering)"
                                : "Competition"
                            }`}
                      </span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left min-w-[800px]">
                        <thead>
                          <tr className="border-b border-retro-gray-light/30">
                            <th className="px-6 py-4 font-mono text-[11px] uppercase tracking-widest text-retro-white/40">
                              Hari
                            </th>
                            <th className="px-6 py-4 font-mono text-[11px] uppercase tracking-widest text-retro-white/40">
                              Aktivitas
                            </th>
                            <th className="px-6 py-4 font-mono text-[11px] uppercase tracking-widest text-retro-white/40">
                              Jarak
                            </th>
                            <th className="px-6 py-4 font-mono text-[11px] uppercase tracking-widest text-retro-white/40">
                              Pace
                            </th>
                            <th className="px-6 py-4 font-mono text-[11px] uppercase tracking-widest text-retro-white/40">
                              Detail Program
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {week.days.map((d, idx) => (
                            <tr
                              key={idx}
                              className={clsx(
                                "border-b border-retro-gray-light/10 last:border-0",
                                d.activity === "Istirahat" ? "opacity-30" : ""
                              )}
                            >
                              <td className="px-6 py-4 font-retro text-retro-white">
                                {d.day}
                              </td>
                              <td className="px-6 py-4">
                                <span
                                  className={clsx(
                                    "font-sport text-sm",
                                    d.activity !== "Easy Run" &&
                                      d.activity !== "Istirahat" &&
                                      d.activity !== "Shakeout Run"
                                      ? "text-retro-green"
                                      : "text-retro-white/80"
                                  )}
                                >
                                  {d.activity} {getTrainingType(d.activity) && <span className="ml-2 border border-retro-green/30 px-1 text-[9px] text-retro-green">{getTrainingType(d.activity)}</span>}
                                </span>
                              </td>
                              <td className="px-6 py-4 font-mono text-sm text-retro-white">
                                {d.distance}
                              </td>
                              <td className="px-6 py-4 font-mono text-sm text-retro-white">
                                {d.pace}
                              </td>
                              <td className="px-6 py-4 font-mono text-[10px] text-retro-white/50 leading-relaxed italic whitespace-pre-line">
                                {d.details}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleStatusChange}
                className="btn-retro flex-1 border border-retro-blue/60 text-retro-blue py-4 font-retro tracking-widest hover:bg-retro-blue hover:text-retro-white"
              > {selectedProgram.status === "done" ? "UBAH KE PROGRES" : "CHANGE STATUS → SELESAI"} </button>
              <button
                onClick={() => setIsExportOpen(true)}
                className="btn-retro flex-1 border border-retro-green/60 text-retro-green py-4 font-retro tracking-widest hover:bg-retro-green hover:text-retro-black"
              > CETAK PROGRAM </button>
            </div>
          </div>
        )}
      </Modal>
      <ExportModal isOpen={isExportOpen} onClose={() => setIsExportOpen(false)} program={selectedProgram} />
    </section>
  );
}