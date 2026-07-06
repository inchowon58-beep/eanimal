const headers = {
  "Content-Type": "application/json",
  Accept: "application/json",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
  Referer: "https://pcmap.place.naver.com/",
  Origin: "https://pcmap.place.naver.com",
};

const body = {
  operationName: "getPlaceDetail",
  variables: { input: { id: "36259604" } },
  query: `query getPlaceDetail($input: PlaceDetailInput) {
    placeDetail(input: $input) {
      id
      name
      imageUrl
      imageUrls
      images { url }
    }
  }`,
};

const res = await fetch("https://pcmap-api.place.naver.com/place/graphql", {
  method: "POST",
  headers,
  body: JSON.stringify(body),
});
console.log(JSON.stringify(await res.json(), null, 2).slice(0, 2000));
