import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { BookingFlow } from "@/components/booking/BookingFlow";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Service } from "@/lib/types";

export const revalidate = 0;

export default async function TurnosPage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string }>;
}) {
  const params = await searchParams;
  const { data } = await supabaseAdmin
    .from("services")
    .select("*")
    .eq("active", true)
    .order("display_order");
  const allServices = (data ?? []) as Service[];
  const services = allServices.filter((s) => !s.is_addon);
  const addons = allServices.filter((s) => s.is_addon);

  return (
    <>
      <Nav />
      <main className="pt-24 md:pt-32 pb-24 md:pb-32 min-h-[100dvh]">
        <div className="container-page px-6 md:px-12">
          <div className="max-w-2xl mb-12">
            <p className="eyebrow mb-4">Reserva online</p>
            <h1 className="font-display text-4xl md:text-6xl leading-tight font-medium">
              Elegí tu turno.
            </h1>
            <p className="mt-4 text-base text-[var(--color-muted)]">
              Tu reserva queda pendiente hasta que envíes la seña por transferencia.
            </p>
          </div>
          <BookingFlow services={services} addons={addons} preselectedSlug={params.service} />
        </div>
      </main>
      <Footer />
    </>
  );
}
