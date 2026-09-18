import { createFileRoute, redirect } from "@tanstack/react-router";

// Entrada da área logada vai direto para o painel.
export const Route = createFileRoute("/_authenticated/")({
  beforeLoad: () => {
    throw redirect({ to: "/dashboard" });
  },
});
