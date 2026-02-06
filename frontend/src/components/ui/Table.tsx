import React from 'react'

interface Column<T> {
    header: string
    accessor: keyof T | ((item: T) => React.ReactNode)
    className?: string
}

interface TableProps<T> {
    data: T[]
    columns: Column<T>[]
    className?: string
    onRowClick?: (item: T) => void
}

export function Table<T extends { id?: string | number }>({
    data,
    columns,
    className = '',
    onRowClick,
}: TableProps<T>) {
    return (
        <div className={`overflow-x-auto ${className}`}>
            <table className="w-full">
                <thead>
                    <tr className="border-b border-neutral-200">
                        {columns.map((column, index) => (
                            <th
                                key={index}
                                className="text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider px-6 py-4 bg-neutral-50/80"
                            >
                                {column.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                    {data.length === 0 ? (
                        <tr>
                            <td
                                colSpan={columns.length}
                                className="px-6 py-12 text-center text-neutral-500"
                            >
                                <div className="flex flex-col items-center gap-3">
                                    <svg
                                        className="w-12 h-12 text-neutral-300"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={1.5}
                                            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                                        />
                                    </svg>
                                    <p className="text-sm font-medium">No data available</p>
                                </div>
                            </td>
                        </tr>
                    ) : (
                        data.map((item, rowIndex) => (
                            <tr
                                key={item.id || rowIndex}
                                onClick={() => onRowClick?.(item)}
                                className={`
                  bg-white hover:bg-neutral-50/50 transition-colors duration-150 group
                  ${onRowClick ? 'cursor-pointer' : ''}
                `}
                            >
                                {columns.map((column, colIndex) => (
                                    <td
                                        key={colIndex}
                                        className={`px-6 py-4 text-sm text-neutral-900 font-medium ${column.className || ''}`}
                                    >
                                        {typeof column.accessor === 'function'
                                            ? column.accessor(item)
                                            : String(item[column.accessor])}
                                    </td>
                                ))}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    )
}
