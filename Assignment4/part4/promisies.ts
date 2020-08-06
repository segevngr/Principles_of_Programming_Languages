import { promises, resolve } from "dns";
import { reject } from "ramda";



function f(x: number): Promise<number> {
    return new Promise<number>((resolve, reject) => {
        try {
            resolve(1 / x);
        }

        catch (e) {
            reject(e)
        }
    });
}

function q(x: number): Promise<number> {
    return new Promise<number>((reslove, reject) => {
        try {
            reslove(x * x);
        }
        catch (e) {
            reject(e)
        }
    });
}

function h(x: number): Promise<number> {
    return new Promise<number>(async (reslove, reject) => {
        try {
            reslove(await f(await q(x)));
        }
        catch (e) {
            reject(e)
        }
    });
}

function slower<T1, T2>(promise1: Promise<T1>, promise2: Promise<T2>): Promise<[T1 | T2, number]> {
    return new Promise<[T1 | T2, number]>((resolve, reject) => {
        let arr: [(T1 | T2),number][] = [];
        const p1 = promise1.then((x: T1) => {
            arr.push([x,0])
        })
            .catch(e => reject(e)
            )
        const p2 = promise2.then((x: T2) => {
            arr.push([x,1])
        })
            .catch(e => reject(e))
        p1.then(_ => p2.then(() => resolve(arr[1])))
    });

}

const exmpro = new Promise((resolve, reject) => setTimeout(resolve, 20, "one"))
const exmpro2 = new Promise((resolve, reject) => setTimeout(resolve, 50, "two"))

slower(exmpro,exmpro2).then(value => console.log(value))