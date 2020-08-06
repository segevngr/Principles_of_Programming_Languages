import { Exp, AppExp, Program, PrimOp, ProcExp, isProgram, isBoolExp, isNumExp, isVarRef, isPrimOp, isDefineExp, isProcExp, isIfExp, isAppExp } from '../imp/L2-ast';
import { Result, makeOk, makeFailure, mapResult, bind, safe3, safe2 } from '../imp/result';
import { map, concat, update, adjust } from "ramda";


/*
Purpose: Gets an expression, translate it to JS and return its Result
Signature: l2ToJS(exp)
Type: [exp -> Result<string>]
*/

export const AppExpToJS = (exp: AppExp) : Result<string> =>
    isVarRef(exp.rator) ? safe2((rator: string, rands: string[]) => 
    makeOk(`${rator}(${rands.join(",")})`)) 
    (l2ToJS(exp.rator), mapResult(l2ToJS, exp.rands)) :

    (isPrimOp(exp.rator) && exp.rator.op === "not") ? safe2((rator: string, rands: string[]) => 
    makeOk(`(${rator}${rands.join(``)})`))
    (l2ToJS(exp.rator), mapResult(l2ToJS, exp.rands)) :
    (isPrimOp(exp.rator) && exp.rator.op === "boolean?") ? safe2((rator: string, rands: string[]) => 
    makeOk(`(${rator} ${rands.join(``)} === 'boolean')`))
    (l2ToJS(exp.rator), mapResult(l2ToJS, exp.rands)) :
    (isPrimOp(exp.rator) && exp.rator.op === "number?") ? safe2((rator: string, rands: string[]) => 
    makeOk(`(${rator} ${rands.join(``)} === 'number')`))
    (l2ToJS(exp.rator), mapResult(l2ToJS, exp.rands)) :

    isProcExp(exp.rator) ? safe2((rator: string, rands: string[]) => 
    makeOk(`${rator}(${rands.join(",")})`)) 
    (l2ToJS(exp.rator), mapResult(l2ToJS, exp.rands)) :

    safe2((rator: string, rands: string[]) => 
    makeOk(`(${rands.join(` ${rator} `)})`))
    (l2ToJS(exp.rator), mapResult(l2ToJS, exp.rands));

export const procExpToJS = (exp: ProcExp) : Result<string> =>
    // One expression:
    exp.body.length === 1 ? bind(mapResult(l2ToJS, exp.body), (body: string[]) => 
    makeOk(`((${map(v => v.var, exp.args).join(",")}) => ${body[0]})`)) :
    // Two or more expressions:
    bind(mapResult(l2ToJS, exp.body), (body: string[]) => 
    makeOk(`((${map(v => v.var, exp.args).join(",")}) => {${insertReturn(body).join("; ")};})`));

// Insert return before the last element in body[]
export const insertReturn = (body: string[]) : string[] =>
    adjust(body.length-1, concatReturn, body);
export const concatReturn = (index :string) : string =>
    concat("return ", index);

export const primOpToJS = (op: string): Result<string> =>
    op === "boolean?" ? makeOk("typeof"):
    op === "number?" ? makeOk("typeof"):
    op === "+" ? makeOk("+") :
    op === "-" ? makeOk("-") :
    op === "*" ? makeOk("*") :
    op === "/" ? makeOk("/") :
    op === ">" ? makeOk(">") :
    op === "<" ? makeOk("<") :
    op === "=" ? makeOk("===") :
    op === "not" ? makeOk("!") :
    op === "and" ? makeOk("&&") :
    op === "or" ?  makeOk("||") :
    op === "eq?" ? makeOk("===") :  
    makeFailure("Invalid Op");

export const progExpToJS = (exp: Program) : Result<string> =>
    // One expression:
    exp.exps.length === 1 ? bind(mapResult(l2ToJS, exp.exps), (exps: string[]) => makeOk(exps.join(";\n"))) :
    // Two or more expressions:
    bind(mapResult(l2ToJS, exp.exps), (exps: string[]) => makeOk(`${insertLog(exps).join(";\n")};`));

//Insert console.log before last line
export const concatLog = (lastCell :string) : string =>
    concat("console.log(", concat(lastCell, ")"));
export const insertLog = (body: string[]) : string[] =>
    adjust(body.length-1, concatLog, body);

export const l2ToJS = (exp: Exp | Program): Result<string> => 
    isProgram(exp) ? progExpToJS(exp) :
    isBoolExp(exp) ? makeOk(exp.val ? 'true' : 'false') :
    isNumExp(exp) ? makeOk(exp.val.toString()) :
    isVarRef(exp) ? makeOk(exp.var) :
    isPrimOp(exp) ? primOpToJS(exp.op) :
    isDefineExp(exp) ? bind(l2ToJS(exp.val), (val: string) => makeOk(`const ${exp.var.var} = ${val}`)) :
    isProcExp(exp) ? procExpToJS(exp) :
    isIfExp(exp) ? safe3((test: string, then: string, alt: string) => makeOk(`(${test} ? ${then} : ${alt})`))
                    (l2ToJS(exp.test), l2ToJS(exp.then), l2ToJS(exp.alt)) :
    isAppExp(exp) ? AppExpToJS(exp) :
    makeFailure("Unknown expression");