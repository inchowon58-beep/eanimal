import ListPagination from "@/components/ui/ListPagination";

interface Props {
  page: number;
  totalPages: number;
  filter: {
    sido?: string;
    sigungu?: string;
    category?: string;
    q?: string;
  };
}

export default function PlacesPagination({ page, totalPages, filter }: Props) {
  return (
    <ListPagination
      page={page}
      totalPages={totalPages}
      basePath="/places"
      params={{
        sido: filter.sido,
        sigungu: filter.sigungu,
        category: filter.category,
        q: filter.q,
      }}
    />
  );
}
