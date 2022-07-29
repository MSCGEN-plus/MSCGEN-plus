import {Entity} from "./Drawables/Entity.js";
import {Options} from "./Options.js";

export class Globals{

    private _options : Options = new Options();
    constructor(copy? : Globals) {
        if(copy === undefined){
            this._options = new Options()
            return
        }
        this._options = new Options(copy._options)
        this._entities = copy._entities
    };

    //resets everything to its initial value
    public reset(){
        this._options = new Options()
        this._entities = new Map<string, Entity>()
    }

    private _entities: Map<string,Entity> = new Map<string, Entity>();

    public getEntity(key: string){
        return this._entities.get(key);
    }

    public getOptions() : Options{
        return this._options
    }

    public setEntity(entity:Entity, key?: string){
        if(key)
            this._entities.set(key, entity);
        else
            this._entities.set(entity.name, entity);
    }

    get entities(): Map<string, Entity> {
        return this._entities;
    }

    set options(value: Options) {
        this._options = value;
    }


}