import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { brl, formatDateTime, paymentLabel } from "@/lib/format";
import { Badge, Card, CardContent, CardHeader, CardTitle, Spinner } from "@/components/ui";
import { ArrowLeft, Camera, PenLine, MapPin } from "lucide-react";

export const Route = createFileRoute("/_authenticated/vendas/$id")({
  head: () => ({
    meta: [
      { title: "Comprovante — B&D Produtos Naturais" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SaleDetail,
});

interface SaleDetailData {
  id: string;
  customer_name: string | null;
  payment_method: string;
  total: string;
  day_number: number | null;
  photo_url: string | null;
  signature_url: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  seller: { full_name: string } | null;
  items: { id: string; quantity: number; unit_price: string; product: { name: string } | null }[];
}

function SaleDetail() {
  const { id } = Route.useParams();

  const { data: sale, isLoading } = useQuery({
    queryKey: ["sale", id],
    queryFn: async (): Promise<SaleDetailData> => {
      const { data, error } = await supabase
        .from("sales")
        .select(
          `*, seller:profiles!sales_seller_id_fkey(full_name),
           items:sale_items(*, product:products(name))`,
        )
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("Venda não encontrada.");
      return data as unknown as SaleDetailData;
    },
  });

  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [sigUrl, setSigUrl] = useState<string | null>(null);

  useEffect(() => {
    async function resolve() {
      if (!sale) return;
      if (sale.photo_url) {
        if (sale.photo_url.startsWith("http")) setPhotoUrl(sale.photo_url);
        else {
          const { data } = await supabase.storage.from("receipts").createSignedUrl(sale.photo_url, 3600);
          if (data) setPhotoUrl(data.signedUrl);
        }
      }
      if (sale.signature_url) {
        if (sale.signature_url.startsWith("http")) setSigUrl(sale.signature_url);
        else {
          const { data } = await supabase.storage.from("receipts").createSignedUrl(sale.signature_url, 3600);
          if (data) setSigUrl(data.signedUrl);
        }
      }
    }
    void resolve();
  }, [sale]);

  if (isLoading || !sale) return <Spinner />;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link to="/vendas" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Voltar às vendas
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Comprovante da venda</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground">Cliente</p>
              <p className="font-medium">{sale.customer_name || "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Vendedor</p>
              <p className="font-medium">{sale.seller?.full_name ?? "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Forma de pagamento</p>
              <p className="font-medium">{paymentLabel(sale.payment_method)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Data</p>
              <p className="font-medium">{formatDateTime(sale.created_at)}</p>
            </div>
            {sale.day_number && (
              <div>
                <p className="text-muted-foreground">Campanha</p>
                <p className="font-medium">Dia {sale.day_number}</p>
              </div>
            )}
            {sale.latitude != null && (
              <div className="col-span-2 flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" /> Localização registrada: {sale.latitude.toFixed(5)}, {sale.longitude?.toFixed(5)}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border">
            <div className="border-b border-border px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Produtos</div>
            <div className="divide-y divide-border">
              {sale.items.map((it) => (
                <div key={it.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                  <span>
                    {it.quantity}× {it.product?.name ?? "Produto"}
                  </span>
                  <span className="font-medium">{brl(Number(it.unit_price) * it.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between bg-secondary/50 px-4 py-3">
              <span className="font-medium">Total</span>
              <span className="font-display text-xl font-bold">{brl(sale.total)}</span>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-1.5 flex items-center gap-1.5 text-sm font-medium">
                <Camera className="h-4 w-4" /> Foto da ficha
              </p>
              {photoUrl ? (
                <img src={photoUrl} alt="Foto da ficha da venda" className="w-full rounded-xl border border-border object-cover" />
              ) : (
                <div className="flex h-40 items-center justify-center rounded-xl bg-muted text-xs text-muted-foreground">Sem foto</div>
              )}
            </div>
            <div>
              <p className="mb-1.5 flex items-center gap-1.5 text-sm font-medium">
                <PenLine className="h-4 w-4" /> Assinatura do cliente
              </p>
              {sigUrl ? (
                <img src={sigUrl} alt="Assinatura do cliente" className="w-full rounded-xl border border-border bg-white object-contain" />
              ) : (
                <div className="flex h-40 items-center justify-center rounded-xl bg-muted text-xs text-muted-foreground">Sem assinatura</div>
              )}
            </div>
          </div>

          {(sale.photo_url || sale.signature_url) && (
            <p className="text-xs text-muted-foreground">
              Registros salvos com segurança: <Badge className="bg-secondary text-secondary-foreground">comprovante</Badge>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
