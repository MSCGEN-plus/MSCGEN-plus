import {Arc} from "../Arc.js";
import {Entity} from "../Entity.js";
import {TextHolder} from "./TextHolder.js";

export class Box extends TextHolder{

    getSVG(){
        let svg : string =
            `<rect x='${this.xLeft - (this.elemWidth/2)}' y='${this.y}' width='${this.xRight - this.xLeft + this.elemWidth}' height='${this.elemHeight}' fill='${this.textbgcolour.slice(0,7)}' stroke='${this.linecolour}' stroke-width='3' />`

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