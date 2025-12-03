import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const partnersTableName =
  process.env.SUPABASE_PARTNERS_TABLE?.trim() || "partners";

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn(
    "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or ANON key) must be set for the partners section."
  );
}

function getClient() {
  if (!supabaseUrl || !supabaseServiceKey) return null;
  return createClient(supabaseUrl, supabaseServiceKey);
}

function normalizePartner(partner, fallbackIndex = 0) {
  if (!partner) {
    return {
      id: `partner-${fallbackIndex}`,
      name: "",
    };
  }

  const normalizedName = partner.name?.toString().trim() ?? "";

  return {
    id:
      partner.id ??
      partner.uuid ??
      partner.slug ??
      (normalizedName || `partner-${fallbackIndex}`),
    name: normalizedName,
  };
}

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = getClient();
  if (!supabase) {
    return NextResponse.json(
      { partners: [], error: "Supabase nu este configurat." },
      { status: 200 }
    );
  }

  const { data, error } = await supabase
    .from(partnersTableName)
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Acest partener este deja în listă." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const partners = (data ?? []).map((partner, index) =>
    normalizePartner(partner, index)
  );

  return NextResponse.json({ partners });
}

export async function POST(request) {
  const supabase = getClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase nu este configurat." },
      { status: 500 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const rawName = body?.name;
  const trimmedName = rawName?.toString().trim();

  if (!trimmedName) {
    return NextResponse.json(
      { error: "Introdu un nume de partener." },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from(partnersTableName)
    .insert([{ name: trimmedName }])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const partner = normalizePartner(data ?? { name: trimmedName });

  return NextResponse.json({ partner }, { status: 201 });
}

export async function DELETE(request) {
  const supabase = getClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase nu este configurat." },
      { status: 500 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const targetId = body?.id?.toString().trim();

  if (!targetId) {
    return NextResponse.json(
      { error: "Lipsește identificatorul partenerului." },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from(partnersTableName)
    .delete()
    .eq("id", targetId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

