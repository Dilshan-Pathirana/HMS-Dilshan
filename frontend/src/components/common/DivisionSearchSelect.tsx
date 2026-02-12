import React, { useState, useRef, useEffect } from 'react';
import { DivisionalSecretariat, sriLankaDivisions } from '../../utils/data/sriLankaDivisions';

interface DivisionSearchSelectProps {
  value: string;
  onChange: (division: DivisionalSecretariat | null) => void;
  required?: boolean;
}

const DivisionSearchSelect: React.FC<DivisionSearchSelectProps> = ({
  value,
  onChange,
  required = false,
}) => {
  const [query, setQuery] = useState(value || '');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = sriLankaDivisions.filter((d) =>
    d.name.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <input
        type="text"
        value={query}
        required={required}
        placeholder="Search division..."
        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300 text-sm"
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          if (!e.target.value) onChange(null);
        }}
        onFocus={() => setOpen(true)}
      />
      {open && filtered.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto bg-white border border-neutral-200 rounded-lg shadow-lg">
          {filtered.map((d) => (
            <li
              key={d.divisionNumber}
              onClick={() => {
                setQuery(d.name);
                onChange(d);
                setOpen(false);
              }}
              className="px-3 py-2 text-sm cursor-pointer hover:bg-primary-50"
            >
              {d.name} {d.district && <span className="text-neutral-400">— {d.district}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default DivisionSearchSelect;
