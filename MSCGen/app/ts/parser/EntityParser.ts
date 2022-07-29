import {Entity} from "../Drawables/Entity.js";
import {Globals} from "../Globals.js";
import {globals} from "../Main.js";
import {ParserError} from "./ParserError.js";


export class EntityParser implements Parser {
    private _entities : string[]
    private _entityToParse : string
    private _entityString : string
    private _startOffset: number
    private _entityList: Entity[]
    private _keywords: string[] = ["label", "linecolour", "textcolour", "textbgcolour",
        "linecolor", "textcolor", "textbgcolor", "arcskip", "fontsize", "arclinecolor", "arclinecolour",
        "arctextcolor", "arctextcolour"]
    private _hscale: number
    private _fontsize: number

    /** Takes extra values that might have been set by the global options + the keywords that can't be entity names
     * @param allKeywords keywords that come from the other parser which cant be names
     * @param hscale the global hscale to set for the entities
     * @param fontsize the global fontsize to set for the entities.
     */
    public setExtraValues (allKeywords: string[], hscale: number, fontsize: number){
        this._keywords.concat(allKeywords)
        this._hscale = hscale
        this._fontsize = fontsize
    }

    public getKeywords(){
        return this._keywords
    }

    public getResult() : Entity[]{
        return this._entityList
    }

    /** Parse the text of the entity list string in the input
     * @param text the complete entity list string
     * @param offset the offset of linenumbers on which an error needs to fall
     * @post fills the _entityList with the parsed entities
     */
    public parseText(text: string, offset: number) {
        this._entityList = []
        this._startOffset = offset
        this.checkQuotes(text)
        this._entities = []
        while (text.trim() != ""){
            let matchindex = text.match(/[,;]|$/).index
            while (this.isInOptionList(text, matchindex)) {
                matchindex = matchindex + 1 + text.substring(matchindex + 1).match(/[,;]|$/).index
            }
            this._entities.push(text.substring(0, matchindex))
            text = text.substr(matchindex + 1)
        }
        this.parseEntities()
    }

    private  isInOptionList(string: string, target: number): boolean {
        let inOptionList = false;
        let inString = false;
        for (let i = 0; i < string.length; i++) {
            if (string[i] == "\"" && string[i-1] != "\\") {
                inString = !inString
            }
            else if (!inString && string[i] == "[") {
                inOptionList = true
                continue
            }
            if (!inString && string[i] == "]") {
                inOptionList = false
            }
            if (i == target) {
                return inOptionList || inString
            }
        }
    }

    /** Checks if there is an unclosed string by counting the unescaped quotes
     * @param text the complete entitylist string
     * @throws ParserError if the amount of unescaped quotes are uneven, thus having an unclosed string
     */
    private checkQuotes(text:string){
        let quoteAm = 0
        for(let i = 0; i<text.length;i++){
            if(text[i].match(/"/) && !text[i-1].match(/\\/))
                quoteAm++
        }
        if (quoteAm % 2 != 0)
            throw new ParserError("You have an unclosed quoted string with your entities.",
                this._startOffset + EntityParser.newLineCounter(text.substring(0,text.lastIndexOf("\""))))

    }

    private static newLineCounter(string: string): number {
        return (string.match(/\n/g) || []).length
    }

    /** Parses the entities in the _entities list
     * @post sets the entities in the global entityList
     */
    private parseEntities(): void{
        let xMultiplier = 0
        for (const entity of this._entities){
            this._entityString = entity
            this._entityToParse = entity.trim()
            this.bracketCheck()

            let entityObj = new Entity(this.findEntityName())
            //Sets the size for the boxes of the entities.
            entityObj.setDrawValues(Math.floor((160*this._hscale*xMultiplier)+((120*this._hscale)/2)+10), this._fontsize,
                this._hscale, Math.floor(120 *this._hscale))
            if(entity.indexOf("[") != -1)
                this.parseOptions(entityObj)

            this._startOffset = this._startOffset+EntityParser.newLineCounter(entity)
            this._entityList.push(entityObj)
            xMultiplier++
        }
        for(const entity of this._entityList){
            globals.setEntity(entity)
        }
    }

    /** Parses the name of an entity according to the right syntax
     * @throws ParserError whenever the entity name is against the proper syntax
     * @post returns the parsed entity name
     */
    private findEntityName(): string {
        let entityName: string
        if(this._entityToParse.indexOf("[") == -1)
            entityName = this._entityToParse.trim()
        else
            entityName = this._entityToParse.slice(0, this._entityToParse.indexOf("[")).trim()

        //no name given, check later for label.
        if (entityName == "") {
            throw new ParserError("You forgot to give an entity name.", this._startOffset)
        }

        //correct naming of entity without quotes
        else if(!entityName.startsWith("\"") && !entityName.endsWith("\"")) {
            if (entityName.match(/^[a-zA-Z0-9_]+$/)) {
                entityName = entityName.trim()
                if (this._keywords.indexOf(entityName) >= 0)
                    throw new ParserError("Your entityname matches a keyword, this is only allowed if you put it between quotes(\"keyword\").",
                        this._startOffset + EntityParser.newLineCounter(this._entityString.substring(0, this._entityString.search(/\S/))))

                return entityName
            }
            else
                throw new ParserError("your entityname is an unquoted string, this only allows letters and numbers. Please use a quoted string for symbols.",
                    this._startOffset + EntityParser.newLineCounter(this._entityString.substring(0, this._entityString.search(/\S/))))

        }

        //correct naming of entity with quotes
        else if (entityName.match(/^"(?:[^\[\]"\\]|\\.)*"$/)) {
            entityName = entityName.trim().replace(/^"|"$/g, "")
            entityName = entityName.replace(/\\"/g, "\"")
            return entityName
        }



        else {

            if(entityName.slice(entityName.match(/[a-zA-Z0-9_]+/)[0].length).length>=0){
                throw new ParserError("There is text after/before the name. Either give one word or a string between quotes.",
                    this._startOffset + EntityParser.newLineCounter(this._entityString.substring(0,this._entityString.search(/\S/))))
            }
            else if(entityName.slice(entityName.match(/"(?:[^\[\]"\\]|\\.)*"/)[0].length).length>0) {
                throw new ParserError("There is text after/before the name. Either give one word or a string between quotes.",
                    this._startOffset + EntityParser.newLineCounter(this._entityString.substring(0,this._entityString.search(/\S/))))
            }
            else
                throw "Something went very wrong!"
        }
    }

    /** Checks if the brackets for the option list are correct according to the syntax
     * @throws ParserError whenever the brackets for the option list are against the proper syntax
     * @post allows the parseEntities function to continue after checking
     */
    private bracketCheck(){
        let slicable : string = this._entityToParse
        let slicableLn = slicable.length
        let openBracketAm: boolean = false
        let closeBracketAm: boolean = false
        let index: number = 0
        while(index < slicableLn){
            if(slicable[index] == "[") {
                if (!openBracketAm){
                    openBracketAm = true
                }
                else
                    throw new ParserError("You have more than one opening bracket.",
                    this._startOffset + EntityParser.newLineCounter(this._entityString.substring(0, index)))
            }
            else if(slicable[index] == "]"){
                if(!closeBracketAm){
                    closeBracketAm = true
                }
                else
                    throw new ParserError("You have more than one closing bracket.",
                    this._startOffset + EntityParser.newLineCounter(this._entityString.substring(0,index)))
            }
            index++
        }
        if(openBracketAm && !closeBracketAm)
            throw new ParserError("you have an opening bracket, but no closing bracket",
                this._startOffset + EntityParser.newLineCounter(this._entityString.substring(0,this._entityString.indexOf("["))))

        else if(!openBracketAm && closeBracketAm)
            throw new ParserError("you have a closing bracket, but no opening bracket",
                this._startOffset + EntityParser.newLineCounter(this._entityString.substring(0,this._entityString.indexOf("]"))))

        else if((slicable.indexOf("]") < slicable.indexOf("[")) && openBracketAm && closeBracketAm)
            throw new ParserError("You have a closing bracket before an opening bracket.",
                this._startOffset + EntityParser.newLineCounter(this._entityString.substring(0,this._entityString.indexOf("]"))))


    }

    /** Parses the option list of the entities
     * @param entityObj the current entity that's being parsed
     * @throws ParserError Whenever the options go against the syntax
     * @post sets the options for the current entityObj after parsing
     */
    private parseOptions(entityObj: Entity){
        let PostOptionsNLs: number = this._startOffset + EntityParser.newLineCounter(this._entityToParse.substring(0,this._entityToParse.search("]")))
        if(this._entityToParse.indexOf("]") != -1){
            if(this._entityToParse.substring(this._entityToParse.indexOf("]")+1).trim() != "")
                throw new ParserError("There is text after the optionlist.",
                    PostOptionsNLs + EntityParser.newLineCounter(this._entityString.substring(0,this._entityString.indexOf("]"))))
        }
        let optionString: string = this._entityToParse.substring(this._entityToParse.indexOf("[")).replace("["," ").replace("]"," ").trim()
        if(optionString == "")
            throw new ParserError("The option list is empty.",
                this._startOffset + EntityParser.newLineCounter(this._entityString.substring(0,this._entityString.indexOf("["))))
        let optionArray: string[] = []
        let inString = false
        for (let i = 0; i < optionString.length; ++i) {
            if (optionString[i] == "\"" && optionString[i-1] != "\\") {
                inString = !inString
            } else if (!inString && optionString[i] == ",") {
                optionArray.push(optionString.slice(0, i))
                optionString = optionString.slice(i+1)
                i = 0
            }
        }
        optionArray.push(optionString)
        this.setOptions(entityObj, optionArray)

    }

    /** Parses per option of the option array to check if they follow the syntax and then adds them to the entity
     * @param ent the current entity that's being parsed
     * @param optarray the array containing the parsed options from the parseOptions function
     * @throws ParserError if an option doesn't follow the the right syntax/ if an option isn't in optionSetting
     */
    private setOptions(ent: Entity, optarray: string[]) {
        let optionnum = 0

        for (let option of optarray) {
            optionnum++
            if(option == "")
                throw new ParserError("You put a comma, but no option.",
                    this._startOffset + EntityParser.newLineCounter(this._entityString.substring(0,this._entityString.indexOf(option))))

            if(option.indexOf("=") == -1)
                throw new ParserError("You forgot an equals(=) for the " + option + " option.",
                    this._startOffset + EntityParser.newLineCounter(this._entityString.substring(0,this._entityString.indexOf(option))))

            let opt = [option.slice(0, option.indexOf("=")).trim(),
                option.slice(option.indexOf("=")+1).trim()]


            if (opt[1] == "")
                throw new ParserError("You didnt give a value for the " + opt[0] + " option. (option = \"value\")",
                    this._startOffset + EntityParser.newLineCounter(this._entityString.substring(0,this._entityString.indexOf("["))))

            if(!/^".*"$/g.test(opt[1]) && / /g.test(opt[1]))
                throw new ParserError(opt[0] + " value " + opt[1]+ " contains spaces but is not surrounded with \" \"",
                    this._startOffset + EntityParser.newLineCounter(this._entityString.substring(0,this._entityString.indexOf("["))))

            //Checks if a name starts with quotes at the start and end, if so it removes those.
            if(opt[1].trim().startsWith("\"") && opt[1].trim().endsWith("\""))
                opt[1] = opt[1].trim().replace(/^"|"$/g, "")
            opt[1] = opt[1].trim()

            if(!opt[1].trim().match(/^(?:[^\[\]"\\]|\\.)*$/g))
                throw new ParserError("You have unescaped quotes in the value of the " + opt[0] + " option. (option = \"value\")",
                    this._startOffset + EntityParser.newLineCounter(this._entityString.substring(0,this._entityString.indexOf("["))))

            opt[1] = opt[1].replace(/\\"/g,"\"")

            try{
                this.optionSetting(opt[0], opt[1], ent)
            }catch(e){
                throw new ParserError(e.message,
                    this._startOffset + EntityParser.newLineCounter(this._entityString.substring(0,this._entityString.indexOf(option))))
            }
        }
    }


    /** Switch case that check if the optionLabel matches an actual option, if so it adds the
     * @param optionLabel the option label for the option to be parsed
     * @param optionValue the option value for the option to be parsed
     * @param ent the entity that's currently being parsed.
     * @throws Error if an option doesnt exist/ a value doesnt follow the right syntax
     * @post Sets the current option that is being parsed for the Entity ent
     */
    private optionSetting(optionLabel: string, optionValue: string, ent: Entity){
        switch (optionLabel.toLowerCase()) {
            case 'label':
                ent.label = optionValue.trim().replace(/^"|"$/g, "")
                break
            case 'linecolour':
            case 'linecolor':
                try{
                    ent.linecolour = optionValue
                    break
                }catch(e){
                    throw new Error("\"" +optionValue + "\" isn't a valid color for the " + optionLabel + " option.")
                }
            case 'textbgcolour':
            case 'textbgcolor':
                try{
                    ent.textbgcolour = optionValue
                    break
                }catch(e){
                    throw new Error("\"" +optionValue + "\" isn't a valid color for the " + optionLabel + " option.")
                }
            case 'textcolour':
            case 'textcolor':
                try{
                    ent.textcolour = optionValue
                    break
                }catch(e){
                    throw new Error("\"" +optionValue + "\" isn't a valid color for the " + optionLabel + " option.")
                }
            case 'arclinecolour':
            case 'arclinecolor':
                try{
                    ent.arclinecolour = optionValue
                    break
                }catch(e){
                    throw new Error("\"" +optionValue + "\" isn't a valid color for the " + optionLabel + " option.")
                }
            case 'arctextbgcolour':
            case 'arctextbgcolor':
                try{
                    ent.arctextbgcolour = optionValue
                    break
                }catch(e){
                    throw new Error("\"" +optionValue + "\" isn't a valid color for the " + optionLabel + " option.")
                }
            case 'arctextcolour':
            case 'arctextcolor':
                try{
                    ent.arctextcolour = optionValue
                    break
                }catch(e){
                    throw new Error("\"" +optionValue + "\" isn't a valid color for the " + optionLabel + " option.")
                }
            case 'fontsize':
                if(isNaN(parseFloat(optionValue)))
                    throw new Error("you didnt give a proper numeric value for the "+ optionLabel + " option.")

                try {
                    ent.fontsize = parseFloat(optionValue);
                }
                catch (e) {
                    throw new Error("you didnt give a proper numeric value for the "+ optionLabel + " option.")
                }
                break;
            default:
                throw new Error(optionLabel + ", is not an option")
        }
    }
}