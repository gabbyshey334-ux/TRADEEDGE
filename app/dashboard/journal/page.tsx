import { requireAuthUser } from "@/lib/auth/server";
import { getTradesForUser } from "@/lib/data/trades";
import { JournalClient } from "./JournalClient";

export const dynamic = "force-dynamic";

export default async function JournalPage() {
  const user = await requireAuthUser();
  const trades = await getTradesForUser(user.id);
  return <JournalClient initialTrades={trades} />;
}
