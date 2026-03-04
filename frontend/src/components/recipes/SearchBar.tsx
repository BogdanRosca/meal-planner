import React from 'react';
import { Search } from 'lucide-react';
import styles from './SearchBar.module.css';

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
    <div className={styles['recipes-search-section']}>
      <form onSubmit={onSearchSubmit} className={styles['search-form']}>
        <div className={styles['search-input-container']}>
          <input
            type="text"
            placeholder="Search recipes..."
            value={searchQuery}
            onChange={onSearchChange}
            className={styles['search-input']}
          />
          <button type="submit" className={styles['search-button']}>
            <Search size={18} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default SearchBar;
