// ========================================================
// L4 normal eval
import { Sexp } from "s-expression";
//import { map } from "ramda";
import {
    Exp, Program, parseL4Exp, isBoolExp, isNumExp, isStrExp, isPrimOp, isLitExp,
    isVarRef, isAtomicExp, isIfExp, isProcExp,
    isAppExp, AppExp, CExp, isDefineExp, isCExp, IfExp, isLetExp, VarRef, ProcExp, PrimOp, VarDecl, Binding, LetExp, makeProcExp, makeIfExp, makeAppExp, makeVarDecl, makeVarRef
} from "./L4-ast";
import { makeEmptyEnv, Env, applyEnv, makeExtEnv } from './L4-env-normal';
import { Value, makeClosure, isClosure, makeExpEvlNormal, isExpEvlNormal, Closure } from "./L4-value";
import { Result, makeFailure, bind, makeOk, mapResult } from "../shared/result";
import { parse as p } from "../shared/parser";
import { isEmpty, rest, first } from "../shared/list";
import { applyPrimitive } from "./evalPrimitive";
import { map, indexOf, zip, filter, contains, KeyValuePair } from "ramda";


const L4normalEval = (exp: CExp, env: Env): Result<Value> =>
    isBoolExp(exp) ? makeOk(exp.val) :
        isNumExp(exp) ? makeOk(exp.val) :
            isStrExp(exp) ? makeOk(exp.val) :
                isPrimOp(exp) ? makeOk(exp) :
                    isLitExp(exp) ? makeOk(exp.val) :
                        isVarRef(exp) ? evalVarRef(exp, env) :
                            isIfExp(exp) ? evalIf(exp, env) :
                                isProcExp(exp) ? evalProc(exp, env) :
                                    isLetExp(exp) ? evalLet(exp, env) :
                                        isAppExp(exp) ? bind(L4normalEval(exp.rator, env), proc => normalApplyProc(proc, exp.rands, env)) :
                                            makeFailure("Bad ast");

const evalVarRef = (exp: VarRef, env: Env): Result<Value> =>
    bind(applyEnv(env, exp.var),
        (exp: CExp): Result<Value> =>
            (isAtomicExp(exp) || isProcExp(exp)) ? L4normalEval(exp, env) : makeOk(makeExpEvlNormal(exp)));

const evalIf = (exp: IfExp, env: Env): Result<Value> =>
    bind(L4normalEval(exp.test, env), (test: Value) =>
        isExpEvlNormal(test) ? bind(L4normalEval(test.val, env),
            (testVal: Value) => isTrueValue(testVal) ? L4normalEval(exp.then, env) : L4normalEval(exp.alt, env)) :
            isTrueValue(test) ? L4normalEval(exp.then, env) : L4normalEval(exp.alt, env))

export const isTrueValue = (x: Value): boolean =>
    !(x === false);

const evalProc = (exp: ProcExp, env: Env): Result<Value> =>
    makeOk(makeClosure(exp.args, exp.body, env));

const evalDefineExps = (def: Exp, exps: Exp[], env: Env): Result<Value> =>
    isDefineExp(def) ? evalExps(exps, makeExtEnv([def.var.var], [def.val], env)) :
        makeFailure("Never")

const evalLet = (exp: LetExp, env: Env): Result<Value> => {
    const vals = map((b: Binding) => b.val, exp.bindings);
    const vars = map((b: Binding) => b.var.var, exp.bindings);
    return evalExps(exp.body, makeExtEnv(vars, vals, env))
}

export const evalExps = (exps: Exp[], env: Env): Result<Value> =>
    isEmpty(exps) ? makeFailure("Empty program") :
        isDefineExp(first(exps)) ? evalDefineExps(first(exps), rest(exps), env) :
            evalCExps(first(exps), rest(exps), env);

const normalApplyProc = (proc: Value, args: CExp[], env: Env): Result<Value> =>
    isPrimOp(proc) ? bind((mapResult((rand: CExp) => L4normalEval(rand, env), args)),
        (rands: Value[]) => applyPrimOp(proc, rands, env)) :
        isClosure(proc) ? applyClosure(proc, args) :
            makeFailure("Bad procedure: " + JSON.stringify(proc));

const applyPrimOp = (rator: PrimOp, rands: Value[], env: Env): Result<Value> =>
    bind(mapResult((value: Value) => isExpEvlNormal(value) ? L4normalEval(value.val, env) : makeOk(value), rands),
        (values: Value[]) => applyPrimitive(rator, values))


const applyClosure = (proc: Closure, args: CExp[]): Result<Value> => {
    const vars = map((v: VarDecl) => v.var, proc.params);
    return evalExps(renameExps(proc.body), makeExtEnv(vars, args, proc.env));
}

export const evalNormalProgram = (program: Program): Result<Value> =>
    evalExps(program.exps, makeEmptyEnv());

const evalCExps = (exp1: Exp, exps: Exp[], env: Env): Result<Value> =>
    isCExp(exp1) && isEmpty(exps) ? L4normalEval(exp1, env) :
        isCExp(exp1) ? bind(L4normalEval(exp1, env), _ => evalExps(exps, env)) :
            makeFailure("Never");

export const evalNormalParse = (s: string): Result<Value> =>
    bind(p(s),
        (parsed: Sexp) => bind(parseL4Exp(parsed),
            (exp: Exp) => evalExps([exp], makeEmptyEnv())));

export const substitute = (body: CExp[], vars: string[], exps: CExp[]): CExp[] => {
    const subVarRef = (e: VarRef): CExp => {
        const pos = indexOf(e.var, vars);
        return ((pos > -1) ? exps[pos] : e);
    };

    const subProcExp = (e: ProcExp): ProcExp => {
        const argNames = map((x) => x.var, e.args);
        const subst = zip(vars, exps);
        const freeSubst = filter((ve) => !contains(first(ve), argNames), subst);
        return makeProcExp(e.args, substitute(e.body, map((x: KeyValuePair<string, CExp>) => x[0], freeSubst), map((x: KeyValuePair<string, CExp>) => x[1], freeSubst)));
    };

    const sub = (e: CExp): CExp => isNumExp(e) ? e :
        isBoolExp(e) ? e :
            isPrimOp(e) ? e :
                isLitExp(e) ? e :
                    isStrExp(e) ? e :
                        isVarRef(e) ? subVarRef(e) :
                            isIfExp(e) ? makeIfExp(sub(e.test), sub(e.then), sub(e.alt)) :
                                isProcExp(e) ? subProcExp(e) :
                                    isAppExp(e) ? makeAppExp(sub(e.rator), map(sub, e.rands)) :
                                        e;

    return map(sub, body);
};

export const makeVarGen = (): (v: string) => string => {
    let count: number = 0;
    return (v: string) => {
        count++;
        return `${v}__${count}`;
    };
};

export const renameExps = (exps: CExp[]): CExp[] => {
    const varGen = makeVarGen();
    const replace = (e: CExp): CExp =>
        isIfExp(e) ? makeIfExp(replace(e.test), replace(e.then), replace(e.alt)) :
            isAppExp(e) ? makeAppExp(replace(e.rator), map(replace, e.rands)) :
                isProcExp(e) ? replaceProc(e) :
                    e;

    // Rename the params and substitute old params with renamed ones.
    //  First recursively rename all ProcExps inside the body.
    const replaceProc = (e: ProcExp): ProcExp => {
        const oldArgs = map((arg: VarDecl): string => arg.var, e.args);
        const newArgs = map(varGen, oldArgs);
        const newBody = map(replace, e.body);
        return makeProcExp(map(makeVarDecl, newArgs), substitute(newBody, oldArgs, map(makeVarRef, newArgs)));
    };

    return map(replace, exps);
};
