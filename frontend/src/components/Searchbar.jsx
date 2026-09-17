import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiSearch } from "react-icons/fi";

export default function Searchbar({ compact = false }) {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  function search(event) {
    event.preventDefault();
    navigate("/co-so-y-te?q=" + encodeURIComponent(query.trim()));
  }
  return (
    <form
      className={"searchbar " + (compact ? "compact" : "")}
      onSubmit={search}
    >
      <FiSearch aria-hidden="true" />
      <input
        aria-label="Tìm cơ sở y tế"
        placeholder="Tìm kiếm cơ sở y tế, chuyên khoa..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <button type="submit" aria-label="Tìm kiếm">
        {compact ? <FiSearch /> : "Tìm kiếm"}
      </button>
    </form>
  );
}
