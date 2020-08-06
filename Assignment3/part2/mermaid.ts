import { Result, makeOk, makeFailure, bind, mapResult, safe2, safe3, isOk } from "../shared/result";
import { Binding, LetrecExp, LetExp, AppExp, CompoundExp, Program, Parsed, Exp, makeProgram, isProgram, CExp, isExp, isAtomicExp, isPrimOp, isVarDecl, isVarRef, isLetrecExp, isSetExp, isCompoundExp, isBinding, isDefineExp, isNumExp, isStrExp, isBoolExp, isIfExp, isAppExp, isLetExp, isLitExp, DefineExp, VarDecl, AtomicExp, IfExp, isProcExp, ProcExp, LitExp, SetExp, parseL4, parseL4Exp } from "./L4-ast"
import { Graph, GraphContent, makeGraph, makeDir, makeNodeDecl, makeEdge, Node, CompoundGraph, isCompoundGraph, makeCompoundGraph, NodeDecl, makeNodeRef, Edge, isNodeDecl, isNodeRef, AtomicGraph } from "./mermaid-ast"
import { KeyValuePair, zip, none } from "ramda";
import { isSymbolSExp, isEmptySExp, SExpValue, isCompoundSExp, CompoundSExp, isClosure } from "./L4-value";
import { isNumber, isBoolean, isString } from "util";
import { parse } from "../shared/parser";

export const mapL4toMermaid = (exp: Parsed): Result<Graph> => {
    const L4ToMermaidProgram = (program: Program, id: string): Result<GraphContent> => {
        const nodeDcelProgram = makeNodeDecl(id, getLabel(program));
        const nodeDcelPoint = makeNodeDecl(expsGen(), getLabel("Exps"));
        const edgeProgram = makeEdge(nodeDcelProgram, nodeDcelPoint, "exps");
        return bind(L4ToMermaidArray(program.exps, makeNodeRef(nodeDcelProgram.id)), (content: GraphContent) => isCompoundGraph(content) ? makeOk(makeCompoundGraph([edgeProgram].concat(content.edges))) :
            makeFailure("should not be here"))
    };

    const L4ToMermaidExp = (exp: Exp, node: Node): Result<GraphContent> =>
        isDefineExp(exp) ? L4ToMermaidDefineExp(exp, node) :
            L4ToMermaidCexp(exp, node);

    const unionContent = (edges: Edge[], content: GraphContent[]): CompoundGraph => {
        const graphTree = zip(edges, content)
        return makeCompoundGraph(graphTree.reduce((acc: Edge[], cur: KeyValuePair<Edge, GraphContent>) =>
            isCompoundGraph(cur[1]) ? acc.concat([cur[0]]).concat(cur[1].edges) : acc.concat([cur[0]]), []))
    }

    const L4ToMermaidArray = (exps: Exp[], refNode: Node): Result<GraphContent> => {
        const dadRef = makeNodeRef(refNode.id);
        const children = exps.map((exp: Exp) => makeNodeDecl(getGen(exp), getLabel(exp)));
        const keyExps: KeyValuePair<Exp, NodeDecl>[] = zip(exps, children);
        const childrenEdges = children.map((nodeDeclChild: Node) => makeEdge(dadRef, nodeDeclChild));
        return bind(mapResult((pairNode: KeyValuePair<Exp, NodeDecl>) => L4ToMermaidExp(pairNode[0], makeNodeRef(pairNode[1].id)), keyExps), (content: GraphContent[]) =>
            makeOk(unionContent(childrenEdges, content)))
    };

    const L4ToMermaidDefineExp = (exp: DefineExp | Binding, node: Node): Result<GraphContent> => {
        const dadRef = makeNodeRef(node.id);
        const children = [makeNodeDecl(getGen(exp.var), getLabel(exp.var)), makeNodeDecl(getGen(exp.val), getLabel(exp.val))];
        const childrenEdges = [makeEdge(node, children[0]), makeEdge(dadRef, children[1])];
        return bind(L4ToMermaidCexp(exp.val, makeNodeRef(children[1].id)), (content: GraphContent) => isCompoundGraph(content) ? makeOk(makeCompoundGraph(childrenEdges.concat(content.edges))) :
            makeFailure("should not be here"))
    }

    const L4ToMermaidAtomic = (atomic: AtomicExp, node: Node): Result<GraphContent> => {
        return makeOk(makeNodeDecl(node.id, getLabel(atomic)));
    }

    const L4ToMermaidCexp = (cExp: CExp, node: Node): Result<GraphContent> =>
        isAtomicExp(cExp) ? L4ToMermaidAtomic(cExp, node) :
            L4ToMermaidCompound(cExp, node);


    const L4ToMermaidSetExp = (setExp: SetExp, node: Node): Result<GraphContent> => {
        const dadRef = makeNodeRef(node.id);
        const children = [makeNodeDecl(varRefGen(), getLabel(setExp)), makeNodeDecl(getGen(setExp.val), getLabel(setExp))]
        const childrenEdges = [makeEdge(node, children[0]), makeEdge(dadRef, children[1])];
        return bind(L4ToMermaidCexp(setExp.val, makeNodeRef(children[1].id)), (content: GraphContent) => isCompoundGraph(content) ? makeOk(makeCompoundGraph(childrenEdges.concat(content.edges))) :
            makeOk(makeCompoundGraph(childrenEdges)))
    }

    const L4ToMermaidCompound = (compound: CompoundExp, node: Node): Result<GraphContent> =>
        isAppExp(compound) ? L4ToMermaidAppExp(compound, node) :
            isIfExp(compound) ? L4ToMermaidIfExp(compound, node) :
                isProcExp(compound) ? L4ToMermaidProcExp(compound, node) :
                    isLetrecExp(compound) ? L4ToMermaidLetrecExp(compound, node) :
                        isSetExp(compound) ? L4ToMermaidSetExp(compound, node) :
                            isLitExp(compound) ? L4ToMermaidLitExp(compound, node) :
                                L4ToMermaidLetExp(compound, node)

    const L4ToMermaidLitExp = (litExp: LitExp, node: Node): Result<GraphContent> => {
        const children = [makeNodeDecl(getGen(litExp.val), getLabel(litExp.val))]
        console.log(litExp.val, children[0]);
        const childrenEdges = [makeEdge(node, children[0])]
        return bind(L4SexpValueToMermaid(litExp.val, makeNodeRef(children[0].id)), (content: GraphContent) => isCompoundGraph(content) ? makeOk(makeCompoundGraph(childrenEdges.concat(content.edges))) :
            makeOk(makeCompoundGraph(childrenEdges)))
    }

    const L4SexpValueToMermaid = (val: SExpValue, node: Node): Result<GraphContent> =>
        isCompoundSExp(val) ? CompoundSexpValToMermaid(val, node) :
            makeOk(makeNodeDecl(getGen(val), getLabel(val)))

    const CompoundSexpValToMermaid = (valCompound: CompoundSExp, node: Node): Result<GraphContent> => {
        const dadRef = makeNodeRef(node.id);
        const children = [makeNodeDecl(getGen(valCompound.val1), getLabel(valCompound.val1)), makeNodeDecl(getGen(valCompound.val2), getLabel(valCompound.val2))]
        const childrenEdges = [makeEdge(node, children[0]), makeEdge(dadRef, children[1])];
        return safe2((content1: GraphContent, content2: GraphContent) => makeOk(unionContent(childrenEdges, [content1, content2])))
            (L4SexpValueToMermaid(valCompound.val1, makeNodeRef(children[0].id)), L4SexpValueToMermaid(valCompound.val2, makeNodeRef(children[1].id)))
    }

    const L4ToMermaidLetrecExp = (letrecExp: LetrecExp, node: Node) => {
        const children = [makeNodeDecl(binidingGen(), getLabel("Binding")), makeNodeDecl(bodyGen(), getLabel("Body"))]
        const dadRef = makeNodeRef(node.id)
        const childrenEdges = [makeEdge(node, children[0]), makeEdge(dadRef, children[1])]
        return safe2((content1: GraphContent, content2: GraphContent) => makeOk(unionContent(childrenEdges, [content1, content2])))
            (L4ToMermaidArrayBinding(letrecExp.bindings, makeNodeRef(children[0].id)), L4ToMermaidArray(letrecExp.body, makeNodeRef(children[1].id)))
    }

    const L4ToMermaidLetExp = (letExp: LetExp, node: Node) => {
        const children = [makeNodeDecl(binidingGen(), getLabel("Binding")), makeNodeDecl(bodyGen(), getLabel("Body"))]
        const dadRef = makeNodeRef(node.id)
        const childrenEdges = [makeEdge(node, children[0]), makeEdge(dadRef, children[1])]
        return safe2((content1: GraphContent, content2: GraphContent) => makeOk(unionContent(childrenEdges, [content1, content2])))
            (L4ToMermaidArrayBinding(letExp.bindings, makeNodeRef(children[0].id)), L4ToMermaidArray(letExp.body, makeNodeRef(children[1].id)))
    }

    const L4ToMermaidAppExp = (appExp: AppExp, node: Node) => {
        const children = [makeNodeDecl(getGen(appExp.rator), getLabel(appExp.rator)), makeNodeDecl(randsGen(), getLabel("Rands"))];
        const dadRef = makeNodeRef(node.id);
        const childrenEdges = [makeEdge(node, children[0]), makeEdge(dadRef, children[1])];
        return safe2((content1: GraphContent, content2: GraphContent) => makeOk(unionContent(childrenEdges, [content1, content2])))
            (L4ToMermaidCexp(appExp.rator, makeNodeRef(children[0].id)),
                (L4ToMermaidArray(appExp.rands, makeNodeRef(children[1].id))))

    }

    const L4ToMermaidProcExp = (procExp: ProcExp, node: Node) => {
        const dadRef = makeNodeRef(node.id);
        const children = [makeNodeDecl(argsGen(), getLabel("Params")), makeNodeDecl(bodyGen(), getLabel("Body"))];
        const childrenEdges = [makeEdge(node, children[0]), makeEdge(dadRef, children[1])];
        return safe2((content1: GraphContent, content2: GraphContent) => makeOk(unionContent(childrenEdges, [content1, content2])))
            (L4ToMermaidVarDeclArray(procExp.args, makeNodeRef(children[0].id)),
                (L4ToMermaidArray(procExp.body, makeNodeRef(children[1].id))))

    }

    const L4ToMermaidVarDeclArray = (array: VarDecl[], node: Node) => {
        const varDeclChildren = array.map((v: VarDecl) => makeNodeDecl(varDeclGen(), getLabel(v)));
        const varDeclEdges = varDeclChildren.map((n: Node) => makeEdge(node, n));
        return makeOk(makeCompoundGraph(varDeclEdges));
    }

    const L4ToMermaidIfExp = (ifExp: IfExp, node: Node) => {
        const children = [makeNodeDecl(getGen(ifExp.test), getLabel(ifExp.test)), makeNodeDecl(getGen(ifExp.then), getLabel(ifExp.then)), makeNodeDecl(getGen(ifExp.alt), getLabel(ifExp.alt))]
        const dadRef = makeNodeRef(node.id);
        const childrenEdges = [makeEdge(node, children[0]), makeEdge(dadRef, children[1]), makeEdge(dadRef, children[2])];
        return safe3((content1: GraphContent, content2: GraphContent, content3: GraphContent) =>
            makeOk(unionContent(childrenEdges, [content1, content2, content3])))
            (L4ToMermaidCexp(ifExp.test, makeNodeRef(children[0].id)),
                L4ToMermaidCexp(ifExp.then, makeNodeRef(children[1].id)),
                L4ToMermaidCexp(ifExp.alt, makeNodeRef(children[2].id)))
    }

    const L4ToMermaidArrayBinding = (binding: Binding[], refNode: Node): Result<GraphContent> => {
        const dadRef = makeNodeRef(refNode.id);
        const children = binding.map((binding: Binding) => makeNodeDecl(getGen(binding), getLabel(binding)));
        const keyBinding: KeyValuePair<Binding, NodeDecl>[] = zip(binding, children);
        const childrenEdges = children.map((nodeDeclChild: Node) => makeEdge(dadRef, nodeDeclChild));
        return bind(mapResult((pairNode: KeyValuePair<Binding, NodeDecl>) => L4ToMermaidDefineExp(pairNode[0], makeNodeRef(pairNode[1].id)), keyBinding), (content: GraphContent[]) =>
            makeOk(unionContent(childrenEdges, content)))
    };

    const getGen = (exp: Exp | SExpValue | Binding | VarDecl): string =>
        isString(exp) ? stringGen() :
            isBoolean(exp) ? boolGen() :
                isNumber(exp) ? numberGen() :
                    isDefineExp(exp) ? defineExpGen() :
                        isProcExp(exp) ? procExpGen() :
                            isNumExp(exp) ? numExpGen() :
                                isStrExp(exp) ? strExpGen() :
                                    isBoolExp(exp) ? boolExpGen() :
                                        isPrimOp(exp) ? primOpGen() :
                                            isVarRef(exp) ? varRefGen() :
                                                isVarDecl(exp) ? varDeclGen() :
                                                    isAppExp(exp) ? appExpGen() :
                                                        isIfExp(exp) ? ifExpGen() :
                                                            isLetExp(exp) ? letExpGen() :
                                                                isLitExp(exp) ? litExpGen() :
                                                                    isBinding(exp) ? binidingGen() :
                                                                        isLetrecExp(exp) ? letrecGen() :
                                                                            isSetExp(exp) ? setExpGen() :
                                                                                isCompoundSExp(exp) ? compoundGen() :
                                                                                    isSymbolSExp(exp) ? symbolSexpGen() :
                                                                                        isEmptySExp(exp) ? emptySexpGen() :
                                                                                            "";

    const getLabel = (exp: Parsed | "Body" | "Rands" | ":" | "Exps" | "Params" | VarDecl | Binding | SExpValue | "Binding"): string =>
        exp === "Body" || exp === "Rands" || exp === "Params" || exp === "Exps" || exp === ":" || exp === "Binding" ? ":" :
            isNumber(exp) ? `"number(${exp})"` :
                isVarDecl(exp) ? `"${exp.tag}(${exp.var})"` :
                    isVarRef(exp) ? `"${exp.tag}(${exp.var})"` :
                        isString(exp) ? `"string(${exp})"` :
                            isBoolean(exp) ? `"boolean(${exp})"` :
                                isSymbolSExp(exp) ? `"symbolExp(${exp})"` :
                                    isAtomicExp(exp) ? isPrimOp(exp) ? `"${exp.tag}(${exp.op})"` :
                                        isBoolExp(exp) ? exp.val ? `"${exp.tag}(#t)"` : `"${exp.tag}(#f)"` :
                                            `"${exp.tag}(${exp.val})"` :
                                        exp.tag;

    const programGen = makeVarGen("Program");
    const defineExpGen = makeVarGen("DefineExp");
    const procExpGen = makeVarGen("ProcExp")
    const numExpGen = makeVarGen("NumExp");
    const strExpGen = makeVarGen("StrExp");
    const boolExpGen = makeVarGen("BoolExp");
    const primOpGen = makeVarGen("PrimOp");
    const varRefGen = makeVarGen("VarRef");
    const varDeclGen = makeVarGen("VarDecl");
    const appExpGen = makeVarGen("AppExp");
    const ifExpGen = makeVarGen("ifExp");
    const letExpGen = makeVarGen("LetExp");
    const litExpGen = makeVarGen("LitExp");
    const binidingGen = makeVarGen("Binding");
    const letrecGen = makeVarGen("LetrecExp");
    const setExpGen = makeVarGen("SetExp");
    const compoundGen = makeVarGen("CompoundSExp");
    const symbolSexpGen = makeVarGen("SymbolSExp");
    const emptySexpGen = makeVarGen("EmptySExp");
    const boolGen = makeVarGen("bool");
    const stringGen = makeVarGen("string");
    const numberGen = makeVarGen("number");
    const bodyGen = makeVarGen("Body");
    const expsGen = makeVarGen("Exps");
    const randsGen = makeVarGen("Rands");
    const argsGen = makeVarGen("args");

    return isProgram(exp) ? bind(L4ToMermaidProgram(exp, programGen()), (content: GraphContent) => makeOk(makeGraph(makeDir("TD"), content))) :
        bind(L4ToMermaidExp(exp, makeNodeDecl(getGen(exp), getLabel(exp))), (content: GraphContent) => makeOk(makeGraph(makeDir("TD"), content)))
}

const makeVarGen = (v: string): () => string => {
    let count: number = 0;
    return () => {
        count++;
        return `${v}_${count}`;
    };
};

export const L4toMermaid = (concrete: string): Result<string> =>
    bind(bind(parseProgramAndExpsGen(concrete), mapL4toMermaid), unparseMermaid)

export const parseProgramAndExpsGen = (concrete: string): Result<Parsed> =>{
    const program = parseL4(concrete);
    return isOk(program) ? program : bind(parse(concrete), parseL4Exp);
}
export const unparseMermaid = (graph: Graph): Result<string> =>
    bind(unparseGraphContent(graph.graphContent), (content: string) => makeOk(`\graph ${graph.dir.dir}\n${content}`))

export const unparseGraphContent = (graphContent: GraphContent): Result<string> =>
    isCompoundGraph(graphContent) ? unparseCommpoundMermaid(graphContent) :
        unparseNodeMermaid(graphContent)

const unparseNodeMermaid = (exp: Node): Result<string> =>
    isNodeDecl(exp) ? makeOk(`${exp.id}[${exp.label}]`) :
        isNodeRef(exp) ? makeOk(`${exp.id}`) :
            makeFailure(`unknown type ${exp}`)

const unparseCommpoundMermaid = (exp: CompoundGraph): Result<string> =>
    bind(mapResult(unparseEdgelMermaid, exp.edges), (edges: string[]) => makeOk(edges.join("\n")))

const unparseEdgelMermaid = (exp: Edge): Result<string> =>
    (isString(exp.label)) ? safe2((x: string, y: string) => makeOk(`${x} -->|${exp.label}| ${y}`))
        (unparseNodeMermaid(exp.from), unparseNodeMermaid(exp.to)) :
        safe2((x: string, y: string): Result<string> =>
            makeOk(`${x} --> ${y}`))
            (unparseNodeMermaid(exp.from), unparseNodeMermaid(exp.to))