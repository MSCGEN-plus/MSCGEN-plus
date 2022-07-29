export class DiffReturn{

    private readonly _text : string
    private readonly _cursorStart : number
    private readonly _cursorEnd : number
    private readonly _selected : boolean

    constructor(text: string, cursorStart: number, cursorEnd: number, selected : boolean) {
        this._text = text;
        this._cursorStart = cursorStart;
        this._cursorEnd = cursorEnd;
        this._selected = selected;
    }

    get text(): string {
        return this._text;
    }

    get cursorStart(): number {
        return this._cursorStart;
    }

    get cursorEnd(): number {
        return this._cursorEnd;
    }

    get selected(): boolean {
        return this._selected;
    }
}