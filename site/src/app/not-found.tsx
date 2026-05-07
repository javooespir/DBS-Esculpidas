import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-[100dvh] flex items-center justify-center px-6">
      <div className="text-center">
        <p className="eyebrow mb-4">404</p>
        <h1 className="font-display text-5xl mb-6">Página no encontrada</h1>
        <Link href="/" className="btn-primary">Volver al inicio</Link>
      </div>
    </main>
  );
}
