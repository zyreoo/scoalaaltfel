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

