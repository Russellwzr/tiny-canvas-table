import { CanvasTableMode } from "./CanvasTableMode";

export type CanvasTableRowItemRowMode = ICanvasTableIndexsRowMode | ICanvasTableGroupItemRowMode;
export type CanvasTableRowItem = number | ICanvasTableGroupItemColMode | CanvasTableRowItemRowMode | null;

export interface ICanvasTableRowItemSelectColMode {
    mode: CanvasTableMode.ColMode;
    path: Array<ICanvasTableIndexsColMode>;
    select: number | ICanvasTableGroupItemColMode;
    index: number;
}

export interface ICanvasTableRowItemSelectRowMode {
    mode: CanvasTableMode.RowMode;
    path: Array<ICanvasTableGroupItemsRowMode | ICanvasTableGroupItemsRowMode>;
    select: CanvasTableRowItemRowMode;
    index: number;
}

export type CanvasTableRowItemSelect = null | ICanvasTableRowItemSelectRowMode | ICanvasTableRowItemSelectColMode;

export enum CanvasTableIndexType { GroupItems, Index, GroupRows }

export interface ICanvasTableGroupItemAbstract {
    caption: string;
    aggregate?: string;
    isExpended: boolean;
}

export interface ICanvasTableIndexRowMode {
    mode: CanvasTableMode.RowMode;
    index: ICanvasTableGroupItemRowsRowMode | ICanvasTableGroupItemsRowMode;
}

export interface ICanvasTableIndexsRowMode extends ICanvasTableGroupItemAbstract {
    index: number;
}
export interface ICanvasTableGroupItemRowMode extends ICanvasTableGroupItemAbstract {
    child: (ICanvasTableGroupItemsRowMode | ICanvasTableGroupItemRowsRowMode);
}
export interface ICanvasTableGroupItemsRowMode {
    type: CanvasTableIndexType.GroupItems;
    list: ICanvasTableGroupItemRowMode[];
}
export interface ICanvasTableGroupItemRowsRowMode {
    type: CanvasTableIndexType.GroupRows;
    list: ICanvasTableIndexsRowMode[];
}

export interface ICanvasTableIndexsColMode {
    type: CanvasTableIndexType.Index;
    list: number[];
}
export interface ICanvasTableGroupItemColMode extends ICanvasTableGroupItemAbstract {
    child: ICanvasTableIndexsColMode;
}

export interface ICanvasTableIndexColMode {
    mode: CanvasTableMode.ColMode;
    index: ICanvasTableIndexsColMode;
}

export type CanvasTableIndexs = ICanvasTableIndexsColMode 
                    | ICanvasTableGroupItemRowsRowMode | ICanvasTableGroupItemsRowMode;
export type CanvasTableIndex = ICanvasTableIndexRowMode | ICanvasTableIndexColMode;
