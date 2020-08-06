//<graph>     ::= <header> <graphContent> // Graph(dir: Dir, content: GraphContent)
//<header>    ::= graph (TD|LR)<newline>// Direction can be TD or LR
//<graphContent>  ::= <atomicGraph> | <compoundGraph>
//<atomicGraph>   ::= <nodeDecl>
//<compoundGraph> ::= <edge>+
//<edge>      ::= <node> --><edgeLabel>?<node><newline>// <edgeLabel> is optional// Edge(from: Node, to: Node, label?: string)
//<node>      ::= <nodeDecl> | <nodeRef>
//<nodeDecl>  ::= <identifier>["<string>"]// NodeDecl(id: string,label: string)
//<nodeRef>   ::= <identifier>// NodeRef(id: string)
//<edgeLabel> ::= |<identifier>|// string



export type GraphContent = AtomicGraph | CompoundGraph;
export type AtomicGraph = NodeDecl;
export type Node = NodeDecl | NodeRef;
export type EdgeLabel = string;

export interface Graph { tag: "Graph"; dir: Dir; graphContent: GraphContent };
export interface Dir { tag: "Dir"; dir: "TD" | "LR" };
export interface CompoundGraph { tag: "CompoundGraph"; edges: Edge[] };
export interface NodeDecl { tag: "NodeDecl"; id: string; label: string };
export interface NodeRef { tag: "NodeRef"; id: string };
export interface Edge { tag: "Edge"; from: Node; to: Node; label?: string };

export const makeGraph = (dir: Dir, graphContent: GraphContent): Graph => ({ tag: "Graph", dir: dir, graphContent: graphContent });
export const makeDir = (dir: "TD" | "LR"): Dir => ({ tag: "Dir", dir: dir });
export const makeCompoundGraph = (edges: Edge[]): CompoundGraph => ({ tag: "CompoundGraph", edges: edges });
export const makeNodeDecl = (id: string, label: string): NodeDecl => ({ tag: "NodeDecl", id: id, label: label });
export const makeNodeRef = (id: string): NodeRef => ({ tag: "NodeRef", id: id });
export const makeEdge = (from: Node, to: Node, label?: string): Edge => ({ tag: "Edge", from: from, to: to, label: label })

export const isGraph = (x: any): x is Graph => x.tag === "Graph";
export const isDir = (x: any): x is Dir => x.tag === "Dir";
export const isCompoundGraph = (x: any): x is CompoundGraph => x.tag === "CompoundGraph";
export const isNodeDecl = (x: any): x is NodeDecl => x.tag === "NodeDecl";
export const isNodeRef = (x: any): x is NodeRef => x.tag === "NodeRef";
export const isEdge = (x: any): x is Edge => x.tag === "Edge";

