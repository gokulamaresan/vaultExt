import React from 'react';
import './SearchBar.css';

export const SearchBar = ({ onSearch }) => {
  return (
    <div className="searchbar-container">
      <input
        className="searchbar-input"
        type="search"
        placeholder="Search credentials..."
        onChange={(e) => onSearch(e.target.value)}
        aria-label="Search credentials"
      />
    </div>
  );
};
