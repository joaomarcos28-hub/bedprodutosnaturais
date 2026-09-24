import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMyProfile } from "@/lib/auth";
import { brl } from "@/lib/format";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Spinner } from "@/components/ui";
import { Modal } from "@/components/Modal";
import { QtyPicker } from "@/components/QtyPicker";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { SignaturePad } from "@/components/SignaturePad";
import { toast } from "sonner";
import { Camera, CheckCircle2, ScanLine, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/_authenticated/vender")({
  head: () => ({
    meta: [
      { title: "Vender — BeD Produtos Naturais" },
      { name: "description", content: "Registrar venda porta a porta com comprovante, foto e assinatura." },
      { property: "og:title", content: "Vender — BeD Produtos Naturais" },
      { property: "og:description", content: "Registrar venda porta a porta com comprovante, foto e assinatura." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: VenderPage,
});

interface StockRow {
  product_id: string;
  quantity: number;
  product: { id: string; name: string; sale_price: number } | null;
}

export function VenderPage() {
  const { data: profile, isLoading: profileLoading } = useMyProfile();
  const uid = profile?.id;
  const queryClient = useQueryClient();

  const [tab, setTab] = useState<"estoque" | "venda">("estoque");
  const [items, setItems] = useState<{ productId: string; name: string; price: number; qty: number }[]>([]);
  const [customer, setCustomer] = useState("");
  const [payment, setPayment] = useState<"pix" | "dinheiro" | "cartao">("pix");
  const [shareLocation, setShareLocation] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const { data: stock, isLoading } = useQuery({
    queryKey: ["my-stock", uid],
    enabled: !!uid,
    queryFn: async (): Promise<StockRow[]> => {
      const { data, error } = await supabase
        .from("seller_stock")
        .select("product_id, quantity, product:products!seller_stock_product_id_fkey(id, name, sale_price)")
        .eq("seller_id", uid!)
        .gt("quantity", 0)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data as unknown as StockRow[];
    },
  });

  const finishSale = useMutation({
    mutationFn: async () => {
      if (!uid) throw new Error("Sessão não encontrada.");
      if (items.length === 0) throw new Error("Adicione ao menos um produto.");

      let latitude: number | null = null;
      let longitude: number | null = null;
      if (shareLocation) {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000, enableHighAccuracy: true }),
        );
        latitude = pos.coords.latitude;
        longitude = pos.coords.longitude;
      }

      let photoPath: string | null = null;
      if (photoFile) {
        photoPath = `${crypto.randomUUID()}/foto.jpg`;
        const { error: upErr } = await supabase.storage.from("receipts").upload(photoPath, photoFile, { contentType: photoFile.type || "image/jpeg" });
        if (upErr) throw new Error("Falha ao enviar a foto: " + upErr.message);
      }

      let sigPath: string | null = null;
      if (signature) {
        sigPath = `${crypto.randomUUID()}/assinatura.png`;
        const blob = await (await fetch(signature)).blob();
        const { error: upErr } = await supabase.storage.from("receipts").upload(sigPath, blob, { contentType: "image/png" });
        if (upErr) throw new Error("Falha ao enviar a assinatura: " + upErr.message);
      }

      const payloadItems = items.map((i) => ({ product_id: i.productId, quantity: i.qty }));
      const rpcArgs: {
        p_items: { product_id: string; quantity: number }[];
        p_payment: string;
        p_customer?: string;
        p_latitude?: number;
        p_longitude?: number;
        p_photo?: string;
        p_signature?: string;
      } = { p_items: payloadItems, p_payment: payment };
      if (customer.trim()) rpcArgs.p_customer = customer.trim();
      if (latitude != null) {
        rpcArgs.p_latitude = latitude;
        rpcArgs.p_longitude = longitude;
      }
      if (photoPath) rpcArgs.p_photo = photoPath;
      if (sigPath) rpcArgs.p_signature = sigPath;
      const { data: saleId, error } = await supabase.rpc("register_sale", rpcArgs);
      if (error) throw error;
      return saleId as string;
    },
    onSuccess: () => {
      toast.success("Venda registrada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["my-stock", uid] });
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      setItems([]);
      setCustomer("");
      setStep(1);
      setPhotoFile(null);
      setPhotoPreview(null);
      setSignature(null);
      setTab("estoque");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (profileLoading) return <Spinner />;

  function addItem(productId: string, name: string, price: number, max: number) {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === productId);
      if (existing) {
        return prev.map((i) => (i.productId === productId ? { ...i, qty: Math.min(i.qty + 1, max) } : i));
      }
      return [...prev, { productId, name, price, qty: 1 }];
    });
  }

  function handleScanned(code: string) {
    setScanning(false);
    const row = stock?.find((s) => s.product && (s.product as unknown as { barcode?: string }).barcode === code.trim());
    if (row?.product) {
      addItem(row.product.id, row.product.name, Number(row.product.sale_price), row.quantity);
      toast.success("Produto adicionado: " + row.product.name);
    } else {
      toast.info("Esse código não está no seu estoque. Veja “Meu estoque” ou peça entrega ao supervisor.");
    }
  }

  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  const stockMax = (productId: string) => stock?.find((s) => s.product_id === productId)?.quantity ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Vender</h1>
        <p className="text-sm text-muted-foreground">Seu estoque e registro de vendas</p>
      </div>

      <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1 md:max-w-xs">
        <button className={`rounded-md py-2 text-sm font-medium ${tab === "estoque" ? "bg-card shadow-sm" : "text-muted-foreground"}`} onClick={() => setTab("estoque")}>
          Meu estoque
        </button>
        <button className={`rounded-md py-2 text-sm font-medium ${tab === "venda" ? "bg-card shadow-sm" : "text-muted-foreground"}`} onClick={() => setTab("venda")}>
          Nova venda
        </button>
      </div>

      {tab === "estoque" && (
        <>
          {isLoading && <Spinner />}
          <div className="grid gap-3 md:grid-cols-2">
            {stock?.map((r) => (
              <Card key={r.product_id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium">{r.product?.name ?? "Produto"}</p>
                    <p className="text-xs text-muted-foreground">{brl(r.product?.sale_price)} / un.</p>
                  </div>
                  <Badge className="bg-secondary text-secondary-foreground">{r.quantity} un.</Badge>
                </CardContent>
              </Card>
            ))}
            {stock && stock.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center text-sm text-muted-foreground">
                  Você ainda não recebeu produtos. Peça entrega ao seu supervisor.
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}

      {tab === "venda" && (
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Escolher produtos */}
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>1. Produtos</CardTitle>
              <Button variant="outline" size="sm" onClick={() => setScanning(true)}>
                <ScanLine className="h-4 w-4" /> Escanear
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {stock?.map((r) =>
                r.product ? (
                  <div key={r.product_id} className="flex items-center justify-between gap-2 rounded-lg bg-secondary/50 px-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{r.product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {brl(r.product.sale_price)} · {r.quantity} disponíveis
                      </p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => addItem(r.product!.id, r.product!.name, Number(r.product!.sale_price), r.quantity)}>
                      Adicionar
                    </Button>
                  </div>
                ) : null,
              )}
            </CardContent>
          </Card>

          {/* Carrinho + cliente */}
          <Card>
            <CardHeader>
              <CardTitle>2. Revisão da venda</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.length === 0 && <p className="text-sm text-muted-foreground">Nenhum produto escolhido ainda.</p>}
              {items.map((i) => (
                <div key={i.productId} className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{i.name}</p>
                    <p className="text-xs text-muted-foreground">{brl(i.price)} / un.</p>
                  </div>
                  <QtyPicker
                    small
                    value={i.qty}
                    onChange={(v) => {
                      if (v <= 0) {
                        setItems((prev) => prev.filter((x) => x.productId !== i.productId));
                      } else {
                        setItems((prev) => prev.map((x) => (x.productId === i.productId ? { ...x, qty: Math.min(v, stockMax(i.productId)) } : x)));
                      }
                    }}
                  />
                </div>
              ))}

              <div className="space-y-1.5">
                <Label htmlFor="customer">Cliente (opcional)</Label>
                <Input id="customer" value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="Maria Silva" />
              </div>

              <div className="space-y-1.5">
                <Label>Forma de pagamento</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(["pix", "dinheiro", "cartao"] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPayment(p)}
                      className={`rounded-lg border py-2 text-sm font-medium capitalize transition-colors ${
                        payment === p ? "border-primary bg-secondary text-secondary-foreground" : "border-border text-muted-foreground hover:bg-accent"
                      }`}
                    >
                      {p === "pix" ? "PIX" : p === "dinheiro" ? "Dinheiro" : "Cartão"}
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-start gap-2 rounded-lg bg-secondary/50 p-3 text-sm">
                <input type="checkbox" checked={shareLocation} onChange={(e) => setShareLocation(e.target.checked)} className="mt-0.5" />
                <span>
                  <span className="inline-flex items-center gap-1 font-medium">
                    <ShieldCheck className="h-4 w-4 text-primary" /> Registrar minha localização nesta venda
                  </span>
                  <span className="block text-xs text-muted-foreground">Opcional. Só enviamos a localização se você autorizar.</span>
                </span>
              </label>

              <div className="flex items-center justify-between border-t border-border pt-3">
                <span className="text-sm text-muted-foreground">Total</span>
                <span className="font-display text-2xl font-bold">{brl(total)}</span>
              </div>

              <Button className="w-full" size="lg" onClick={() => setStep(2)} disabled={items.length === 0}>
                Continuar para o comprovante
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Passo 2: comprovante */}
      {tab === "venda" && step === 2 && (
        <Modal open onClose={() => setStep(1)} title="Comprovante da venda">
          <div className="space-y-4">
            <div>
              <p className="mb-1.5 flex items-center gap-1.5 text-sm font-medium">
                <Camera className="h-4 w-4" /> Foto da ficha
              </p>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  setPhotoFile(f);
                  setPhotoPreview(f ? URL.createObjectURL(f) : null);
                }}
              />
              {photoPreview ? (
                <img src={photoPreview} alt="Prévia da ficha" className="max-h-48 w-full rounded-xl border border-border object-cover" />
              ) : (
                <Button variant="outline" className="w-full" onClick={() => photoInputRef.current?.click()}>
                  <Camera className="h-4 w-4" /> Tirar foto
                </Button>
              )}
            </div>

            <div>
              <p className="mb-1.5 text-sm font-medium">Assinatura do cliente</p>
              <SignaturePad onChange={setSignature} />
            </div>

            <div className="flex items-center justify-between border-t border-border pt-3">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="font-display text-xl font-bold">{brl(total)}</span>
            </div>

            <Button className="w-full" size="lg" variant="success" disabled={finishSale.isPending} onClick={() => finishSale.mutate()}>
              <CheckCircle2 className="h-5 w-5" />
              {finishSale.isPending ? "Registrando…" : "Finalizar venda"}
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => setStep(1)}>
              Voltar
            </Button>
          </div>
        </Modal>
      )}

      {scanning && <BarcodeScanner onDetected={handleScanned} onClose={() => setScanning(false)} />}
    </div>
  );
}
