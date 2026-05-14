import type { DrillItem } from "./useDrillSession";

export type ShortcutHandlers = {
  grade: ((g: 1 | 2 | 3 | 4) => void) | null;
  reveal: (() => void) | null;
};
export type ShortcutRef = React.MutableRefObject<ShortcutHandlers>;

export interface DrillModeProps {
  header: React.ReactNode;
  item: DrillItem;
  vref: string;
  onResult: (grade: 1 | 2 | 3 | 4, transcript?: string, accuracy?: number) => void;
  shortcuts: ShortcutRef;
}
