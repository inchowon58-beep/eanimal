const q = "일산에이스애견미용학원";

async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html",
      "Accept-Language": "ko-KR,ko;q=0.9",
    },
  });
  return res.text();
}

const html = await fetchHtml(
  `https://pcmap.place.naver.com/place/list?query=${encodeURIComponent(q)}`
);

const nextData = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
if (nextData) {
  const data = JSON.parse(nextData[1]);
  const str = JSON.stringify(data);
  const ids = [...str.matchAll(/"id":"(\d{5,})"/g)].slice(0, 5);
  const imgs = [...str.matchAll(/https:\\\/\\\/ldb-phinf\.pstatic\.net[^"\\]+/g)].slice(0, 3);
  console.log("ids", ids.map((m) => m[1]));
  console.log("imgs", imgs.map((m) => m[0].replace(/\\\/\//g, "//")));
} else {
  console.log("no __NEXT_DATA__", html.slice(0, 300));
}

// try place home if we find id in html any way
const anyId = html.match(/"(\d{8,})"/);
console.log("anyId", anyId?.[1]);
