interface TSearchBarProps {
  query: string;
  onSearchChange: (query: string) => void;
}

const SearchBar: React.FC<TSearchBarProps> = ({ query, onSearchChange }) => {
  return (
    <input
      type="text"
      placeholder="Search menu items..."
      value={query}
      onChange={(e) => onSearchChange(e.target.value)}
      className="w-full p-2 mb-4 border rounded"
    />
  );
};

export default SearchBar;
