import {BooleanParser} from "./parser/BooleanParser.js";

export class Options{

    constructor(copy? : Options) {
        if(copy != undefined) {
            for (const key in copy._options) {
                this._options[key] = copy._options[key]
            }
            return
        }
        this._options["hscale"] =  1
        this._options["arcgradient"] =  0
        this._options["fontsize"] =  14

        this._options["wordwraparcs"] =  0
        this._options["autospacegroup"] =  0
    };

    private _options: {[key: string]: number} = {
    "hscale" : 1,
    "arcgradient": 0,
    "fontsize" : 14, //px
    "wordwraparcs": 0,
    "autospacegroup": 0
    };

    private _booleanValues:string[] = ['wordwraparcs', "autospacegroup"];


    public setValue(key : string, value : string){
        if(this._options[key] === undefined){
            throw new Error( "\"" + key + "\"" + " is not a valid option")
        }
        if(this._booleanValues.indexOf(key) >= 0 ){
            try {
                this._options[key] = +BooleanParser.parseBoolean(value)
            }catch (e){
                throw new Error("\"" + value + "\"" + " is not a valid boolean value")
            }
            return
        }
        let optionValue : number = Number.parseFloat(value)
        if(isNaN(optionValue)){
            throw new Error("\"" + value + "\"" + " is not a valid input for that option")
        }
        this._options[key] = optionValue
    }

    public getValue(key : string) : number{
        return this._options[key]
    }
}