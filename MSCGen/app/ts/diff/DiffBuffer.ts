import {Diff} from "./Diff.js";
import {DiffReturn} from "./DiffReturn.js";

export class DiffBuffer{
    private bufferSize : number = 50
    private next : Diff[] = []
    private previous : Diff[] = []

    public addPrevious(diff : Diff){
        //adds the current input state to the previous array, if there are 5 elements in the array the last input will be removed
        if(this.previous.length >= this.bufferSize){
            this.previous.shift()
        }
        this.previous.push(diff)
    }

    private addNext(diff : Diff){
        //adds the current input state to the next array, if there are 5 elements in the array the last input will be removed
        if(this.next.length >= this.bufferSize){
            this.next.shift()
        }
        this.next.push(diff)
    }

    public clearNext(){
        this.next = []
    }

    public applyUndo(text : string) : DiffReturn{
        if(this.previous.length == 0)
            return new DiffReturn(text, -1, -1, false)

        let diff : Diff = this.previous.pop()
        text = this.remove(text, diff)
        text = this.add(text, diff)

        let returnValue : DiffReturn = new DiffReturn(text, diff.cursorRemove, diff.cursorRemove + diff.removed.length, diff.selected)
        this.addNext(diff.invert())
        return returnValue
    }

    public applyRedo(text : string) : DiffReturn{
        if(this.next.length == 0)
            return new DiffReturn(text, -1, -1, false)

        let diff : Diff = this.next.pop()
        text = this.remove(text, diff)
        text = this.add(text, diff)

        let returnValue : DiffReturn = new DiffReturn(text, diff.cursorRemove, diff.cursorRemove + diff.removed.length, diff.selected)
        this.addPrevious(diff.invert())
        return returnValue
    }

    public setDragDestination(cursorPos : number){
        let diff : Diff = this.previous.pop()
        diff.cursorAdd = cursorPos
        this.previous.push(diff)
    }

    private remove(text : string, diff : Diff) : string{
        let front : string = text.slice(0, diff.cursorAdd)
        let back : string = text.slice(diff.cursorAdd + diff.added.length)
        return front + back
    }

    private add(text : string, diff : Diff) : string{
        let cursorPos : number = diff.cursorRemove
        let front : string = text.slice(0, cursorPos)
        let back : string = text.slice(cursorPos)
        return front + diff.removed + back
    }

}