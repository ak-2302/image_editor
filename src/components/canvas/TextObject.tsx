import type { CSSProperties } from "react";

type TextObjectProps = {
  content: string;
  fontSize: number;
  color: string;
  bold: boolean;
  italic: boolean;
  transform: string;
  opacity: number;
  zIndex?: number;
  name: string;
};

function TextObject({
  content,
  fontSize,
  color,
  bold,
  italic,
  transform,
  opacity,
  zIndex = 1,
  name,
}: TextObjectProps) {
  return (
    <div
      className="canvas_text"
      aria-label={name}
      style={{
        color,
        fontSize: `${fontSize}px`,
        fontWeight: bold ? 700 : 400,
        fontStyle: italic ? "italic" : "normal",
        transform,
        opacity,
        zIndex,
      } satisfies CSSProperties}
    >
      {content}
    </div>
  );
}

export default TextObject;
