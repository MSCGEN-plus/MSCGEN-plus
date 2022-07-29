import {Arc} from "../Drawables/Arc.js";
import {Globals} from "../Globals.js";
import {globals} from "../Main.js";
import {ParserError} from "./ParserError.js";
import {Options} from "../Options.js";
import {Note} from "../Drawables/Arcs/Note.js";
import {Box} from "../Drawables/Arcs/Box.js";
import {RBox} from "../Drawables/Arcs/RBox.js";
import {ABox} from "../Drawables/Arcs/ABox.js";
import {
    CallbackArc,
    CommentArc, EmphasisedArc,
    LostArc,
    MessageArc,
    MethodArc,
    OmittedArc,
    ReturnArc, SpacingArc
} from "../Drawables/Arcs/Arrows.js";
import {ColourParser} from "./ColourParser.js";
import {BooleanParser} from "./BooleanParser.js";
//import {Entity} from "../Entity.js";

export class ArclistParser implements Parser {
    private arcHead = new Arc(null);
    private _keywords : string[] = ["label", "url", "URL", "id", "idurl", "linecolour", "textcolour", "textbgcolour",
        "linecolor", "textcolor", "textbgcolor",
        "arcskip", "fontsize", "autospacegroup"]
    getResult(): any {
        return this.arcHead
    }
    parseText(text: string, offset: number): void {
        this.arcHead = new Arc(null)
        new GroupParser().parseGroup(text, offset, this.arcHead, new Context(globals))
    }
    public getKeywords() : string[]{
        return this._keywords
    }

}

/**
 * used to keep track of scoped options
 */
class Context {
    private _arcgradient : number
    private _fontsize : number
    private _linecolour : string
    private _textcolour : string
    private _textbgcolour : string
    private _autospacegroup : boolean

    constructor(context:Globals | Context) {
        if (context instanceof Globals) {
            this._arcgradient = globals.getOptions().getValue("arcgradient")
            this._fontsize = globals.getOptions().getValue("fontsize")
            this._autospacegroup = BooleanParser.parseBoolean(globals.getOptions().getValue("autospacegroup").toString())
        } else if (context instanceof Context) {
            this._arcgradient = context.arcgradient
            this._autospacegroup = context.autospacegroup
            this._fontsize = context.fontsize
            this._linecolour = context.linecolour
            this._textcolour = context.textcolour
            this._textbgcolour = context.textbgcolour
        } else {
            throw new TypeError(typeof context)
        }
    }

    get autospacegroup(): boolean {
        return this._autospacegroup;
    }

    set autospacegroup(value: boolean) {
        this._autospacegroup = value;
    }

    get arcgradient(): number {
        return this._arcgradient;
    }

    set arcgradient(value: number) {
        this._arcgradient = value;
    }

    get fontsize(): number {
        return this._fontsize;
    }

    set fontsize(value: number) {
        this._fontsize = value;
    }

    get linecolour(): string {
        return this._linecolour;
    }

    set linecolour(value: string) {
        this._linecolour = ColourParser.colourNameToRGB(value);
    }

    get textcolour(): string {
        return this._textcolour;
    }

    set textcolour(value: string) {
        this._textcolour = ColourParser.colourNameToRGB(value);
    }

    get textbgcolour(): string {
        return this._textbgcolour;
    }

    set textbgcolour(value: string) {
        this._textbgcolour = ColourParser.colourNameToRGB(value);
    }
}
class GroupParser {
    /**
     * parse a group of arcs, working recursively on groups
     * @param text input to parse
     * @param offset linenumber of first line of input
     * @param head {@link Arc} to be used as head for the return linked list
     * @param context the current {@link Context} in which the group starts
     */
    parseGroup(text: string, offset: number, head: Arc, context: Context): Arc {
        text = text.concat(";")
        let current = head
        let temp: Arc[] = []

        //copy context
        let scopeContext = new Context(context)


        //check for unclosed strings
        if(((text.match(/"/g)||[]).length - (text.match(/\\"/g)||[]).length) % 2 != 0)
            throw new ParserError("You have an unclosed quoted string",
                offset + GroupParser.newlinecounter(text.substring(0,text.lastIndexOf("\""))))

        //go through input item by item splitting on ;{}
        let item
        while (text.trim() != "") {

            //get new item
            try {
                //avoid counting any splitting chars while inside []
                let matchindex = text.match(/[;{}]/).index
                while (GroupParser.isInOptionList(text, matchindex)) {
                    matchindex = matchindex + 1 + text.substring(matchindex + 1).match(/[;{}]/).index
                }

                item = text.substring(0, matchindex + 1)
            } catch (e) {
                console.error(e)
                throw "something went very wrong";
            }

            //set offset for correct error lineNr
            offset += GroupParser.newlinecounter(item)

            //check for groups
            if (item.trim() == "{") {
                //find end of group and give the entire group substring as argument to parsegroup
                let group: string
                try {
                    group = text.substring(text.indexOf("{") + 1, GroupParser.closingBracketFinder(text, text.indexOf("{")) + 1)
                } catch (e) {
                    if(e instanceof ParserError)
                        offset += e.lineNr
                    throw new ParserError(e.message, offset)
                }
                temp.push(this.parseGroup(
                    group,
                    //calculate correct line number
                    offset,
                    //arc to attack to and the current scope context
                    current, scopeContext))
                offset += GroupParser.newlinecounter(group)
                text = text.substring(group.length + item.length)
                continue

                //scoped option handlers
            } else if (item.trim().startsWith("arcgradient")) {
                this.arcgradientHandler(item, offset, scopeContext);
            } else if (item.trim().startsWith("autospacegroup")) {
                this.autospacegroupHandler(item, offset, scopeContext);
            } else if (item.trim().startsWith("fontsize")) {
                this.fontsizeHandler(item, offset, scopeContext);
            } else if (item.trim().startsWith("linecolour") || item.trim().startsWith("linecolor")) {
                this.linecolourHandler(item, offset, scopeContext);
            } else if (item.trim().startsWith("textcolour") || item.trim().startsWith("textcolor")) {
                this.textcolourHandler(item, offset, scopeContext);
            } else if (item.trim().startsWith("textbgcolour") || item.trim().startsWith("textbgcolor")) {
                this.textbgcolourHandler(item, offset, scopeContext);

                //ignore if the item is in this list, currently ignores closing groups and trailing ;
            } else if (["}", ";"].indexOf(item.trim()) >=0 ) {


                //arcs
            } else {
                let arcs:Arc[] = []
                if(temp.length <= 0){
                    temp.unshift(current)
                }
                // handle an arc,arc,arc; style item
                while (item.trim() != "") {
                    //split item into separate arcs
                    //avoid counting any splitting chars while inside []
                    let matchindex = 0
                    try {
                        matchindex = item.match(/[,;]/).index
                    } catch (e) {
                        throw new ParserError(" '"+ item + "' found inside an arc,arc,arc; style list",
                            offset - GroupParser.newlinecounter(item))
                    }
                    while (GroupParser.isInOptionList(item, matchindex)) {
                        matchindex = matchindex + 1 + item.substring(matchindex + 1).match(/[,;]/).index
                    }
                    let subitem = item.substring(0, matchindex + 1)

                    //parse single arc
                    try {
                        arcs.push(ArcParser.parseArc(subitem.trim(), scopeContext));
                    } catch (e) {
                        throw new ParserError(e.message,
                            offset - GroupParser.newlinecounter(item.substring(item.indexOf(subitem.trim()))))
                    }
                    item = item.substring(subitem.length)
                    text = text.substring(subitem.length)
                }

                //link prev and next
                for (let arcTemp of temp) {
                    arcTemp.next = arcTemp.next.concat(arcs)
                }
                for (let arc of arcs) {
                    arc.prev = arc.prev.concat(temp)
                }
                current = arcs[0]
                temp = []
            }
            text = text.substring(item.length)
        }
        return current
    }
//yes these functions could probably be one generic one, they are just annoyingly different enough that it isn't worth the effort
    private textbgcolourHandler(item: string, offset: number, scopeContext: Context) {
        let match = item.match(/textbgcolou?r\s*?=\s*?"?(.+)"?\s*?;/)
        if (match == null) {
            throw new ParserError("Found a textbgcolour but could not find a colour, correct syntax: textbgcolour=\"colourName\"; or textbgcolour=\"#RRGGBB(AA)\";",
                offset - GroupParser.newlinecounter(item.substring(item.indexOf("textbgcolo"))))
        }
        try {
            scopeContext.textbgcolour = match[1]
        } catch (e) {
            throw new ParserError(e.message,
                offset - GroupParser.newlinecounter(item.substring(item.indexOf("textbgcolo"))))
        }
    }

    private textcolourHandler(item: string, offset: number, scopeContext: Context) {
        let match = item.match(/textcolou?r\s*?=\s*?"?(.+)"?\s*?;/)
        if (match == null ) {
            throw new ParserError("Found a textcolour but could not find a colour, correct syntax: textcolour=\"colourName\"; or textcolour=\"#RRGGBB(AA)\";",
                offset - GroupParser.newlinecounter(item.substring(item.indexOf("textcolo"))))
        }
        try {
            scopeContext.textcolour = match[1]
        } catch (e) {
            throw new ParserError(e.message,
                offset - GroupParser.newlinecounter(item.substring(item.indexOf("textcolo"))))
        }
    }

    private linecolourHandler(item: string, offset: number, scopeContext: Context) {
        let match = item.match(/linecolou?r\s*?=\s*?"?(.+)"?\s*?;/)
        if (match == null) {
            throw new ParserError("Found a linecolour but could not find a colour, correct syntax: linecolour=\"colourName\"; or linecolour=\"#RRGGBB(AA)\";",
                offset - GroupParser.newlinecounter(item.substring(item.indexOf("linecolo"))))
        }
        try {
            scopeContext.linecolour = match[1]
        } catch (e) {
            throw new ParserError(e.message,
                offset - GroupParser.newlinecounter(item.substring(item.indexOf("linecolo"))))
        }
    }

    private fontsizeHandler(item: string, offset: number, scopeContext: Context) {
        let match = item.match(/fontsize\s*?=\s*?"?(.+)"?\s*?;/)
        if (match == null || isNaN(parseFloat(match[1]))) {
            throw new ParserError("Found a fontsize but could not find a number, correct syntax: fontsize=\"number\";",
                offset - GroupParser.newlinecounter(item.substring(item.indexOf("fontsize"))))
        }
        try {
            scopeContext.fontsize = parseFloat(match[1])
        } catch (e) {
            throw new ParserError("The fontsize \"" + match[1] + "\" given could not be interpreted as a number",
                offset - GroupParser.newlinecounter(item.substring(item.indexOf("fontsize"))))
        }
    }

    private arcgradientHandler(item: string, offset: number, scopeContext: Context) {
        let match = item.match(/arcgradient\s*?=\s*?"?(.+)"?\s*?;/)
        if (match == null || isNaN(parseInt(match[1]))) {
            throw new ParserError("Found an arcgradient but could not find a number, correct syntax: arcgradient=\"number\";",
                offset - GroupParser.newlinecounter(item.substring(item.indexOf("arcgradient"))))
        }
        try {
            scopeContext.arcgradient = parseInt(match[1])
        } catch (e) {
            throw new ParserError("The arcgradient \"" + match[1] + "\" given could not be interpreted as a number",
                offset - GroupParser.newlinecounter(item.substring(item.indexOf("arcgradient"))))
        }
    }

    private autospacegroupHandler(item: string, offset: number, scopeContext: Context) {
        let match = item.match(/autospacegroup\s*?=\s*?"?(.+)"?\s*?;/)
        if (match == null) {
            throw new ParserError("Found a autospacegroup but could not find a mode, correct syntax: autospacegroup=\"[boolean]\";",
                offset - GroupParser.newlinecounter(item.substring(item.indexOf("autospacegroup"))))
        }
        try {
            scopeContext.autospacegroup = BooleanParser.parseBoolean(match[1])
        } catch (e) {
            throw new ParserError("The value \"" + match[1] + "\" given could not be interpreted as a boolean",
                offset - GroupParser.newlinecounter(item.substring(item.indexOf("autospacegroup"))))
        }
    }

    //count the newlines in a string
    private static newlinecounter(string: string): number {
        return (string.match(/\n/g) || []).length
    }

    //checks if the match is inside [] so we ignore stuff like strings and the comma's separating options
    private static isInOptionList(string: string, target: number): boolean {
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

    //find and return the index of the closing bracket
    private static closingBracketFinder(string: string, start: number = 0): number {
        let counter = 0;
        let result = -1;
        for (let i = start; i < string.length; ++i) {
            if (!this.isInOptionList(string, i) && string[i] == "{") {
                ++counter
                continue
            }
            if (!this.isInOptionList(string, i) && string[i] == "}") {
                --counter
            }
            if (counter == 0) {
                result = i
                break
            }
        }
        if (result == -1)
            throw new Error("no closing bracket")
        else if (!(/[{;}]\s*}$/).test(string.substring(start, result + 1))){
            throw new ParserError("missing semicolon",
                this.newlinecounter(string.substring(start, start + result)) - 1)
        }
        else return result
    }
}

class ArcParser {
    /**
     * parses a string containing a single arc and returns the resulting {@link Arc}
     * @param line
     * @param context
     * @return Arc
     */
    public static parseArc(line: string, context: Context): Arc {
        //split off the optlist part
        let match = line.match(/\[([^[]+?)\][;,]$/)
        let optlist
        if (match) {
            optlist = match[1]
            line = line.slice(0, match.index)
        } else if(line.trim().endsWith(";") || line.trim().endsWith(",")){
            line = line.trim().slice(0,-1)
        }
        //check if we missed an optlist because it doesn't have a ; or ,
        if (/\[([^[]+?)\]/.test(line)){
            throw new Error("looks like you have an optionlist not followed by , or ;")
        }

        let relation = new RegExp(/^(box|abox|rbox|note|--|==|\.\.|::|<->|<=>|<\.>|<<=>>|<<>>|<:>|->|=>|\.>|=>>|:>|>>|-x)$/)
        let relation_from = new RegExp(/^(<-|<=|<\.|<<=|<:|<<|x-)$/)

        //matches above relations but is sorted by length to match longest first
        let arctypes = new RegExp(/^(<<=>>|abox|rbox|note|\.\.|<\.>|<<>>|box|<->|<=>|<:>|\.>|=>>|<\.|<<=|--|==|::|->|=>|:>|>>|-x|<-|<=|<:|<<|x-)/)

        let fromEntity = null
        let toEntity = null
        let arctype: string

        //finds "..." , "---" or "|||" arcs
        if (RegExp(/^(\.\.\.|\|\|\||---)$/).test(line.trim())) {
            arctype = line.trim()

        } else {

            //get the first entity
            let from = this.getEntity(line)
            line = line.slice(from.length).trim()


            //get the type of arc
            try {
                arctype = line.match(arctypes)[1]?.toLowerCase()
            } catch (e) {
                throw new Error("Could not recognise this type of arc")
            }
            if (arctype == undefined)
                throw new Error("Could not recognise this type of arc")
            line = line.slice(arctype.length).trim()


            //get the second entity
            let to = this.getEntity(line)
            line = line.slice(to.length).trim()

            //remove any quotes
            from = from.trim().replace(/^"|"$/g, "")
            to = to.trim().replace(/^"|"$/g, "")

            //check if it contains unescaped quotes
            if(/[^\\]"/g.test(from)){
                throw new Error("Entity name '" + from + "' contains unescaped quotes, please use \\\" instead of \"")
            }
            from = from.replace(/\\"/g, "\"")

            if(/[^\\]"/g.test(to)){
                throw new Error("Entity name '" + to + "' contains unescaped quotes, please use \\\" instead of \"")
            }
            to = to.replace(/\\"/g, "\"")


            if (line.trim() != "")
                throw new Error("arc syntax is \"Entity Relation Entity [Options]\" but also found: " +line.trim())
            //get the corresponding objects from the name
            if (from.trim() != "*") {
                fromEntity = globals.getEntity(from)
                if (!fromEntity)
                    throw new Error("Entity \"" + from + "\" is not defined")
            }
            if (to.trim() != "*") {
                toEntity = globals.getEntity(to)
                if (!toEntity)
                    throw new Error("Entity " + to + " is not defined")
            }

            //swap stuff around if using a reverse relation
            if (relation_from.test(arctype.trim())) {
                arctype = arctype.split("").reverse().join("").replace(/</g, ">");
                [fromEntity, toEntity] = [toEntity, fromEntity]
            }

            //check if the arctype is supported
            if (!relation.test(arctype.trim())) {
                throw new Error("Could not recognise this type of arc: " + arctype)
            }
        }

        let arc =  this.getArcFromArcType(arctype, fromEntity, toEntity);

        //set options
        arc.arcgradient = context.arcgradient
        arc.fontsize =  context.fontsize
        if (context.linecolour)
            arc.linecolour =  context.linecolour
        if (context.textcolour)
            arc.textcolour =  context.textcolour
        if (context.textbgcolour)
            arc.textbgcolour =  context.textbgcolour
        if (context.autospacegroup != null)
            arc.autospacegroup =  context.autospacegroup

        if(optlist)
            this.setOptions(arc, optlist)
        return arc
    }

    private static getArcFromArcType(arctype: string, fromEntity: any, toEntity: any): Arc {
        switch (arctype.trim().toLowerCase()) {
            case ("->"):
            case ("<->"):
            case ("--"):
                return new MessageArc([], arctype.includes("<"), arctype.includes(">"), fromEntity, toEntity)
            case ("=>"):
            case ("<=>"):
            case ("=="):
                return new MethodArc([], arctype.includes("<"), arctype.includes(">"), fromEntity, toEntity)

            case (">>"):
            case ("<<>>"):
            case (".."):
            case (".>"):
                return new ReturnArc([], arctype.includes("<"), arctype.includes(">"), fromEntity, toEntity)

            case ("=>>"):
            case ("<<=>>"):
                return new CallbackArc([], arctype.includes("<"), arctype.includes(">"), fromEntity, toEntity)

            case ("-x"):
                return new LostArc([], arctype.includes("<"), arctype.includes(">"), fromEntity, toEntity)

            case (":>"):
            case ("<:>"):
            case ("::"):
                return new EmphasisedArc([], arctype.includes("<"), arctype.includes(">"), fromEntity, toEntity)

            case ("..."):
                return new OmittedArc([], arctype.includes("<"), arctype.includes(">"), fromEntity, toEntity)

            case ("---"):
                return new CommentArc([], arctype.includes("<"), arctype.includes(">"), fromEntity, toEntity)

            case ("|||"):
                return new SpacingArc([], arctype.includes("<"), arctype.includes(">"), fromEntity, toEntity)

            case("note"):
                return new Note([], fromEntity, toEntity)

            case("box"):
                return new Box([], fromEntity, toEntity)

            case("rbox"):
                return new RBox([], fromEntity, toEntity)

            case("abox"):
                return new ABox([], fromEntity, toEntity)
            default:
                throw Error("unknown type of arc: " + arctype.trim())
        }
    }

    //parses an attrlist and applies it to the given arc
    private static setOptions(arc: Arc, string: string) {
        //split based on "," we can't just split() due to string arguments possibly containing a ","
        let optarray: string[] = []
        let inString = false
        for (let i = 0; i < string.length; ++i) {
            if (string[i] == "\"" && string[i-1] != "\\") {
                inString = !inString
            } else if (!inString && string[i] == ",") {
                optarray.push(string.slice(0, i))
                string = string.slice(i+1)
                i = 0
            }
        }
        optarray.push(string)
        //switch based on possible options
        for (let option of optarray) {
            if(option.indexOf("=") == -1){
                throw new Error(option+ " is not a valid arc option, it is missing a =")
            }
            let opt = [option.slice(0, option.indexOf("=")).trim(),
                option.slice(option.indexOf("=")+1).trim()]
            if(!/^".*"$/g.test(opt[1]) && / /g.test(opt[1])){
                throw new Error(opt[0] + " value '" + opt[1]+ "' contains spaces but is not surrounded with \" \"")
            }
            opt[1] = opt[1].replace(/^"|"$/g, "")
            if(/[^\\]"/g.test(opt[1])){
                throw new Error(opt[0] + " value '" + opt[1]+ "' contains unescaped quotes, please use \\\" instead of \"")
            }
            opt[1] = opt[1].replace(/\\"/g, "\"")
            switch (opt[0].toLowerCase()) {
                case 'label':
                    arc.label = opt[1];
                    break;
                case 'url':
                    arc.URL = opt[1];
                    break;
                case 'id':
                    arc.ID = opt[1];
                    break;
                case 'idurl':
                    arc.IDURL = opt[1];
                    break;
                case 'linecolour':
                case 'linecolor':
                    arc.linecolour = opt[1];
                    break;
                case 'textcolour':
                case 'textcolor':
                    arc.textcolour = opt[1];
                    break;
                case 'textbgcolour':
                case 'textbgcolor':
                    arc.textbgcolour = opt[1];
                    break;
                case 'arcskip':
                    if(isNaN(parseFloat(opt[1])))
                        throw new Error("arcskip " + opt[1] + " could not be interpreted as a number")
                    try {
                        arc.arcskip = parseFloat(opt[1]);
                    } catch (e) {
                        throw new Error("arcskip " + opt[1] + " could not be interpreted as a number")
                    }
                    break;
                case 'arcgradient':
                    if(isNaN(parseInt(opt[1])))
                        throw new Error("arcgradient " + opt[1] + " could not be interpreted as a number")
                    try {
                        arc.arcgradient = parseInt(opt[1]);
                    } catch (e) {
                        throw new Error("arcgradient " + opt[1] + " could not be interpreted as a number")
                    }
                    break;
                case 'fontsize':
                    if(isNaN(parseFloat(opt[1])))
                        throw new Error("fontsize " + opt[1] + " could not be interpreted as a number")
                    try {
                        arc.fontsize = parseFloat(opt[1]);
                    } catch (e) {
                        throw new Error("fontsize " + opt[1] + " could not be interpreted as a number")
                    }
                    break;
                default:
                    throw new Error(opt[0] + " is not a valid arc option")

            }
        }
    }


    private static getEntity(line: string): string {
        //quoted entity
        if (line.trim()[0] == "\"") {
            let inStringName = false;
            for (let i = line.indexOf("\""); i < line.length; i++) {

                if (line[i] == "\"" && line[i - 1] != "\\") {
                    inStringName = !inStringName
                    continue
                }
                if (inStringName)
                    continue

                return line.substring(0, i)//.trim()//.replace(/^"|"$/g, " ")
            }
            return line//.trim()//.replace(/^"|"$/g, " ")
        }
        //unquoted entity
        //take continuously smaller slices of the line until matching an entity
        for (let i = line.length; i > 0; --i) {
            if (i==1 || globals.entities.has(line.slice(0,i).trim().replace(/^"|"$/g, ""))){
                return line.slice(0,i)
            }
        }
    }
}