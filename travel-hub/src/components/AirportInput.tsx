'use client';

// Shares the <datalist id="airports"> rendered once in the root layout.
export default function AirportInput({
  value,
  onChange,
  placeholder,
  required,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <input
      className="input"
      list="airports"
      value={value}
      maxLength={3}
      required={required}
      placeholder={placeholder ?? 'TPE'}
      onChange={(e) => onChange(e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))}
    />
  );
}
