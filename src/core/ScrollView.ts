import { CanvasColor, ICanvasContext2D } from "./types/CanvasContext2D";
import { IDrawable } from "./types/Drawable";

declare function setTimeout(callback: (...args: any[]) => void, ms: number, ...args: any[]): number;

export interface IScrollViewConfig {
   buttonHoverColor?: CanvasColor;
   buttonColor?: CanvasColor;
   backgroundColor?: CanvasColor;
}

interface IScrollViewConf {
    buttonHoverColor: CanvasColor;
    buttonColor: CanvasColor;
    backgroundColor: CanvasColor;
}

export class ScrollView {
    private readonly drawable: IDrawable;
    private readonly askForExtentedMouseMoveAndMaouseUp: () => void;
    private readonly askForNormalMouseMoveAndMaouseUp: () => void;
    private readonly scrollViewChange: () => void;

    private canvasWidth: number = -1;
    private canvasHeight: number = -1;
    private context: ICanvasContext2D;
    private height?: number;
    private width?: number;
    private r: number = 1;
    private timeout?: number; // implement a delay effect for scrolling while holding down the button

    private hasScrollBarY: boolean = false;
    /** 
     * mouse down - scrollBar Y
     */ 
    private scrollBarThumbDownY: boolean = false;
    /**
     * flag - mouse over scroll element
     */
    private isOverScrollUpY: boolean = false;
    private isOverScrollDownY: boolean = false;
    private isOverScollThumbY: boolean = false;
    /**
     * current scroll position value on Y
     */
    private posYvalue: number = 0;
    /**
     * scrollBarY Range
     */
    private scrollBarThumbMinY: number = -1;
    private scrollBarThumbMaxY: number = -1;
    private scrollBarPosMaxY: number = -1;
    /**
     * ratio: real_all_height / canvas_height
     */
    private pageY: number = -1;

    private hasScrollBarX: boolean = false;
    private scrollBarThumbDownX: boolean = false;
    private isOverScrollUpX: boolean = false;
    private isOverScrollDownX: boolean = false;
    private isOverScollThumbX: boolean = false;
    private posXvalue: number = 0;
    private scrollBarThumbMinX: number = -1;
    private scrollBarThumbMaxX: number = -1;
    private scrollBarPosMaxX: number = -1;
    private pageX: number = -1;

    private scrollbarSize = 10;
    private arrowSize = 8;
    private cellHeight = 36;
    private run: boolean = false;
    private runXOrY: boolean = false;
    private speed: number = 1;
    private scrollViewConfig: IScrollViewConf;

    public constructor(context: ICanvasContext2D, drawable: IDrawable, config: IScrollViewConfig | undefined,
                       askForExtentedMouseMoveAndMaouseUp: () => void,
                       askForNormalMouseMoveAndMaouseUp: () => void, scrollViewChange: () => void) {
        this.scrollViewChange = scrollViewChange;
        this.askForExtentedMouseMoveAndMaouseUp = askForExtentedMouseMoveAndMaouseUp;
        this.askForNormalMouseMoveAndMaouseUp = askForNormalMouseMoveAndMaouseUp;
        this.drawable = drawable;
        this.context = context;
        this.scrollViewConfig = {
             ...{
                backgroundColor: "#f0f0f0",
                buttonColor: "#b0b0b0",
                buttonHoverColor: "#808080",
            },  ...config };
    }

    public getPosY(): number {
        return this.posYvalue;
    }

    public setPosY(value: number) {
        if (!this.hasScrollBarY || value <= 0) {
            value = 0;
        }

        if (value > 0 && value > this.scrollBarPosMaxY) {
            value = this.scrollBarPosMaxY;
        }

        if (this.posYvalue !== value) {
            this.posYvalue = value;
            this.scrollViewChange.call(this.drawable);
            this.drawable.askForReDraw();
        }
    }

    public getPosX(): number {
        return this.posXvalue;
    }

    public setPosX(value: number) {
        if (!this.hasScrollBarX || value <= 0) {
            value = 0;
        }

        if (value > 0 && value > this.scrollBarPosMaxX) {
            value = this.scrollBarPosMaxX;
        }

        if (this.posXvalue !== value) {
            this.posXvalue = value;
            this.scrollViewChange.call(this.drawable);
            this.drawable.askForReDraw();
        }
    }

    public getScrollBarPosMaxY(): number {
        return this.scrollBarPosMaxY;
    }
    public getScrollBarPosMaxX(): number {
        return this.scrollBarPosMaxX;
    }
    public getHasScrollBarY(): boolean {
        return this.hasScrollBarY;
    }
    public getHasScrollBarX(): boolean {
        return this.hasScrollBarX;
    }
    public getScrollbarSize(): number {
        return this.scrollbarSize;
    }

    public draw() {
        if (this.height === undefined || this.width === undefined) {
            return;
        }

        const padding = (this.scrollbarSize - this.arrowSize) / 2;

        if (this.hasScrollBarY) {
            const canvasHeight = this.canvasHeight - (this.hasScrollBarX ? this.scrollbarSize * this.r : 0);
            const height = canvasHeight - this.r * this.arrowSize * 2 - this.r * 8;
            const ratioY = this.scrollBarPosMaxY === 0 ? 1 : (this.posYvalue / this.scrollBarPosMaxY);
            const scrollBarSizeY = Math.max(18 * this.r, (height / this.pageY));
            const scrollBarPosY = this.arrowSize * this.r + ratioY * (height - scrollBarSizeY);
            this.scrollBarThumbMinY = scrollBarPosY / this.r;
            this.scrollBarThumbMaxY = (scrollBarPosY + scrollBarSizeY) / this.r;

            // draw scroll bar background
            this.context.fillStyle = this.scrollViewConfig.backgroundColor;
            this.context.fillRect(this.canvasWidth - this.r * this.scrollbarSize, 0,
                                  this.r * this.scrollbarSize, canvasHeight);

            // draw scroll up button
            this.context.fillStyle = this.isOverScrollUpY ?
                        this.scrollViewConfig.buttonHoverColor : this.scrollViewConfig.buttonColor;
            this.context.beginPath();
            this.context.moveTo(this.canvasWidth - this.r * this.scrollbarSize * 0.5, this.r * 2);
            this.context.lineTo(this.canvasWidth - this.r * (this.arrowSize + padding), this.r * 10);
            this.context.lineTo(this.canvasWidth - this.r * padding, this.r * 10);
            this.context.fill();

            // draw scroll down button
            this.context.fillStyle = this.isOverScrollDownY ?
                        this.scrollViewConfig.buttonHoverColor : this.scrollViewConfig.buttonColor;
            this.context.beginPath();
            this.context.moveTo(this.canvasWidth - this.r * this.scrollbarSize * 0.5, canvasHeight - this.r * 2);
            this.context.lineTo(this.canvasWidth - this.r * (this.arrowSize + padding), canvasHeight - this.r * 10);
            this.context.lineTo(this.canvasWidth - this.r * padding, canvasHeight - this.r * 10);
            this.context.fill();

            // draw scroll button
            this.context.fillStyle = this.isOverScollThumbY ?
                        this.scrollViewConfig.buttonHoverColor : this.scrollViewConfig.buttonColor;
            this.context.beginPath();
            this.context.rect(
                this.canvasWidth - this.r * (this.scrollbarSize - 1), 
                scrollBarPosY + 4 * this.r, 
                (this.scrollbarSize - 2) * this.r, 
                scrollBarSizeY
            );
            this.context.fill();
        }

        if (this.hasScrollBarX) {
            const canvasWidth = this.canvasWidth - (this.hasScrollBarY ? this.scrollbarSize * this.r : 0);
            const width = canvasWidth - this.r * this.arrowSize * 2 - this.r * 8;
            const ratioX = this.scrollBarPosMaxX === 0 ? 1 : (this.posXvalue / this.scrollBarPosMaxX);
            const scrollBarSizeX = Math.max(18 * this.r, (width / this.pageX));
            const scrollBarPosX = this.arrowSize * this.r + ratioX * (width - scrollBarSizeX);
            this.scrollBarThumbMinX = scrollBarPosX / this.r;
            this.scrollBarThumbMaxX = (scrollBarPosX + scrollBarSizeX) / this.r;

            // draw scroll bar background
            this.context.fillStyle = this.scrollViewConfig.backgroundColor;
            this.context.fillRect(
                0, 
                this.canvasHeight - this.r * this.scrollbarSize,
                canvasWidth, 
                this.r * this.scrollbarSize
            );

            // draw scroll up button
            this.context.fillStyle = this.isOverScrollUpX ?
                    this.scrollViewConfig.buttonHoverColor : this.scrollViewConfig.buttonColor;
            this.context.beginPath();
            this.context.moveTo(this.r * 2, this.canvasHeight - this.r * this.scrollbarSize * 0.5);
            this.context.lineTo(this.r * 10, this.canvasHeight - this.r * (this.arrowSize + padding));
            this.context.lineTo(this.r * 10, this.canvasHeight - this.r * padding);
            this.context.fill();

            // draw scroll down button
            this.context.fillStyle = this.isOverScrollDownX ?
                    this.scrollViewConfig.buttonHoverColor : this.scrollViewConfig.buttonColor;
            this.context.beginPath();
            this.context.moveTo(canvasWidth - this.r * 2, this.canvasHeight - this.r * this.scrollbarSize * 0.5);
            this.context.lineTo(canvasWidth - this.r * 10, this.canvasHeight - this.r * (this.arrowSize + padding));
            this.context.lineTo(canvasWidth - this.r * 10, this.canvasHeight - this.r * padding);
            this.context.fill();

            // draw scroll button
            this.context.fillStyle = this.isOverScollThumbX ?
                    this.scrollViewConfig.buttonHoverColor : this.scrollViewConfig.buttonColor;
            this.context.beginPath();
            this.context.rect(
                scrollBarPosX + 4 * this.r, 
                this.canvasHeight - this.r * (this.scrollbarSize - 1), 
                scrollBarSizeX,
                (this.scrollbarSize - 2) * this.r, 
            );
            this.context.fill();
        }

        if (this.hasScrollBarX && this.hasScrollBarY) {
            this.context.fillStyle = this.scrollViewConfig.backgroundColor;
            this.context.fillRect(
                this.canvasWidth - this.r * this.scrollbarSize,
                this.canvasHeight - this.r * this.scrollbarSize,
                this.r * this.scrollbarSize, 
                this.r * this.scrollbarSize
            );
        }
    }

    public setSize(r: number, canvasWidth: number, canvasHeight: number, headerHeight: number, width?: number, height?: number) {
        this.canvasHeight = canvasHeight;
        this.canvasWidth = canvasWidth;
        this.width = width;
        this.height = height;
        this.r = r;

        if (this.height === undefined || this.width === undefined) {
            this.hasScrollBarX = false;
            this.hasScrollBarY = false;
            this.scrollBarPosMaxX = 0;
            this.scrollBarPosMaxY = 0;
            return;
        }

        if ((this.height / (this.canvasHeight - (headerHeight + this.scrollbarSize) * this.r) > 1) &&
            (this.width / (this.canvasWidth - this.scrollbarSize * this.r) > 1)) {
            // has X and Y
            this.pageY = this.height / (this.canvasHeight - (headerHeight + this.scrollbarSize) * this.r);
            this.hasScrollBarY = true;
            this.scrollBarPosMaxY  = this.height - (this.canvasHeight - (headerHeight + this.scrollbarSize) * this.r);
            
            this.pageX = this.width / (this.canvasWidth - this.scrollbarSize * this.r);
            this.hasScrollBarX = true;
            this.scrollBarPosMaxX  = this.width - (this.canvasWidth - this.scrollbarSize * this.r);
        } else {
            // has x or Y
            this.pageY = this.height / (this.canvasHeight - headerHeight * this.r);
            if (this.pageY < 1) {
                this.hasScrollBarY = false;
                this.scrollBarPosMaxY = 0;
            } else {
                this.hasScrollBarY = true;
                this.scrollBarPosMaxY  = this.height - (this.canvasHeight - headerHeight * this.r);
            }

            this.pageX = this.width / this.canvasWidth;
            if (this.pageX < 1) {
                this.hasScrollBarX = false;
                this.scrollBarPosMaxX = 0;
            } else {
                this.hasScrollBarX = true;
                this.scrollBarPosMaxX  = this.width - this.canvasWidth;
            }
        }

        if (this.posYvalue > this.scrollBarPosMaxY) { this.setPosY(this.scrollBarPosMaxY); }
        if (this.posXvalue > this.scrollBarPosMaxX) { this.setPosX(this.scrollBarPosMaxX); }
    }

    public beforeDraw(): boolean {
        // runXOrY == true:  Y
        // runXOrY == false: X
        if (this.run) {
            if (this.runXOrY) {
                this.setPosY(this.posYvalue - (this.speed * this.r));
            } else {
                this.setPosX(this.posXvalue - (this.speed * this.r));
            }
            return true;
        }
        return false;
    }
    
    public OnKeydown(keyCode: number): boolean {
        switch (keyCode) {
            case 33: // pagedown
                this.setPosY(this.posYvalue - this.canvasHeight);
                return true;
            case 34: // pageup
                this.setPosY(this.posYvalue + this.canvasHeight);
                return true;
            case 38: // up
                this.setPosY(this.posYvalue - this.cellHeight * this.r);
                return true;
            case 40: // down
                this.setPosY(this.posYvalue + this.cellHeight * this.r);
                return true;
            default:
                return false;
        }
    }

    public onScroll = (deltaMode: number, deltaX: number, deltaY: number) => {
        switch (deltaMode) {
            case 0: // DOM_DELTA_PIXEL	0x00	The delta values are specified in pixels.
                this.setPosY(this.posYvalue + deltaY);
                this.setPosX(this.posXvalue + deltaX);
                break;
            case 1: // DOM_DELTA_LINE	0x01	The delta values are specified in lines.
                this.setPosY(this.posYvalue + deltaY * this.cellHeight * this.r);
                this.setPosX(this.posXvalue + deltaX * this.cellHeight * this.r);
                break;
            case 2: // DOM_DELTA_PAGE	0x02	The delta values are specified in pages.
                this.setPosY(this.posYvalue + deltaY * this.canvasHeight * this.r);
                this.setPosX(this.posXvalue + deltaX * this.canvasWidth * this.r);
                break;
            default:
                // uups
                return;
        }

        this.fixPos();
    }

    public onExtendedMouseUp(x: number, y: number): boolean {
        this.askForNormalMouseMoveAndMaouseUp.call(this.drawable);

        this.scrollBarThumbDownY = false;
        this.isOverScollThumbY = false;
        this.scrollBarThumbDownX = false;
        this.isOverScollThumbX = false;
        this.drawMe();

        return false;
    }
    public onExtendedMouseMove(x: number, y: number): boolean {
        if (this.scrollBarThumbDownY) {
            this.setPosY(this.scrollBarPosMaxY * ((y - this.arrowSize) / (this.canvasHeight / this.r - this.arrowSize * 2)));
        }
        if (this.scrollBarThumbDownX) {
            this.setPosX(this.scrollBarPosMaxX * (x / (this.canvasWidth / this.r - this.arrowSize * 2)));
        }
        return true;
    }
    public onMouseDown(x: number, y: number): boolean {
        return this.scrollClick(x, y, false);
    }
    public onMouseMove(x: number, y: number): boolean {
        if (!this.hasScrollBarY && !this.hasScrollBarX) { return false; }

        const canvasWidth = this.canvasWidth / this.r;
        const canvasHeight = this.canvasHeight / this.r;

        // right-bottom no element
        if (this.hasScrollBarX && this.hasScrollBarY &&
            x > canvasWidth - this.scrollbarSize && y > canvasHeight - this.scrollbarSize) {
            if (this.isOverScrollUpY || this.isOverScollThumbY || this.isOverScrollDownY ||
                this.isOverScrollUpX || this.isOverScollThumbX || this.isOverScrollDownX) {
                this.isOverScrollUpY = false;
                this.isOverScollThumbY = false;
                this.isOverScrollDownY = false;
                this.isOverScrollUpX = false;
                this.isOverScollThumbX = false;
                this.isOverScrollDownX = false;
                this.drawMe();
            }
            return true;
        }

        // mouse not on scroll-bar element
        if (( this.hasScrollBarX &&  this.hasScrollBarY &&
              x < canvasWidth - this.scrollbarSize && y < canvasHeight - this.scrollbarSize) ||
            (!this.hasScrollBarX &&  this.hasScrollBarY && x < canvasWidth - this.scrollbarSize) ||
            ( this.hasScrollBarX && !this.hasScrollBarY && y < canvasHeight - this.scrollbarSize) ) {
            if (this.isOverScrollUpY || this.isOverScollThumbY || this.isOverScrollDownY ||
                this.isOverScrollUpX || this.isOverScollThumbX || this.isOverScrollDownX) {
                this.isOverScrollUpY = false;
                this.isOverScollThumbY = false;
                this.isOverScrollDownY = false;
                this.isOverScrollUpX = false;
                this.isOverScollThumbX = false;
                this.isOverScrollDownX = false;
                this.drawMe();
            }
            return false;
        }

        // mouse on scroll-up button
        if (this.hasScrollBarY && y < this.arrowSize + 2) {
            if (!this.isOverScrollUpY || this.isOverScollThumbY || this.isOverScrollDownY ||
                this.isOverScrollUpX || this.isOverScollThumbX || this.isOverScrollDownX) {
                this.isOverScrollUpY = true;
                this.isOverScollThumbY = false;
                this.isOverScrollDownY = false;
                this.isOverScrollUpX = false;
                this.isOverScollThumbX = false;
                this.isOverScrollDownX = false;
                this.drawMe();
            }
            return true;
        }

        // mouse on scroll-down button
        if (this.hasScrollBarY && x >= canvasWidth - this.scrollbarSize &&
            y > this.canvasHeight / this.r - this.arrowSize - 2 - (this.hasScrollBarX ? this.scrollbarSize : 0)) {
            if (this.isOverScrollUpY || this.isOverScollThumbY || !this.isOverScrollDownY ||
                this.isOverScrollUpX || this.isOverScollThumbX || this.isOverScrollDownX) {
                this.isOverScrollUpY = false;
                this.isOverScollThumbY = false;
                this.isOverScrollDownY = true;
                this.isOverScrollUpX = false;
                this.isOverScollThumbX = false;
                this.isOverScrollDownX = false;
                this.drawMe();
            }
            return true;
        }

        // mouse on scroll-bar
        if (this.hasScrollBarY && this.scrollBarThumbMinY <= y && y <= this.scrollBarThumbMaxY) {
            if (this.isOverScrollUpY || !this.isOverScollThumbY || this.isOverScrollDownY ||
                this.isOverScrollUpX || this.isOverScollThumbX || this.isOverScrollDownX) {
                this.isOverScrollUpY = false;
                this.isOverScollThumbY = true;
                this.isOverScrollDownY = false;
                this.isOverScrollUpX = false;
                this.isOverScollThumbX = false;
                this.isOverScrollDownX = false;
                this.drawMe();
            }
            return true;
        }

        // mouse on scroll-left button
        if (this.hasScrollBarX && x < this.arrowSize + 2) {
            if (!this.isOverScrollUpX || this.isOverScollThumbX || this.isOverScrollDownX ||
                this.isOverScrollUpY || !this.isOverScollThumbY || this.isOverScrollDownY) {
                this.isOverScrollUpX = true;
                this.isOverScollThumbX = false;
                this.isOverScrollDownX = false;
                this.isOverScrollUpY = false;
                this.isOverScollThumbY = false;
                this.isOverScrollDownY = false;
                this.drawMe();
            }
            return true;
        }

        // mouse on scroll-right button
        if (this.hasScrollBarX && y >= canvasHeight - this.scrollbarSize &&
            x > this.canvasWidth / this.r - this.arrowSize - 2 - (this.hasScrollBarY ? this.scrollbarSize : 0)) {
            if (this.isOverScrollUpY || this.isOverScollThumbY || this.isOverScrollDownY ||
                this.isOverScrollUpX || this.isOverScollThumbX || !this.isOverScrollDownX) {
                this.isOverScrollUpY = false;
                this.isOverScollThumbY = false;
                this.isOverScrollDownY = false;
                this.isOverScrollUpX = false;
                this.isOverScollThumbX = false;
                this.isOverScrollDownX = true;
                this.drawMe();
            }
            return true;
        }

        // mouse on scroll-bar
        if (this.hasScrollBarX && this.scrollBarThumbMinX <= x && x <= this.scrollBarThumbMaxX) {
            if (this.isOverScrollUpY || this.isOverScollThumbY || this.isOverScrollDownY ||
                this.isOverScrollUpX || !this.isOverScollThumbX || this.isOverScrollDownX) {
                this.isOverScrollUpY = false;
                this.isOverScollThumbY = false;
                this.isOverScrollDownY = false;
                this.isOverScrollUpX = false;
                this.isOverScollThumbX = true;
                this.isOverScrollDownX = false;
                this.drawMe();
            }
            return true;
        }

        return true;
    }
    public onMouseUp(x: number, y: number): boolean {
        this.scrollBarThumbDownY = false;
        this.isOverScollThumbY = false;
        this.scrollBarThumbDownX = false;
        this.isOverScollThumbX = false;
        this.drawMe();

        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = undefined;
            this.run = false;
        }
        return false;
    }

    private scrollClick(x: number, y: number, isTouch: boolean): boolean {
        if (!this.hasScrollBarY && !this.hasScrollBarX) { return false; }

        const canvasWidth = this.canvasWidth / this.r;
        const canvasHeight = this.canvasHeight / this.r;

        // right-bottom no element
        if (this.hasScrollBarX && this.hasScrollBarY &&
            x > canvasWidth - this.scrollbarSize && y > canvasHeight - this.scrollbarSize) {
            return true;
        }

        // mouse not on scroll-bar
        if (( this.hasScrollBarX &&  this.hasScrollBarY &&
             x < canvasWidth - this.scrollbarSize && y < canvasHeight - this.scrollbarSize) ||
            (!this.hasScrollBarX &&  this.hasScrollBarY && x < canvasWidth - this.scrollbarSize) ||
            ( this.hasScrollBarX && !this.hasScrollBarY && y < canvasHeight - this.scrollbarSize) ) {
            return false;
        }

        // scroll-up
        if (this.hasScrollBarY && y < this.arrowSize + 2) {
            if (this.posYvalue === 0) { return true; }
            this.setPosY(this.posYvalue - this.cellHeight * this.r);
            this.timeout = setTimeout(() => {
                this.speed = 7;
                this.runXOrY = true;
                this.run = true;
                this.drawable.askForReDraw();
            }, 500);
            return true;
        }

        // scroll-down
        if (this.hasScrollBarY && x >= canvasWidth - this.scrollbarSize &&
            y > canvasHeight - this.arrowSize - 2 - (this.hasScrollBarX ? this.scrollbarSize : 0)) {
            if (this.posYvalue === this.scrollBarPosMaxY) { return true; }
            this.setPosY(this.posYvalue + this.cellHeight * this.r);
            this.timeout = setTimeout(() => {
                this.speed = -7;
                this.runXOrY = true;
                this.run = true;
                this.drawable.askForReDraw();
            }, 500);
            return true;
        }

        // scroll-down
        if (this.hasScrollBarY && x >= canvasWidth - this.scrollbarSize && y > this.scrollBarThumbMaxY) {
            this.setPosY(this.posYvalue + canvasHeight - 20);
            this.timeout = setTimeout(() => {
                this.speed = -14;
                this.runXOrY = true;
                this.run = true;
                this.drawable.askForReDraw();
            }, 500);
            return true;
        }

        // scroll-up
        if (this.hasScrollBarY && x >= canvasWidth - this.scrollbarSize && y < this.scrollBarThumbMinY) {
            this.setPosY(this.posYvalue - canvasHeight - 20);
            this.timeout = setTimeout(() => {
                this.speed = +14;
                this.runXOrY = true;
                this.run = true;
                this.drawable.askForReDraw();
            }, 500);
            return true;
        }

        if (this.hasScrollBarY && x >= canvasWidth - this.scrollbarSize) {
            this.scrollBarThumbDownY = true;
        }

        // scroll-left
        if (this.hasScrollBarX && x < this.arrowSize + 2) {
            if (this.posXvalue === 0) { return true; }
            this.setPosX(this.posXvalue - this.cellHeight * this.r);
            this.timeout = setTimeout(() => {
                this.speed = +7;
                this.runXOrY = false;
                this.run = true;
                this.drawable.askForReDraw();
            }, 500);
            return true;
        }

        // scroll-right
        if (this.hasScrollBarX && y >= canvasHeight - this.scrollbarSize &&
            x > canvasWidth - this.arrowSize - 2 - (this.hasScrollBarY ? this.scrollbarSize : 0)) {
            if (this.posXvalue === this.scrollBarPosMaxY) { return true; }
            this.setPosX(this.posXvalue + this.cellHeight * this.r);
            this.timeout = setTimeout(() => {
                this.speed = -7;
                this.runXOrY = false;
                this.run = true;
                this.drawable.askForReDraw();
            }, 500);
            return true;
        }

        // scroll-right
        if (this.hasScrollBarX && y >= canvasHeight - this.scrollbarSize && x > this.scrollBarThumbMaxX) {
            this.setPosX(this.posXvalue + canvasHeight - 20);
            this.timeout = setTimeout(() => {
                this.speed = -14;
                this.runXOrY = false;
                this.run = true;
                this.drawable.askForReDraw();
            }, 500);
            return true;
        }

        // scroll-left
        if (this.hasScrollBarX && y >= canvasHeight - this.scrollbarSize && x < this.scrollBarThumbMinX) {
            this.setPosX(this.posXvalue - canvasHeight - 20);
            this.timeout = setTimeout(() => {
                this.speed = +14;
                this.runXOrY = false;
                this.run = true;
                this.drawable.askForReDraw();
            }, 500);
            return true;
        }

        if (this.hasScrollBarX && y >= canvasHeight - this.scrollbarSize) {
            this.scrollBarThumbDownX = true;
        }

        if (!isTouch) {
            this.askForExtentedMouseMoveAndMaouseUp.call(this.drawable);
        }

        return true;
    }

    private drawMe() {
        if (!this.drawable.isPlanToRedraw()) {
            this.draw();
        }
    }

    private fixPos() {
        if (!this.hasScrollBarY || this.posYvalue < 0) {
            this.setPosY(0);
        }
        if (this.posYvalue > this.scrollBarPosMaxY) {
            this.setPosY(this.scrollBarPosMaxY);
        }
        if (!this.hasScrollBarX || this.posXvalue < 0) {
            this.setPosX(0);
        }
        if (this.posXvalue > this.scrollBarPosMaxX) {
            this.setPosX(this.scrollBarPosMaxX);
        }
    }
}
