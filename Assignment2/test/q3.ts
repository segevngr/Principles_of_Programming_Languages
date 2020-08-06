import { ForExp, AppExp, CExp, Exp, Program, makeAppExp, makeProcExp, makeNumExp, isBoolExp, isNumExp, isPrimOp, isVarRef, isVarDecl, isForExp, isDefineExp, makeDefineExp, makeProgram, isProcExp, isIfExp, isProgram, isCExp, isExp, isAppExp, makeIfExp } from "./L21-ast"; 
import { Result, makeOk, bind, mapResult, safe2, safe3 } from "../imp/result"; 
import {range, map, then } from "ramda"; 
import { isAtomicExp } from "../imp/L2-ast";

/*
Purpose: cnverting a For expression to App expression
Signature: for2app (exp: ForExp): AppExp
Type: ForExp => AppExp
*/
export const for2app = (exp: ForExp): AppExp => {
    const cExp: CExp[] = map(makeNumExp,range(exp.start.val,exp.end.val+1))
    const appExp: CExp[] = map((entry: CExp) => makeAppExp(makeProcExp([exp.var],[exp.body]),[entry]),cExp)
    return makeAppExp(makeProcExp([],appExp),[]);
}
/*
Purpose: transform L21 to L2
Signature: L21ToL2(exp: Exp | Program): Result<Exp | Program>
Type: (exp: Exp | Program) => Result<Exp | Program>
*/
export const L21ToL2 = (exp: Exp | Program): Result<Exp | Program> =>
    isExp(exp) ? L21ToL2Exp(exp):
    isProgram(exp) ? bind(mapResult(L21ToL2Exp, exp.exps),(arrOfExp:Exp[]) => makeOk(makeProgram(arrOfExp))): 
    makeOk(exp);

export const L21ToL2Exp = (exp: Exp): Result<Exp> => 
    isCExp(exp) ? L21ToL2CExp(exp) :
    isDefineExp(exp) ? bind(L21ToL2CExp(exp.val),(cexp: CExp)=> makeOk(makeDefineExp(exp.var,cexp))):
    makeOk(exp);
              

export const L21ToL2CExp = (exp: CExp): Result<CExp> => 
    isNumExp(exp) ? makeOk(exp) :
    isVarDecl(exp) ? makeOk(exp) :
    isPrimOp(exp) ? makeOk(exp) : 
    isVarRef(exp) ? makeOk(exp) : 
    isBoolExp(exp) ? makeOk(exp) : 
    isAtomicExp(exp) ? makeOk(exp) :
    isForExp(exp) ? L21ToL2CExp(for2app(exp)) :
    isProcExp(exp) ? bind(mapResult(L21ToL2CExp,exp.body),(cexps: CExp[])=> makeOk(makeProcExp(exp.args, cexps))) :
    isIfExp(exp) ? safe3((test: CExp,then: CExp,alt: CExp) => makeOk(makeIfExp(test,then,alt)))
                    (L21ToL2CExp(exp.test), L21ToL2CExp(exp.then), L21ToL2CExp(exp.alt)):
    isAppExp(exp) ? safe2((rator: CExp, rands : CExp[]) => makeOk(makeAppExp(rator,rands)))
                    (L21ToL2CExp(exp.rator),mapResult(L21ToL2CExp,exp.rands)):
    makeOk(exp);
    
