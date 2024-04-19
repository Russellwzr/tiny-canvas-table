import { ICanvasTableColumn, IUpdateRect } from "./CanvasTableColum";

export enum OffscreenCanvasMesssageType {
    create = 0,
    resize = 1,
    expendAll = 2, collapseAll = 3, setGroupBy = 4,
    scroll = 10, focus = 15,
    mouseDown = 20, mouseMove = 21, mouseUp = 22, mouseMoveExtended = 24, mouseUpExtended = 25,
    mouseDblClick = 26,
    keyDown = 40,
    askForExtentedMouseMoveAndMaouseUp = 100, askForNormalMouseMoveAndMaouseUp = 101, setCursor = 102,
    updateForEdit = 103, removeUpdateForEdit = 104, locationForEdit = 105, onEditRemoveUpdateForEdit = 106,
}

interface IOffscreenCanvasMesssageParnet {
    type: OffscreenCanvasMesssageType;
    canvasTableId: number;
}

interface IOffscreenCanvasMessageCreate extends IOffscreenCanvasMesssageParnet {
    type: OffscreenCanvasMesssageType.create;
    offscreen: OffscreenCanvas;
    width: number;
    height: number;
    r: number;
}

interface IOffscreenCanvasMessageResize extends IOffscreenCanvasMesssageParnet {
    type: OffscreenCanvasMesssageType.resize;
    width: number;
    height: number;
    r: number;
}

interface IOffscreenCanvasMessageFunctionsToWorker extends IOffscreenCanvasMesssageParnet {
    type: OffscreenCanvasMesssageType.expendAll
        | OffscreenCanvasMesssageType.collapseAll;
}

interface IOffscreenCanvasMessageFunctionsFromWorker extends IOffscreenCanvasMesssageParnet {
    type: OffscreenCanvasMesssageType.askForExtentedMouseMoveAndMaouseUp
        | OffscreenCanvasMesssageType.askForNormalMouseMoveAndMaouseUp
        | OffscreenCanvasMesssageType.removeUpdateForEdit;
}

interface IOffscreenCanvasMessageScroll extends IOffscreenCanvasMesssageParnet {
    type: OffscreenCanvasMesssageType.scroll;
    deltaMode: number;
    deltaX: number;
    deltaY: number;
}

interface IOffscreenCanvasMessageMouse extends IOffscreenCanvasMesssageParnet {
    type: OffscreenCanvasMesssageType.mouseDown | OffscreenCanvasMesssageType.mouseMove
        | OffscreenCanvasMesssageType.mouseUp | OffscreenCanvasMesssageType.mouseMoveExtended
        | OffscreenCanvasMesssageType.mouseUpExtended | OffscreenCanvasMesssageType.mouseDblClick;
    x: number;
    y: number;
}


interface IOffscreenCanvasMessageKeyDown extends IOffscreenCanvasMesssageParnet {
    type: OffscreenCanvasMesssageType.keyDown;
    keycode: number;
}

interface IOffscreenCanvasMessageGroupBy extends IOffscreenCanvasMesssageParnet {
    type: OffscreenCanvasMesssageType.setGroupBy;
    groupBy?: string[];
}

interface IOffscreenCanvasMessageSetCursor extends IOffscreenCanvasMesssageParnet {
    type: OffscreenCanvasMesssageType.setCursor;
    cursor: string;
}

interface IOffscreenCanvasMessageFocus extends IOffscreenCanvasMesssageParnet {
    type: OffscreenCanvasMesssageType.focus;
    focus: boolean;
}

interface IOffscreenCanvasMessageUpdateForEdit<T> extends IOffscreenCanvasMesssageParnet {
    cellHeight: number;
    rect: IUpdateRect;
    col: ICanvasTableColumn<T>;
    type: OffscreenCanvasMesssageType.updateForEdit;
    row: number;
    value: any;
}

interface IOffscreenCanvasMessageLocationForEdit extends IOffscreenCanvasMesssageParnet {
    rect: IUpdateRect;
    type: OffscreenCanvasMesssageType.locationForEdit;
}

interface IOffscreenCanvasMessageOnEditRemoveForEdit<T> extends IOffscreenCanvasMesssageParnet {
    cancel: boolean;
    col?: ICanvasTableColumn<T>;
    newData: string;
    row: number | undefined;
    type: OffscreenCanvasMesssageType.onEditRemoveUpdateForEdit;
}

export type OffscreenCanvasMesssageToWorker<T = any> =
      IOffscreenCanvasMessageScroll
    | IOffscreenCanvasMessageCreate
    | IOffscreenCanvasMessageResize
    | IOffscreenCanvasMessageFunctionsToWorker
    | IOffscreenCanvasMessageGroupBy
    | IOffscreenCanvasMessageMouse
    | IOffscreenCanvasMessageKeyDown
    | IOffscreenCanvasMessageFocus
    | IOffscreenCanvasMessageOnEditRemoveForEdit<T>
    ;

export type OffscreenCanvasMesssageFromWorker<T = any> =
      IOffscreenCanvasMessageSetCursor
    | IOffscreenCanvasMessageFunctionsFromWorker
    | IOffscreenCanvasMessageUpdateForEdit<T>
    | IOffscreenCanvasMessageLocationForEdit
    ;
