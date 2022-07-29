import {svgStringContainer} from "../Arc.js";
import {globals} from "../../Main.js";
import { Arc } from "../Arc.js";
import {Entity} from "../Entity.js";
import {TextWrapper} from "../../TextWrapper.js";

//override drawArcline to draw the specific arrow, everything else should be handled by this class
abstract class ArrowArc extends Arc{

    /**
     * draw the arrow of an arc
     * @param x1 startpoint of line
     * @param y1 startpoint of line
     * @param x2 endpoint of line
     * @param y2 endpoint of line
     * @param svg {@link svgStringContainer} to append lines to
     * @abstract
     */
    abstract drawArcLine(x1: number, y1: number, x2: number, y2: number, svg:svgStringContainer): void;

    //auto applies wrapping if wordwraparcs is set to true
    set label(value: string) {
        this._label = value.replace(/\\n/g, "\n");
        let maxWidth = Number.NEGATIVE_INFINITY
        let minWidth = Number.POSITIVE_INFINITY
        if(this.from && this.to) {
            maxWidth = Math.max(this.to.getX, this.from.getX)
            minWidth = Math.min(this.to.getX, this.from.getX)
        } else {
            for (let toEntity of globals.entities.values()) {
                maxWidth = Math.max(toEntity.getX, maxWidth)
                minWidth = Math.min(toEntity.getX, minWidth)
            }
        }
        if (globals.getOptions().getValue("wordwraparcs")) {
            let width = Math.round(Math.max(maxWidth - minWidth, 100 * globals.getOptions().getValue("hscale")))
            this._label = TextWrapper.wrapText(this._label, width, this.fontsize, 10)
        }
        let textHeight = 0
        for (const string of this._label.split("\n")){
            textHeight += this.fontsize
        }

        this.textHeight = textHeight+this.arcgradient/2

    }
    get label(): string {
        return this._label;
    }
    protected override drawSelf(height: number, minHeight:number, maxHeight: number, svg:svgStringContainer):number{
        height += this.topSpacing

        //start group
        svg.Arcs += `<g>`

        //Handle arcSkip
        let arrowHeight=0
        if (this.arcskip==undefined) {
            arrowHeight = height + this.arcgradient
        }
        else
            arrowHeight =(height + (this.arcgradient * (this.arcskip)) + (this.spacing * this.arcskip))

        if((arrowHeight>maxHeight || arrowHeight<minHeight) && this.arcskip!=undefined)
            arrowHeight = maxHeight

        //from has to exist
        if(this.from){
            //single line or broadcast?
            if(this.to){
                this.drawArcLine(this.from.getX, height, this.to.getX, arrowHeight, svg)
            } else {
                for (let toEntity of globals.entities.values()) {
                    if (this.from != toEntity)
                        this.drawArcLine(this.from.getX, height, toEntity.getX, arrowHeight, svg)
                }
            }
            //reverse broadcast
        } else if (this.to){
            for (let fromEntity of globals.entities.values()) {
                if (this.to != fromEntity)
                    this.drawArcLine(fromEntity.getX, arrowHeight, this.to.getX, height, svg)
            }
        }
        let textHeight = 0
        //text stuff
        if(this.label) {

            //calculate the center
            let center:number // used to center text
            if(this.from && this.to) {

                center = (this.to.getX - this.from.getX) / 2 + this.from.getX
                if (this.from.getX == this.to.getX)
                    center = this.from.getX + 50
            } else {
                let maxWidth = Number.NEGATIVE_INFINITY
                let minWidth = Number.POSITIVE_INFINITY
                for (let toEntity of globals.entities.values()) {
                    maxWidth = Math.max(toEntity.getX, maxWidth)
                    minWidth = Math.min(toEntity.getX, minWidth)
                }
                center = (maxWidth + minWidth) / 2
            }
            //wrap in url if needed
            if(this.URL){
                svg.Arcs += `<a href='${this.URL}'>`
            }
            //text, we use a filter to do textbackground
            if (svg.Defs.indexOf(`<filter x="0" y="0" width="1" height="1" id="${this.textbgcolour.replace("#", "")}"><feFlood flood-color="${this.textbgcolour}"/><feComposite in="SourceGraphic" operator="over"/></filter>`) ==-1){
                svg.Defs += `<filter x="0" y="0" width="1" height="1" id="${this.textbgcolour.replace("#", "")}"><feFlood flood-color="${this.textbgcolour}"/><feComposite in="SourceGraphic" operator="over"/></filter>`
            }
            svg.Arcs += `<g filter="url(#${this.textbgcolour.replace("#", "")})" color="${this.textcolour}">`

            let first = true
            for (const string of this.label.split("\n")){
                if(string.trim() != "")
                    svg.Arcs += `<text x='${center}' y='${height+textHeight-this.fontsize+this.arcgradient/2}' text-anchor="middle" font-size="${this.fontsize}px" dominant-baseline="middle" fill="${this.textcolour}">${first ? "<tspan>" + string +"</tspan>" + this.insertId() : "<tspan>" + string +"</tspan>"}</text>`
                textHeight += this.fontsize
                first = false
            }
            this.insertId();
            svg.Arcs += `</g>`

            if(this.URL){
                svg.Arcs += `</a>`
            }
        }
        //close group
        svg.Arcs += `</g>`


        return Math.max(this.spacing + this.arcgradient, this.textHeight);
    }

    private insertId(): string {
        //ID stuff (just like text stuff but smaller ;) )
        let string = ""
        if (this.ID) {
            if (this.IDURL) {
                string += `<a href='${this.IDURL}'>`
            }

            string += `<tspan style="vertical-align:text-top;font-size:0.7em;text-anchor:start;">[${this.ID}]</tspan>`

            if (this.IDURL) {
                string += `</a>`
            }
        }
        return string
    }

    protected _fromArrow:boolean
    protected _toArrow:boolean

    constructor(prev: Arc[], fromArrow:boolean, toArrow:boolean,from?: Entity, to?: Entity) {
        super(prev, from, to);
        this._fromArrow = fromArrow
        this._toArrow = toArrow
    }
}

export class MessageArc extends ArrowArc{
    drawArcLine(x1: number, y1: number, x2: number, y2: number, svg:svgStringContainer): void {
        if (svg.Defs.indexOf(`<marker id="slash_${this.linecolour.replace("#", "")}" `) == -1){
            svg.Defs += `<marker id="slash_${this.linecolour.replace("#", "")}" viewBox="0 0 10 10" refX="10" refY="5"
        markerWidth="6" markerHeight="6"
        orient="auto-start-reverse">
      <line x1="0" y1="10" x2="20" y2="0" stroke="${this.linecolour}" stroke-width="2"/>
    </marker>
<marker id="slash_-1${this.linecolour.replace("#", "")}" viewBox="0 0 10 10" refX="10" refY="5"
        markerWidth="6" markerHeight="6"
        orient="auto-start-reverse">
      <line x1="0" y1="0" x2="20" y2="10" stroke="${this.linecolour}" stroke-width="2"/>
    </marker>`
        }
        let string = ""
        let fromMark = "\"url(#slash_" + this.linecolour.replace("#", "")+ ")\""
        let toMark = "\"url(#slash_-1" + this.linecolour.replace("#", "")+ ")\""
        if(x1<x2)
            [fromMark, toMark] = [toMark, fromMark]

        if (x1 == x2){
            if (y1 == y2){
                y2 += this.topSpacing
            }
            string+= `<path d="M ${x1} ${y1} C ${x1+100*globals.getOptions().getValue("hscale")} ${y1}, ${x2+100*globals.getOptions().getValue("hscale")} ${y2}, ${x2} ${y2}" ${
                this._fromArrow ? "marker-start=" + toMark : ""} ${
                this._toArrow ? "marker-end="+toMark : ""} style="stroke:${this.linecolour};stroke-width:2;fill:none"/>`
        } else {
            string += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ${
                this._fromArrow ? "marker-start=" + fromMark : ""} ${
                this._toArrow ? "marker-end=" + toMark : ""} style="stroke:${this.linecolour};stroke-width:2" />`

        }
        svg.Arcs += string
    }
}

export class MethodArc extends ArrowArc{
    drawArcLine(x1: number, y1: number, x2: number, y2: number, svg:svgStringContainer): void {
        if (svg.Defs.indexOf(`<marker id="arrow_${this.linecolour.replace("#", "")}" `)==-1){
            svg.Defs += `<marker id="arrow_${this.linecolour.replace("#", "")}" viewBox="0 0 10 10" refX="10" refY="5"
        markerWidth="6" markerHeight="6"
        orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="${this.linecolour}" />
    </marker>`
        }
        let string = ""
        let Mark = "\"url(#arrow_" + this.linecolour.replace("#", "")+ ")\""
        if (x1 == x2){
            if (y1 == y2){
                y2 += this.topSpacing
            }
            string+= `<path d="M ${x1} ${y1} C ${x1+100*globals.getOptions().getValue("hscale")} ${y1}, ${x2+100*globals.getOptions().getValue("hscale")} ${y2}, ${x2} ${y2}" ${
                this._fromArrow ? "marker-start=" + Mark : ""} ${
                this._toArrow ? "marker-end="+Mark : ""} style="stroke:${this.linecolour};stroke-width:2;fill:none"/>`
        } else {
            string += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ${
                this._fromArrow ? "marker-start=" + Mark : ""} ${
                this._toArrow ? "marker-end=" + Mark : ""} style="stroke:${this.linecolour};stroke-width:2" />`

        }
        svg.Arcs += string
    }
}

export class ReturnArc extends ArrowArc{
    drawArcLine(x1: number, y1: number, x2: number, y2: number, svg:svgStringContainer): void {
        if (svg.Defs.indexOf(`<marker id="doubleslash_${this.linecolour.replace("#", "")}" `)==-1){
            svg.Defs += `<marker id="doubleslash_${this.linecolour.replace("#", "")}" viewBox="0 0 10 10" refX="10" refY="3"
        markerWidth="8" markerHeight="8"
        orient="auto-start-reverse">
            <path d="M 1,1 l 8,2 l-8,2" style="stroke:${this.linecolour};fill:none"></path>
    </marker>`
        }
        let string = ""
        let Mark = "\"url(#doubleslash_" + this.linecolour.replace("#", "")+ ")\""
        if (x1 == x2){
            if (y1 == y2){
                y2 += this.topSpacing
            }
            string+= `<path d="M ${x1} ${y1} C ${x1+100*globals.getOptions().getValue("hscale")} ${y1}, ${x2+100*globals.getOptions().getValue("hscale")} ${y2}, ${x2} ${y2}" ${
                this._fromArrow ? "marker-start=" + Mark : ""} ${
                this._toArrow ? "marker-end="+Mark : ""} style="stroke:${this.linecolour};stroke-width:2;stroke-dasharray:5,3;fill:none"/>`
        } else {
            string += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ${
                this._fromArrow ? "marker-start=" + Mark : ""} ${
                this._toArrow ? "marker-end=" + Mark : ""} style="stroke:${this.linecolour};stroke-dasharray:5,3;stroke-width:2" />`

        }
        svg.Arcs += string
    }
}

export class CallbackArc extends ArrowArc{
    drawArcLine(x1: number, y1: number, x2: number, y2: number, svg:svgStringContainer): void {
        if (svg.Defs.indexOf(`<marker id="doubleslash_${this.linecolour.replace("#", "")}" `)==-1){
            svg.Defs += `<marker id="doubleslash_${this.linecolour.replace("#", "")}" viewBox="0 0 10 10" refX="10" refY="3"
        markerWidth="8" markerHeight="8"
        orient="auto-start-reverse">
            <path d="M 1,1 l 8,2 l-8,2" style="stroke:${this.linecolour};fill:none"></path>
    </marker>`
        }
        let string = ""
        let Mark = "\"url(#doubleslash_" + this.linecolour.replace("#", "")+ ")\""
        if (x1 == x2){
            if (y1 == y2){
                y2 += this.topSpacing
            }
            string+= `<path d="M ${x1} ${y1} C ${x1+100*globals.getOptions().getValue("hscale")} ${y1}, ${x2+100*globals.getOptions().getValue("hscale")} ${y2}, ${x2} ${y2}" ${
                this._fromArrow ? "marker-start=" + Mark : ""} ${
                this._toArrow ? "marker-end="+Mark : ""} style="stroke:${this.linecolour};stroke-width:2;fill:none"/>`
        } else {
            string += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ${
                this._fromArrow ? "marker-start=" + Mark : ""} ${
                this._toArrow ? "marker-end=" + Mark : ""} style="stroke:${this.linecolour};stroke-width:2" />`

        }
        svg.Arcs += string
    }
}

export class EmphasisedArc extends ArrowArc{
    drawArcLine(x1: number, y1: number, x2: number, y2: number, svg:svgStringContainer): void {
        if (svg.Defs.indexOf(`<marker id="arrow_${this.linecolour.replace("#", "")}" `)==-1){
            svg.Defs += `<marker id="arrow_${this.linecolour.replace("#", "")}" viewBox="0 0 10 10" refX="10" refY="5"
        markerWidth="6" markerHeight="6"
        orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="${this.linecolour}" />
    </marker>`
        }
        let string = ""
        let Mark = "\"url(#arrow_" + this.linecolour.replace("#", "")+ ")\""
        if (x1 == x2){
            if (y1 == y2){
                y2 += this.topSpacing
            }
            //stop the 2 lines of the emphasised arc so they don't go past the arrow marker
            let markerStopEarly = this._toArrow ? 10 : 0
            string+= `<path d="M ${x1} ${y1} C ${x1+100*globals.getOptions().getValue("hscale")} ${y1}, ${x2+100*globals.getOptions().getValue("hscale")} ${y2-2}, ${x2+markerStopEarly} ${y2-2} M ${x1} ${y1} C ${x1+100*globals.getOptions().getValue("hscale")} ${y1}, ${x2+100*globals.getOptions().getValue("hscale")} ${y2+2}, ${x2+markerStopEarly} ${y2+2}" style="stroke:${this.linecolour};stroke-width:2;fill:none"/>`

            string+= `<path d="M ${x1} ${y1} C ${x1+100*globals.getOptions().getValue("hscale")} ${y1}, ${x2+100*globals.getOptions().getValue("hscale")} ${y2}, ${x2} ${y2}" ${
                this._fromArrow ? "marker-start=" + Mark : ""} ${
                this._toArrow ? "marker-end="+Mark : ""} style="stroke:transparent;stroke-width:2;fill:none"/>`
        } else {
            //stop the 2 lines of the emphasised arc, so they don't go past the arrow marker
            //uses a dasharray 10-20 pixels shorter than the line to hide the part that would otherwise be visible past the marker
            // see this trick: https://css-tricks.com/almanac/properties/s/stroke-dasharray/
            let linelen = ((x2-x1)**2 + (y2-y1)**2)**0.5
            let dasharraychange = 0
            if (this._fromArrow || this._toArrow){
                dasharraychange = -10
            }
            let dashofset = 0
            if (this._fromArrow && this._toArrow) {
                dashofset = -10
                dasharraychange = -20
            }
            string+= `<line x1="${x1}" y1="${y1 + 2}" x2="${x2}" y2="${y2 + 2}" style="stroke:${this.linecolour};stroke-width:2;stroke-dasharray: ${linelen +dasharraychange};stroke-dashoffset:${dashofset}" />
    <line x1="${x1}" y1="${y1 - 2}" x2="${x2}" y2="${y2 - 2}" style="stroke:${this.linecolour};stroke-width:2;stroke-dasharray:${linelen +dasharraychange};stroke-dashoffset:${dashofset}" />`

            string += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ${
                this._fromArrow ? "marker-start=" + Mark : ""} ${
                this._toArrow ? "marker-end=" + Mark : ""} style="stroke:transparent;stroke-width:2" />`

        }
        svg.Arcs += string
    }
}

export class LostArc extends ArrowArc{
    drawArcLine(x1: number, y1: number, x2: number, y2: number, svg:svgStringContainer): void {
        let string = ""
        if (x1 == x2){
            string+= `<path d="M ${x1} ${y1} C ${x1+100*globals.getOptions().getValue("hscale")} ${y1}, ${x2+100*globals.getOptions().getValue("hscale")} ${y2}, ${x2+50} ${y2}" style="stroke:${this.linecolour};stroke-width:2;fill:none"/>
    <line transform="translate(${x2+50} ${y2})" x1="-5" y1="-5" x2="5" y2="5" style="stroke:${this.linecolour};stroke-width:2" />
    <line transform="translate(${x2+50} ${y2})" x1="-5" y1="5" x2="5" y2="-5" style="stroke:${this.linecolour};stroke-width:2" />`
        } else {
            x2 = (x2-x1)/1.5 + x1
            y2 = (y2-y1)/1.5 + y1
            string+= `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" style="stroke:${this.linecolour};stroke-width:2" />
    <line transform="translate(${x2} ${y2})" x1="-5" y1="-5" x2="5" y2="5" style="stroke:${this.linecolour};stroke-width:2" />
    <line transform="translate(${x2} ${y2})" x1="-5" y1="5" x2="5" y2="-5" style="stroke:${this.linecolour};stroke-width:2" />`
        }
        svg.Arcs += string
    }
}

export class OmittedArc extends ArrowArc{
    protected drawEntityLines(height: number, newHeight: number, svg: svgStringContainer) {
        svg.EntityLines += `<g>`
        for (let varEntity of globals.entities.values()) {
            svg.EntityLines += `<line x1="${varEntity.getX}" y1="${height}" x2="${varEntity.getX}" y2="${height+newHeight}" style="stroke:${varEntity.linecolour};stroke-width:2;stroke-dasharray:5,3" />`
        }
        svg.EntityLines += `</g>`
    }

    drawArcLine(x1: number, y1: number, x2: number, y2: number, svg:svgStringContainer): void { }
}

export class CommentArc extends ArrowArc{
    drawArcLine(x1: number, y1: number, x2: number, y2: number, svg:svgStringContainer): void { }

    protected drawEntityLines(height: number, newHeight: number, svg: svgStringContainer) {
        svg.EntityLines += `<g>`
        let maxWidth = Number.NEGATIVE_INFINITY
        let minWidth = Number.POSITIVE_INFINITY
        for (let varEntity of globals.entities.values()) {
            maxWidth = Math.max(varEntity.getX, maxWidth)
            minWidth = Math.min(varEntity.getX, minWidth)
            svg.EntityLines += `<line x1="${varEntity.getX}" y1="${height}" x2="${varEntity.getX}" y2="${height+newHeight}" style="stroke:${varEntity.linecolour};stroke-width:2;stroke-dasharray:10,10" />`
        }
        let center = height + (this.arcgradient + this.spacing)/2
        svg.EntityLines += `</g>
        <line x1="${minWidth-100}" y1="${center}" x2="${maxWidth+100}" y2="${center}" style="stroke:${this.linecolour};stroke-width:2;stroke-dasharray:10,10" />`

    }
}

export class SpacingArc extends ArrowArc{
    drawArcLine(x1: number, y1: number, x2: number, y2: number, svg:svgStringContainer): void { }
}