import {Arc, svgStringContainer} from "../Arc.js";
import {Entity} from "../Entity.js";
import {globals} from "../../Main.js";
import {TextWrapper} from "../../TextWrapper.js";

export abstract class TextHolder extends Arc{
    public xLeft : number           //this is the middle of the left most entity
    public xRight : number          //this is the middle of the right most entity
    public y : number               //this is the y value of the top of the box
    public x : number               //this is the x value of the center of the box
    public elemWidth : number = 75  //this is the total width of the box (if it goes from x to x)
    public elemHeight : number = 50 //this is the actual height

    protected wrappedLabels : string[]

    /**
     * @param includeSpacing whether or not the spacing should be included in the calculation
     * @return number the calculated height
     */
    protected calcHeight(includeSpacing : boolean) : number{
        if(! this.wrappedLabels){
            this.xLeft = Math.min(this.to.getX,  this.from.getX);//this is the middle of the left most entity
            this.xRight = Math.max(this.to.getX,  this.from.getX);//this is the middle of the right most entity
            this.x = (this.xLeft + this.xRight) / 2
            this.splitLabel()
        }
        if(includeSpacing){
            return this.elemHeight + this.spacing
        }
        return this.elemHeight
    }

    /**
     * splits the label into an array based on \n and wrapping
     * @post wrappedLabels will be initialized
     */
    protected splitLabel() {
        if (this.label)
            this.wrappedLabels = TextWrapper.wrapText(this.label, Math.max(this.xRight - this.xLeft , this.elemWidth* (this.xRight - this.xLeft == 0 ? 1 : 2)), this.fontsize, 20).split("\n")
        else this.wrappedLabels = []
        this.textHeight = this.fontsize * (this.wrappedLabels.length - 1)
        this.elemHeight += this.textHeight
    }

    /**
     * @return string the svg of all the text in wrappedLabels under one another
     */
    protected addLabel() : string{
        let svg = ""
        let height = 0
        for (const label of this.wrappedLabels) {
            svg += `<text x='${this.x}' y='${this.y + height + ((this.elemHeight - this.textHeight)  / 2)}' text-anchor="middle" font-size="${this.fontsize}px" dominant-baseline="middle" fill="${this.textcolour}">
                    ${label}
                    </text>`
            height += this.fontsize
        }
        return svg
    }


    protected addLink(svg : string) : string{
        svg = svg.replace(/(<text.*>)([\s\S]*?)(<\/text>)/g,
            `$1\n${`<a href='${this.URL}' fill="blue" style='text-decoration:none'>`}$2</a>$3`
        )
        return svg
    }

    protected addID(svg:string) : string{
        let ID : string =
            `
<tspan dy = ${this.elemHeight/10} style='font-size:${this.fontsize - 8}px;'>
[${this.ID}]
</tspan>`

        svg = svg.replace(/([\s\S]*)(<\/text>)/,
            `$1${ID}$2`
        )
        return svg
    }

    protected addIDLink(svg:string) : string{
        svg = svg.replace(/(<tspan.*>)([\s\S]*)(<\/tspan>)/,
            `$1${`<a href='${this.IDURL}' style='fill:blue;'>`}$2</a>$3`
        )
        return svg
    }

    /**
     * @return string a string that describes the svg
     */
    protected abstract getSVG() : string;

    /**
     * @param height the height of the center of the element
     * @param minHeight the minimum height at which each element can be placed (irrelevant for this class)
     * @param maxHeight the maximum height at which each element can be placed (irrelevant for this class)
     * @param svg the string in which all svgs are collected
     *
     * @return number the total height of the element that was drawn
     */
    public override drawSelf(height: number, minHeight:number, maxHeight: number,  svg : svgStringContainer):number{
        this.xLeft = Math.min(this.to.getX,  this.from.getX);//this is the middle of the left most entity
        this.xRight = Math.max(this.to.getX,  this.from.getX);//this is the middle of the right most entity
        this.y = height;
        this.x = (this.xLeft + this.xRight) / 2
        svg.TextBoxes += this.getSVG()
        return this.calcHeight(true)
    }

}