import React from 'react';

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (_e: React.ChangeEvent<HTMLInputElement>) => void;
  onSearchSubmit: (_e: React.FormEvent) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
}) => {
  return (
    <div className="recipes-search-section">
      <form onSubmit={onSearchSubmit} className="search-form">
        <div className="search-input-container">
          <input
            type="text"
            placeholder="Search recipes..."
            value={searchQuery}
            onChange={onSearchChange}
            className="search-input"
          />
          <button type="submit" className="search-button">
            <img
              width="16px"
              src="assets/search.png"
              alt="Search"
              className="search-icon"
            />
          </button>
        </div>
      </form>
    </div>
  );
};

export default SearchBar;
