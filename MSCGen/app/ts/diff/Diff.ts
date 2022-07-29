export class Diff{
    private _added : string = ""
    private _removed : string = ""
    private _cursorAdd : number = 0
    private _cursorRemove : number = 0
    private _selected : boolean = false

    constructor(added : string, removed : string, cursorPos : number, selected : boolean) {
        this._added = added
        this._removed = removed
        this._cursorRemove = cursorPos
        this._cursorAdd = cursorPos
        this._selected = selected
    }

    public invert() : Diff{
        let tmp : string = this._added
        this._added = this._removed
        this._removed = tmp

        let tmpNum : number = this._cursorAdd
        this._cursorAdd = this._cursorRemove
        this._cursorRemove = tmpNum

        return this
    }

    get added(): string {
        return this._added;
    }

    get removed(): string {
        return this._removed;
    }

    get cursorAdd(): number {
        return this._cursorAdd;
    }

    set cursorAdd(value: number) {
        this._cursorAdd = value;
    }

    get cursorRemove(): number {
        return this._cursorRemove;
    }

    set cursorRemove(value: number) {
        this._cursorRemove = value;
    }

    get selected(): boolean {
        return this._selected;
    }
}