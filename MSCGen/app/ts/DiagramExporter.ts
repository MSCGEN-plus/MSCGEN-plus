export class DiagramExporter{
    private diagram : HTMLElement & SVGGraphicsElement
    private canvas : HTMLCanvasElement
    constructor() {
        this.diagram = document.getElementById('DiagramDisplay') as HTMLElement & SVGGraphicsElement
        this.canvas = document.getElementById('utilityCanvas') as HTMLCanvasElement
        let form = document.getElementById('ExportForm') as HTMLFormElement

        document.getElementById('ExportButton').onclick = () => {
            this.exportDiagram(form);
        }

        form.onchange = () => {
            this.checkCheckbox()
        }

        this.checkCheckbox()
    }

    /**
     * @param form a form with the options for exporting
     * @post a file will be downloaded with the current svg in the renderer possibly converted
     */
    public exportDiagram(form : HTMLFormElement) : void{
        let link = document.createElement("a") as HTMLAnchorElement
        let type = form.elements.namedItem("exportType") as RadioNodeList
        let onlyVisible = form.elements.namedItem("visible") as HTMLInputElement
        let addBackground = form.elements.namedItem("background") as HTMLInputElement
        if(type.value == "SVG"){
            this.exportSVG(onlyVisible.checked, link, addBackground.checked)
        }
        else{
            this.exportRaster(link,addBackground.checked, type.value)
        }
    }

    private exportSVG(onlyVisible : boolean, link : HTMLAnchorElement , addBackground : boolean){
        let svg = this.cleanSVG(onlyVisible, addBackground);

        const blob = new Blob([svg])
        link.download = "diagram.svg"
        link.href = window.URL.createObjectURL(blob)
        link.click()
        link.href = ""
    }

    private exportRaster(link : HTMLAnchorElement, addBackground : boolean, type : string){
        let svg64 = btoa(this.cleanSVG(false, addBackground));
        let image64 = 'data:image/svg+xml;base64,' + svg64;

        let img = document.createElement("img")
        img.src = image64;

        img.onload = () => {
            let canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            let ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
            let dataURL = canvas.toDataURL("image/" + type);

            link.download = "diagram." + type
            link.href = dataURL
            link.click()
            link.href = ""
        };
    }

    private cleanSVG(onlyVisible : boolean, addBackground : boolean) : string{
        let svg : HTMLElement & SVGGraphicsElement = this.diagram.cloneNode(true) as HTMLElement & SVGGraphicsElement
        if(addBackground){
            let width : number = parseInt(this.diagram.getAttribute("width").replace("px", ""))
            let height : number = parseInt(this.diagram.getAttribute("height").replace("px", ""))
            let viewport = svg.getElementsByClassName("svg-pan-zoom_viewport")[0]
            viewport.innerHTML = `<rect x="0" y="0" width="${width}" height="${height}" fill="#ffffff"></rect>` + viewport.innerHTML
        }
        if(onlyVisible){
            let box = this.diagram.getBBox()
            let width : number = box.x + box.width
            let height : number = box.y + box.height
            return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}px" height="${height}px">\n ${this.diagram.innerHTML} \n</svg>`
        }else{
            let width : string = svg.getAttribute("width")
            let height : string = svg.getAttribute("height")
            let viewport = svg.getElementsByClassName("svg-pan-zoom_viewport")[0]
            return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">\n ${viewport.innerHTML} \n</svg>`
        }
    }

    private checkCheckbox() : void{
        let form = document.getElementById('ExportForm') as HTMLFormElement
        let type = form.elements.namedItem("exportType") as RadioNodeList
        let visible = document.getElementById("visible") as HTMLInputElement
        let background = document.getElementById("background") as HTMLInputElement

        switch (type.value){
            case "jpeg":
                visible.disabled = true
                visible.checked = false
                background.disabled = true
                background.checked = true
                return

            case "SVG":
                visible.disabled = false
                background.disabled = false
                return

            case "png":
                visible.disabled = true
                visible.checked = false
                background.disabled = false
                return
        }

    }

}