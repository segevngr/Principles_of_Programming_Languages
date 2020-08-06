// Environment for L4 (support for Letrec)
// =======================================
// An environment represents a partial function from symbols (variable names) to values.
// It supports the operation: apply-env(env,var)
// which either returns the value of var in the environment, or else throws an error.
//
// Env is defined inductively by the following cases:
// * <env> ::= <empty-env> | <extended-env> | <rec-env>
// * <empty-env> ::= (empty-env) // empty-env()
// * <extended-env> ::= (env (symbol+) (value+) next-env) // env(vars:List(Symbol), vals:List(Value), next-env: Env)
// * <rec-ext-env> ::= (rec-env (symbol+) (params+) (bodies+) next-env)
//       // rec-env(vars:List(Symbol), paramss:List(List(var-decl)), bodiess:List(List(cexp)), next-env: Env)
//
// The key operation on env is apply-env(var) which returns the value associated to var in env
// or throw an error if var is not defined in env.

import { VarDecl, CExp, isBoolExp, isNumExp, isStrExp, isPrimOp, isLitExp, isVarRef, isIfExp, isProcExp, isAppExp, IfExp, Program, Exp, isDefineExp, isCExp } from './L4-ast';
import { makeClosure, Value } from './L4-value';
import { Result, makeOk, makeFailure, bind, mapResult } from '../shared/result';
import { rest, isEmpty, first } from '../shared/list';
import { Sexp } from 's-expression';


// ========================================================
// Environment data type
export type Env = EmptyEnv | ExtEnv
export interface EmptyEnv { tag: "EmptyEnv" }
export interface ExtEnv {
    tag: "ExtEnv";
    vars: string[];
    vals: CExp[];
    nextEnv: Env;
}

export const makeEmptyEnv = (): EmptyEnv => ({ tag: "EmptyEnv" });
export const makeExtEnv = (vs: string[], vals: CExp[], env: Env): ExtEnv =>
    ({ tag: "ExtEnv", vars: vs, vals: vals, nextEnv: env });

const isEmptyEnv = (x: any): x is EmptyEnv => x.tag === "EmptyEnv";
const isExtEnv = (x: any): x is ExtEnv => x.tag === "ExtEnv";


export const isEnv = (x: any): x is Env => isEmptyEnv(x) || isExtEnv(x);

// Apply-env
export const applyEnv = (env: Env, v: string): Result<CExp> =>
    isEmptyEnv(env) ? makeFailure(`var not found ${v}`) :
        applyExtEnv(env, v);


const applyExtEnv = (env: ExtEnv, v: string): Result<CExp> =>
    env.vars.includes(v) ? makeOk(env.vals[env.vars.indexOf(v)]) :
        applyEnv(env.nextEnv, v);

