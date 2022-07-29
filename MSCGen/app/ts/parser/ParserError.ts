export class ParserError extends Error{
    public lineNr : number
    constructor(message : string, line : number){
        super(message)
        this.lineNr = line
    }
}