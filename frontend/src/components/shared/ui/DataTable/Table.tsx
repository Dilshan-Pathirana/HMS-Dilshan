import { HiOutlineArrowsUpDown } from "react-icons/hi2";
import { BsThreeDotsVertical } from "react-icons/bs";
import { MdDeleteOutline, MdOutlineEdit } from "react-icons/md";
import { IoEyeOutline } from "react-icons/io5";
import { TableProps } from "../../../../utils/types/common/IDataTable";

const Table = <T extends Record<string, any>>({
    paginatedData,
    columns,
    handleSort,
    toggleActionMenu,
    openActionMenuId,
    onEdit,
    onDelete,
    onViewDetails,
    enableActions,
    idKey,
}: TableProps<T>) => {
    return (
        <div className="rounded-md border border-neutral-200 w-full">
            <table className="w-full text-sm">
                <thead className="bg-neutral-100">
                    <tr>
                        {columns.map((column) => (
                            <th
                                key={column.key as string}
                                className="p-3 text-left font-medium text-neutral-700 cursor-pointer"
                                onClick={() => handleSort(column.key)}
                            >
                                <div className="flex items-center gap-[5px]">
                                    {column.label}
                                    <HiOutlineArrowsUpDown className="hover:bg-neutral-200 p-[5px] rounded-md text-[1.6rem]" />
                                </div>
                            </th>
                        ))}
                        {enableActions && (
                            <th className="p-3 text-left font-medium text-neutral-700">
                                Actions
                            </th>
                        )}
                    </tr>
                </thead>
                <tbody>
                    {paginatedData.map((item) => (
                        <tr
                            key={item[idKey] as string}
                            className="border-t border-neutral-200 hover:bg-neutral-50"
                        >
                            {columns.map((column) => (
                                <td key={column.key as string} className="p-3">
                                    {item[column.key]}
                                </td>
                            ))}
                            {enableActions && (
                                <td className="p-3 relative">
                                    <BsThreeDotsVertical
                                        onClick={() =>
                                            toggleActionMenu(
                                                item[idKey] as string,
                                            )
                                        }
                                        className="action-btn text-neutral-600 cursor-pointer"
                                    />
                                    <div
                                        className={`${openActionMenuId === item[idKey] ? "opacity-100 scale-[1] z-30" : "opacity-0 scale-[0.8] z-[-1]"} zenui-table absolute top-[90%] right-[80%] p-1.5 rounded-md bg-white shadow-md min-w-[160px] transition-all duration-100`}
                                    >
                                        {onEdit && (
                                            <button
                                                className="flex items-center gap-[8px] text-[0.9rem] py-1.5 px-2 w-full rounded-md text-neutral-700 cursor-pointer hover:bg-neutral-50 transition-all duration-200"
                                                onClick={() =>
                                                    onEdit(
                                                        item[idKey] as string,
                                                    )
                                                }
                                            >
                                                <MdOutlineEdit />
                                                Edit
                                            </button>
                                        )}
                                        {onDelete && (
                                            <button
                                                className="flex items-center gap-[8px] text-[0.9rem] py-1.5 px-2 w-full rounded-md text-neutral-700 cursor-pointer hover:bg-neutral-50 transition-all duration-200"
                                                onClick={() =>
                                                    onDelete(
                                                        item[idKey] as string,
                                                    )
                                                }
                                            >
                                                <MdDeleteOutline />
                                                Delete
                                            </button>
                                        )}
                                        {onViewDetails && (
                                            <button
                                                className="flex items-center gap-[8px] text-[0.9rem] py-1.5 px-2 w-full rounded-md text-neutral-700 cursor-pointer hover:bg-neutral-50 transition-all duration-200"
                                                onClick={() =>
                                                    onViewDetails(
                                                        item[idKey] as string,
                                                    )
                                                }
                                            >
                                                <IoEyeOutline />
                                                View Details
                                            </button>
                                        )}
                                    </div>
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
            {!paginatedData?.length && (
                <p className="text-[0.9rem] text-neutral-500 py-6 text-center w-full">
                    No data found!
                </p>
            )}
        </div>
    );
};

export default Table;
