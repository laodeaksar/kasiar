import { EmptyState, ErrorState, Skeleton } from "../feedback";

export function DataTableStates({
  loading,
  error,
  isEmpty = false,
  isSearchEmpty,
  query,
  onRetry,
  onClearSearch,
}: {
  loading?: boolean;
  error?: boolean;
  isEmpty?: boolean;
  isSearchEmpty?: boolean;
  query?: string;
  onRetry?: () => void;
  onClearSearch?: () => void;
}) {
  if (loading) return <Skeleton variant="table-rows" />;
  if (error) return <ErrorState onRetry={onRetry ?? (() => undefined)} />;
  if (!isEmpty) return null;
  
  return (
    <EmptyState
      title={isSearchEmpty ? `Tidak ada hasil untuk “${query ?? ""}”.` : "Belum ada data."}
      action={
        isSearchEmpty && onClearSearch ? (
          <button
            className="btn btn-outline"
            onClick={onClearSearch}
          >
            Hapus pencarian
          </button>
        ) : undefined
      }
      searching={isSearchEmpty}
    />
  );
}
