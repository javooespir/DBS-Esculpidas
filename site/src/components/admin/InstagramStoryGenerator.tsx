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

        // ── Coordenadas calibradas al área blanca real de la plantilla
        // El rectángulo blanco ocupa aprox: x: 5.5%→94.5%  y: 26.5%→71.5%
        const cardX = Math.round(W * 0.055);
        const cardY = Math.round(H * 0.265);
        const cardW = Math.round(W * 0.890);
        const cardH = Math.round(H * 0.450);
        const cardCX = cardX + cardW / 2;

        // Overlay blanco semitransparente para tapar el watermark y mejorar legibilidad
        ctx.fillStyle = "rgba(255,255,255,0.78)";
        ctx.roundRect(cardX, cardY, cardW, cardH, 14);
        ctx.fill();

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
          cardY + Math.round(H * 0.015)
        );

        // ── Separador
        const sepY = cardY + Math.round(H * 0.050);
        ctx.strokeStyle = "#E8C4D4";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cardX + Math.round(cardW * 0.08), sepY);
        ctx.lineTo(cardX + Math.round(cardW * 0.92), sepY);
        ctx.stroke();

        if (slots.length === 0) {
          const noSlotSize = Math.round(W * 0.042);
          ctx.font = `${noSlotSize}px 'Cormorant Garamond', 'Georgia', serif`;
          ctx.fillStyle = "#999";
          ctx.fillText("Sin disponibilidad", cardCX, sepY + Math.round(H * 0.04));
        } else {
          // ── Slots — fuente reducida para que entren más horarios
          const timeSize = Math.round(W * 0.054);
          const noteSize = Math.round(W * 0.023);
          const lineH = Math.round(H * 0.035);
          let curY = sepY + Math.round(H * 0.014);

          // Espacio disponible para slots dentro del card
          const slotAreaH = cardH - Math.round(H * 0.060) - Math.round(H * 0.025);
          const maxSlots = Math.floor(slotAreaH / lineH);
          const visibleSlots = slots.slice(0, maxSlots);

          for (const slot of visibleSlots) {
            if (curY + lineH > cardY + cardH - Math.round(H * 0.022)) break;

            const timeLabel = fmtSlotTime(slot.start);

            if (slot.lastSlot) {
              ctx.font = `bold ${timeSize}px 'Cormorant Garamond', 'Georgia', serif`;
              ctx.fillStyle = "#C2A0B4";
              ctx.textAlign = "center";
              ctx.fillText(timeLabel, cardCX - Math.round(W * 0.055), curY);

              ctx.font = `${noteSize}px Arial, sans-serif`;
              ctx.fillStyle = "#C2A0B4";
              ctx.fillText("(solo 30 min)", cardCX + Math.round(W * 0.13), curY + Math.round(lineH * 0.28));
            } else {
              ctx.font = `bold ${timeSize}px 'Cormorant Garamond', 'Georgia', serif`;
              ctx.fillStyle = "#3D2233";
              ctx.textAlign = "center";
              ctx.fillText(timeLabel, cardCX, curY);
            }

            curY += lineH;
          }

          // "+N horarios más" si no entraron todos
          const remaining = slots.length - visibleSlots.length;
          if (remaining > 0) {
            ctx.font = `italic ${noteSize}px Arial, sans-serif`;
            ctx.fillStyle = "#C97B9B";
            ctx.textAlign = "center";
            ctx.fillText(`+ ${remaining} horarios más`, cardCX, cardY + cardH - Math.round(H * 0.016));
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
          <p className="text-xs text-white/30 text-center">
            Los horarios en rosa claro con "(solo 30 min)" son los últimos disponibles del día.
          </p>
        </div>
      )}
    </div>
  );
}
