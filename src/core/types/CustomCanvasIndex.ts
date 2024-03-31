export type CanvasTableRowItem = number | { index: number; } | null;

export interface ICanvasTableRowItemSelectColMode {
    path: Array<ICanvasTableIndexsColMode>;
    select: number;
    index: number;
}

export type CanvasTableRowItemSelect = null | ICanvasTableRowItemSelectColMode;

export interface ICanvasTableIndexRowMode {
    index: any;
}

export interface ICanvasTableIndexsColMode {
    list: number[];
}

export interface ICanvasTableIndexColMode {
    index: ICanvasTableIndexsColMode;
}

export type CanvasTableIndexs = ICanvasTableIndexsColMode;
export type CanvasTableIndex = ICanvasTableIndexRowMode | ICanvasTableIndexColMode;
