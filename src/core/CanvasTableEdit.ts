import { ICanvasTableColumn } from "./types/CanvasTableColum";

export class CanvasTableEdit<T = any> {
    private hasBeenRemoved: boolean = false;
    private readonly column: ICanvasTableColumn<T>;
    private readonly row: number;
    private readonly inputeElement: HTMLInputElement | HTMLSelectElement;
    private onRemove?: (cancel: boolean, newData: string) => void;

    constructor(col: ICanvasTableColumn<T>, row: number, data: string, cellHeight: number,
                onRemve: (cancel: boolean, newData: string) => void) {
        this.column = col;
        this.row = row;
        this.onRemove = onRemve;
        this.inputeElement = document.createElement("input");
        this.inputeElement.type = "text";
        this.inputeElement.value = data;
        this.inputeElement.style.position = "absolute";
        this.inputeElement.style.border = "none";
        this.inputeElement.style.width = (col.width - 7) + "px";
        this.inputeElement.style.height = cellHeight + "px";
        this.inputeElement.style.padding = "0px 3px";
        document.body.appendChild(this.inputeElement);

        this.inputeElement.focus({preventScroll: true});
        this.inputeElement.addEventListener("blur", this.onBlur);
        this.inputeElement.addEventListener("keydown", this.onKeydown);
    }

    public getRow() { return this.row; }

    public getColumn() {return this.column; }

    public updateEditLocation(top: number, left: number, width: number, height: number) {
        this.inputeElement.style.top = top + "px";
        this.inputeElement.style.left = left + "px";
        this.inputeElement.style.width = (width - 7) + "px";
        this.inputeElement.style.height = height + "px";
    }

    public doRemove(cancel: boolean) {
        let error;
        try {
            if (this.onRemove) {
                this.onRemove(cancel, this.inputeElement.value);
            }
        } catch (e) {
            error = e;
        }

        this.onRemove = undefined;

        this.inputeElement.removeEventListener("blur", this.onBlur);
        this.inputeElement.removeEventListener("keydown", this.onKeydown as any);

        if (!this.hasBeenRemoved) {
            document.body.removeChild(this.inputeElement);
            this.hasBeenRemoved = true;
        }
        if (error) {
            throw error;
        }
    }

    private onKeydown = (ev: KeyboardEvent) => {
        let cancel: boolean | undefined;
        switch (ev.code) {
            case "Escape":
                cancel = true;
                break;
            case "NumpadEnter":
            case "Enter":
                cancel = false;
                break;
        }
        if (cancel !== undefined) {
            setTimeout(() => {
                this.doRemove(cancel as boolean);
            }, 0);
        }
    }

    private onBlur = () => {
        if (!this.hasBeenRemoved) {
            setTimeout(() => {
                this.doRemove(false);
            }, 0);
        }
    }
}
