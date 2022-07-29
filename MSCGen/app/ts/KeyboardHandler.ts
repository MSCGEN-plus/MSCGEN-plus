import {DiffBuffer} from "./diff/DiffBuffer.js";
import {Diff} from "./diff/Diff.js";
import {TextEditor} from "./TextEditor.js";
import {DiffReturn} from "./diff/DiffReturn.js";

export class KeyboardHandler{
    private _input : HTMLTextAreaElement

    private _textEditor : TextEditor
    private _mapOfDoubleDeleteChar : Map<string,string> = new Map<string, string>([["{" , "}"], ["\"" , "\""],["[" , "]"], ["(" , ")"]])
    private _diffBuffer : DiffBuffer = new DiffBuffer()
    private _draggedString : string = ""
    private _insertToggle : boolean = false

    constructor(textEditor : TextEditor, input : HTMLTextAreaElement) {
        let timer : number;

        this._input = input
        this._textEditor = textEditor

        this._input.onpaste = (event : ClipboardEvent) =>{
            //for safety reasons we cant just read out the clipboard so we need this event
            this.pasteHandler(event)
        }

        this._input.ondragstart = () =>{
            this._draggedString = this.getSelectedText()
            let cursorPos : number = this._input.selectionStart
            this._diffBuffer.addPrevious(new Diff(this._draggedString, this._draggedString, cursorPos, true))
        }

        this._input.ondragend = () =>{
            let code : string = this._input.value
            let cursorPos : number = this._input.selectionStart - this._draggedString.length
            //only set the destination if the drag was successful
            if(this._draggedString == code.slice(cursorPos, this._draggedString.length))
                this._diffBuffer.setDragDestination(cursorPos)
        }

        this._input.onkeyup = () =>{
            clearTimeout(timer);
            timer = setTimeout(this._textEditor.startParser, 500);
        }

        this._input.onkeydown = (event : KeyboardEvent) =>{
            clearTimeout(timer);
            this.keyHandler(event)
        }
    }

    private keyHandler(event : KeyboardEvent) {
        if (!this.handledKey(event)) {
            if (event.ctrlKey && event.key == "x") {//saves the previous state if ctrl x is called
                let selected : string = this.getSelectedText()
                let cursorPos : number = this._input.selectionStart
                this._diffBuffer.addPrevious(new Diff("", selected, cursorPos, selected.length > 0))
            }
            return
        }

        event.preventDefault()

        if (event.ctrlKey) {
            this.controlKeyHandler(event);
        } else {
            this.defaultKeyHandler(event);
        }
    }

    private handledKey(event : KeyboardEvent) : boolean{// returns whether or not this key is handled by us
        if(event.ctrlKey) {
            switch (event.key) {
                case "z":
                case "y":
                case "/":
                    return true

                default:
                    return false
            }
        }

        if (this._mapOfDoubleDeleteChar.has(event.key))
            return true
        if ([...this._mapOfDoubleDeleteChar.values()].indexOf(event.key) != -1)
            return true
        switch (event.key){
            case "Tab":
            case "Enter":
            case "Backspace":
            case "Delete":
            case "Insert":
                return true

            default:
                return event.key.length == 1
        }
    }

    private defaultKeyHandler(event : KeyboardEvent) : void{//handles the key inputs without control
        let code : string = this._input.value;
        let cursorPos : number = this._input.selectionStart
        let before : string = code.slice(0, this._input.selectionStart)
        let after : string = code.slice(this._input.selectionEnd)
        let selected : string = this.getSelectedText()

        this._diffBuffer.clearNext()
        switch (event.key){
            case "Tab":
                this.tabHandler(event, code, before, after, selected, cursorPos)
                this._textEditor.update()
                return;

            case "Enter":
                cursorPos  = this.enterHandler(before, after, selected, cursorPos)
                break

            case "Delete":
                cursorPos = this.deleteHandler(before, after, selected, cursorPos)
                break

            case "Backspace":
                cursorPos = this.backspaceHandler(before, after, selected, cursorPos)
                break

            case "Insert":
                this._insertToggle = !this._insertToggle
                break

            default:
                cursorPos = this.charHandler(event, before, after, selected, cursorPos)
                break
        }
        this._textEditor.update();
        this._input.selectionStart = cursorPos;
        this._input.selectionEnd = cursorPos;
    }

    private controlKeyHandler(event: KeyboardEvent) : void {//handles the key inputs with control
        switch (event.key) {
            case "z":
                this.undoHandler()
                break

            case "y":
                this.redoHandler()
                break

            case "/":
                this.commentHandler()
                break

            default:
                break
        }

    }


    private charHandler(event : KeyboardEvent, before : string, after : string, selected : string, cursorPos : number) : number{
        //autocomplete "{[ with "}] respectively, unless it's already there
        if (this._mapOfDoubleDeleteChar.has(event.key) && after[0] != this._mapOfDoubleDeleteChar.get(event.key)){
            this._input.value = before + event.key + selected + this._mapOfDoubleDeleteChar.get(event.key) + after;
            this._diffBuffer.addPrevious(new Diff( event.key + selected + this._mapOfDoubleDeleteChar.get(event.key), selected, cursorPos, selected.length > 0))
            ++cursorPos
        } else
        //autoskip "}] if already there
        if ([...this._mapOfDoubleDeleteChar.values()].indexOf(event.key) != -1 && after[0] == event.key){
            ++cursorPos
        }
        else{
            if(this._insertToggle && selected.length == 0 && after.length > 0){
                selected = after[0]
                after = after.slice(1)
                this._input.value = before + event.key + after;
                this._diffBuffer.addPrevious(new Diff(event.key, selected, cursorPos, false))
                cursorPos += 1
            }
            else{
                this._input.value = before + event.key + after;
                this._diffBuffer.addPrevious(new Diff(event.key, selected, cursorPos, selected.length > 0))
                cursorPos += 1;
            }
        }

        return cursorPos;
    }

    private enterHandler(before : string, after : string, selected : string, cursorPos : number) : number{
        let indent : number = before.split("\n").pop().split("\t").length - 1
        let change = "\n" + "\t".repeat(indent)

        /*auto indent brackets like this:
        indent{
        indent+1
        indent}
        */
        let inString = ((before.match(/"/g) || []).length - (before.match(/\\"/g) || []).length) % 2 == 1
        let indentedBrackets = false
        if (!inString && selected == "" && before[before.length-1] == "{"){
            change+= "\t"
            if (after[0] == "}"){
                change+= "\n" + "\t".repeat(indent)
                indentedBrackets = true
            }
        }
        this._input.value = before + change + after;
        this._diffBuffer.addPrevious(new Diff(change, selected, cursorPos, selected.length > 0))
        cursorPos += change.length
        if (indentedBrackets)
            cursorPos -= indent +1
        return cursorPos
    }

    private backspaceHandler(before : string, after : string, selected : string, cursorPos : number) : number{
        if (before == "" && selected.length == 0)
            return cursorPos

        let select : boolean = true
        if(selected.length == 0){
            selected = before.slice(before.length - 1)
            before = before.slice(0, before.length - 1)
            cursorPos -= 1
            select = false
        }
        //delete double chars
        if (this._mapOfDoubleDeleteChar.has(selected) && this._mapOfDoubleDeleteChar.get(selected) == after[0]){
            selected += after[0]
            after = after.slice(1)
        }

        this._input.value = before + after;
        this._diffBuffer.addPrevious(new Diff("", selected, cursorPos, select))
        return cursorPos
    }

    private deleteHandler(before : string, after : string, selected : string, cursorPos : number) : number{
        let select : boolean = true
        if(selected.length == 0) {
            selected = after[0]
            after = after.slice(1)
            select = false
        }
        this._input.value = before + after;
        this._diffBuffer.addPrevious(new Diff("", selected, cursorPos, select))
        return cursorPos
    }

    private tabHandler(event : KeyboardEvent, code : string, before : string, after : string, selected : string, cursorPos : number): void{
        //normal tab
        if (this._input.selectionStart == this._input.selectionEnd && !event.shiftKey){
            this._input.value = before + "\t" + after

            this._diffBuffer.addPrevious(new Diff("\t", selected, cursorPos, selected.length > 0))
            this._input.selectionStart = ++cursorPos
            this._input.selectionEnd = cursorPos
            return;
        }

        //indent and unindent selection

        //get full lines by finding the last \n before and the first \n after
        //not found returns -1 :(
        let startOfLine = code.slice(0, this._input.selectionStart).lastIndexOf("\n")+1
        let endOfLine =  code.slice(this._input.selectionEnd).indexOf("\n") != -1 ?
            this._input.selectionEnd + code.slice(this._input.selectionEnd).indexOf("\n")
            : this._input.value.length
        //get new selection
        before = code.slice(0, startOfLine)
        selected = code.slice(startOfLine, endOfLine)
        after = code.slice(endOfLine)

        //normal shift tab
        if (this._input.selectionStart == this._input.selectionEnd && event.shiftKey){
            if (/^\t/g.test(selected)) {
                let newline = selected.replace(/^\t/g, "")
                this._input.value = before + newline + after
                this._diffBuffer.addPrevious(new Diff(newline, selected, cursorPos, selected.length > 0))
                cursorPos -= selected.length - newline.length
                this._input.selectionStart = cursorPos
                this._input.selectionEnd = cursorPos
                return;
            }
            return;
        }
        //multiline (shift+)tab
        //insert \t for every line
        let newlines:string[] = []
        for (let line of selected.split("\n")) {
            if (!event.shiftKey){
                newlines.push("\t" + line)
            } else {
                newlines.push(line.replace(/^\t/g, ""))
            }
        }
        this._input.value = before + newlines.join("\n") + after;
        this._diffBuffer.addPrevious(new Diff(newlines.join("\n"), selected, startOfLine, selected.length > 0))
        this._input.selectionStart = startOfLine
        this._input.selectionEnd = startOfLine+newlines.join("\n").length
    }


    private commentHandler() : void{
        let code : string = this._input.value
        let cursorPos = code.slice(0, this._input.selectionStart).lastIndexOf("\n") + 1

        //get full lines by finding the last \n before and the first \n after
        //not found returns -1 :(
        let startOfLine = code.slice(0, this._input.selectionStart).lastIndexOf("\n")+1
        let endOfLine =  code.slice(this._input.selectionEnd).indexOf("\n") != -1 ?
            this._input.selectionEnd + code.slice(this._input.selectionEnd).indexOf("\n")
            : this._input.value.length
        //get new selection
        let before = code.slice(0, startOfLine)
        let selected = code.slice(startOfLine, endOfLine)
        let after = code.slice(endOfLine)
        let isAlreadycomment = /^\s*(\/\/|#)/g.test(selected)

        //insert // for every line
        let newlines:string[] = []
        for (let line of selected.split("\n")) {
            if (!isAlreadycomment){
                newlines.push("//" + line)
            } else {
                newlines.push(line.replace(/^\s*(\/\/|#)/g, ""))
            }
        }
        //set cursorposition to the line after the selection
        let newcursorpos:number = before.length + newlines.join("\n").length
        if(this._input.selectionStart == this._input.selectionEnd){
            newcursorpos = before.length + newlines[0].length + 1
        }
        this._input.value = before + newlines.join("\n") + after
        this._diffBuffer.addPrevious(new Diff(newlines.join("\n"), selected, cursorPos, false))
        this._textEditor.update();
        this._input.selectionStart = newcursorpos
        this._input.selectionEnd = newcursorpos

    }

    private undoHandler() : void{
        let undoValue : DiffReturn = this._diffBuffer.applyUndo(this._input.value)
        this._input.value = undoValue.text
        if(undoValue.selected){
            this._input.selectionStart = undoValue.cursorStart
            this._input.selectionEnd = undoValue.cursorEnd
        }else{
            this._input.selectionStart = undoValue.cursorEnd
            this._input.selectionEnd = undoValue.cursorEnd
        }
        this._textEditor.update();
    }

    private redoHandler() : void{
        let redoValue : DiffReturn = this._diffBuffer.applyRedo(this._input.value)
        this._input.value = redoValue.text
        if(redoValue.selected){
            this._input.selectionStart = redoValue.cursorStart
            this._input.selectionEnd = redoValue.cursorEnd
        }else{
            this._input.selectionStart = redoValue.cursorEnd
            this._input.selectionEnd = redoValue.cursorEnd
        }
        this._textEditor.update();
    }

    private pasteHandler(event : ClipboardEvent) : void{
        let input : string = event.clipboardData.getData("text")
        let selected : string = this.getSelectedText()
        let cursorPos : number = this._input.selectionStart
        this._diffBuffer.addPrevious(new Diff(input, selected, cursorPos, selected.length > 0))
    }


    private getSelectedText() : string{
        return this._input.value.slice(this._input.selectionStart, this._input.selectionEnd)
    }
}