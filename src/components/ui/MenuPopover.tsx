import type { ReactNode } from "react";

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
  return (
    <div className={`menu_popover ${className}`.trim()}>
      <span onClick={onToggle}>{trigger}</span>
      {open && <div className={menuClassName}>{children}</div>}
    </div>
  );
}
