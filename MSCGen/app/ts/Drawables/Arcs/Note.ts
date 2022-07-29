import {Arc} from "../Arc.js";
import {Entity} from "../Entity.js";
import {TextHolder} from "./TextHolder.js";

export class Note extends TextHolder{

    private cornerSize : number = 15;

    private calcPoints() : string{
        let points : string =
            `${this.xLeft - this.elemWidth/2},${this.y} ${this.xRight + this.elemWidth/2 - this.cornerSize},${this.y} ${this.xRight + this.elemWidth/2},${this.y + this.cornerSize} ${this.xRight + this.elemWidth/2},${this.y + this.elemHeight} ${this.xLeft - this.elemWidth/2},${this.y + this.elemHeight}`
        return points
    }
    private addLines() : string{
        let lines : string =
            `<line x1='${this.xRight + this.elemWidth/2 - this.cornerSize}' y1='${this.y}' x2='${this.xRight + this.elemWidth/2 - this.cornerSize}' y2='${this.y + this.cornerSize}' stroke='${this.linecolour}' stroke-width='3' stroke-linecap='square'/>/n`+
		    `<line x1='${this.xRight + this.elemWidth/2 - this.cornerSize}' y1='${this.y + this.cornerSize}' x2='${this.xRight + this.elemWidth/2}' y2='${this.y + this.cornerSize}' stroke='${this.linecolour}' stroke-width='3' stroke-linecap='square' />`
        return lines
    }

    getSVG(){
        let svg : string =
            `<polygon points='${this.calcPoints()}' fill='${this.textbgcolour.slice(0,7)}' stroke='${this.linecolour}' stroke-width='3' />`
        svg += this.addLabel()
        svg += this.addLines()
        if(this.URL){
            svg = this.addLink(svg)
        }

        if(this.ID){
            svg = this.addID(svg)
            if(this.IDURL){
                svg = this.addIDLink(svg)
            }
        }
        return svg
    }
}