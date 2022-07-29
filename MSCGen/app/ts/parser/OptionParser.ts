import {Globals} from "../Globals.js";
import {ParserError} from "./ParserError.js";
import {Options} from "../Options.js";

export class OptionParser implements Parser{
    private _options : Options = new Options()
    private _lookup : string[]
    private _keywords : string[] = ["hscale", "width", "arcgradient", "fontsize", "wordwraparcs", "autospacegroup"]

    /**
     * @param text the sanitised user input
     * @post all the values in _options will be set to the users input and sets the lookup to text split on newlines
     */
    public parseText(text: string) : void {
        this._options = new Options()
        this._lookup = text.split('\n')
        this.parseOptlist(text)
    }

    /*
     *   optlist: opt
     * | optlist ',' opt
     */
    private parseOptlist(text: string) : void {
        let commaPos : number = text.indexOf(",")
        if (commaPos == - 1){
            this.parseOpt(text.trim())
            return
        }
        let option : string = text.substr(0, text.indexOf(",")).trim()
        let optlist : string = text.substr(text.indexOf(",") + 1).trim()
        this.parseOpt(option)
        this.parseOptlist(optlist)
    }

    /*
     *opt: optval '=' string
     */
    private parseOpt(text: string) : void {
        let equalPos : number = text.indexOf("=")
        if (equalPos == - 1){
            this.throwError("an option value is assigned to an option with a '='", text)
        }
        let optionName: string = text.substr(0, equalPos).trim()
        let optionValue: string = text.substr(equalPos + 1).trim()
        optionValue = optionValue.replace(/^"|"$/g, "")
        try {
            this._options.setValue(optionName, optionValue)
        }catch (e){
            this.throwError(e, text)
        }

    }

    private throwError(msg : string, line : string){
        for (let i = 0; i < this._lookup.length; i++) {
            if(this._lookup[i].indexOf(line) !== -1){
                throw new ParserError(msg, i)
            }
        }
    }

    public getResult() : Options{
        return this._options
    }

    public getKeywords() : string[]{
        return this._keywords
    }

}