import React, { useState, useRef, useEffect } from "react";
import { sriLankaDivisions, DivisionalSecretariat } from "../../utils/data/sriLankaDivisions";

interface DivisionSearchSelectProps {
    value: string;
    onChange: (division: DivisionalSecretariat | null) => void;
    required?: boolean;
    className?: string;
}

const DivisionSearchSelect: React.FC<DivisionSearchSelectProps> = ({
    value,
    onChange,
    required = false,
    className = "",
}) => {
    const [query, setQuery] = useState(value || "");
    const [isOpen, setIsOpen] = useState(false);
    const [highlightIndex, setHighlightIndex] = useState(-1);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLUListElement>(null);

    useEffect(() => {
        setQuery(value || "");
    }, [value]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setIsOpen(false);
                // Reset query to current value if user clicked away without selecting
                if (!sriLankaDivisions.find((d) => d.name === query)) {
                    setQuery(value || "");
                }
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [query, value]);

    const q = query.toLowerCase().trim();
    const filtered = q
        ? sriLankaDivisions.filter(
              (d) =>
                  d.name.toLowerCase().includes(q) ||
                  d.district.toLowerCase().includes(q) ||
                  d.divisionNumber.includes(q)
          )
        : sriLankaDivisions;

    const handleSelect = (div: DivisionalSecretariat) => {
        setQuery(div.name);
        setIsOpen(false);
        setHighlightIndex(-1);
        onChange(div);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setQuery(e.target.value);
        setIsOpen(true);
        setHighlightIndex(-1);
        if (!e.target.value) {
            onChange(null);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen) {
            if (e.key === "ArrowDown" || e.key === "Enter") {
                setIsOpen(true);
                e.preventDefault();
            }
            return;
        }
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlightIndex((prev) => Math.min(prev + 1, filtered.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlightIndex((prev) => Math.max(prev - 1, 0));
        } else if (e.key === "Enter") {
            e.preventDefault();
            if (highlightIndex >= 0 && highlightIndex < filtered.length) {
                handleSelect(filtered[highlightIndex]);
            }
        } else if (e.key === "Escape") {
            setIsOpen(false);
            setQuery(value || "");
        }
    };

    // Scroll highlighted item into view
    useEffect(() => {
        if (listRef.current && highlightIndex >= 0) {
            const item = listRef.current.children[highlightIndex] as HTMLElement;
            item?.scrollIntoView({ block: "nearest" });
        }
    }, [highlightIndex]);

    return (
        <div ref={wrapperRef} className={`relative ${className}`}>
            <input
                type="text"
                value={query}
                onChange={handleInputChange}
                onFocus={() => setIsOpen(true)}
                onKeyDown={handleKeyDown}
                placeholder="Search division, district, or code..."
                className="w-full p-2 border border-neutral-300 rounded focus:ring-2 focus:ring-primary-500 outline-none"
                required={required}
                autoComplete="off"
            />
            {isOpen && (
                <ul
                    ref={listRef}
                    className="absolute z-50 w-full mt-1 bg-white border border-neutral-300 rounded shadow-lg max-h-60 overflow-y-auto"
                >
                    {filtered.length === 0 ? (
                        <li className="px-3 py-2 text-neutral-400 text-sm">No divisions found</li>
                    ) : (
                        filtered.map((div, idx) => (
                            <li
                                key={div.divisionNumber}
                                onClick={() => handleSelect(div)}
                                className={`px-3 py-2 cursor-pointer text-sm flex justify-between items-center ${
                                    idx === highlightIndex
                                        ? "bg-primary-100 text-primary-800"
                                        : "hover:bg-neutral-100"
                                } ${div.name === value ? "font-semibold bg-primary-50" : ""}`}
                            >
                                <span>
                                    {div.name}{" "}
                                    <span className="text-neutral-400">— {div.district}</span>
                                </span>
                                <span className="text-neutral-500 text-xs font-mono">
                                    {div.divisionNumber}
                                </span>
                            </li>
                        ))
                    )}
                </ul>
            )}
        </div>
    );
};

export default DivisionSearchSelect;
