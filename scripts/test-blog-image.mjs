const urls = [
  "https://m.blog.naver.com/acegroomer",
  "https://blog.naver.com/acegroomer",
];

for (const url of urls) {
  const r = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)" },
    redirect: "follow",
  });
  const h = await r.text();
  const og = h.match(/property="og:image"[^>]+content="([^"]+)"/i) ||
    h.match(/content="([^"]+)"[^>]+property="og:image"/i);
  const pstatic = [...h.matchAll(/https:\/\/[^"'\s]*pstatic\.net[^"'\s]+/g)].slice(0, 3);
  console.log(url, "og", og?.[1]?.slice(0, 100));
  console.log("pstatic", pstatic.map((m) => m[0].slice(0, 100)));
}
