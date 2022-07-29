interface Parser{
    /**
     * @param text input string to parse
     * @param offset linenumber of the start of the input
     */
    parseText(text : string, offset: number) : void
    getResult() : any
}