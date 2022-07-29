import {MainParser} from "./parser/MainParser.js";
import {ParserError} from "./parser/ParserError.js";
import {Highlighter} from "./Highlighter.js";
import {Entity} from "./Drawables/Entity.js";
import {Arc, svgStringContainer} from "./Drawables/Arc.js";
import {DiffBuffer} from "./diff/DiffBuffer.js";
import {Diff} from "./diff/Diff.js";
import {DiffReturn} from "./diff/DiffReturn.js";
import {KeyboardHandler} from "./KeyboardHandler.js";

export class TextEditor{
    private _input : HTMLTextAreaElement
    private _display : HTMLElement
    private _numbers : HTMLElement
    private _errorField : HTMLElement
    private _errorMessage : HTMLElement
    private _errorNumber : HTMLElement
    private _errorCode : HTMLElement
    private _svg : HTMLElement & SVGElement
    private _autorendercheck : HTMLInputElement
    private _parser : MainParser = new MainParser()
    private _highlighter : Highlighter = new Highlighter()
    private _keyboardHandler : KeyboardHandler

    constructor() {
        this._input = document.getElementById("CodeInput") as HTMLTextAreaElement
        this._display = document.getElementById("CodeDisplay")
        this._numbers = document.getElementById("NumberDisplay")
        this._errorField = document.getElementById("ErrorDisplay")
        this._errorMessage = document.getElementById("ErrorMessage")
        this._errorNumber = document.getElementById("ErrorNumberDisplay")
        this._errorCode = document.getElementById("ErrorCodeDisplay")
        this._svg = document.getElementById("DiagramDisplay") as HTMLElement & SVGElement
        this._autorendercheck = document.getElementById("autorendercheck") as HTMLInputElement
        this._autorendercheck.addEventListener("change", this.startParser)
        this._keyboardHandler = new KeyboardHandler(this, this._input)

        this._highlighter.addKeywords(this._parser.getAllKeyWords())

        this.update()

        this._input.oninput = () =>{
            this.update()
        }

        this._input.onscroll = () =>{
            this.syncScroll()
        }
    }

    /**
     * @post the display will be updated to the state of the input
     */
    public update() : void{
        this.syncScroll();
        this.setNumbers();
        this.unHighlightError()
        let output : string = this._input.value
        output = this._parser.htmlPrep(output)
        output = this._highlighter.highlightText(output)
        this._display.innerHTML= output
    }

    private setNumbers() : void{
        let lineCount : number = this._input.value.split(/\r|\n|\r\n/).length;
        let numLines : string[] = this._numbers.innerHTML.split(/\r|\n|\r\n/)
        let numLineCount : number = numLines.length
        if(lineCount < numLineCount){
            for (let i = 0; i < numLineCount - lineCount; i++) {
                numLines.pop()
            }
        }else if(lineCount > numLineCount){
            for (let i = 0; i < lineCount - numLineCount; i++) {
                numLines.push(numLines.length + 1 + " ")
            }
        }
        this._numbers.innerHTML = numLines.join("\n")
    }

    private syncScroll() : void{
        this._display.scrollTop = this._input.scrollTop;
        this._display.scrollLeft = this._input.scrollLeft;
        this._numbers.scrollTop = this._input.scrollTop;
    }

    private highlightError(error : ParserError){
        let displayLines : string[] = this._display.innerHTML.split("\n")
        let numberLines : string[] = this._numbers.innerText.split("\n")
        let preErrorNr : string[] = numberLines.slice(0, error.lineNr)
        let preError : string[] = displayLines.slice(0, error.lineNr)
        this._display.innerHTML = ""
        this._numbers.innerHTML = ""

        if(preError.length > 0){
            this._display.innerHTML += preError.join("\n") + "\n"
            this._numbers.innerHTML += preErrorNr.join("\n") + "\n"
        }
        this._display.innerHTML += `<error class = "ErrorLine">${displayLines[error.lineNr]}</error>`
        this._numbers.innerHTML += "<span class = \"ErrorLine\">" + (error.lineNr + 1) + " </span>"
        let postError : string[] = displayLines.slice(error.lineNr + 1)
        let postErrorNr : string[] = numberLines.slice(error.lineNr + 1)

        if(postError.length > 0){
            this._display.innerHTML += "\n" + postError.join("\n")
            this._numbers.innerHTML += "\n" + postErrorNr.join("\n")
        }
    }

    private unHighlightError(){
        this._numbers.innerHTML = this._numbers.innerHTML.replace(/<span class="ErrorLine">(\d* )<\/span>/, "$1")
        this._display.innerHTML = this._display.innerHTML.replace(/<error class="ErrorLine">(.*)<\/error>/, "$1")
    }

    private setError(error : ParserError) : void{
        this._errorMessage.innerText = "Line " + (error.lineNr + 1) + ": " + error.message
        this.unHighlightError()
        this.highlightError(error)
        let length : number = this._display.innerHTML.split("\n").length
        this._errorNumber.innerHTML = ""
        this._errorCode.innerHTML = ""
        if(error.lineNr == 0){// if the error is on the first line
            for (let i = 0; i < Math.min(length , 3 ); i++) {
                this._errorNumber.innerHTML += this._numbers.innerHTML.split("\n")[i] + "\n"
                this._errorCode.innerHTML += this._display.innerHTML.split("\n")[i] + "\n"
            }
        }
        else if (error.lineNr + 1 == length){// if the error is on the last line
            for (let i = Math.min(length , 3 )- 1; i >= 0; i--) {
                this._errorNumber.innerHTML += this._numbers.innerHTML.split("\n")[length - i - 1] + "\n"
                this._errorCode.innerHTML += this._display.innerHTML.split("\n")[length - i - 1] + "\n"
            }
        }
        else{// if the error is somewhere in the middle
            for (let i = -1; i < 2; i++) {
                this._errorNumber.innerHTML += this._numbers.innerHTML.split("\n")[error.lineNr + i] + "\n"
                this._errorCode.innerHTML += this._display.innerHTML.split("\n")[error.lineNr + i] + "\n"
            }
        }
    }


    private drawResult() {
        if (!this._autorendercheck.checked)
            return
        let entities: Entity[] = this._parser.getEntities()
        let arcHead: Arc = this._parser.getArcs()
        let svg : svgStringContainer = new svgStringContainer()

        let startheight = 0
        for(let entity of entities){
            entity.draw(svg)
            svg.TotalWidth = Math.max(svg.TotalWidth, entity.x + entity.width)
            if(startheight < entity.getY)
                startheight = entity.getY
        }
        startheight +=20
        for(let entity of entities)
            entity.startLineDraw(svg, startheight)

        let maxheight =  arcHead.calcHighestArcY(startheight)
        arcHead.draw(startheight, startheight, maxheight, svg)
        let viewport = this._svg.getElementsByClassName("svg-pan-zoom_viewport")[0]
        if(viewport)
            viewport.innerHTML = svg.getSvg();
        else
            this._svg.innerHTML = svg.getSvg();

        this._svg.setAttribute("width", svg.TotalWidth + "px")
        this._svg.setAttribute("height", svg.Totalheight + "px")
    }

    /**
     * @post will have tried to parse the text and drawn the result or set an error
     */
    public startParser = () => {
        try {
            this.setNumbers();
            this._svg.style.display = "block"
            this._errorField.style.display = "none"
            this._parser.parseText(this._input.value)
            this.drawResult()
        }catch (e) {
            if (e instanceof ParserError){
                this._svg.style.display = "none"
                this._errorField.style.display = "block"
                this.setError(e)
            } else {
                console.error(e)
            }
        }
    }
}