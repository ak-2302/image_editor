export type ObjectLayer = {
  id: number;
  name: string;
  type: "image" | "rectangle" | "circle" | "triangle" | "text";
  url?: string;
  visible: boolean;
  text?: {
    content: string;
    fontSize: number;
    color: string;
    bold: boolean;
    italic: boolean;
  };
};
