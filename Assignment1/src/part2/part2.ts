import { filter, T, map, compose } from "ramda";
import { access } from "fs";

/* Question 1 */
export const partition: <T>(pred:(pram: T)=>boolean,x:T[])=>T[][] = 
(pred,x) => [filter(pred,x),filter(x => !pred(x),x)];
    


/* Question 2 */
export const mapMat= <T, E> ( func: (param: T) => E,x: T[][]) :E[][]  =>

    x.map((cur) => cur.map(func));

        
    


/* Question 3 */
export const composeMany: <T>(functions:((param:T)=>T)[]) => (param:T)=>T=
(functions)=> functions.reduce((acc,cur) => compose(acc,cur),x=>x);
    
/* Question 4 */
interface Languages {
    english: string;
    japanese: string;
    chinese: string;
    french: string;
}

interface Stats {
    HP: number;
    Attack: number;
    Defense: number;
    "Sp. Attack": number;
    "Sp. Defense": number;
    Speed: number;
}

interface Pokemon{
    id: number;
    name: Languages;
    type: string[];
    base: Stats;
}

export const maxSpeed: (database: Pokemon[]) => Pokemon[] =
(database) =>  database.filter((pokemon: Pokemon) => pokemon.base.Speed === database.reduce((acc,cur) => acc < cur.base.Speed ? acc = cur.base.Speed:acc,0));

export const grassTypes: (database: Pokemon[]) => string[] =
(database) => database.filter(Pokemon => Pokemon.type.includes("Grass")).map(Pokemon => Pokemon.name.english).sort();

export const uniqueTypes: (database: Pokemon[]) => string[] = 
(database) => database.reduce((acc:string[],cur) => acc.concat(cur.type), []).reduce((acc:string[],cur2) => !acc.includes(cur2) ?  acc.concat(cur2): acc, []).sort();

