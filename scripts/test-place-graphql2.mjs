const q = "일산에이스애견미용학원";

const headers = {
  "Content-Type": "application/json",
  Accept: "application/json",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Referer: "https://pcmap.place.naver.com/",
  Origin: "https://pcmap.place.naver.com",
};

const input = {
  query: q,
  start: 1,
  display: 5,
  adult: false,
  spq: false,
  queryRank: "",
};

const queries = [
  {
    name: "places",
    body: {
      operationName: "getPlacesList",
      variables: { input, isNmap: true, isBounds: true, reverseGeocodingInput: {} },
      query: `query getPlacesList($input: PlacesInput, $isNmap: Boolean!, $isBounds: Boolean!, $reverseGeocodingInput: ReverseGeocodingInput) {
        places(input: $input) {
          total
          items { id name imageUrl thumbnailUrl roadAddress address category }
        }
      }`,
    },
  },
  {
    name: "searchByQuery",
    body: {
      operationName: "searchByQuery",
      variables: { query: q, start: 1, display: 5 },
      query: `query searchByQuery($query: String!, $start: Int, $display: Int) {
        searchPlaces(input: {query: $query, start: $start, display: $display}) {
          items { id name imageUrl roadAddress }
        }
      }`,
    },
  },
];

for (const { name, body } of queries) {
  const res = await fetch("https://pcmap-api.place.naver.com/place/graphql", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const text = await res.text();
  console.log("\n===", name, res.status);
  if (text.startsWith("{")) {
    const data = JSON.parse(text);
    console.log(JSON.stringify(data, null, 2).slice(0, 1200));
  } else {
    console.log(text.slice(0, 200));
  }
}
