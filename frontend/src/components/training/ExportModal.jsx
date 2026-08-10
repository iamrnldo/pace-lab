import Modal from "../ui/Modal";
import api from "../../services/api";
import { toast } from "react-hot-toast";

export default function ExportModal({ isOpen, onClose, program }) {
  const download = async (format) => {
    try {
      const isSaved = Boolean(program.id);
      const url = isSaved ? `/training-program/${program.id}/export/${format}` : `/training-program/export/${format}`;
      const response = await api({ url, method: isSaved ? "GET" : "POST", data: isSaved ? undefined : program, responseType: "blob" });
      const blob = new Blob([response.data], { type: response.headers["content-type"] });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `Program_${(program.name || "Training").replace(/[^a-z0-9]/gi, "_")}.${format === "pdf" ? "pdf" : "xlsx"}`;
      link.click();
      URL.revokeObjectURL(link.href);
      toast.success(`Program ${format.toUpperCase()} berhasil dibuat.`);
    } catch (error) { toast.error("Gagal membuat file program."); }
  };
  return <Modal isOpen={isOpen} onClose={onClose} title="CETAK PROGRAM">
    <div className="space-y-4">
      <p className="font-mono text-xs text-retro-white/50">Pilih format file untuk program latihan ini.</p>
      <button onClick={() => download("pdf")} className="btn-retro w-full border border-red-500/60 text-red-400 py-4 font-retro tracking-widest hover:bg-red-500 hover:text-white">▣ CETAK / DOWNLOAD PDF</button>
      <button onClick={() => download("excel")} className="btn-retro w-full border border-retro-green/60 text-retro-green py-4 font-retro tracking-widest hover:bg-retro-green hover:text-retro-black">▤ DOWNLOAD EXCEL</button>
    </div>
  </Modal>;
}
