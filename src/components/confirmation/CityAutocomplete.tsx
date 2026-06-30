"use client";

import { useEffect, useState, useRef, useMemo } from "react";

interface Props {
  value: string;
  onChange: (city: string) => void;
}

export default function CityAutocomplete({ value, onChange }: Props) {
  const [cities, setCities] = useState<{ city_name: string }[]>([]);
  const [query, setQuery] = useState(value);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const activeItemRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    loadCities();
  }, []);

  useEffect(() => {
    if (activeIndex >= 0 && activeItemRef.current) {
      activeItemRef.current.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setActiveIndex(-1);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowSuggestions(false);
        setActiveIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  async function loadCities() {
    try {
      const response = await fetch("/api/cities");

      if (!response.ok) {
        throw new Error("Failed to load cities");
      }

      const data = await response.json();
      setCities(data);
    } catch {
      setCities([]);
    } finally {
      // future loading state
    }
  }

  const filteredCities = useMemo(() => {
    if (query.trim().length === 0) {
      return [];
    }

    return cities
      .filter((city) =>
        city.city_name.toLowerCase().startsWith(query.toLowerCase())
      )
      .slice(0, 10);
  }, [query, cities]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setQuery(newValue);
    setShowSuggestions(true);
    setActiveIndex(-1);
    onChange(newValue);
  };

  const handleInputFocus = () => {
    if (query.trim().length > 0 && filteredCities.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleCitySelect = (cityName: string) => {
    setQuery(cityName);
    onChange(cityName);
    setShowSuggestions(false);
    setActiveIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || filteredCities.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % filteredCities.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + filteredCities.length) % filteredCities.length);
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      handleCitySelect(filteredCities[activeIndex].city_name);
    }
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <input
        type="text"
        value={query}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onKeyDown={handleKeyDown}
        placeholder="Rechercher une ville..."
        className="
          w-full
          px-4
          py-3
          bg-white
          border
          border-slate-200
          rounded-xl
          text-slate-800
          placeholder:text-slate-400
          font-medium
          text-base
          focus:outline-none
          focus:ring-2
          focus:ring-orange-500
          focus:border-transparent
          transition-all
          duration-200
        "
        role="combobox"
        aria-label="Rechercher une ville"
        aria-autocomplete="list"
        aria-expanded={showSuggestions}
        aria-haspopup="listbox"
        aria-controls="city-suggestions"
        aria-activedescendant={activeIndex >= 0 ? `suggestion-${activeIndex}` : undefined}
        autoComplete="off"
      />

      {showSuggestions && filteredCities.length > 0 && (
        <div
          id="city-suggestions"
          role="listbox"
          className="
            absolute
            z-[100]
            mt-2
            w-full
            bg-white
            border
            border-slate-200
            rounded-xl
            shadow-lg
            overflow-hidden
            max-h-60
            overflow-y-auto
          "
        >
          {filteredCities.map((city, index) => (
            <button
              key={city.city_name}
              id={`suggestion-${index}`}
              ref={index === activeIndex ? activeItemRef : null}
              type="button"
              onClick={() => handleCitySelect(city.city_name)}
              role="option"
              aria-selected={index === activeIndex}
              className={`
                w-full
                text-left
                px-4
                h-10
                flex
                items-center
                text-slate-700
                font-medium
                text-sm
                transition-colors
                duration-150
                cursor-pointer
                focus-visible:outline-none
                focus-visible:ring-2
                focus-visible:ring-orange-500
                focus-visible:ring-inset
                ${
                  index === activeIndex
                    ? "bg-orange-50 text-orange-600"
                    : "hover:bg-orange-50 hover:text-orange-600"
                }
              `}
            >
              {city.city_name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}