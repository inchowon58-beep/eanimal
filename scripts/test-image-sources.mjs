import fs from "fs";
import path from "path";

const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim();
  }
}

const id = process.env.NAVER_CLIENT_ID;
const secret = process.env.NAVER_CLIENT_SECRET;

async function img(q) {
  const u =
    "https://openapi.naver.com/v1/search/image?" +
    new URLSearchParams({ query: q, display: "3" });
  const r = await fetch(u, {
    headers: { "X-Naver-Client-Id": id, "X-Naver-Client-Secret": secret },
  });
  console.log("status", r.status);
  console.log(await r.text());
}

await img("일산에이스애견미용학원");
