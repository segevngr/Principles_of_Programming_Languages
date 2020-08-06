/* Question 1 */

import { any } from "ramda";

export type Optional<T> = Some<T> | None;
    interface None {
        tag: 'None'

    }
    interface Some<T>{
        tag: 'Some'
        value: T
    }
export const makeSome = <T>(value: T): Some<T> => ({tag: 'Some' ,value: value});
export const makeNone = ():None =>({tag: 'None'});

export const isSome =  <T>(y:Optional<T>): y is Some<T> => y.tag === 'Some' ;
export const isNone = <T>(y:Optional<T>):y is None => y.tag === 'None';

/* Question 2 */
export const bind = <T, U>(optional:Optional<T>,f:(value:T) => Optional<U>): Optional<U> =>  
isSome(optional) ? f(optional.value): makeNone();