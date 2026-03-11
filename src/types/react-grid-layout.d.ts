declare module 'react-grid-layout' {
  import * as React from 'react';

  export interface Layout {
    i: string;
    x: number;
    y: number;
    w: number;
    h: number;
    minW?: number;
    minH?: number;
    maxW?: number;
    maxH?: number;
    static?: boolean;
    isDraggable?: boolean;
    isResizable?: boolean;
  }

  export interface Layouts {
    [P: string]: Layout[];
  }

  export interface ReactGridLayoutProps {
    className?: string;
    layout?: Layout[];
    cols?: number;
    rowHeight?: number;
    width?: number;
    isDraggable?: boolean;
    isResizable?: boolean;
    compactType?: 'vertical' | 'horizontal' | null;
    margin?: [number, number];
    draggableHandle?: string;
    onLayoutChange?: (layout: Layout[]) => void;
    children?: React.ReactNode;
  }

  export interface ResponsiveProps extends ReactGridLayoutProps {
    breakpoints?: { [P: string]: number };
    cols?: { [P: string]: number };
    layouts?: Layouts;
    onLayoutChange?: (currentLayout: Layout[], allLayouts?: Layouts) => void;
  }

  export class Responsive extends React.Component<ResponsiveProps> {}

  export function WidthProvider<P extends object>(
    component: React.ComponentType<P>
  ): React.ComponentType<Omit<P, 'width'> & { measureBeforeMount?: boolean }>;

  export default class ReactGridLayout extends React.Component<ReactGridLayoutProps> {}
}

declare module 'react-grid-layout/dist/legacy.mjs' {
  export { Responsive, WidthProvider, Layout, Layouts } from 'react-grid-layout';
}

declare module 'react-grid-layout/css/styles.css' {
  const content: string;
  export default content;
}

declare module 'react-resizable/css/styles.css' {
  const content: string;
  export default content;
}
