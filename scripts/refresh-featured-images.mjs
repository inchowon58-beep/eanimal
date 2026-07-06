import fs from "fs";
import path from "path";

const root = process.cwd();
const dataPath = path.join(root, "data/featured-partners.json");
const partners = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

async function resolve(name) {
  const res = await fetch("https://pcmap-api.place.naver.com/place/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Referer: "https://pcmap.place.naver.com/",
      Origin: "https://pcmap.place.naver.com",
      "User-Agent": "Mozilla/5.0",
    },
    body: JSON.stringify({
      operationName: "getPlacesList",
      variables: {
        input: { query: name, start: 1, display: 3, adult: false, spq: false, queryRank: "" },
      },
      query: `query getPlacesList($input: PlacesInput) {
        places(input: $input) { items { id name imageUrl roadAddress address category } }
      }`,
    }),
  });
  const json = await res.json();
  return json.data?.places?.items?.[0];
}

for (const p of partners) {
  const item = await resolve(p.name);
  if (item?.imageUrl) {
    p.name = item.name;
    p.address = item.roadAddress || item.address;
    p.placeUrl = `https://pcmap.place.naver.com/place/${item.id}/home`;
    p.imageUrl = item.imageUrl;
    p.updatedAt = new Date().toISOString();
    console.log("OK", p.name);
  }
}

fs.writeFileSync(dataPath, JSON.stringify(partners, null, 2));
