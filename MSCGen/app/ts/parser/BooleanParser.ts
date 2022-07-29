export class BooleanParser {

    /**
     * @param text the text value to be parsed (can still have quotation marks)
     * @return boolean returns the boolean value of the given string
     * @throws Error if the value given is not recognised as a boolean
     */
    public static parseBoolean(text : String) : boolean{
        text = text.trim().replace(/^"|"$/g, "")
        if(this._true.indexOf(text.trim().toLowerCase()) > -1)
            return true

        if(this._false.indexOf(text.trim().toLowerCase()) > -1)
            return false

        throw new Error("the given value is not recognised as a boolean")
    }

    public static getKeywords() : string[]{
        return this._true.concat(this._false).filter((element) => {(element.match(/\d+/) || []).length > 0} )
    }

    private static _true : string[] = [
        "1",
        "true",
        "on",
        "yes"
    ]

    private static _false : string[] = [
        "0",
        "false",
        "off",
        "no"
    ]
}