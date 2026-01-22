import { useMemo, useState } from "react";
import Pagination from "./Pagination";
import Table from "./Table";
import SearchBar from "./SearchBar";
import { DataTableProps } from "../../../../utils/types/common/IDataTable";

const compareByKey = <T extends object>(
    a: T,
    b: T,
    key: keyof T,
    direction: string,
): number => {
    if (a[key] < b[key]) {
        return direction === "asc" ? -1 : 1;
    }
    if (a[key] > b[key]) {
        return direction === "asc" ? 1 : -1;
    }
    return 0;
};

const DataTable = <T extends { id: string }>(props: DataTableProps<T>) => {
    const {
        data,
        columns,
        onEdit,
        onDelete,
        onViewDetails,
        enableActions = true,
    } = props;

    const [search, setSearch] = useState("");
    const [sortConfig, setSortConfig] = useState<{
        key: keyof T | null;
        direction: string;
    }>({
        key: columns[0]?.key ?? null,
        direction: "asc",
    });

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(
        null,
    );

    const filteredData = useMemo(() => {
        return data.filter((item) =>
            columns.some((column) =>
                item[column.key]
                    ?.toString()
                    .toLowerCase()
                    .includes(search.toLowerCase()),
            ),
        );
    }, [data, search, columns]);

    const handleSort = (key: keyof T) => {
        let direction = "asc";
        if (sortConfig.key === key && sortConfig.direction === "asc") {
            direction = "desc";
        }
        setSortConfig({ key, direction });
    };

    const sortedData = useMemo(() => {
        if (!sortConfig.key) return filteredData;

        return [...filteredData].sort((a, b) =>
            compareByKey(a, b, sortConfig.key as keyof T, sortConfig.direction),
        );
    }, [filteredData, sortConfig]);

    const totalPages = Math.ceil(sortedData.length / pageSize);

    const paginatedData = sortedData.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize,
    );

    const handlePageChange = (page: number) => {
        setCurrentPage(Math.min(Math.max(1, page), totalPages));
    };

    const handlePageSizeChange = (size: number) => {
        setPageSize(size);
        setCurrentPage(1);
    };

    const toggleActionMenu = (id: string) => {
        setOpenActionMenuId(openActionMenuId === id ? null : id);
    };

    return (
        <div>
            <SearchBar search={search} onSearchChange={setSearch} />
            <Table
                paginatedData={paginatedData}
                columns={columns}
                handleSort={handleSort}
                toggleActionMenu={toggleActionMenu}
                openActionMenuId={openActionMenuId}
                onEdit={onEdit}
                onDelete={onDelete}
                onViewDetails={onViewDetails}
                enableActions={enableActions}
                idKey="id"
            />

            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={pageSize}
                totalResults={sortedData.length}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
            />
        </div>
    );
};

export default DataTable;
