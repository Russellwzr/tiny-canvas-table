import { CanvasColor, ICanvasContext2D } from "./types/CanvasContext2D";
import { Align, CustomRowColStyle, 
         ICanvasTableColumn, ICanvasTableColumnConf, ICanvasTableColumnSort,
         ICanvasTableRowColStyle, IEditRowItem, IUpdateRect, Sort } from "./types/CanvasTableColum";
import { CanvasTableIndex, 
         CanvasTableRowItemSelect, 
         ICanvasTableRowItemSelectColMode } from "./types/CustomCanvasIndex";
import { IDrawable } from "./types/Drawable";
import { IScrollViewConfig, ScrollView } from "./ScrollView";


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
     * Every secound row can have another backgound color sepra
     */
    sepraBackgroundColor: CanvasColor;
}

const defaultConfig: ICanvasTableConfig = {
    backgroundColor: "white",
    font: "arial",
    fontColor: "black",
    fontSize: 16,
    fontStyle: "",
    headerBackgroundColor: "#ecf1f5",
    headerDrawSortArrow: true,
    headerDrawSortArrowColor: "#5f6163",
    headerFont: "arial",
    headerFontColor: "black",
    headerFontSize: 16,
    headerFontStyle: "bold",
    lineColor: "#e1e4e8",
    selectLineColor: "#1c1cfc",
    sepraBackgroundColor: "#faf9fb",
};

export abstract class CustomCanvasTable<T = any> implements IDrawable {
    protected context?: ICanvasContext2D;
    protected requestAnimationFrame?: number;
    protected r: number = 1;
    protected data: T[] = [];
    protected allowEdit: boolean = false;

    protected scrollView?: ScrollView;

    protected headerHeight = 36;
    protected cellHeight = 36;
    protected dataIndex?: CanvasTableIndex = undefined;
    protected config: ICanvasTableConfig = defaultConfig;
    protected column: Array<ICanvasTableColumn<T>> = [];

    private needToCalc: boolean = true;

    private isFocus: boolean = false;
    private minFontWidth: number = 1;
    private maxFontWidth: number = 1;
    private customRowColStyle?: CustomRowColStyle<T>;
    private sortCol?: Array<ICanvasTableColumnSort<T>>;
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
        return true;
    }

    /**
     * Let CanvasTable redraw
     */
    public askForReDraw() {

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

    public setUpdateData(row: number, field: string, data: any) {
        if (!this.editData[row]) {
            this.editData[row] = {};
        }
        this.editData[row][field] = data;
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
        if (y <= this.headerHeight) {
            return;
        }
        const col = this.findColByPos(x);
        const row = this.findRowByPos(y);
        if (this.allowEdit && row && typeof row.select === "number" && col !== null) {
            if (!col.allowEdit) { return; }
            this.updateForEdit(col, row.select);
        }
    }

    protected abstract updateForEdit(orginalCol: ICanvasTableColumn<T>, row: number): void;

    protected mouseDown(x: number, y: number): void {
        if (this.dataIndex === undefined || 
            (this.scrollView && this.scrollView.onMouseDown(x, y))) { 
            return;
        }
        const col = this.findColByPos(x);
        if (y <= this.headerHeight) {
            const colSplit = this.findColSplit(x);
            if (colSplit !== null) {
                // resize
                this.columnResize = {x, col: this.column[colSplit]};
                this.askForExtentedMouseMoveAndMaouseUp();
            } else {
                // sort
                this.clickOnHeader(col);
            }  
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
    }

    protected mouseMove(x: number, y: number) {
        if (!this.scrollView) { 
            return; 
        }
        if (this.resizeColIfNeed(x)) {
            return;
        }
        if (this.scrollView.onMouseMove(x, y)) {
            this.setCursor();
            return;
        }
        if (y < this.headerHeight && this.findColSplit(x) !== null) {
            // add pointer style for col resize
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
        this.scrollView?.onMouseUp(x, y);
    }

    protected mouseMoveExtended(x: number, y: number) {
        if (this.resizeColIfNeed(x)) {
            return;
        }
        this.scrollView?.onExtendedMouseMove(x, y);
    }

    protected mouseUpExtended(x: number, y: number) {
        if (this.columnResize) {
            this.columnResize = undefined;
            this.askForNormalMouseMoveAndMaouseUp();
        }
        this.scrollView?.onExtendedMouseUp(x, y);
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
        const items = this.dataIndex.index;
        const pos = -this.scrollView.getPosY() / this.r + this.headerHeight;
        const h = items.list.length * this.cellHeight;
        if (y <= pos + h) {
            const i = Math.trunc((-pos + y) / this.cellHeight);
            if (i < items.list.length) {
                return { path: [items], select: items.list[i], index: i};
            }
        }
        return null;
    }

    protected findTopPosByRow(rowValue: number | ICanvasTableRowItemSelectColMode): number | undefined {
        if (this.dataIndex === undefined || this.scrollView === undefined || rowValue === null) { return undefined; }
        let row: number | undefined;
        if (typeof rowValue === "number") {
            row = rowValue;
        } else if (typeof rowValue.select === "number") {
            row = rowValue.select;
        } else {
            return undefined;
        }
        let pos = this.headerHeight * this.r;
        const cellHeight = this.cellHeight * this.r;
        const items = this.dataIndex.index;
        for (let i = 0; i < items.list.length; i++) {
            if (items.list[i] === row) {
                return pos;
            }
            pos += cellHeight;
        }
        return undefined;
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
            this.scrollView.setSize(this.r, this.canvasWidth, this.canvasHeight, this.headerHeight, w * this.r, h * this.r);
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

        this.requestAnimationFrame = undefined;

        if (this.scrollView.beforeDraw()) {
            this.askForReDraw();
        }


        this.context.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        this.context.fillStyle = this.config.fontColor;
        this.context.strokeStyle = this.config.lineColor;
        this.context.font = this.config.fontStyle + " " + this.config.fontSize * this.r + "px " + this.config.font;
        
        this.minFontWidth = this.context.measureText("i").width;
        this.maxFontWidth = this.context.measureText("Æ").width;

        const posX = this.scrollView.getPosX();
        const headerHeight = this.headerHeight * this.r;
        const offsetLeft = 14 * this.r; // font offset
        const colStart = 0;
        const colEnd = this.column.length;
        const height = this.cellHeight * this.r;
        const index = this.dataIndex.index;
        const maxPos = this.canvasHeight + height + 4 * this.r;

        // draw data-row item
        let i = Math.max(0, Math.floor((this.scrollView.getPosY() - headerHeight) / height)); // row-index
        let pos = -this.scrollView.getPosY() + headerHeight + (i + 1) * height; // y-axis coordinate 
        while (pos < maxPos && i < index.list.length) {
            this.drawRowItem(this.context, index.list[i], i, pos, posX, height,
                                offsetLeft, colStart, colEnd);
            pos += height;
            i++;
        }

        // draw data-row vertical line
        this.context.beginPath();
        const end = pos - height;
        const firstLine = -posX + this.column[colStart].leftPos;
        this.context.moveTo(firstLine, headerHeight);
        this.context.lineTo(firstLine, end);
        for (let col = colStart; col < colEnd; col++) {
            const rightPos = -posX + this.column[col].rightPos;
            this.context.moveTo(rightPos, headerHeight);
            this.context.lineTo(rightPos, end);
        }
        this.context.stroke();
                
        // draw table header
        this.context.font = this.config.headerFontStyle + " " +
            (this.config.headerFontSize * this.r) + "px " + this.config.headerFont;
        this.context.fillStyle = this.config.headerFontColor;
        this.context.clearRect(0, 0, this.canvasWidth, headerHeight);
        
        // draw header row item
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
            const rectX = -posX + colItem.leftPos;
            if (needClip) {
                this.context.fillRect(rectX, 0, colItem.width * this.r, headerHeight);
                this.context.save();
                this.context.beginPath();
                this.context.rect(rectX + offsetLeft, 0, colItem.width * this.r - offsetLeft * 2, headerHeight);
                this.context.clip();
                this.context.fillStyle = this.config.headerFontColor;
                this.context.fillText(data, rectX + offsetLeft, headerHeight - 14 * this.r);
                this.context.restore();
            } else {
                this.context.fillRect(rectX, 0, colItem.width * this.r, headerHeight);
                this.context.fillStyle = this.config.headerFontColor;
                this.context.fillText(data,  rectX + offsetLeft, headerHeight - 14 * this.r);
            }

            // draw sort arrow
            if (this.config.headerDrawSortArrow) {
                let sort: Sort | undefined;
                if (this.sortCol) {
                    let sortIndex;
                    for (sortIndex = 0; sortIndex < this.sortCol.length; sortIndex++) {
                        if (this.sortCol[sortIndex].col === this.column[col].orginalCol) {
                            sort = this.sortCol[sortIndex].sort;
                            break;
                        }
                    }
                }
                if (sort !== undefined) {
                    this.context.fillStyle = this.config.headerDrawSortArrowColor;
                    const startX = -posX + this.column[col].rightPos;
                    if (sort === Sort.ascending) {
                        this.context.beginPath();
                        this.context.moveTo(startX - 20 * this.r, 14 * this.r);
                        this.context.lineTo(startX - 10 * this.r, 14 * this.r);
                        this.context.lineTo(startX - 15 * this.r, 20 * this.r);
                        this.context.fill();
                    } else {
                        this.context.beginPath();
                        this.context.moveTo(startX - 15 * this.r, 14 * this.r);
                        this.context.lineTo(startX - 20 * this.r, 20 * this.r);
                        this.context.lineTo(startX - 10 * this.r, 20 * this.r);
                        this.context.fill();
                    }
                }
            }
        }

        // draw header vertical line
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

        // draw scroll bar
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
                        height: number, offsetLeft: number, colStart: number, colEnd: number): void {

        const isSepra =  i % 2 === 0;

        for (let col = colStart; col < colEnd; col++) {
            const colItem = this.column[col];
            const data = this.getDrawData(colItem, indexId, i);

            let customStyle: ICanvasTableRowColStyle | undefined | null;
            if (this.customRowColStyle) {
                try {
                    customStyle = this.customRowColStyle(
                        this.data, this.data[indexId], colItem.orginalCol, isSepra, data);
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
                    x = colItem.leftPos + offsetLeft + colWidth * 0.5;
                    if (context.textAlign !== "center") {
                        context.textAlign = "center";
                    }
                    break;
            }

            if (customStyle.backgroundColor !== undefined) {
                context.fillStyle = customStyle.backgroundColor;
            } else {
                context.fillStyle = isSepra ? this.config.sepraBackgroundColor : this.config.backgroundColor;
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

            const rectX = -posX + colItem.leftPos;
            const rectY = pos - height;
            if (needClip) {
                context.fillRect(rectX, rectY, colItem.width * this.r, height);
                context.save();
                context.beginPath();
                context.rect(rectX + offsetLeft, rectY, colItem.width * this.r - offsetLeft * 2, height);
                context.clip();
                context.fillStyle = customStyle.fontColor === undefined ? this.config.fontColor : customStyle.fontColor;
                context.fillText(data, -posX + x, pos - 14 * this.r);
                context.restore();
            } else {
                context.fillRect(rectX, rectY, colItem.width * this.r, height);
                context.fillStyle = customStyle.fontColor === undefined ? this.config.fontColor : customStyle.fontColor;
                context.fillText(data, -posX + x, pos - 14 * this.r);
            }
            if (lastFont) {
                context.font = lastFont;
            }
        }

        // draw horizontal line
        context.beginPath();
        context.moveTo(0, pos);
        context.lineTo(Math.min(-posX + this.column[this.column.length - 1].rightPos, this.canvasWidth), pos);
        context.stroke();

        // draw select box
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
                    context.rect(
                        -posX + this.selectColValue.leftPos + 2 * this.r,
                        pos - this.cellHeight * this.r + 2 * this.r,
                        this.selectColValue.width * this.r - 4 * this.r, 
                        this.cellHeight * this.r - 4 * this.r
                    );
                    context.stroke();
                    context.strokeStyle = lastStroke;
                    context.lineWidth = lastLineWidth;
                    break;
                }
            }
        }
    }
}