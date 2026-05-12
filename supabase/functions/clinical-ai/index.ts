// Lovable AI gateway - handover summary & doctor query insight
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { mode, patient, vitals, reminders, observation } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    let system = "";
    let user = "";

    if (mode === "handover") {
      system = `You are a clinical handover assistant for nurses. Produce a concise SBAR-style narrative handover (Situation, Background, Assessment, Recommendation). Use plain professional clinical language. Highlight TRENDS (especially subtle declines) and outstanding tasks. 180-250 words. Do not invent data.`;
      user = `Patient:\n${JSON.stringify(patient, null, 2)}\n\nRecent vitals (newest first):\n${JSON.stringify(vitals, null, 2)}\n\nOutstanding reminders:\n${JSON.stringify(reminders, null, 2)}\n\nWrite the handover narrative now.`;
    } else if (mode === "doctor_query") {
      system = `You are a clinical decision-support assistant for nurses preparing to consult a physician. Given the patient context and the nurse's observation, produce: (1) a concise pre-flight summary (2-3 sentences), (2) 3-5 evidence-based considerations or differentials in plain language, (3) suggested data points to gather BEFORE calling the doctor, and (4) urgency rating (routine/urgent/emergent) with one-line rationale. Use markdown headings.`;
      user = `Patient:\n${JSON.stringify(patient, null, 2)}\n\nRecent vitals:\n${JSON.stringify(vitals, null, 2)}\n\nNurse observation:\n"${observation}"\n\nProduce the briefing.`;
    } else {
      return new Response(JSON.stringify({ error: "invalid mode" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });

    if (!resp.ok) {
      const t = await resp.text();
      console.error("AI gateway error:", resp.status, t);
      if (resp.status === 429) return new Response(JSON.stringify({ error: "Rate limit reached. Please wait a moment and try again." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (resp.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted. Add credits in Lovable workspace settings." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ error: "AI gateway error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await resp.json();
    const content = data.choices?.[0]?.message?.content ?? "";
    return new Response(JSON.stringify({ content }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
