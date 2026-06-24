"use client";

import { useEffect, useState } from "react";

interface Props {
  value: string;
  onChange: (city: string) => void;
}

export default function CityAutocomplete({
  value,
  onChange,
}: Props) {
  const [cities, setCities] = useState<
    { city_name: string }[]
  >([]);

  const [query, setQuery] =
    useState(value);

  useEffect(() => {
    loadCities();
  }, []);

  async function loadCities() {
    const response = await fetch(
      "/api/cities"
    );

    const data =
      await response.json();

    setCities(data);
  }

const filteredCities =
  query.length === 0
    ? []
    : cities
        .filter((city) =>
          city.city_name
            .toLowerCase()
            .startsWith(
              query.toLowerCase()
            )
        )
        .slice(0, 8);;
const [showSuggestions, setShowSuggestions] =
  useState(false);
  return (
    <div className="relative">
      <input
        type="text"
        value={query}
onChange={(e) => {
  setQuery(e.target.value);
  setShowSuggestions(true);
  onChange(e.target.value);
}}
        className="
          w-full
          px-3
          py-2
          rounded-lg
          bg-[#0f172a]
          border
          border-slate-700
          text-slate-200
          focus:outline-none
          focus:border-blue-500
          text-sm
        "
      />

      {showSuggestions &&
 filteredCities.length > 0 && (
        <div
          className="
            absolute
            z-50
            mt-1
            w-full
            bg-[#111827]
            border
            border-slate-700
            rounded-lg
            overflow-hidden
            shadow-xl
            max-h-64
            overflow-y-auto
          "
        >
          {filteredCities.map(
            (city) => (
              <button
                key={
                  city.city_name
                }
                type="button"
onClick={() => {
  setQuery(city.city_name);

  onChange(
    city.city_name
  );

  setShowSuggestions(false);
}}
                className="
                  w-full
                  text-left
                  px-3
                  py-2
                  hover:bg-slate-700
                  text-sm
                "
              >
                {city.city_name}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}