import { supabase } from "@/lib/supabase";

export default async function Home() {
  const { data, error } = await supabase
    .from("classes")
    .select("*");

  if (error) {
    return (
      <main className="p-10">
        <h1 className="text-2xl font-bold">Supabase Connection Error</h1>
        <pre className="mt-4 text-red-500">
          {JSON.stringify(error, null, 2)}
        </pre>
      </main>
    );
  }

  return (
    <main className="p-10">
      <h1 className="text-2xl font-bold">
        Supabase Connected ✅
      </h1>

      <pre className="mt-6">
        {JSON.stringify(data, null, 2)}
      </pre>
    </main>
  );
}