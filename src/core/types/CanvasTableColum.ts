import { CanvasColor, ICanvasContext2D } from "./CanvasContext2D";
import { CustomCanvasTable } from "../CustomCanvasTable";

export interface IEditRowItem { [field: string]: any; }

export type CustomData<T = any> = (canvasTable: CustomCanvasTable, dataValue: string, row: T,
                                   data: T[], rowIndex: number, col: ICanvasTableColumnConf<T>) => string;
export type RenderValue<T = any> = (
    canvasTable: CustomCanvasTable, context: ICanvasContext2D, rowIndex: number,
    col: ICanvasTableColumnConf<T>, left: number, top: number, right: number, bottom: number,
    width: number, height: number, r: number, dataValue: string, row: T, data: T[]) => void;

export type CustomRowColStyle<T = any> = (data: T[], row: T, col: ICanvasTableColumnConf<T>,
                                          isSepra: boolean, dataRowCol: string)
                                 => ICanvasTableRowColStyle | undefined | null;

export interface IUpdateRect {
    cellHeight: number;
    clipBottom: number | undefined;
    clipLeft: number | undefined;
    clipRight: number | undefined;
    clipTop: number | undefined;
    left: number;
    top: number;
    width: number;
    x: number;
    y: number;
}

export interface ICanvasTableColumn<T> {
    allowEdit: boolean;
    header: string;
    field: string;
    width: number;
    align: Align;
    index: number;
    leftPos: number;
    rightPos: number;
    customData?: CustomData<T>;
    orginalCol: ICanvasTableColumnConf<T>;
}

/**
 * CanvasTableRowColStyle interface is return in [[CustomRowColStyle]]
 */
export interface ICanvasTableRowColStyle {
    /**
     * Font name
     */
    font?: string;
    /**
     * Font style example bold
     */
    fontStyle?: string;
    /**
     * Font size in px
     */
    fontSize?: number;
    /**
     * Font color
     */
    fontColor?: CanvasColor;
    /**
     * background color in the cell
     */
    backgroundColor?: CanvasColor;
    /**
     * Text align: left, center, right
     */
    align?: Align;
}

/**
 * Canvas Table Column Config
 */
export interface ICanvasTableColumnConf<T = any> {
    /**
     * Text in header
     */
    header: string;
    /**
     * Property field in data
     */
    field: string;
    /**
     * Width of the column
     */
    width?: number;
    /**
     * Align render data in the table. default Align.left
     */
    align?: Align;
    /**
     * Visible of the column. default visible
     */
    visible?: boolean;
    /**
     * function pointer to render string.
     */
    customData?: CustomData<T>;
}

export interface ICanvasTableColumnSort<T = any> {
    col: ICanvasTableColumnConf<T>;
    sort: Sort;
}

/**
 * Align text
 */
export enum Align {
    /**
     * Left = 0
     */
    left = 0,
    /**
     * Center = 1
     */
    center = 1,
    /**
     * Right = 2
     */
    right = 2,
}

/**
 * Sort direction
 */
export enum Sort {
    /**
     * sort accending  = 1
     */
    ascending = 1,
    /**
     * sort descending = -1
     */
    descending = -1,
}
