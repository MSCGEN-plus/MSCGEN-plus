import {ColourParser} from "../parser/ColourParser.js";
import {svgStringContainer} from "./Arc.js";

export class Entity {
    private _name: string;
    private _label: string;
    private _fontsize: number = 14;
    private _x: number;
    private _y: number = this._fontsize;
    private _hscale: number = 1;
    private _width: number = 100;

    private _linecolour: string = "#000000ff";
    private _textcolour: string = "#000000ff";
    private _textbgcolour: string = "#ffffff00";
    private _arclinecolour: string = "#000000ff";
    private _arctextcolour: string = "#000000ff";
    private _arctextbgcolour: string = "#ffffff00";


    /** Draws the complete entity
     * @param svg the main svg string where everything gets added to
     */
    public draw(svg : svgStringContainer): void{
        svg.EntityHeads += this.checkLabelPixels()
        svg.EntityHeads = this.createRectangle() + svg.EntityHeads
    }

    /**Draws the first line coming out of an entity
     * @param svg the main svg string where everything gets added to
     * @param height the height till which the first line needs to be drawn
     */
    public startLineDraw(svg : svgStringContainer, height: number){
        svg.EntityHeads += `<line x1='${this._x}' y1='${this._y}' x2='${this._x}' y2='${height}' style="stroke:${this.linecolour};stroke-width:2" />`
    }

    /** Sets the standard values for an entity needed for drawing
     * @param xCoord the x coordinate for the start of the entityline
     * @param fontsize the size for the font of the label
     * @param hscale the horizontal scaling used for the entities
     * @param width the width of a single entity box
     */
    public setDrawValues(xCoord: number, fontsize: number, hscale: number, width: number){
        this._x = xCoord;
        this._fontsize = fontsize;
        this._hscale = hscale;
        this._width = width;
    }

    /**Checks how big labels are to wrap the text and then changes the height of the boxes accordingly.
     *@post returns the text svg string with the fitted text on multiple lines
     */
    private checkLabelPixels(){
        let charPerLineAmount = Math.floor(((8*(14/this._fontsize))*this._hscale))
        if (charPerLineAmount<1)
            charPerLineAmount = 1

        let regexString = "(?![^\\n]{1," + charPerLineAmount + "}$)([^\\n]{1," + charPerLineAmount + "})\\s"
        let wrapFirstRegex = new RegExp(regexString, "g")
        let secondRegexStr = "(?![^\\n]{1," + charPerLineAmount + "}$)([^\\n]{1," + charPerLineAmount + "})"
        let wrapSecondRegex = new RegExp(secondRegexStr, "g")

        let wrap : string = (this._label||"").replace(wrapFirstRegex, '$1\n')

        let splitArray : string[] = wrap.split('\n')

        for (let i = 0; i < splitArray.length; i++) {
            splitArray[i] =  splitArray[i].replace(wrapSecondRegex, '$1\n')

        }
        splitArray = splitArray.join('\n').split('\n')

        let textSVG = ""
        let height = Math.floor((this._fontsize/2))+15
        for (const split of splitArray) {
            textSVG += `<text x='${this._x}' y='${height}' text-anchor="middle" fill='${this.textcolour}' font-size="${this.fontsize}px" dominant-baseline="middle">
             ${split}
             </text>`
            height += this.fontsize
        }
        this._y = height-Math.floor(this._fontsize/2)+15
        return textSVG

    }
    private createRectangle(){
        let rectangleSVG: string= ''
        rectangleSVG = `<rect width='${this._width}' height='${this._y}' x='${this._x - (this._width/2)}' style='fill:${this.textbgcolour};stroke:${this.linecolour};stroke-width:3' />`
        return rectangleSVG
    }

    constructor(name: string) {
        this._name = name;
        this._label = name;
    };

    get x(): number {
        return this._x;
    }

    get width(): number {
        return this._width;
    }

    get name(): string {
        return this._name;
    }

    set name(value: string) {
        this._name = value;
    }

    get label(): string {
        return this._label;
    }

    set label(value: string) {
        this._label = value;
    }

    get getX(): number{
        return this._x
    }

    set setX(value: number) {
        this._x = value;
    }

    get getY(): number {
        return this._y;
    }

    set setY(value: number) {
        this._y = value;
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

    get arclinecolour(): string {
        return this._arclinecolour;
    }

    set arclinecolour(value: string) {
        this._arclinecolour = ColourParser.colourNameToRGB(value);
    }

    get arctextcolour(): string {
        return this._arctextcolour;
    }

    set arctextcolour(value: string) {
        this._arctextcolour = ColourParser.colourNameToRGB(value);
    }

    get arctextbgcolour(): string {
        return this._arctextbgcolour;
    }

    set arctextbgcolour(value: string) {
        this._arctextbgcolour = ColourParser.colourNameToRGB(value);
    }
}