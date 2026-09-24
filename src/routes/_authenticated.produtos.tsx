import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMyRole } from "@/lib/auth";
import { brl } from "@/lib/format";
import { Badge, Button, Card, CardContent, Input, Label, Select, Spinner } from "@/components/ui";
import { Modal } from "@/components/Modal";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { toast } from "sonner";
import { Barcode, Minus, Pencil, Plus, ScanLine } from "lucide-react";
import type { Product } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/produtos")({
  head: () => ({
    meta: [
      { title: "Produtos e Estoque — BeD Produtos Naturais" },
      { name: "description", content: "Cadastro de produtos, estoque central e leitura de código de barras." },
      { property: "og:title", content: "Produtos e Estoque — BeD Produtos Naturais" },
      { property: "og:description", content: "Cadastro de produtos, estoque central e leitura de código de barras." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProdutosPage,
});

const emptyForm = {
  id: "",
  barcode: "",
  name: "",
  category: "",
  unit_cost: "",
  sale_price: "",
  central_stock: "0",
  low_stock_threshold: "10",
};

function ProdutosPage() {
  const { data: role, isLoading: roleLoading } = useMyRole();
  const queryClient = useQueryClient();
  const [scanning, setScanning] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formOpen, setFormOpen] = useState(false);

  const { data: products, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase.from("products").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const adjust = useMutation({
    mutationFn: async ({ id, delta }: { id: string; delta: number }) => {
      const { error } = await supabase.rpc("adjust_central_stock", {
        p_product_id: id,
        p_delta: delta,
        p_note: delta > 0 ? "Entrada manual" : "Saída manual",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["movements"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        barcode: form.barcode.trim() || null,
        name: form.name.trim(),
        category: form.category.trim() || null,
        unit_cost: Number(form.unit_cost || "0"),
        sale_price: Number(form.sale_price || "0"),
        central_stock: parseInt(form.central_stock || "0", 10),
        low_stock_threshold: parseInt(form.low_stock_threshold || "10", 10),
      };
      if (!payload.name) throw new Error("Informe o nome do produto.");
      if (form.id) {
        const { error } = await supabase.from("products").update(payload).eq("id", form.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("products").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(form.id ? "Produto atualizado!" : "Produto cadastrado!");
      setFormOpen(false);
      setForm(emptyForm);
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function handleScanned(code: string) {
    setScanning(false);
    const clean = code.trim();
    const { data } = await supabase.from("products").select("*").eq("barcode", clean).maybeSingle();
    if (data) {
      toast.success("Produto encontrado: " + data.name);
      openEdit(data as Product);
    } else {
      toast.info("Produto não cadastrado. Preencha os dados para cadastrar.");
      setForm({ ...emptyForm, barcode: clean });
      setFormOpen(true);
    }
  }

  function openEdit(p: Product) {
    setForm({
      id: p.id,
      barcode: p.barcode ?? "",
      name: p.name,
      category: p.category ?? "",
      unit_cost: String(p.unit_cost),
      sale_price: String(p.sale_price),
      central_stock: String(p.central_stock),
      low_stock_threshold: String(p.low_stock_threshold),
    });
    setFormOpen(true);
  }

  if (roleLoading || !role) return <Spinner />;
  if (role !== "owner") {
    return <p className="p-8 text-center text-sm text-muted-foreground">Somente o dono acessa esta página.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Produtos e estoque</h1>
          <p className="text-sm text-muted-foreground">Cadastre produtos e controle o estoque central</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setScanning(true)}>
            <ScanLine className="h-4 w-4" /> Escanear produto
          </Button>
          <Button
            onClick={() => {
              setForm(emptyForm);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Novo produto
          </Button>
        </div>
      </div>

      {isLoading && <Spinner />}

      <div className="space-y-3">
        {products?.map((p) => {
          const low = p.central_stock <= p.low_stock_threshold;
          return (
            <Card key={p.id}>
              <CardContent className="flex flex-wrap items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{p.name}</p>
                    {low && (
                      <Badge className="bg-warning text-warning-foreground">
                        <AlertIcon /> estoque baixo
                      </Badge>
                    )}
                  </div>
                  <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    {p.barcode && (
                      <span className="inline-flex items-center gap-1">
                        <Barcode className="h-3 w-3" /> {p.barcode}
                      </span>
                    )}
                    {p.category && <span>· {p.category}</span>}
                    <span>· custo {brl(p.unit_cost)}</span>
                    <span className="font-medium text-foreground">· venda {brl(p.sale_price)}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Estoque:</span>
                  <Button variant="outline" size="icon" onClick={() => adjust.mutate({ id: p.id, delta: -1 })} aria-label={`Retirar 1 de ${p.name}`}>
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="font-display w-10 text-center text-lg font-semibold">{p.central_stock}</span>
                  <Button variant="outline" size="icon" onClick={() => adjust.mutate({ id: p.id, delta: 1 })} aria-label={`Adicionar 1 a ${p.name}`}>
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(p)} aria-label={`Editar ${p.name}`}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {scanning && <BarcodeScanner onDetected={handleScanned} onClose={() => setScanning(false)} />}

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={form.id ? "Editar produto" : "Cadastrar produto"}>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate();
          }}
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="p-name">Nome</Label>
              <Input id="p-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Whey Natural 500g" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="p-barcode">Código de barras</Label>
              <Input id="p-barcode" value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} placeholder="7891234567890" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-cat">Categoria</Label>
              <Input id="p-cat" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Suplementos" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-low">Aviso de estoque baixo</Label>
              <Input id="p-low" type="number" min="0" value={form.low_stock_threshold} onChange={(e) => setForm({ ...form, low_stock_threshold: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-cost">Preço de custo</Label>
              <Input id="p-cost" type="number" step="0.01" min="0" value={form.unit_cost} onChange={(e) => setForm({ ...form, unit_cost: e.target.value })} placeholder="55,00" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-price">Preço de venda</Label>
              <Input id="p-price" type="number" step="0.01" min="0" value={form.sale_price} onChange={(e) => setForm({ ...form, sale_price: e.target.value })} placeholder="89,90" />
            </div>
            {!form.id && (
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="p-stock">Quantidade inicial</Label>
                <Input id="p-stock" type="number" min="0" value={form.central_stock} onChange={(e) => setForm({ ...form, central_stock: e.target.value })} />
              </div>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={save.isPending}>
            {save.isPending ? "Salvando…" : "Salvar"}
          </Button>
        </form>
      </Modal>
    </div>
  );
}

function AlertIcon() {
  return <span aria-hidden className="mr-1">⚠</span>;
}
