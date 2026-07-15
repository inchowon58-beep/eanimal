/** JSON-LD 구조화 데이터 삽입용 (서버 컴포넌트) */
export default function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      // 구조화 데이터는 신뢰된 서버 값이므로 안전하게 직렬화한다.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
