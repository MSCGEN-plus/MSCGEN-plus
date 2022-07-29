export class TextWrapper {
    private static context: CanvasRenderingContext2D = (document.getElementById("utilityCanvas") as HTMLCanvasElement).getContext("2d");

    /**
     * inserts \n into a given string whenever a line would be longer than the given elemWidth
     * @param text string of textinput
     * @param elemWidth max width of a single line
     * @param fontSize
     * @param margin actual width = elemWidth - margin
     */
    public static wrapText(text: string, elemWidth: number, fontSize: number, margin:number = 0): string {
        this.context.font = `400 ${fontSize}px serif`
        for (let i = 0; i < text.length; i++) {
            let startindex = text.slice(0, i).lastIndexOf("\n") + 1
            let slice = text.slice(startindex, i)
            if (this.context.measureText(slice).width> elemWidth - margin ) {
                if (slice.length == 1)
                    break
                let newslice = ""
                if (slice.includes(" "))
                    newslice = slice.slice(0, slice.lastIndexOf(" ")) + "\n" + slice.slice(slice.lastIndexOf(" ")+1)
                else newslice = slice.slice(0, -1) + "\n" + slice.slice(-1)

                text = text.slice(0, startindex) + newslice + text.slice(i)
            }
        }
        return text
    }
}