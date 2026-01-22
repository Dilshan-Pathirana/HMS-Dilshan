import React from "react";

interface SearchBarProps {
    search: string;
    onSearchChange: (value: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ search, onSearchChange }) => {
    return (
        <div className="mb-4 flex items-center justify-between">
            <input
                placeholder="Search..."
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                className="max-w-sm py-2.5 px-4 border border-gray-200 rounded-md outline-none focus:border-blue-300"
            />
        </div>
    );
};

export default SearchBar;
