import { ICanvasContext2D } from "./types/CanvasContext2D";
import { Align, CustomSort, ICanvasTableColumn, ICanvasTableColumnConf,
     ICanvasTableColumnSort, Sort } from "./types/CanvasTableColum";
import { CanvasTableEditAction } from "./CanvasTableEdit";
import { CanvasTableRowItem } from "./types/CustomCanvasIndex";
import { CustomCanvasTable, ICanvasTableConfig } from "./CustomCanvasTable";
import { OffscreenCanvasMesssageFromWorker, OffscreenCanvasMesssageToWorker, OffscreenCanvasMesssageType } from "./types/OffscreenCanvasTableMessage";
import { ScrollView } from "./ScrollView";

declare function postMessage(message: any): void;

export { Align, Sort, CustomCanvasTable };
export type {
    ICanvasTableColumnConf, CanvasTableRowItem, ICanvasTableColumnSort, CustomSort, ICanvasContext2D
};

export class OffscreenCanvasTableWorker<T = any> extends CustomCanvasTable {

    private id: number;
    private canvas?: OffscreenCanvas;
    private hasUpdateForEdit?: {col: ICanvasTableColumn<T>; row: number};

    constructor(offscreenCanvasTableId: number, col: ICanvasTableColumnConf[], config?: ICanvasTableConfig) {
        super(config);
        this.id = offscreenCanvasTableId;
        this.updateColumns(col);
    }

    public updateColumns(col: Array<ICanvasTableColumnConf<T>>) {
        super.updateColumns(col);
        const data: OffscreenCanvasMesssageFromWorker = {
            canvasTableId: this.id,
            type: OffscreenCanvasMesssageType.removeUpdateForEdit,
        };

        postMessage(data);
        this.hasUpdateForEdit = undefined;
    }

    public message(data: OffscreenCanvasMesssageToWorker) {
        if (data.canvasTableId !== this.id) { return; }

        switch (data.type) {
            case OffscreenCanvasMesssageType.create:
                this.canvas = data.offscreen;
                this.setR(data.r);
                const context =  this.canvas.getContext("2d") as ICanvasContext2D;
                if (context === null) { return; }
                this.scrollView = new ScrollView(context, this,
                    this.config ? this.config.scrollView : undefined,
                    this.askForExtentedMouseMoveAndMaouseUp, this.askForNormalMouseMoveAndMaouseUp,
                    this.scrollViewChange);

                this.context = context;
                this.doReize(data.width, data.height);
                this.askForReDraw();
                break;
            case OffscreenCanvasMesssageType.resize:
                this.setR(data.r);
                this.doReize(data.width, data.height);
                this.askForReDraw();
                break;
            case OffscreenCanvasMesssageType.focus:
                this.setIsFocus(data.focus);
                break;
            case OffscreenCanvasMesssageType.scroll:
                this.wheel(data.deltaMode, data.deltaX, data.deltaY);
                break;
            case OffscreenCanvasMesssageType.mouseDown:
                this.mouseDown(data.x, data.y);
                break;
            case OffscreenCanvasMesssageType.mouseMove:
                this.mouseMove(data.x, data.y);
                break;
            case OffscreenCanvasMesssageType.mouseUp:
                this.mouseUp(data.x, data.y);
                break;
            case OffscreenCanvasMesssageType.mouseDblClick:
                this.dblClick(data.x, data.y);
                break;
            case OffscreenCanvasMesssageType.mouseMoveExtended:
                this.mouseMoveExtended(data.x, data.y);
                break;
            case OffscreenCanvasMesssageType.mouseUpExtended:
                this.mouseUpExtended(data.x, data.y);
                break;
            case OffscreenCanvasMesssageType.mouseLeave:
                this.mouseLeave();
                break;
            case OffscreenCanvasMesssageType.keyDown:
                this.keydown(data.keycode);
                break;
            case OffscreenCanvasMesssageType.onEditRemoveUpdateForEdit:
                this.onEditRemoveUpdateForEdit(data.action, data.cancel,
                    data.col, data.newData, data.row);
                break;
        }
    }

    public resize() {
        /** */
    }
    protected drawCanvas(): void {
        if (this.context === undefined || this.dataIndex === undefined) {
            this.requestAnimationFrame = undefined;
            this.askForReDraw(this.drawconf);
            return;
        }

        super.drawCanvas();
    }

    protected scrollViewChange(): void {
        if (this.hasUpdateForEdit) {
            const rect  = this.calcRect(this.hasUpdateForEdit.col, this.hasUpdateForEdit.row);
            if (!rect) {
                return;
            }

            const data: OffscreenCanvasMesssageFromWorker = {
                canvasTableId: this.id,
                rect,
                type: OffscreenCanvasMesssageType.locationForEdit,
            };

            postMessage(data);
        }
    }

    protected updateForEdit(col: ICanvasTableColumn<T>, row: number) {
        const rect  = this.calcRect(col, row);
        if (!rect) {
            return;
        }

        const value = this.getUpdateDataOrData(row, col.field);

        const data: OffscreenCanvasMesssageFromWorker<T> = {
            cellHeight: this.cellHeight,
            col,
            canvasTableId: this.id,
            rect,
            row,
            type: OffscreenCanvasMesssageType.updateForEdit,
            value,
        };

        postMessage(data);
        this.hasUpdateForEdit = {col, row};
    }

    protected setCanvasSize(width: number, height: number): void {
        if (this.canvas === undefined) { return; }
        this.canvas.width = width;
        this.canvas.height = height;
        super.setCanvasSize(width, height);
    }
    protected setCursor(cursor: string): void {
        const data: OffscreenCanvasMesssageFromWorker = { cursor, canvasTableId: this.id,
              type: OffscreenCanvasMesssageType.setCursor };
        postMessage(data);
    }
    protected askForExtentedMouseMoveAndMaouseUp() {
        const data: OffscreenCanvasMesssageFromWorker = { canvasTableId: this.id,
              type: OffscreenCanvasMesssageType.askForExtentedMouseMoveAndMaouseUp };
        postMessage(data);
    }
    protected askForNormalMouseMoveAndMaouseUp() {
        const data: OffscreenCanvasMesssageFromWorker = { canvasTableId: this.id,
              type: OffscreenCanvasMesssageType.askForNormalMouseMoveAndMaouseUp };
        postMessage(data);
    }
    
    private onEditRemoveUpdateForEdit(
          action: CanvasTableEditAction | undefined,
          cancel: boolean,
          col: ICanvasTableColumn<T> | undefined,
          newData: string,
          row: number | undefined) {
        this.hasUpdateForEdit = undefined;

        if (cancel || col === undefined || row === undefined) {
            return;
        }

        if (String(this.getUpdateDataOrData(row, col.field)) !== String(newData)) {
            this.setUpdateData(row, col.field, newData);
            this.reCalcIndexIfNeed(col.field);
            this.askForReDraw();
        }

        if (action !== undefined) {
            switch (action) {
                case CanvasTableEditAction.moveNext:
                    if (this.column.length > col.index + 1) {
                        const column = this.column[col.index + 1];
                        this.updateForEdit(column, row);
                    }
                    break;
                case CanvasTableEditAction.movePrev:
                        if (0 < col.index) {
                            const column = this.column[col.index - 1];
                            this.updateForEdit(column, row);
                        }
                        break;
            }
        }
    }
}
