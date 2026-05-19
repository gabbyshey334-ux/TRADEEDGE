import { requireAuthUser } from "@/lib/auth/server";
import { getTradesForUser } from "@/lib/data/trades";
import { AiCoachClient } from "./AiCoachClient";

export const dynamic = "force-dynamic";

export default async function AiCoachPage() {
  const user = await requireAuthUser();
  const trades = await getTradesForUser(user.id);
  return <AiCoachClient tradeCount={trades.length} />;
}
