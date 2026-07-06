const q = "일산에이스애견미용학원";

async function test(url, ua) {
  console.log("---", url);
  const res = await fetch(url, {
    headers: {
      "User-Agent": ua,
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "ko-KR,ko;q=0.9",
    },
    redirect: "follow",
  });
  console.log("status", res.status, "final", res.url);
  const html = await res.text();
  const placeId = html.match(/place\/(\d{5,})/);
  const ldb = [...html.matchAll(/https:\/\/ldb-phinf\.pstatic\.net[^"'\\<>]+/g)].map((m) => m[0]);
  const og = html.match(/og:image[^>]+content="([^"]+)"/i);
  console.log("placeId", placeId?.[1], "ldb", ldb.length, "og", og?.[1]?.slice(0, 80));
  if (ldb[0]) console.log("ldb0", ldb[0].slice(0, 150));
}

await test(
  `https://m.place.naver.com/place/list?query=${encodeURIComponent(q)}`,
  "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)"
);
await test(
  `https://pcmap.place.naver.com/place/list?query=${encodeURIComponent(q)}`,
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0"
);
