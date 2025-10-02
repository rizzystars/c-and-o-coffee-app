// netlify/functions/list-catalog.ts
export const handler = async () => {
  try {
    const { SQUARE_ACCESS_TOKEN, SQUARE_ENV, SQUARE_LOCATION_ID } = process.env;
    if (!SQUARE_ACCESS_TOKEN) {
      return { statusCode: 500, body: "Missing SQUARE_ACCESS_TOKEN" };
    }
    const base =
      SQUARE_ENV === "production"
        ? "https://connect.squareup.com"
        : "https://connect.squareupsandbox.com";

    const headers: Record<string, string> = {
      "Square-Version": "2023-10-18",
      "Authorization": `Bearer ${SQUARE_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    };

    const types = ["CATEGORY", "ITEM", "ITEM_VARIATION", "MODIFIER_LIST", "IMAGE"].join(",");
    let cursor: string | undefined;
    const objects: any[] = [];

    do {
      const url = new URL(`${base}/v2/catalog/list`);
      url.searchParams.set("types", types);
      if (cursor) url.searchParams.set("cursor", cursor);
      const res = await fetch(url.toString(), { headers });
      const data = await res.json();
      if (!res.ok || data.errors) {
        return { statusCode: 500, body: JSON.stringify(data.errors || data) };
      }
      objects.push(...(data.objects || []));
      cursor = data.cursor;
    } while (cursor);

    const byId = new Map(objects.map((o) => [o.id, o]));
    const items = objects.filter((o) => o.type === "ITEM");
    const imageUrlForId = (imgId?: string | null) => {
      if (!imgId) return null;
      const img = byId.get(imgId);
      return img?.image_data?.url || null;
    };

    const menuItems: any[] = [];

    for (const item of items) {
      const data = item.item_data;
      if (!data) continue;
      const catName = data.category_id ? byId.get(data.category_id)?.category_data?.name : "Uncategorized";
      const itemImage = imageUrlForId(data.image_id);

      const modListIds: string[] = (data.modifier_list_info || []).map((m: any) => m.modifier_list_id);
      const modifierGroups = modListIds
        .map((id: string) => byId.get(id))
        .filter(Boolean)
        .map((ml: any) => ({
          id: ml.id,
          name: ml.modifier_list_data?.name,
          options: (ml.modifier_list_data?.modifiers || []).map((m: any) => ({
            id: m.id,
            name: m.modifier_data?.name,
            price: m.modifier_data?.price_money?.amount ?? 0,
          })),
        }));

      for (const v of (data.variations || [])) {
        const vd = v.item_variation_data;
        if (!vd) continue;

        if (process.env.SQUARE_LOCATION_ID) {
          const present = v.present_at_location_ids || [];
          const absent = v.absent_at_location_ids || [];
          if (present.length && !present.includes(process.env.SQUARE_LOCATION_ID)) continue;
          if (absent.length && absent.includes(process.env.SQUARE_LOCATION_ID)) continue;
        }

        const price = vd.price_money?.amount;
        if (price == null) continue;

        const size = vd.name ? ` ${vd.name}` : "";
        menuItems.push({
          id: v.id,
          name: `${data.name}${size}`,
          category: catName,
          description: data.description || null,
          price,
          imageUrl: itemImage,
          stock: 999,
          isActive: data.is_archived ? false : true,
          modifierGroups,
        });
      }
    }

    menuItems.sort((a, b) => (a.category || "").localeCompare(b.category || "") || a.name.localeCompare(b.name));

    return {
      statusCode: 200,
      headers: { "content-type": "application/json", "cache-control": "public, max-age=60" },
      body: JSON.stringify({ items: menuItems }),
    };
  } catch (e: any) {
    return { statusCode: 500, body: e?.message || "Internal error" };
  }
};
