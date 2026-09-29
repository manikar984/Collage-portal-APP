import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";

export async function GET() {
  const store = getStore();
  return NextResponse.json({
    departments: store.departments,
    placements: store.placements,
    stats: store.stats,
    alumni: store.alumni,
    gallery: store.gallery,
    circulars: store.circulars.filter((row) => !row.targetRole),
  });
}
