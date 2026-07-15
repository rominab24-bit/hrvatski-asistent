import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listExpenses from "./tools/list-expenses";
import createExpense from "./tools/create-expense";
import listCategories from "./tools/list-categories";
import expenseSummary from "./tools/expense-summary";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "kucni-budzet-mcp",
  title: "Kućni budžet MCP",
  version: "0.1.0",
  instructions:
    "Alati za aplikaciju Kućni budžet. Koristi list_expenses za pregled troškova, expense_summary za sažetak po kategorijama, list_categories za popis kategorija i create_expense za dodavanje novog troška.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listExpenses, expenseSummary, listCategories, createExpense],
});
