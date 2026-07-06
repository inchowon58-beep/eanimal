const q = "일산에이스애견미용학원";

// Naver place GraphQL search
const body = [
  {
    operationName: "getPlacesList",
    variables: {
      input: {
        query: q,
        start: 1,
        display: 5,
        adult: false,
        spq: false,
        queryRank: "",
      },
      isNmap: true,
      isBounds: true,
      reverseGeocodingInput: {},
    },
    query: `query getPlacesList($input: PlacesInput, $isNmap: Boolean!, $isBounds: Boolean!, $reverseGeocodingInput: ReverseGeocodingInput) {
      places: places(input: $input) {
        items {
          id
          name
          category
          roadAddress
          address
          imageUrl
          thumbnailUrl
          imageCount
        }
      }
    }`,
  },
];

const endpoints = [
  "https://pcmap-api.place.naver.com/place/graphql",
  "https://api.place.naver.com/place/graphql",
  "https://map.naver.com/p/api/place/summary/",
];

for (const url of endpoints) {
  console.log("\n---", url);
  try {
    const res = await fetch(url, {
      method: url.includes("graphql") ? "POST" : "GET",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0",
        Accept: "application/json",
        Referer: "https://map.naver.com/",
      },
      body: url.includes("graphql") ? JSON.stringify(body[0]) : undefined,
    });
    console.log("status", res.status);
    const text = await res.text();
    console.log(text.slice(0, 800));
  } catch (e) {
    console.log("err", e.message);
  }
}
