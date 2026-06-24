import { supabase } from "@/src/lib/supabase";
import { redirect } from "next/navigation";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function Page({ params }: Props) {
  const { id } = await params;

  const { data: bl } = await supabase
    .from("bon_livraisons")
    .select("delivery_note_ref")
    .eq("id", id)
    .single();

  if (!bl) {
    return <div>BL introuvable</div>;
  }

  redirect(
    `https://client.ozoneexpress.ma/pdf-delivery-note-tickets?dn-ref=${bl.delivery_note_ref}`
  );
}