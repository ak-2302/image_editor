import { useEffect, useRef, type ReactNode } from "react";

type MenuPopoverProps = {
  open: boolean;
  onToggle: () => void;
  trigger: ReactNode;
  children: ReactNode;
  className?: string;
  menuClassName?: string;
};

export default function MenuPopover({
  open,
  onToggle,
  trigger,
  children,
  className = "",
  menuClassName = "",
}: MenuPopoverProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) onToggle();
    };
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, [open, onToggle]);

  return (
    <div ref={menuRef} className={`menu_popover ${className}`.trim()}>
      <span onClick={onToggle}>{trigger}</span>
      {open && <div className={menuClassName}>{children}</div>}
    </div>
  );
}
