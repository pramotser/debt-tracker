import { FixCostApp } from "@/features/fix-cost/fix-cost-app";
import { listTemplates } from "@/server/queries/fixed-cost-templates";

export default async function FixCostPage() {
  const templates = await listTemplates();
  return <FixCostApp initialTemplates={templates} />;
}
