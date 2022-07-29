export class Highlighter{
    private highlightCounter : number = 0;
    private highlightSubStrings : string[] = [];
    private _keyWords : string[] = []

    /**
     * returns html formatted string that with corresponding css highlights text according to syntax
     * @param text string
     */
    public highlightText(text : string) {

        //first single line quotes
        // @ts-ignore
        let singleLineQuote = new RegExp(/("(?:[^"\\\n]|\\.)*")/, "g")
        text = text.replace(singleLineQuote, ($1) => {
            return this.highlightReplacer("<span class='quote'>"+ $1 +"</span>")
        }) //wraps everything inside quotations in the tags

        //then comments, who have priority over multiline quotes
        // @ts-ignore
        let comment = new RegExp(/(\/\*[\s\S]*?\*\/)|(\/{2}|#).*/, "g")
        text = text.replace(comment, ($1, f, i, l, $5) => {
            return this.highlightReplacer("<span class='comment'>"+ $1 + "</span>")
        }) //wraps everything after comments in the tags

        //then multiline quotes
        // @ts-ignore
        let multiLineQuote = new RegExp(/("(?:[^"\\]|\\.)*")/, "g")
        text = text.replace(multiLineQuote, ($1) => {
            return this.highlightReplacer("<span class='quote'>"+ $1 +"</span>")
        }) //wraps everything inside quotations in the tags

        // @ts-ignore
        let arrow = new RegExp(/(---?|\.\.\.?|==|::|\|\|\|)|(&lt;&lt;=?&gt;&gt;|&lt;[-=.:]&gt;)|(=?&gt;&gt;|[-=.:]&gt;|-x)|(&lt;&lt;=?|&lt;[-=.:]|x-)/, "g")
        text = text.replace(arrow, ($1) =>{
            return this.highlightReplacer("<span class='arrow'>"+ $1 +"</span>")
        }) //wraps all arrows in the tags

        // @ts-ignore
        let note = new RegExp(/(?<=\s|^)([ra]?box|note)(?=\s|$)/, "g")
        text = text.replace(note, ($1) =>{
            return this.highlightReplacer("<span class='arrow'>"+ $1 +"</span>")
        }) //wraps all notes in the tags arrow

        // @ts-ignore
        for (const keyWord of this._keyWords) {
            let keyWordRegex = new RegExp("([^\\w&])(" + keyWord +")([^\\w&])" , "gi")
            text = text.replace(keyWordRegex, (match, p1, p2, p3) => {
                return p1 + this.highlightReplacer("<span class='keyWord'>"+ p2 +"</span>") + p3
            }) //wraps some keywords in the tags
        }
        text = this.refRelinker(text);

        return text
    }

    //undoes what the replacer did, run this when all the other string.replaces are done to get your actual output string
    private refRelinker(text: string) {
        while (text.match(/&([\d]+)&/)){
            text = text.replace(/&([\d]+)&/g, (match, p1) => {
                return this.highlightRE_Placer(p1)
            })
        }
        this.highlightCounter = 0;
        return text;
    }

    //replaces found substring with a reference to it in an array in order to prevent overlapping <spans>
    //due to the same substring being found several times
    private highlightReplacer(substr:string): string{
        this.highlightSubStrings[this.highlightCounter] = substr;
        return "&" + this.highlightCounter++ +"&";
    }

    //get it???
    //helper function for the relinker, use if you want to be more specific of what to re-place
    private highlightRE_Placer(ref: string): string{
        let i = parseInt(ref, 10)
        if(isNaN(i)){
            throw "reference \"" + ref + "\" to replace is Not a Number";
        }
        return this.highlightSubStrings[i];
    }

    public addKeywords(keyWords : string[]){
        this._keyWords = this._keyWords.concat(keyWords)
    }
}