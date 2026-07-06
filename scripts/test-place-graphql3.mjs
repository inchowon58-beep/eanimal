const q = "일산에이스애견미용학원";

const headers = {
  "Content-Type": "application/json",
 Accept: "application/json",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Referer: "https://pcmap.place.naver.com/",
  Origin: "https://pcmap.place.naver.com",
};

const body = {
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
  },
  query: `query getPlacesList($input: PlacesInput) {
    places(input: $input) {
      total
      items {
        id
        name
        imageUrl
        imageCount
        roadAddress
        address
        category
        dbType
      }
    }
  }`,
};

const res = await fetch("https://pcmap-api.place.naver.com/place/graphql", {
  method: "POST",
  headers,
  body: JSON.stringify(body),
});
const data = await res.json();
console.log(JSON.stringify(data, null, 2));
