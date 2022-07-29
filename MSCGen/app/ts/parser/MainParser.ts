import {OptionParser} from "./OptionParser.js";
import {ArclistParser} from "./ArclistParser.js";
import {ParserError} from "./ParserError.js";
import {BooleanParser} from "./BooleanParser.js";
import {EntityParser} from "./EntityParser.js";
import {globals} from "../Main.js";
import {Entity} from "../Drawables/Entity.js";
import {Arc} from "../Drawables/Arc";

export class MainParser{
    private _hasOptions : boolean = false
    private _optionParser : OptionParser = new OptionParser()
    private _arclistParser: ArclistParser = new ArclistParser()
    private _entityParser: EntityParser = new EntityParser()

    /**
     * @param text the raw user input
     * @return string the text but some characters have been replaced with their unicode
     */
    public htmlPrep(text : string) : string {
        text = text.replace(/&/g, '&amp;').replace(/</g, "&lt;").replace(/>/g, "&gt;") //html safe
        //text = text.replace(/\r|\n|\r\n/g,"<br>") //replaces all newlines with breaks
        // text = text.replace(/\t/g, "    ") //replaces all tabs with 4 spaces

        if(text.endsWith("\n")) //for some reason if the text ends in a break it is ignored so we add another
            text += "\n"

        return text
    }

    /**
     * @param text the raw user input
     * @return string[] an array of the text input but without the comments and without the msc braces split on ';'
     * @post _hasOptions will be set to true if global options have been recognised else false
     */
    public prepText(text : string) : string[]{
        text = this.removeComments(text)
        text = this.removeMsc(text)

        let textArray : string[] = text.split(";")
        let firstWord : RegExpMatchArray = text.match(/\w+/)
        if(firstWord !== null){
            this._hasOptions = this._optionParser.getKeywords().indexOf(firstWord[0]) > -1
        }
        return textArray
    }

    /**
     * @param text the raw user input
     * @post all the parsers that have been called will have the appropriate elements that can later be called
     */
    public parseText(text : string) : void{
        globals.reset()
        let textArray : string[] = this.prepText(text)
        if(this._hasOptions){
            this._optionParser.parseText(textArray[0])
        }
        globals.options = this._optionParser.getResult()
        this._entityParser.setExtraValues (this.getAllKeyWords(), globals.getOptions().getValue("hscale"), globals.getOptions().getValue("fontsize"))
        this._entityParser.parseText(textArray[this._hasOptions ? 1 : 0],
            (textArray.slice(0, this._hasOptions ? 1 : 0).join(";").match(/\n/g) || []).length)

        this._arclistParser.parseText(textArray.slice(this._hasOptions ? 2 : 1).join(";"),
            (textArray.slice(0, this._hasOptions ? 2 : 1).join(";").match(/\n/g) || []).length);

    }

    /**
     * @param text the raw user input
     * @return string the user input but all comments have been removed and if necessary replaced by a newline
     */
    private removeComments(text : string) : string{

        let matches : RegExpMatchArray  = text.match(/^.*(\/{2}|#).*$/gm) || []
        for (let i = 0; i < matches.length; i++) {
            if(!matches[i].replace(/"[^"]*"|'[^']*'/g, '').match(/(\/{2}|#)/g)){
                continue
            }
            text = text.replace(matches[i].match(/(\/{2}|#).*/)[0] + "\n", "\n")
        }

        matches = text.match(/(\/\*[\s\S]*?\*\/)/g) || []
        for (let i = 0; i < matches.length; i++) {
            let lines = matches[i].match(/\n/g)
            let lineAmount : number = 0
            if(lines !== null)
                lineAmount = lines.length
            text = text.replace(matches[i], "\n".repeat(lineAmount))
        }
        return text
    }

    /**
     * @param text the user input without comments
     * @return string the input but without the msc braces which will be replaced byy newlines
     */
    private removeMsc(text : string) : string{
        //checks if the text starts with 'msc{' preceded by any amount of whitespace
        let tag : RegExpMatchArray = text.match(/^\s*msc\s*{/g)
        if(tag === null)
            this.throwError(text.split("\n"), "you didn't put msc in or there is text in front of it", /^\s*$|^\s*msc\s*{?\s*$/)
        let lines = tag[0].match(/\n/g)
        let lineAmount : number = 0
        if(lines !== null)
            lineAmount = lines.length
        text = text.replace(tag[0], "\n".repeat(lineAmount))


        //checks if the text ends with a bracket followed by any amount of whitespace
        tag = text.match(/}\s*$/g)
        if(tag === null)
            this.throwErrorBackwards(text.split("\n"), "the closing brace for msc is missing or there is text after it", /^\s*$|^\s*}\s*$/)
        lines = tag[0].match(/\n/g)
        lineAmount = 0
        if(lines !== null)
            lineAmount = lines.length
        text = text.replace(/}\s*$/, "\n".repeat(lineAmount + 1))

        return text
    }


    /**
     * @param text the user input split on newlines
     * @param msg the error message
     * @param regex the regex to find the error
     *
     * @throws ParserError with linenr the first occurrence of the regex or 0 if it isnt found
     */
    public throwError(text: string[], msg : string, regex : RegExp){
        for (let i = 0; i < text.length; i++) {
            if(text[i].match(regex) === null){
                throw new ParserError(msg, i)
            }
        }
        throw new ParserError(msg, 0)
    }
    /**
     * @param text the user input split on newlines
     * @param msg the error message
     * @param regex the regex to find the error
     *
     * @throws ParserError with linenr the last occurrence of the regex or 0 if it isnt found
     */

    public throwErrorBackwards(text: string[], msg : string, regex : RegExp){
        for (let i = text.length - 1; i >= 0; i--) {
            if(text[i].match(regex) === null){
                throw new ParserError(msg, i)
            }
        }
        throw new ParserError(msg, 0)
    }

    public getAllKeyWords() : string[]{
        return [].concat(this._optionParser.getKeywords(), BooleanParser.getKeywords(), this._arclistParser.getKeywords(),this._entityParser.getKeywords())
    }

    public getEntities() : Entity[]{
        return this._entityParser.getResult()
    }

    public getArcs() : Arc{
        return this._arclistParser.getResult()
    }
}