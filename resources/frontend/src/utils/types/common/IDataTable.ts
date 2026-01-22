export interface Column<T> {
    key: keyof T;
    label: string;
}

export interface TableProps<T> {
    paginatedData: T[];
    columns: { key: keyof T; label: string }[];
    handleSort: (key: keyof T) => void;
    toggleActionMenu: (id: string) => void;
    openActionMenuId: string | null;
    onEdit?: (id: string) => void;
    onDelete?: (id: string) => void;
    onViewDetails?: (id: string) => void;
    enableActions: boolean;
    idKey: keyof T;
}

export interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    onEdit?: (id: string) => void;
    onDelete?: (id: string) => void;
    onViewDetails?: (id: string) => void;
    enableActions: boolean;
}

export interface PaginationProps {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    totalResults: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
}

export interface PageSizeSelectorProps {
    pageSize: number;
    onPageSizeChange: (size: number) => void;
}

export interface ResultsInfoProps {
    currentPage: number;
    pageSize: number;
    totalResults: number;
}
