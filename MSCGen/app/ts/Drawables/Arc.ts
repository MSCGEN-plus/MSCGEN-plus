import {Entity} from "./Entity.js";
import {ColourParser} from "../parser/ColourParser.js";
import {globals} from "../Main.js";

export class Arc{
    constructor(prev: Arc[], from?: Entity, to?: Entity){
        this._prev = prev;
        this.updateDrawers()
        from ? this.from = from : this._from = from
        this._from = from;
        this._to = to;
    };
    //from-to
    private _from?: Entity = null;
    private _to?: Entity = null; //if not specified assumes broadcast/* arc
    private _prev: Arc[] = [];
    private _next: Arc[] = [];

    protected static  _arcSpacing = 20;
    private _spacing = 20;

    private _bottomSpacing = 20;
    private _topSpacing = 20;

    //options
    protected _label: string;
    private _URL: string;
    private _ID: string;
    private _IDURL: string;
    private _arcskip: number = undefined;
    private _linecolour: string =  "#000000ff";
    private _textcolour: string =  "#000000ff";
    private _textbgcolour: string = "#ffffff00";
    private _arcgradient: number = 0;
    private _fontsize: number;
    private _textHeight : number = 0;
    private _autospacegroup : boolean = true;

    get autospacegroup(): boolean {
        return this._autospacegroup;
    }

    set autospacegroup(value: boolean) {
        this._autospacegroup = value;
    }

    private updateDrawers(){
        this._drawers = (this._prev || []).length;
    }

    protected calcHeight(includeSpacing : boolean):number{
        if(includeSpacing){
            return Math.max(this.spacing + this.arcgradient, this.textHeight)
        }
        return this.arcgradient
    }

    private _drawers : number;//count down of arcs with this as the next one

    /**
     * draws the arc into the given svg
     * @param height y at which to start drawing
     * @param minHeight min y to allow arcskip to be drawn at
     * @param maxHeight max y to allow arcskip to be drawn at
     * @param svg {@link svgStringContainer} to append the arc to
     * @return height of the arc that has been drawn, relative to given height not absolute
     * @protected
     */
    protected drawSelf(height: number, minHeight:number, maxHeight: number, svg : svgStringContainer):number{
        return null;
    }

    /**
     * draws the entity lines into the given svg, only drawn this is the leftmost sibling in the linked list
     * @param height y at which to start drawing
     * @param newHeight y at which to stop drawing
     * @param svg {@link svgStringContainer} to append the lines to
     * @protected
     */
    protected drawEntityLines(height: number, newHeight: number, svg: svgStringContainer){
        //only draw once
        if(this.prev?.[0]?._next?.[0] != this)
            return

            svg.EntityLines += `<g>`
        for (let varEntity of globals.entities.values()) {
            svg.EntityLines += `<line x1="${varEntity.getX}" y1="${height}" x2="${varEntity.getX}" y2="${height+newHeight}" style="stroke:${varEntity.linecolour};stroke-width:2" />`
        }
        svg.EntityLines += `</g>`
    }

    private calcSequenceHeight(includeSpacing : boolean, first : boolean) : number{

        if(this.next.length == 0 || this.next[0].prev.length != 1)
            return this.calcHeight(includeSpacing) - (this.bottomSpacing * +includeSpacing) - ((this.topSpacing * +includeSpacing) * +first)

        return this.calcHeight(includeSpacing) - ((this.topSpacing * +includeSpacing) * +first) + this.next[0].calcSequenceHeight(includeSpacing, false)
    }

    private setSequenceSpacing(spacing : number, first : boolean){
        if(!first)//the first arc does not need to apply topspacing to have all groups start at the same height
            this.topSpacing = spacing

        //the last arc does not need to apply bottomspacing to have all groups end at the same height
        if(this.next.length > 0 && this.next[0].prev.length == 1){
            this.bottomSpacing = spacing
            this.next[0].setSequenceSpacing(spacing, false)
        }
    }

    private getSequenceLength() : number{
        if(this.next.length == 0 || this.next[0].prev.length != 1)
            return 1

        return this.next[0].getSequenceLength() + 1
    }

    private childIsAutoSpaced() : boolean{
        for (const arc of this.next) {
            if(arc.autospacegroup)
                return true
        }
        return false
    }

    private autoSpaceChildren() : void{
        //check to see if any of its children are autospaced and if it has more than one child
        if(this.childIsAutoSpaced() && this.next.length > 1){
            let seqlength : number = 0
            //calculate the longest child
            for (const arc of this.next) {
                seqlength = Math.max(seqlength, arc.calcSequenceHeight(true, true))
            }
            for (const arc of this.next) {
                //skip if the group doesnt want to be changed or is already the longest
                if(!arc.autospacegroup || arc.calcSequenceHeight(true, true) == seqlength)
                    continue
                let arcAmount : number = arc.getSequenceLength()
                let spacing : number = 0
                if(arcAmount == 1){//if a group has one arc that one will be centered
                    spacing = (seqlength - arc.calcSequenceHeight(false, true)) / 2
                    //add an extra 20 to account for the default spacing at the top im removing
                    arc.setSequenceSpacing(spacing + 20, false)
                }else {
                    spacing = (seqlength - arc.calcSequenceHeight(false, true)) / (arcAmount - 1)
                    arc.setSequenceSpacing(spacing / 2, true)
                }
            }
        }
    }

    private _currheight = 0;

    /**
     * recursively draw arcs in the linked list
     * @param height y at which to start drawing
     * @param minHeight min y to allow arcskip to be drawn at
     * @param maxHeight max y to allow arcskip to be drawn at
     * @param svg {@link svgStringContainer} to append results to
     */
    draw(height: number, minHeight:number, maxHeight: number, svg : svgStringContainer):void{
        --this._drawers
        let length : number = 0
        this.autoSpaceChildren()
        //draw at latest point called, doesn't care about call order
        this._currheight = Math.max(this._currheight, height);
        //only draws at last call to draw(), meaning when all previous dependent sequences are done
        if(this._drawers <= 0){
            let entityLineHeight = this.calcHeight(true)
            for(let arc of (this.prev?.[0]?._next || [])){
                entityLineHeight = Math.max(arc.calcHeight(true), entityLineHeight);
            }

            this.drawEntityLines(this._currheight, entityLineHeight, svg)
            let height = this.drawSelf(this._currheight, minHeight, maxHeight, svg)
            svg.Totalheight = Math.max(svg.Totalheight, this._currheight + height)
            //draws seperate sequences without issue as the recursion stops at the end of every sequence except the last one
            for(let arc of this._next){
                arc.draw(this._currheight + height, minHeight, maxHeight, svg);
            }
        }
    }

    /** recursively calculates the lowest height of all starting point of the arcs
     * @param height y position of the arc start
     * @post returns the highest starting y
     */
    private calcFinalHeight(height : number):number{
        --this._drawers;
        this._currheight = Math.max(this._currheight, height);
        if(this._drawers <= 0){
            let arcHeight = this.calcHeight(true)
            let maxHeight = this._currheight + arcHeight
            //Calculates seperate sequences without issue as the recursion stops at the end of every sequence except the last one
            for(let arc of this._next){
                maxHeight = Math.max(arc.calcFinalHeight(this._currheight + arcHeight),maxHeight);
            }
            this.updateDrawers()
            this._currheight = 0
            if(this._next.length == 0){
                return height
            }
            return maxHeight
        }
        return 0
    }

    /** Calculates the lowest Starting Y value of all the arcs, used for finding till where the arc skip can go
     * @param height the starting height for the arcs
     * @post returns the highest starting y value out of all arcs
     */
    calcHighestArcY(height:number):number{
        return this.calcFinalHeight(height) - (Arc._arcSpacing);
    }


    get textHeight(): number {
        return this._textHeight;
    }

    set textHeight(value: number) {
        this._textHeight = value;
    }

    get prev(): Arc[] {
        return this._prev;
    }

    set prev(value: Arc[]) {
        this._prev = value;
        this.updateDrawers();
    }

    addPrev(arc: Arc){
        this._next.push(arc);
        this.updateDrawers();
    }

    get from(): Entity {
        return this._from;
    }

    set from(value: Entity) {
        this._from = value;
        this._linecolour = this._from.arclinecolour
        this._textcolour = this._from.arctextcolour
        this._textbgcolour = this._from.arctextbgcolour
    }

    get to(): Entity {
        return this._to;
    }

    set to(value: Entity) {
        this._to = value;
    }


    get next(): Arc[] {
        return this._next;
    }

    set next(value: Arc[]) {
        this._next = value;
    }

    addNext(arc: Arc){
        this._next.push(arc);
    }

    get label(): string {
        return this._label;
    }

    set label(value: string) {
        this._label = value.replace(/\\n/g, "\n");
    }

    get URL(): string {
        return this._URL;
    }

    set URL(value: string) {
        this._URL = value;
    }

    get ID(): string {
        return this._ID;
    }

    set ID(value: string) {
        this._ID = value;
    }

    get IDURL(): string {
        return this._IDURL;
    }

    set IDURL(value: string) {
        this._IDURL = value;
    }

    get arcskip(): number {
        return this._arcskip;
    }

    set arcskip(value: number) {
        this._arcskip = value;
    }

    get linecolour(): string {
        return this._linecolour;
    }

    set linecolour(value: string) {
        this._linecolour = ColourParser.colourNameToRGB(value);
    }

    get textbgcolour(): string {
        return this._textbgcolour;
    }

    set textbgcolour(value: string) {
        this._textbgcolour = ColourParser.colourNameToRGB(value);
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

    get textcolour(): string {
        return this._textcolour;
    }

    set textcolour(value: string) {
        this._textcolour =ColourParser.colourNameToRGB(value);
    }

    get spacing(): number {
        return this.bottomSpacing + this.topSpacing;
    }

    set spacing(value: number) {
        this.bottomSpacing = value / 2
        this.topSpacing = value / 2
    }


    get bottomSpacing(): number {
        return this._bottomSpacing;
    }

    set bottomSpacing(value: number) {
        this._bottomSpacing = value;
    }

    get topSpacing(): number {
        return this._topSpacing;
    }

    set topSpacing(value: number) {
        this._topSpacing = value;
    }
}

export class svgStringContainer {
    EntityHeads : String = ""
    Defs : String = ""
    Arcs : String = ""
    TextBoxes : String = ""
    EntityLines : String = ""
    TotalWidth : number = 0
    Totalheight : number = 0

    getSvg() : string{
        return`  <defs>${this.Defs}</defs>
<g class="EntityHeads">${this.EntityHeads}</g>
<g class="EntityLines">${this.EntityLines}</g>
<g class="Arcs">${this.Arcs}</g>
<g class="TextBoxes">${this.TextBoxes}</g>`
    }
}