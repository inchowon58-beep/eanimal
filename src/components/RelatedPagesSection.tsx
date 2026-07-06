import Link from "next/link";
import type { RelatedPageLink } from "@/lib/related-pages";

interface Props {
  pages: RelatedPageLink[];
  brandName: string;
}

export default function RelatedPagesSection({ pages, brandName }: Props) {
  if (pages.length === 0) return null;

  return (
    <section className="mt-10 bg-white rounded-2xl p-6 lg:p-8 shadow-sm">
      <h2 className="text-xl font-bold text-dark mb-2">함께 보면 좋은 학원 안내</h2>
      <p className="text-sm text-gray-500 mb-6">
        {brandName}에서 제공하는 다른 애견미용학원 관련 정보입니다.
      </p>
      <ul className="space-y-4">
        {pages.map((item) => (
          <li key={item.slug}>
            <Link
              href={item.href}
              className="block rounded-xl border border-gray-100 p-5 hover:border-orange/40 hover:bg-orange/5 transition group"
            >
              <span className="inline-block text-xs font-bold text-orange bg-orange/10 px-2.5 py-1 rounded-full mb-2">
                {item.keyword}
              </span>
              <h3 className="font-bold text-dark group-hover:text-orange transition mb-2">
                {item.title}
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">{item.description}</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
