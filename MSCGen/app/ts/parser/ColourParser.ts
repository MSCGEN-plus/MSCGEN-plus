//parses a colour string into a valid rgb
export class ColourParser {
    /**
     * returns a hex colour string from the given input string, for example: #ffffff
     * @param string string of format #RGB(A)
     */
    public static colourNameToRGB(string:string):string{
        string = string.trim().replace(/^"|"$/g, "")
        if ((/^#(?:[0-9a-fA-F]{3,4}){1,2}$/).test(string))
            return string
        if(this._colours[string] === undefined){
            throw new Error("colo(u)r " + string + " isn't supported")
        } else return this._colours[string]

    }

    private static _colours : {[key: string]: string} = {
        "white" : "#ffffffff",
        "silver" : "#c0c0c0ff",
        "gray" : "#808080ff",
        "grey" : "#808080ff",
        "black" : "#000000ff",
        "maroon" : "#800000ff",
        "red" : "#ff0000ff",
        "orange" : "#ffb000ff",
        "yellow" : "#ffff00ff",
        "olive" : "#808000ff",
        "green" : "#00ff00ff",
        "lime" :  "#00ff00ff",
        "aqua" : "#00ffffff",
        "teal" : "#008080ff",
        "blue" : "#0000ffff",
        "navy" : "#000080ff",
        "indigo" : "#440088ff",
        "purple" : "#800080ff",
        "violet" : "#d02090ff",
        "fuchsia" : "#ff00ffff",
        "transparent" : "#00000000"
    }
}