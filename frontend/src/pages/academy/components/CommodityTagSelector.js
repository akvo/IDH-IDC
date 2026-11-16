import React, { useState, useMemo, useRef } from "react";
import { Tag, AutoComplete, Input } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { commodities } from "../../../store/static";

const FALLBACK_COMMODITIES = [
  "Wheat",
  "Corn",
  "Grain",
  "Cocoa",
  "Sugar",
  "Cane",
  "Cotton",
  "Rice",
  "Coffee",
  "Tea",
  "Palm Oil",
  "Maize",
  "Rubber",
  "Vanilla",
  "Cashew",
];

const CommodityTagSelector = ({
  value = [],
  onChange,
  disabled = false,
  suggestions,
}) => {
  const [adding, setAdding] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const committingRef = useRef(false);

  // Merge static commodities, fallbacks, and optional custom suggestions (case-insensitive dedup)
  const allSuggestions = useMemo(() => {
    const staticList = (commodities || [])
      .map((c) => (typeof c === "object" ? c?.name : c))
      .filter(Boolean);

    const source =
      Array.isArray(suggestions) && suggestions.length
        ? [...suggestions, ...staticList, ...FALLBACK_COMMODITIES]
        : [...staticList, ...FALLBACK_COMMODITIES];

    const seen = new Set();
    const result = [];
    source.forEach((item) => {
      const str = typeof item === "string" ? item.trim() : "";
      if (str && !seen.has(str.toLowerCase())) {
        seen.add(str.toLowerCase());
        result.push(str);
      }
    });
    return result;
  }, [suggestions]);

  // Options for AutoComplete, excluding already-selected items
  const filteredOptions = useMemo(() => {
    const currentLower = new Set(
      (Array.isArray(value) ? value : []).map((v) => String(v).toLowerCase())
    );
    const query = (inputValue || "").trim().toLowerCase();
    return allSuggestions
      .filter((s) => !currentLower.has(s.toLowerCase()))
      .filter((s) => !query || s.toLowerCase().includes(query))
      .map((s) => ({ value: s, label: s }));
  }, [allSuggestions, value, inputValue]);

  const commitValues = (raw) => {
    if (committingRef.current) {
      return;
    }
    committingRef.current = true;

    const text = typeof raw === "string" ? raw : "";
    if (!text.trim()) {
      setAdding(false);
      setInputValue("");
      committingRef.current = false;
      return;
    }

    const current = Array.isArray(value) ? value : [];
    const currentLower = new Set(
      current.map((item) => String(item).toLowerCase())
    );
    const pieces = text
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const toAdd = [];
    pieces.forEach((piece) => {
      const lower = piece.toLowerCase();
      if (!currentLower.has(lower)) {
        currentLower.add(lower);
        toAdd.push(piece);
      }
    });

    if (toAdd.length > 0 && typeof onChange === "function") {
      onChange([...current, ...toAdd]);
    }

    setInputValue("");
    setAdding(false);
    setTimeout(() => {
      committingRef.current = false;
    }, 50);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commitValues(inputValue);
    } else if (e.key === ",") {
      e.preventDefault();
      commitValues(inputValue);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setInputValue("");
      setAdding(false);
    }
  };

  const handleBlur = () => {
    if (committingRef.current) {
      return;
    }
    if (inputValue && inputValue.trim()) {
      commitValues(inputValue);
    } else {
      setAdding(false);
      setInputValue("");
    }
  };

  const handleRemove = (itemToRemove) => {
    const current = Array.isArray(value) ? value : [];
    const next = current.filter(
      (v) => String(v).toLowerCase() !== String(itemToRemove).toLowerCase()
    );
    if (typeof onChange === "function") {
      onChange(next);
    }
  };

  const currentValues = Array.isArray(value) ? value : [];

  return (
    <div
      className="commodity-tag-selector"
      data-testid="commodity-tag-selector"
    >
      {currentValues.map((item) => (
        <Tag
          key={item}
          closable={!disabled}
          onClose={(e) => {
            e.preventDefault();
            handleRemove(item);
          }}
          className="commodity-tag"
          data-testid={`commodity-tag-${item}`}
          aria-label={`Remove ${item}`}
        >
          {item}
        </Tag>
      ))}

      {disabled && currentValues.length === 0 && (
        <span className="commodity-empty-text">No commodities selected</span>
      )}

      {!disabled && !adding && (
        <button
          type="button"
          className="commodity-add-btn"
          data-testid="btn-add-commodity"
          aria-label="Add commodity"
          onClick={() => setAdding(true)}
        >
          <span>Add more</span>
          <PlusOutlined />
        </button>
      )}

      {!disabled && adding && (
        <AutoComplete
          className="commodity-add-autocomplete"
          options={filteredOptions}
          value={inputValue}
          onChange={(val) => setInputValue(val)}
          onSelect={(val) => commitValues(val)}
          defaultActiveFirstOption={false}
        >
          <Input
            data-testid="input-add-commodity"
            autoFocus
            placeholder="Add commodity"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
          />
        </AutoComplete>
      )}
    </div>
  );
};

export default CommodityTagSelector;
