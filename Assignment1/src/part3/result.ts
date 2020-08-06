/* Question 3 */

export type Result<T> = Ok<T> | Failure;

interface Ok<T> {
    value: T;
    tag: string;
}
interface Failure {
    message: string;
    tag: string;
}
export const makeOk = <T>(value: T): Ok<T> => ({value:value,tag:'Ok'});
export const makeFailure = <T>(message:string): Failure => ({tag:'Failure',message:message});

export const isOk = <T>(value:Result<T>): value is Ok<T> => value.tag === 'Ok';
export const isFailure = <T>(value:Result<T>): value is Failure => value.tag === 'Failure' ;

/* Question 4 */
export const bind = <T,U>(result: Result<T>,f: (x:T) => Result<U>): Result<U> => 
            isOk(result) ? f(result.value): makeFailure(result.message);    
;

/* Question 5 */
interface User {
    name: string;
    email: string;
    handle: string;
}

const validateName = (user: User): Result<User> =>
    user.name.length === 0 ? makeFailure("Name cannot be empty") :
    user.name === "Bananas" ? makeFailure("Bananas is not a name") :
    makeOk(user);

const validateEmail = (user: User): Result<User> =>
    user.email.length === 0 ? makeFailure("Email cannot be empty") :
    user.email.endsWith("bananas.com") ? makeFailure("Domain bananas.com is not allowed") :
    makeOk(user);

const validateHandle = (user: User): Result<User> =>
    user.handle.length === 0 ? makeFailure("Handle cannot be empty") :
    user.handle.startsWith("@") ? makeFailure("This isn't Twitter") :
    makeOk(user);

export const naiveValidateUser =(user: User): Result<User> => {
            if(isFailure(validateName(user))){
               return validateName(user);
            }else if(isFailure(validateEmail(user))){
                   return validateEmail(user);
                }else if(isFailure(validateHandle(user))){
                         return validateHandle(user);  
                }    
            return makeOk(user);
        };
export const monadicValidateUser =(user:User): Result<User> =>
            bind(validateName(user) ,(user:User) => bind(validateEmail(user) ,validateHandle));