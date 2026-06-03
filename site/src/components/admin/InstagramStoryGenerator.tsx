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

        // ── Plantilla original
        // Watermark "Turnos Disponibles": y ≈ 21%→44%
        // Área blanca limpia: y ≈ 44%→82%
        const cardX  = Math.round(W * 0.055);
        const cardW  = Math.round(W * 0.890);
        const cardCX = cardX + cardW / 2;

        // ── Fecha — centrada justo debajo del watermark (~47%)
        const dateText = fmtDateCaption(dateStr);
        ctx.font = `bold ${Math.round(W * 0.044)}px 'Cormorant Garamond', 'Georgia', serif`;
        ctx.fillStyle = "#C97B9B";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(
          dateText.charAt(0).toUpperCase() + dateText.slice(1),
          cardCX,
          Math.round(H * 0.470)
        );

        // ── Separador elegante
        const sepY = Math.round(H * 0.498);
        ctx.strokeStyle = "#D4A0B5";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cardX + Math.round(cardW * 0.10), sepY);
        ctx.lineTo(cardX + Math.round(cardW * 0.90), sepY);
        ctx.stroke();

        // ── Zona de horarios: 51% → 83% (ocupa todo el área blanca)
        const slotsTopY = Math.round(H * 0.513);
        const slotsEndY = Math.round(H * 0.830);

        if (slots.length === 0) {
          ctx.font = `italic ${Math.round(W * 0.036)}px 'Cormorant Garamond', 'Georgia', serif`;
          ctx.fillStyle = "#C0A0B0";
          ctx.textBaseline = "middle";
          ctx.fillText("Sin disponibilidad", cardCX, (slotsTopY + slotsEndY) / 2);
        } else {
          // ── Decidir columnas
          const MIN_LINE_H   = Math.round(H * 0.032);
          const MAX_LINE_H   = Math.round(H * 0.056);
          const availH       = slotsEndY - slotsTopY;
          const maxSingle    = Math.floor(availH / MIN_LINE_H);
          const useTwoCols   = slots.length > maxSingle;

          // Distribucion balanceada
          const col1Count  = useTwoCols ? Math.ceil(slots.length / 2)  : slots.length;
          const col2Count  = useTwoCols ? Math.floor(slots.length / 2) : 0;
          const numRows    = useTwoCols ? Math.max(col1Count, col2Count) : slots.length;

          // lineH dinámico: reparte el espacio equitativamente, con máximo para no quedar raro
          const lineH  = Math.min(MAX_LINE_H, Math.floor(availH / numRows));
          const timeSize = useTwoCols ? Math.round(W * 0.044) : Math.round(W * 0.052);

          ctx.font = `bold ${timeSize}px 'Cormorant Garamond', 'Georgia', serif`;
          ctx.fillStyle = "#3D2233";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle"; // middle para centrar verticalmente en la fila

          if (!useTwoCols) {
            // ── Columna única centrada con separadores decorativos
            slots.forEach((slot, i) => {
              const rowCY = slotsTopY + i * lineH + lineH / 2;

              // Separador entre filas (excepto la última)
              if (i > 0) {
                ctx.strokeStyle = "rgba(212,160,181,0.35)";
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(cardX + Math.round(cardW * 0.20), slotsTopY + i * lineH);
                ctx.lineTo(cardX + Math.round(cardW * 0.80), slotsTopY + i * lineH);
                ctx.stroke();
              }

              ctx.fillStyle = "#3D2233";
              ctx.fillText(fmtSlotTime(slot.start), cardCX, rowCY);
            });
          } else {
            // ── 2 columnas balanceadas
            const col1Slots = slots.slice(0, col1Count);
            const col2Slots = slots.slice(col1Count);
            const col1X = cardX + Math.round(cardW * 0.26);
            const col2X = cardX + Math.round(cardW * 0.74);

            // Línea vertical divisoria
            ctx.strokeStyle = "rgba(212,160,181,0.50)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(cardCX, slotsTopY + Math.round(lineH * 0.2));
            ctx.lineTo(cardCX, slotsTopY + numRows * lineH - Math.round(lineH * 0.2));
            ctx.stroke();

            // Filas con separadores horizontales
            for (let i = 0; i < numRows; i++) {
              const rowCY = slotsTopY + i * lineH + lineH / 2;

              if (i > 0) {
                ctx.strokeStyle = "rgba(212,160,181,0.25)";
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(cardX + Math.round(cardW * 0.06), slotsTopY + i * lineH);
                ctx.lineTo(cardX + Math.round(cardW * 0.94), slotsTopY + i * lineH);
                ctx.stroke();
              }

              ctx.font = `bold ${timeSize}px 'Cormorant Garamond', 'Georgia', serif`;
              ctx.fillStyle = "#3D2233";
              ctx.textAlign = "center";

              if (i < col1Slots.length)
                ctx.fillText(fmtSlotTime(col1Slots[i].start), col1X, rowCY);
              if (i < col2Slots.length)
                ctx.fillText(fmtSlotTime(col2Slots[i].start), col2X, rowCY);
            }
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
