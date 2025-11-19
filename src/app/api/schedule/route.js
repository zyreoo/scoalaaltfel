import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn(
    "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set for schedule editing."
  );
}

function getClient() {
  if (!supabaseUrl || !supabaseServiceKey) return null;
  return createClient(supabaseUrl, supabaseServiceKey);
}

export async function GET() {
  const supabase = getClient();
  if (!supabase) {
    return NextResponse.json(
      { entries: [], error: "Supabase nu este configurat." },
      { status: 200 }
    );
  }

  const { data, error } = await supabase
    .from("schedule_entries")
    .select("*")
    .order("class_name", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ entries: data ?? [] });
}

export async function POST(request) {
  const supabase = getClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase nu este configurat." },
      { status: 500 }
    );
  }

  const body = await request.json();
  const { className, day, time, activity, professor } = body;

  if (!className || !day || !time) {
    return NextResponse.json(
      { error: "Date insuficiente." },
      { status: 400 }
    );
  }

  const payload = {
    class_name: className,
    day,
    time,
    activity: activity ?? "",
    professor: professor ?? "",
  };

  const { data, error } = await supabase
    .from("schedule_entries")
    .upsert(payload, { onConflict: "class_name,day,time" })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ entry: data });
}

export async function DELETE(request) {
  const supabase = getClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase nu este configurat." },
      { status: 500 }
    );
  }

  const body = await request.json();
  const { className, day, time } = body;

  if (!className || !day || !time) {
    return NextResponse.json(
      { error: "Date insuficiente." },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("schedule_entries")
    .delete()
    .eq("class_name", className)
    .eq("day", day)
    .eq("time", time);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

