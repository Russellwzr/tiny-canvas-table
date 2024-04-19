import { CanvasColor, ICanvasContext2D } from "./types/CanvasContext2D";
import { Align, CustomRowColStyle, 
         ICanvasTableColumn, ICanvasTableColumnConf, ICanvasTableColumnSort,
         ICanvasTableRowColStyle, IEditRowItem, IUpdateRect, Sort } from "./types/CanvasTableColum";
import { CanvasTableIndex, CanvasTableRowItem,
         CanvasTableRowItemSelect, 
         ICanvasTableIndexsColMode, ICanvasTableRowItemSelectColMode } from "./types/CustomCanvasIndex";
import { IDrawable } from "./types/Drawable";
import { EventManagerClick, EventManagerClickHeader, EventManagerEdit, EventManagerReCalcForScrollView } from "./types/EventManager";
import { IScrollViewConfig, ScrollView } from "./ScrollView";

export interface IDrawConfig {
    drawOnly?: number[];
}

type FrameRequestCallback = (time: number) => void;
declare function requestAnimationFrame(callback: FrameRequestCallback): number;

/**
 * Interface to config style of CanvasTable
 */
export interface ICanvasTableConfig {
    /**
     * ScollView config
     */
    scrollView?: IScrollViewConfig;
    /**
     * FontName
     */
    font: string;
    /**
     * Font Style
     */
    fontStyle: string;
    /**
     * Font size in px
     */
    fontSize: number;
    /**
     * Font color
     */
    fontColor: CanvasColor;
    /**
     * Header font name
     */
    headerFont: string;
    /**
     * Header font style
     */
    headerFontStyle: string;
    /**
     * Header font size in px
     */
    headerFontSize: number;
    /**
     * Header front color
     */
    headerFontColor: CanvasColor;
    /**
     * Header Draw sort arrow
     */
    headerDrawSortArrow: boolean;
    /**
     * Header draw sort arrow color
     */
    headerDrawSortArrowColor: CanvasColor;
    /**
     * Header: background color in header
     */
    headerBackgroundColor: CanvasColor;

    /**
     * Background color
     */
    backgroundColor: CanvasColor;
    /**
     * color line in grid in CanvasTable
     */
    lineColor: CanvasColor;
    /**
     * select line color in grid in CanvasTable
     */
    selectLineColor: CanvasColor;
    /**
     * Backgroud color when mouse is hover the row
     */
    hoverBackgroundColor: CanvasColor;
    /**
     * Every secound row can have another backgound color sepra
     */
    sepraBackgroundColor: CanvasColor;
}

const defaultConfig: ICanvasTableConfig = {
    backgroundColor: "white",
    font: "arial",
    fontColor: "black",
    fontSize: 14,
    fontStyle: "",
    headerBackgroundColor: "#add8e6",
    headerDrawSortArrow: true,
    headerDrawSortArrowColor: "purple",
    headerFont: "arial",
    headerFontColor: "black",
    headerFontSize: 14,
    headerFontStyle: "bold",
    hoverBackgroundColor: "#DCDCDC",
    lineColor: "black",
    selectLineColor: "green",
    sepraBackgroundColor: "#ECECEC",
};

export abstract class CustomCanvasTable<T = any> implements IDrawable {
    protected context?: ICanvasContext2D;
    protected requestAnimationFrame?: number;
    protected drawconf?: IDrawConfig & { fulldraw: boolean };
    protected r: number = 1;
    protected data: T[] = [];
    protected allowEdit: boolean = false;

    protected scrollView?: ScrollView;

    protected headerHeight = 18;
    protected cellHeight = 20;
    protected dataIndex?: CanvasTableIndex = undefined;
    protected config: ICanvasTableConfig = defaultConfig;
    protected column: Array<ICanvasTableColumn<T>> = [];
    private eventDblClick: Array<EventManagerClick<T>> = [];
    private eventClick: Array<EventManagerClick<T>> = [];
    private eventClickHeader: Array<EventManagerClickHeader<T>> = [];
    private eventReCalcForScrollView: EventManagerReCalcForScrollView[] = [];
    private eventEdit: EventManagerEdit[] = [];

    private needToCalc: boolean = true;

    private isFocus: boolean = false;
    private minFontWidth: number = 1;
    private maxFontWidth: number = 1;
    private customRowColStyle?: CustomRowColStyle<T>;
    private sortCol?: Array<ICanvasTableColumnSort<T>>;
    private overRowValue?: number;
    private selectRowValue: CanvasTableRowItemSelect = null;
    private selectColValue?: ICanvasTableColumn<T>;
    private columnResize?: {x: number, col: ICanvasTableColumn<T>};

    private canvasHeight: number = 0;
    private canvasWidth: number = 0;
    private editData: { [index: number]: IEditRowItem } = {};

    constructor(config: ICanvasTableConfig | undefined) {
        this.config = { ...defaultConfig, ...config };
    }

    /**
     * Is CanvasTable going to redraw in next frame
     */
    public isPlanToRedraw(): boolean {
        if (!this.requestAnimationFrame) {
            return false;
        }
        return (this.drawconf !== undefined && this.drawconf.fulldraw);
    }

    /**
     * Let CanvasTable redraw
     * @param config
     */
    public askForReDraw(config?: IDrawConfig) {
        if (config === undefined || (this.drawconf !== undefined && this.drawconf.fulldraw)) {
            this.drawconf = { fulldraw: true };
        } else {
          if (this.drawconf === undefined) {
            this.drawconf = {...config, ...{fulldraw : false}};
          }
        }

        if (this.requestAnimationFrame) {
            return;
        }

        this.requestAnimationFrame = requestAnimationFrame(
            () => {
                this.drawCanvas();
            });
    }
    /**
     * Recalc index and then redraw
     * You need to call this if size of the data was change or columns witch was change is in active groupby or sort
     */
    public askForReIndex() {
        this.calcIndex();
        this.askForReDraw();
    }

    public setAllowEdit(allowEdit: boolean) {
        this.allowEdit = allowEdit;
    }

    public setRowColStyle(style?: CustomRowColStyle<T> | null) {
        if (style === null) {
            style = undefined;
        }
        if (this.customRowColStyle !== style) {
            this.customRowColStyle = style;
            this.askForReDraw();
        }
    }

    public setSort(sortCol?: Array<ICanvasTableColumnSort<T>>) {
        this.sortCol = sortCol;
        this.askForReIndex();
    }

    /**
     * Set new Data and then reindex and redraw
     * @param data new Data
     */
    public setData(data?: T[]) {
        if (data !== undefined) {
            this.data = data;
        }
        this.askForReIndex();
    }

    public updateColumns(col: Array<ICanvasTableColumnConf<T>>) {
        this.column = [];
        let i;
        for (i = 0; i < col.length; i++) {
            if (col[i].visible === false) { continue; }
            const index = this.column.length;
            this.column[index] = {
                ...{
                    align: Align.left,
                    allowEdit: true,
                    index,
                    leftPos: 0,
                    orginalCol: col[i],
                    rightPos: 0,
                    width: 50,
                }, ...col[i],
            };
            if (this.column[index].field === "__idxnum__" || this.column[index].field === "__rownum__") {
                this.column[index].allowEdit = false;
            }
        }
        this.needToCalc = true;
        this.calcColumn();
    }

    public addEvent(EventName: "edit", event: EventManagerEdit): void;
    public addEvent(eventName: "clickHeader", event: EventManagerClickHeader<T>): void;
    public addEvent(eventName: "click" | "dblClick", event: EventManagerClick<T>): void;
    public addEvent(eventName: "reCalcForScrollView", event: EventManagerReCalcForScrollView): void;
    public addEvent(eventName: string, event: any): void {
        this.getEvent(eventName).push(event);
    }

    public removeEvent(EventName: "edit", event: EventManagerEdit): void;
    public removeEvent(eventName: "clickHeader", event: EventManagerClickHeader<T>): void;
    public removeEvent(eventName: "click" | "dblClick", event: EventManagerClick<T>): void;
    public removeEvent(eventName: "reCalcForScrollView", event: EventManagerReCalcForScrollView): void;
    public removeEvent(eventName: string, event: any): void {
        const e = this.getEvent(eventName);
        const index = e.indexOf(event);
        if (index !== -1) {
            e.splice(index, 1);
        }
    }

    public setUpdateData(row: number, field: string, data: any) {
        const oldData = this.getUpdateDataOrData(row, field);
        if (!this.editData[row]) {
            this.editData[row] = {};
        }
        this.editData[row][field] = data;
        this.fireEdit(row, field, data, oldData);
    }

    public getUpdateData(row: number, field: string): {data: any} | undefined {
        const rowData = this.editData[row];
        if (!rowData) { return undefined; }
        if (rowData.hasOwnProperty(field)) {
            return { data: rowData[field] };
        }
        return undefined;
    }

    public getUpdateDataOrData(row: number, field: string): any {
        const rowData = this.editData[row];
        if (rowData && rowData.hasOwnProperty(field)) {
            return rowData[field];
        }
        return (this.data[row] as any)[field];
    }

    protected logError(value: string, value2?: any, value3?: any): void {
        console.log(value, value2, value3);
    }

    protected setR(r: number) {
        if (this.r === r) { return; }
        this.r = r;
        this.needToCalc = true;
    }

    protected abstract setCursor(cusor?: string): void;
    protected abstract askForExtentedMouseMoveAndMaouseUp(): void;
    protected abstract askForNormalMouseMoveAndMaouseUp(): void;
    protected abstract scrollViewChange(): void;

    protected setIsFocus(isFocus: boolean) {
        if (this.isFocus !== isFocus) {
            this.isFocus = isFocus;
            if (this.allowEdit) {
                this.askForReDraw();
            }
        }
    }

    protected fireEdit(row: CanvasTableRowItem, col: string, newData: any, oldData: any) {
        let i;
        for (i = 0; i < this.eventEdit.length; i++) {
            try {
                this.eventEdit[i](this, row, col, newData, oldData);
            } catch {
                this.logError("eventEdit");
            }
        }
    }

    protected fireDblClick(row: CanvasTableRowItem, col: ICanvasTableColumn<T> | null) {
        let i;
        for (i = 0; i < this.eventDblClick.length; i++) {
            try {
                this.eventDblClick[i](this, row, col === null ? null : col.orginalCol);
            } catch {
                this.logError("fireDblClick");
            }
        }
    }

    protected fireClick(row: CanvasTableRowItem, col: ICanvasTableColumn<T> | null) {
        let i;
        for (i = 0; i < this.eventClick.length; i++) {
            try {
                this.eventClick[i](this, row, col === null ? null : col.orginalCol);
            } catch {
                this.logError("fireClick");
            }
        }
    }

    protected fireClickHeader(col: ICanvasTableColumn<T> | null) {
        let i;
        for (i = 0; i < this.eventClick.length; i++) {
            try {
                this.eventClickHeader[i](this, col === null ? null : col.orginalCol);
            } catch {
                this.logError("fireClickHeader");
            }
        }
    }

    protected clickOnHeader(col: ICanvasTableColumn<T> | null) {
        if (col) {
            if (this.sortCol && this.sortCol.length === 1 &&
                this.sortCol[0].col === col.orginalCol && this.sortCol[0].sort === Sort.ascending) {
                this.setSort([{col: col.orginalCol, sort: Sort.descending}]);
            } else {
                this.setSort([{col: col.orginalCol, sort: Sort.ascending}]);
            }
        }
    }

    protected wheel(deltaMode: number, deltaX: number, deltaY: number) {
        if (this.scrollView) {
            this.scrollView.onScroll(deltaMode, deltaX, deltaY);
        }
    }

    protected dblClick(x: number, y: number) {
        const col = this.findColByPos(x);
        if (y <= this.headerHeight) {
            return;
        }
        const row =  this.findRowByPos(y);
        if (this.allowEdit && row && typeof row.select === "number" && col !== null) {
            if (!col.allowEdit) { return; }

            this.updateForEdit(col, row.select);
        }

        this.fireDblClick(row === null ? null : row.select, col);
    }

    protected abstract updateForEdit(orginalCol: ICanvasTableColumn<T>, row: number): void;

    protected mouseDown(x: number, y: number): void {
        if (this.dataIndex === undefined) { return; }
        if (this.scrollView && this.scrollView.onMouseDown(x, y)) {
            return;
        }
        const col = this.findColByPos(x);
        if (y <= this.headerHeight) {
            const colSplit = this.findColSplit(x);
            if (colSplit !== null) {
                this.columnResize = {x, col: this.column[colSplit]};
                this.askForExtentedMouseMoveAndMaouseUp();
                this.fireClickHeader(col);
                return;
            }
            this.clickOnHeader(col);
            this.fireClickHeader(col);
            return;
        }

        const row =  this.findRowByPos(y);
        if (row && typeof row.select === "number" && col !== null) {
            if (this.selectColValue !== col || this.selectRowValue !== row) {
                this.selectColValue = col;
                this.selectRowValue = row;
                this.askForReDraw();
            }
        } 
        this.fireClick(row === null ? null : row.select, col);
    }

    
    protected mouseMove(x: number, y: number) {
        if (!this.scrollView) { return; }
        if (this.resizeColIfNeed(x)) {
            return;
        }
        if (this.scrollView.onMouseMove(x, y)) {
            this.setCursor();
            return;
        }
        if (y < this.headerHeight && this.findColSplit(x) !== null) {
            this.setCursor("col-resize");
        } else {
            this.setCursor();
        }
    }
    

    protected mouseUp(x: number, y: number) {
        if (this.columnResize) {
            this.columnResize = undefined;
            this.askForNormalMouseMoveAndMaouseUp();
        }
        if (this.scrollView && this.scrollView.onMouseUp(x, y)) { return; }
    }

    protected mouseMoveExtended(x: number, y: number) {
        if (this.resizeColIfNeed(x)) {
            return;
        }

        if (this.scrollView && this.scrollView.onExtendedMouseMove(x, y)) { return; }
    }

    protected mouseUpExtended(x: number, y: number) {
        if (this.columnResize) {
            this.columnResize = undefined;
            this.askForNormalMouseMoveAndMaouseUp();
        }
        if (this.scrollView && this.scrollView.onExtendedMouseUp(x, y)) { return; }
    }

    protected keydown(keycode: number) {
        if (this.scrollView !== undefined &&
            this.selectColValue !== undefined &&
            this.selectRowValue !== null &&
            typeof this.selectRowValue.select === "number") {
                const index = this.selectRowValue.path[this.selectRowValue.path.length - 1];
                let y;
                switch (keycode) {
                    case 40: // Down
                        if (this.selectRowValue.index === index.list.length - 1) { return; }
                        this.selectRowValue.index++;
                        this.selectRowValue.select = index.list[this.selectRowValue.index];
                        y = this.findTopPosByRow(this.selectRowValue);
                        if (y !== undefined) {
                            y = y - (this.canvasHeight -
                                ((this.headerHeight +
                                    (this.scrollView.getHasScrollBarX() ? this.scrollView.getScrollbarSize() : 0))
                                    * this.r));
                            if (this.scrollView.getPosY() < y) {
                                this.scrollView.setPosY(y);
                            }
                        }
                        this.askForReDraw();
                        break;
                    case 38: // Up
                        if (this.selectRowValue.index === 0) { return; }
                        this.selectRowValue.index--;
                        this.selectRowValue.select = index.list[this.selectRowValue.index];
                        y = this.findTopPosByRow(this.selectRowValue);
                        if (y !== undefined) {
                            y = y - this.headerHeight * this.r;
                            if (this.scrollView.getPosY() > y) {
                                this.scrollView.setPosY(y);
                            }
                        }
                        this.askForReDraw();
                        break;
                    case 37: // Left
                        if (this.selectColValue.index === 0) { return; }
                        this.selectColValue =  this.column[this.selectColValue.index - 1];
                        if (this.selectColValue.leftPos < this.scrollView.getPosX()) {
                            this.scrollView.setPosX(this.selectColValue.leftPos);
                        }
                        this.askForReDraw();
                        break;
                    case 39: // Right
                        if (this.selectColValue.index === this.column.length - 1) { return; }
                        this.selectColValue =  this.column[this.selectColValue.index + 1];
                        if (this.selectColValue.rightPos > this.scrollView.getPosX() + this.canvasWidth) {
                            this.scrollView.setPosX(this.selectColValue.rightPos - this.canvasWidth);
                        }
                        this.askForReDraw();
                        break;
                    case 13: // Enter
                        if (this.allowEdit && typeof this.selectRowValue.select === "number") {
                            if (!this.selectColValue.allowEdit) { return; }
                            this.updateForEdit(this.selectColValue, this.selectRowValue.select);
                        }
                    default:
                        break;
                }
            } 
    }

    protected calcRect(col: ICanvasTableColumn<T>, row: number): IUpdateRect | undefined {
        if (!this.scrollView ) {
            return;
        }

        const topPos = this.findTopPosByRow(row);
        if (topPos === undefined) {
            return;
        }

        const y = (topPos - this.scrollView.getPosY()) / this.r;
        const x = -(this.scrollView.getPosX() / this.r) + (col.leftPos / this.r);
        const top = y;
        const left = x;

        let clipTop: number | undefined;
        const clipRight: number | undefined = undefined;
        const clipBottom: number | undefined = undefined;
        let clipLeft: number | undefined;

        if (y < this.headerHeight) {
            // rect(<top>, <right>, <bottom>, <left>)
            if (x < 0) {
                clipTop = -y + this.headerHeight;
                clipLeft = -x;
            } else {
                clipTop = -y + this.headerHeight;
            }
        } else if (x < 0) {
            clipLeft = -x;
        }

        return {
            cellHeight: this.cellHeight,
            clipBottom,
            clipLeft,
            clipRight,
            clipTop,
            left,
            top,
            width: col.width,
            x,
            y,
        };

    }

    protected findColSplit(x: number): number | null {
        if (this.scrollView === undefined) { return null; }
        const posXNeg = -this.scrollView.getPosX();
        for (let i = 0; i < this.column.length; i++) {
            const d = ((posXNeg + this.column[i].rightPos) / this.r) - x;
            if (-3 <= d && d <= 3) {
                return i;
            }
        }
        return null;
    }

    protected findColByPos(x: number): ICanvasTableColumn<T> | null {
        if (this.scrollView === undefined) { return null; }
        const pos = this.scrollView.getPosX() / this.r + x;
        let w = 0;
        let i;
        for (i = 0; i < this.column.length; i++) {
            w += this.column[i].width;
            if (w >= pos) {
                return this.column[i];
            }
        }
        return null;
    }

    protected findRowByPos(y: number): CanvasTableRowItemSelect {
        if (this.dataIndex === undefined || this.scrollView === undefined) { return null; }
        let pos = -this.scrollView.getPosY() / this.r + this.headerHeight;
        const cellHeight = this.cellHeight;
        const find = (items: ICanvasTableIndexsColMode):
                    ICanvasTableRowItemSelectColMode | null => {
            let i;
            const h = items.list.length * cellHeight;
            if (y > pos + h) {
                pos += h;
            } else {
                i = Math.trunc((-pos + y) / cellHeight);
                pos += i * cellHeight;
                if (i < items.list.length) {
                    return { path: [items], select: items.list[i], index: i};
                }
                return null;
            }
            return null;
        };
        return find(this.dataIndex.index);
    }

    protected findTopPosByRow(rowValue: number | ICanvasTableRowItemSelectColMode): number | undefined {
        if (this.dataIndex === undefined || this.scrollView === undefined || rowValue === null) { return undefined; }
        let row: number | undefined;
        if (typeof rowValue === "number") {
            row = rowValue;
        } else {
            if (typeof rowValue.select === "number") {
                row = rowValue.select;
            } else {
            }
        }
        let pos = this.headerHeight * this.r;
        const cellHeight = this.cellHeight * this.r;

        const find = (items: ICanvasTableIndexsColMode): number | undefined => {
            let i;    
            if (row === undefined) {
                pos += cellHeight * items.list.length;
            } else {
                for (i = 0; i < items.list.length; i++) {
                    if (items.list[i] === row) {
                        return pos;
                    }
                    pos += cellHeight;
                }
            }
            return undefined;
        };

        return find(this.dataIndex.index);
    }

    protected calcIndex() {
        if (this.data === undefined) {
            return;
        }
        const index: number[] = [];
        let i;

        for (i = 0; i < this.data.length; i++) {
            index[index.length] = i;
        }
        
        const sortCol = this.sortCol;
        if (sortCol && sortCol.length) {
            index.sort((a: number, b: number) => {
                let sortColIndex;
                for (sortColIndex = 0; sortColIndex < sortCol.length; sortColIndex++) {
                    let d;
                    const col = sortCol[sortColIndex];
                    switch (col.col.field) {
                        case "__rownum__":
                            d = a - b;
                            if (d !== 0) { return d * col.sort; }
                            break;
                        default:
                            const da = this.getUpdateDataOrData(a, col.col.field);
                            const db = this.getUpdateDataOrData(b, col.col.field);
                            if (da === undefined || da === null) {
                                if (db === undefined || db === null) {
                                    continue;
                                }
                                return col.sort;
                            }
                            if (db === undefined || db === null) {
                                return -1 * col.sort;
                            }
                            if (typeof da === "string" && typeof db === "string") {
                                if (da === "") {
                                    if (db === "") {
                                        continue;
                                    }
                                    return col.sort;
                                }

                                if (db === "") {
                                    return -1 * col.sort;
                                }
                                d = da.localeCompare(db);
                                if (d !== 0) { return d * col.sort; }
                                continue;
                            }
                            if (da > db) {
                                return col.sort;
                            }
                            if (da < db) {
                                return -1 * col.sort;
                            }
                    }
                }
                return 0;
            });
        }

        this.dataIndex =  {
            index: { list: index }
        };
    }

    protected reCalcForScrollView() {
        if (this.dataIndex === undefined) { return; }
        let w: number | undefined = 1;
        if (this.column) {
            for (let i = 0; i < this.column.length; i++) {
                w += this.column[i].width;
            }
        } else {
            w = undefined;
        }
        const h = this.cellHeight * this.dataIndex.index.list.length;
        if (this.scrollView && w !== undefined) {
            this.scrollView.setSize(this.r, this.canvasWidth, this.canvasHeight, w * this.r, h * this.r);
        }
    }

    protected setCanvasSize(width: number, height: number): void {
        this.canvasWidth = width;
        this.canvasHeight = height;
        this.reCalcForScrollView();
    }

    protected doReize(width: number, height: number) {
        this.setCanvasSize(width * this.r, height * this.r);
    }

    protected drawCanvas() {
        if (!this.scrollView || !this.context || !this.dataIndex) {
            return;
        }

        if (this.needToCalc) {
            this.calcColumn();
        }

        this.context.font = this.config.fontStyle + " " + this.config.fontSize * this.r + "px " + this.config.font;
        const posX = this.scrollView.getPosX();

        this.minFontWidth = this.context.measureText("i").width;
        this.maxFontWidth = this.context.measureText("Æ").width;
        
        if (this.drawconf !== undefined && this.drawconf.fulldraw) {
            this.drawconf = undefined;
        }
        const drawConf = this.drawconf;
        this.drawconf = undefined;

        this.requestAnimationFrame = undefined;

        if (this.scrollView.beforeDraw()) {
            this.askForReDraw();
        }

        const headerHeight = this.headerHeight * this.r;
        const offsetLeft = 5 * this.r;
        if (drawConf === undefined) {
            this.context.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        }

        this.context.fillStyle = this.config.fontColor;
        this.context.strokeStyle = this.config.lineColor;
        const colStart = 0;
        const colEnd = this.column.length;

        const height = this.cellHeight * this.r;
        const index = this.dataIndex.index;
        let pos: number;
        let i: number;
        let maxPos: number;

        maxPos = this.canvasHeight + this.cellHeight + 5 * this.r;
        i = Math.floor(this.scrollView.getPosY() / height);
        pos = (-this.scrollView.getPosY() + (i + 1) * height);
        pos += 14 * this.r;
        while (pos < maxPos) {
            if(i >= index.list.length) {
                break;
            }
            this.drawRowItem(this.context, index.list[i], i, pos, posX, height,
                                offsetLeft, colStart, colEnd, drawConf);
            pos += height;
            i++;
        }

        this.context.beginPath();
        const end = pos - height + 4 * this.r;
        const firstLine = -this.scrollView.getPosX() + this.column[colStart].leftPos;
        this.context.moveTo(firstLine, headerHeight);
        this.context.lineTo(firstLine, end);
        for (let col = colStart; col < colEnd; col++) {
            const rightPos = -this.scrollView.getPosX() + this.column[col].rightPos;
            this.context.moveTo(rightPos, headerHeight);
            this.context.lineTo(rightPos, end);
        }
        this.context.stroke();
                
        // Header
        pos = 14 * this.r;
        this.context.font = this.config.headerFontStyle + " " +
            (this.config.headerFontSize * this.r) + "px " + this.config.headerFont;
        this.context.fillStyle = this.config.headerFontColor;
        this.context.clearRect(0, 0, this.canvasWidth, headerHeight);
        this.context.beginPath();
        this.context.strokeStyle = this.config.lineColor;

        const leftPos = -this.scrollView.getPosX() + this.column[colStart].leftPos;
        this.context.moveTo(leftPos, 0);
        this.context.lineTo(leftPos, headerHeight);

        for (let col = colStart; col < colEnd; col++) {
            const rightPos = -this.scrollView.getPosX() + this.column[col].rightPos;
            this.context.moveTo(rightPos, 0);
            this.context.lineTo(rightPos, headerHeight);
        }
        this.context.stroke();

        this.context.textAlign = "left";
        for (let col = colStart; col < colEnd; col++) {
            let needClip: boolean;
            const colItem = this.column[col];
            const colWidth = this.column[col].width * this.r - offsetLeft * 2;
            const data = this.column[col].header;
            if (colWidth > data.length * this.maxFontWidth) {
                needClip = false;
            } else if (colWidth < data.length * this.minFontWidth) {
                needClip = true;
            } else {
                needClip = colWidth < this.context.measureText(data).width;
            }

            this.context.fillStyle = this.config.headerBackgroundColor;
            if (needClip) {
                this.context.fillRect(-posX + colItem.leftPos + 1, pos - height + 4 * this.r + 1,
                    colItem.width * this.r - 1 * 2, height - 3);
                this.context.save();
                this.context.beginPath();
                this.context.rect(-this.scrollView.getPosX() + colItem.leftPos + offsetLeft, pos - height,
                    colItem.width * this.r - offsetLeft * 2, height);
                this.context.clip();
                this.context.fillStyle = this.config.headerFontColor;
                this.context.fillText(data, -this.scrollView.getPosX() + colItem.leftPos + offsetLeft, pos);
                this.context.restore();
            } else {
                this.context.fillRect(-posX + colItem.leftPos + 1, pos - height + 4 * this.r + 1,
                    colItem.width * this.r - 1 * 2, height - 3);
                this.context.fillStyle = this.config.headerFontColor;
                this.context.fillText(data,  -this.scrollView.getPosX() + colItem.leftPos + offsetLeft, pos);
            }

            if (this.config.headerDrawSortArrow) {
                let sort: Sort|undefined;
                if (this.sortCol) {
                    let sortIndex;
                    for (sortIndex = 0; sortIndex < this.sortCol.length; sortIndex++) {
                        if (this.sortCol[sortIndex].col === this.column[col].orginalCol) {
                            sort = this.sortCol[sortIndex].sort;
                            break;
                        }
                    }
                }
                if (sort) {
                    this.context.fillStyle = this.config.headerDrawSortArrowColor;
                    const startX =  -this.scrollView.getPosX() + this.column[col].rightPos;
                    if (sort === Sort.ascending) {
                        this.context.beginPath();
                        this.context.moveTo(startX - 12 * this.r, 5 * this.r);
                        this.context.lineTo(startX - 4 * this.r, 5 * this.r);
                        this.context.lineTo(startX - 8 * this.r, 14 * this.r);
                        this.context.fill();
                    } else {
                        this.context.beginPath();
                        this.context.moveTo(startX - 8 * this.r, 5 * this.r);
                        this.context.lineTo(startX - 12 * this.r, 14 * this.r);
                        this.context.lineTo(startX - 4 * this.r, 14 * this.r);
                        this.context.fill();
                    }
                }
            }
        }

        this.context.beginPath();
        this.context.moveTo(0, pos + 4 * this.r);
        this.context.lineTo(
            Math.min(-this.scrollView.getPosX() + this.column[this.column.length - 1].rightPos, this.canvasWidth),
            pos + 4 * this.r);
        this.context.stroke();
        this.scrollView.draw();
    }

    private calcColumn() {
        this.needToCalc = false;
        let leftPos = 1;
        let i;
        for (i = 0; i < this.column.length; i++) {
            this.column[i].leftPos = leftPos;
            leftPos += this.column[i].width * this.r;
            this.column[i].rightPos = leftPos;
        }
        this.reCalcForScrollView();
    }

    private getEvent(eventName: string): any[] {
        switch (eventName) {
            case "click":
                return this.eventClick;
            case "dblClick":
                return this.eventDblClick;
            case "clickHeader":
                return this.eventClickHeader;
            case "reCalcForScrollView":
                return this.eventReCalcForScrollView;
            case "edit":
                return this.eventEdit;
            default:
                throw new Error("unknown;");
        }
    }

    private resizeColIfNeed(x: number): boolean {
        if (this.columnResize === undefined) { return false; }
        const d = x - this.columnResize.x;
        const col = this.columnResize.col;
        if (d === 0 || col.width + d < 10) { return true; }
        col.width += d;
        this.columnResize.x = x;
        col.orginalCol.width = col.width;
        this.calcColumn();
        this.askForReDraw();
        return true;
    }

    private getDrawData(colItem: ICanvasTableColumn<T>, rowId: number, indexId: number): string {
        let data: string;
        switch (colItem.field) {
            case "__rownum__":
                data = rowId.toString();
                break;
            case "__idxnum__":
                data = indexId.toString();
                break;
            default:
                data = String(this.getUpdateDataOrData(rowId, colItem.field));
        }

        if (colItem.customData) {
            data = colItem.customData(this, data, this.data[rowId], this.data, rowId, colItem);
        }

        return data;
    }

    private drawRowItem(context: ICanvasContext2D, indexId: number, i: number, pos: number, posX: number,
                        height: number, offsetLeft: number, colStart: number, colEnd: number,
                        drawConf: IDrawConfig | undefined): void {
        if (drawConf !== undefined && drawConf.drawOnly !== undefined) {
            let found = false;
            let index;
            for (index = 0; index < drawConf.drawOnly.length; index++) {
                if (drawConf.drawOnly[index] === indexId) {
                    found = true;
                    break;
                }
            }

            if (!found) {
                return;
            }
        }
        const isOver = this.overRowValue === indexId;
        const isSepra =  i % 2 === 0;

        for (let col = colStart; col < colEnd; col++) {
            const colItem = this.column[col];
            const data = this.getDrawData(colItem, indexId, i);

            let customStyle: ICanvasTableRowColStyle | undefined | null;
            if (this.customRowColStyle) {
                try {
                    customStyle = this.customRowColStyle(
                        this.data, this.data[indexId], colItem.orginalCol, isOver, isSepra, data);
                } catch {
                    this.logError("Canvas Table customRowColStyle");
                }
            }

            if (!customStyle) {
                customStyle = {};
            }

            let needClip: boolean;
            const colWidth = colItem.width * this.r - offsetLeft * 2;
            if (data === null || data === undefined) {
                return;
            }
            if (colWidth > data.length * this.maxFontWidth) {
                needClip = false;
            } else if (colWidth < data.length * this.minFontWidth) {
                needClip = true;
            } else {
                needClip = colWidth < context.measureText(data).width;
            }

            let x;
            switch (customStyle.align === undefined ? colItem.align : customStyle.align) {
                case Align.left:
                default:
                    x = colItem.leftPos + offsetLeft;
                    if (context.textAlign !== "left") {
                        context.textAlign = "left";
                    }
                    break;
                case Align.right:
                    x = colItem.rightPos - offsetLeft;
                    if (context.textAlign !== "right") {
                        context.textAlign = "right";
                    }
                    break;
                case Align.center:
                    x = colItem.leftPos + colItem.width * this.r * 0.5 - offsetLeft;
                    if (context.textAlign !== "center") {
                        context.textAlign = "center";
                    }
                    break;
            }

            if (customStyle.backgroundColor !== undefined) {
                context.fillStyle = customStyle.backgroundColor;
            } else {
                if (isOver) {
                    context.fillStyle = this.config.hoverBackgroundColor;
                } else {
                    context.fillStyle = isSepra ?  this.config.sepraBackgroundColor : this.config.backgroundColor ;
                }
            }

            let lastFont;
            if (customStyle.font !== undefined || customStyle.fontSize !== undefined ||
                customStyle.fontStyle !== undefined) {
                lastFont = context.font;
                context.font =
                    (customStyle.fontStyle === undefined ? this.config.fontStyle : customStyle.fontStyle)
                     + " " +
                    (customStyle.fontSize === undefined ? this.config.fontSize : customStyle.fontSize)
                     * this.r + "px " +
                    (customStyle.font === undefined ? this.config.font : customStyle.font);
            }

            if (needClip) {
                context.fillRect(-posX + colItem.leftPos + 1, pos - height + 4 * this.r + 1,
                     colItem.width * this.r - 1 * 2, height - 3);
                context.save();
                context.beginPath();
                context.rect(-posX + colItem.leftPos + offsetLeft, pos - height,
                     colItem.width * this.r - offsetLeft * 2, height);
                context.clip();
                context.fillStyle = customStyle.fontColor === undefined ?
                                         this.config.fontColor : customStyle.fontColor;
                context.fillText(data, -posX + x, pos);
                context.restore();
            } else {
                context.fillRect(-posX + colItem.leftPos + 1, pos - height + 4 * this.r + 1,
                                      colItem.width * this.r - 1 * 2, height - 3);
                context.fillStyle = customStyle.fontColor === undefined ?
                                         this.config.fontColor : customStyle.fontColor;
                context.fillText(data, -posX + x, pos);
            }
            if (lastFont) {
                context.font = lastFont;
            }
        }

        if (drawConf === undefined) {
            context.beginPath();
            context.moveTo(0, pos + 4 * this.r);
            context.lineTo(
                                Math.min(-posX + this.column[this.column.length - 1].rightPos,
                                this.canvasWidth), pos + 4 * this.r);
            context.stroke();
        }

        if (this.allowEdit && this.isFocus &&
             this.selectRowValue && this.selectRowValue.select === indexId &&
             this.selectColValue !== undefined) {
            for (let col = colStart; col < colEnd; col++) {
                if (this.selectColValue.index === col) {
                    const lastStroke = context.strokeStyle;
                    const lastLineWidth = context.lineWidth;
                    context.strokeStyle = this.config.selectLineColor;
                    context.lineWidth = 3;
                    context.beginPath();
                    context.rect(-posX + this.selectColValue.leftPos + 2,
                        pos + 4 * this.r - this.cellHeight * this.r + 2,
                        this.selectColValue.width * this.r - 4, this.cellHeight * this.r - 4);
                    context.stroke();
                    context.strokeStyle = lastStroke;
                    context.lineWidth = lastLineWidth;
                    break;
                }
            }
        }
    }
}