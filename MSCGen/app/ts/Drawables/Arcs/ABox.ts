import {Arc, svgStringContainer} from "../Arc.js";
import {Entity} from "../Entity.js";
import {TextHolder} from "./TextHolder.js";

export class ABox extends TextHolder{

    private pointDelta : number = 15;

    private calcPoints() : string{
        let points : string =
            `${this.xLeft - this.elemWidth/2 + this.pointDelta},${this.y + this.elemHeight} ${this.xRight + this.elemWidth/2 - this.pointDelta},${this.y + this.elemHeight} ${this.xRight + (this.elemWidth/2)},${this.y + this.elemHeight/2} ${this.xRight + this.elemWidth/2 - this.pointDelta},${this.y} ${this.xLeft - this.elemWidth/2 + this.pointDelta},${this.y} ${this.xLeft - (this.elemWidth/2)},${this.y + this.elemHeight/2}`
        return points
    }

    public getSVG() : string{
        let svg : string =
            `<polygon points='${this.calcPoints()}' style='fill:${this.textbgcolour.slice(0,7)};stroke:${this.linecolour};stroke-width:3' />`

        svg += this.addLabel()

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