type ColorInputRowProps = {
  label: string;
  value: string;
  id?: string;
  onChange: (value: string) => void;
};

export default function ColorInputRow({ label, value, id = "color_picker", onChange }: ColorInputRowProps) {
  return (
    <div className="initial_effect_row">
      <label htmlFor={id}>{label}</label>
      <input
        className="shape_color_code"
        aria-label={`${label}のカラーコード`}
        type="text"
        value={value}
        pattern="^#[0-9a-fA-F]{6}$"
        onChange={(event) => {
          if (/^#[0-9a-fA-F]{6}$/.test(event.target.value)) onChange(event.target.value);
        }}
      />
      <input
        id={id}
        className="shape_color_picker"
        type="color"
        value={value}
        aria-label={`${label}を選択`}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
