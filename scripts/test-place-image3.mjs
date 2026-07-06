const placeId = "36259604";
const urls = [
  `https://pcmap.place.naver.com/place/${placeId}/home`,
  `https://m.place.naver.com/place/${placeId}/home`,
  `https://map.naver.com/p/entry/place/${placeId}`,
];

for (const url of urls) {
  console.log("\n---", url);
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html",
    },
  });
  const html = await res.text();
  const og = html.match(/property="og:image"[^>]+content="([^"]+)"/i);
  const ldb = [...html.matchAll(/https:\/\/ldb-phinf\.pstatic\.net[^"'\\<>]+/g)].map((m) => m[0]);
  const next = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  console.log("og", og?.[1]);
  console.log("ldb count", ldb.length);
  if (ldb[0]) console.log("ldb0", ldb[0]);
  if (next) {
    const imgs = [...next[1].matchAll(/ldb-phinf\.pstatic\.net[^"\\]+/g)].slice(0, 3);
    console.log("next imgs", imgs.map((m) => m[0]));
  }
}
