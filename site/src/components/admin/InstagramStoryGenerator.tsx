"use client";

import { useRef, useState } from "react";
import { Download, Loader2, ImageIcon } from "lucide-react";

const TZ = "America/Argentina/Buenos_Aires";

const fmtDateCaption = (dateStr: string) => {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
};

const fmtSlotTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: TZ,
  });

type StorySlot = { start: string; lastSlot: boolean };

export function InstagramStoryGenerator() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    return d.toLocaleDateString("sv-SE", { timeZone: TZ });
  });
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    setLoading(true);
    setError(null);
    setGenerated(false);

    try {
      const res = await fetch(`/api/admin/story-slots?date=${selectedDate}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? "Error al cargar slots");
      if (data.closedDay) {
        setError("Este día está cerrado — no hay turnos disponibles.");
        return;
      }

      const slots: StorySlot[] = data.slots ?? [];
      await drawStory(slots, selectedDate, data.closeTime ?? "18:00");
      setGenerated(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  };

  const drawStory = (slots: StorySlot[], dateStr: string, closeTime: string) => {
    return new Promise<void>((resolve, reject) => {
      const canvas = canvasRef.current;
      if (!canvas) return reject(new Error("Canvas no disponible"));

      const img = new Image();
      img.src = "/images/plantilla turnos.png";

      img.onload = () => {
        const W = img.naturalWidth;
        const H = img.naturalHeight;
        canvas.width = W;
        canvas.height = H;

        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas context no disponible"));

        // Dibujamos el fondo (plantilla)
        ctx.drawImage(img, 0, 0, W, H);

        // ── Coordenadas calibradas a la plantilla original (rosa con logo DB)
        // Área blanca: x 4.5%→95.5%  y: 21%→64%
        const cardX  = Math.round(W * 0.045);
        const cardY  = Math.round(H * 0.210);
        const cardW  = Math.round(W * 0.910);
        const cardH  = Math.round(H * 0.430);
        const cardCX = cardX + cardW / 2;

        // ── Fecha centrada
        const dateText = fmtDateCaption(dateStr);
        const dateFontSize = Math.round(W * 0.040);
        ctx.font = `bold ${dateFontSize}px 'Cormorant Garamond', 'Georgia', serif`;
        ctx.fillStyle = "#C97B9B";
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText(
          dateText.charAt(0).toUpperCase() + dateText.slice(1),
          cardCX,
          cardY + Math.round(H * 0.016)
        );

        // ── Separador
        const sepY = cardY + Math.round(H * 0.055);
        ctx.strokeStyle = "#E8C4D4";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cardX + Math.round(cardW * 0.08), sepY);
        ctx.lineTo(cardX + Math.round(cardW * 0.92), sepY);
        ctx.stroke();

        if (slots.length === 0) {
          const noSlotSize = Math.round(W * 0.036);
          ctx.font = `${noSlotSize}px 'Cormorant Garamond', 'Georgia', serif`;
          ctx.fillStyle = "#aaa";
          ctx.fillText("Sin disponibilidad", cardCX, sepY + Math.round(H * 0.05));
        } else {
          // ── Fuente y espaciado compactos
          const timeSize = Math.round(W * 0.040);
          const lineH    = Math.round(H * 0.029);
          const startY   = sepY + Math.round(H * 0.013);

          // Filas que entran en el área útil del card
          const availH     = cardH - Math.round(H * 0.070) - Math.round(H * 0.016);
          const maxPerCol  = Math.floor(availH / lineH);
          const useTwoCols = slots.length > maxPerCol;
          const maxVisible = useTwoCols ? maxPerCol * 2 : maxPerCol;
          const visible    = slots.slice(0, maxVisible);

          ctx.font = `bold ${timeSize}px 'Cormorant Garamond', 'Georgia', serif`;
          ctx.fillStyle = "#3D2233";
          ctx.textAlign = "center";
          ctx.textBaseline = "top";

          if (!useTwoCols) {
            // ── Columna única centrada
            visible.forEach((slot, i) => {
              ctx.fillText(fmtSlotTime(slot.start), cardCX, startY + i * lineH);
            });
          } else {
            // ── Dos columnas: izquierda y derecha
            const col1X = cardX + Math.round(cardW * 0.27);
            const col2X = cardX + Math.round(cardW * 0.73);
            visible.forEach((slot, i) => {
              const isCol2 = i >= maxPerCol;
              const x = isCol2 ? col2X : col1X;
              const row = isCol2 ? i - maxPerCol : i;
              ctx.fillText(fmtSlotTime(slot.start), x, startY + row * lineH);
            });
          }

          // "+N más" si aún sobran
          const remaining = slots.length - visible.length;
          if (remaining > 0) {
            const moreSize = Math.round(W * 0.022);
            ctx.font = `italic ${moreSize}px Arial, sans-serif`;
            ctx.fillStyle = "#C97B9B";
            ctx.textAlign = "center";
            ctx.fillText(`+ ${remaining} horarios más`, cardCX, cardY + cardH - Math.round(H * 0.014));
          }
        }

        resolve();
      };

      img.onerror = () => reject(new Error("No se pudo cargar la plantilla"));
    });
  };

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `turnos-${selectedDate}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h2 className="font-display text-2xl mb-1">Story de Instagram</h2>
        <p className="text-sm text-white/50">
          Generá una imagen con los turnos disponibles del día para subir a Instagram.
        </p>
      </div>

      <div className="bg-[#141414] border border-white/10 rounded-xl p-5 space-y-4">
        <div>
          <label className="label !text-white/60">Elegí el día</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              setGenerated(false);
              setError(null);
            }}
            className="input !bg-[#0A0A0A] !border-white/15 !text-white"
          />
        </div>

        <button
          onClick={generate}
          disabled={loading || !selectedDate}
          className="btn-primary !bg-[var(--color-rose)] !text-black w-full flex items-center justify-center gap-2"
        >
          {loading ? (
            <><Loader2 size={16} className="animate-spin" /> Generando...</>
          ) : (
            <><ImageIcon size={16} /> Generar imagen</>
          )}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Canvas oculto donde se dibuja la imagen */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Preview */}
      {generated && canvasRef.current && (
        <div className="space-y-3">
          <p className="text-sm text-white/50">Preview</p>
          <div className="rounded-xl overflow-hidden border border-white/10">
            <img
              src={canvasRef.current.toDataURL("image/png")}
              alt="Story generada"
              className="w-full"
            />
          </div>
          <button
            onClick={download}
            className="btn-secondary !border-white/30 !text-white w-full flex items-center justify-center gap-2"
          >
            <Download size={16} /> Descargar PNG
          </button>
        </div>
      )}
    </div>
  );
}
