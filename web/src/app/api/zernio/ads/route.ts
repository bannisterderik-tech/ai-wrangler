import { NextResponse } from "next/server";
import { createAd, listAds, setAdStatus } from "@/lib/zernio";

export async function GET() {
  try {
    return NextResponse.json(await listAds());
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}

export async function POST(req: Request) {
  const body = await req.json();
  try {
    return NextResponse.json(
      await createAd({
        platform: String(body.platform || "google"),
        name: String(body.name || "Untitled"),
        budget: Number(body.budget || 50),
        geo: body.geo ? String(body.geo) : undefined,
        accountId: body.accountId,
        adAccountId: body.adAccountId,
      }),
    );
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}

export async function PUT(req: Request) {
  const { id, status } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  try {
    return NextResponse.json(await setAdStatus(String(id), status === "paused" ? "paused" : "active"));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
