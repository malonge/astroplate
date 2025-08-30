import React, { useEffect, useState } from "react";

const SearchModal = () => {
  const [searchString, setSearchString] = useState("");

  // handle input change
  const handleSearch = (e: React.FormEvent<HTMLInputElement>) => {
    setSearchString(e.currentTarget.value);
  };

  // search dom manipulation
  useEffect(() => {
    const searchModal = document.getElementById("searchModal");
    const searchInput = document.getElementById("searchInput");
    const searchModalOverlay = document.getElementById("searchModalOverlay");
    const searchModalTriggers = document.querySelectorAll(
      "[data-search-trigger]",
    );

    // search modal open
    searchModalTriggers.forEach((button) => {
      button.addEventListener("click", function () {
        const searchModal = document.getElementById("searchModal");
        searchModal!.classList.add("show");
        searchInput!.focus();
      });
    });

    // search modal close
    searchModalOverlay!.addEventListener("click", function () {
      searchModal!.classList.remove("show");
    });

    // keyboard navigation
    document.addEventListener("keydown", function (event) {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        searchModal!.classList.add("show");
        searchInput!.focus();
      }

      if (event.key === "Escape") {
        searchModal!.classList.remove("show");
      }
    });
  }, []);

  return (
    <>
      <div id="searchModal" className="search-modal">
        <div id="searchModalOverlay" className="search-modal-overlay" />
        <div className="search-modal-content">
          <div className="search-modal-header">
            <h3>Search</h3>
            <button
              type="button"
              className="search-modal-close"
              onClick={() => {
                const searchModal = document.getElementById("searchModal");
                searchModal!.classList.remove("show");
              }}
            >
              ×
            </button>
          </div>
          <div className="search-modal-body">
            <input
              id="searchInput"
              type="text"
              placeholder="Search projects, publications, and more..."
              value={searchString}
              onChange={handleSearch}
              className="search-input"
            />
            <div className="search-results">
              {searchString.length > 0 ? (
                <div className="search-suggestions">
                  <p>Search functionality coming soon!</p>
                  <p className="text-sm text-muted">
                    For now, you can navigate using the menu above.
                  </p>
                </div>
              ) : (
                <div className="search-suggestions">
                  <p>Type to search...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SearchModal;
