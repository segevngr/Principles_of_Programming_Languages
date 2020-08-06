
function* braid(generator1: Generator, generator2: Generator): Generator {
    let v1 = generator1.next();
    let v2 = generator2.next();

    while (!v1.done && !v2.done) {
        yield v1.value;
        yield v2.value;
        v1 = generator1.next();
        v2 = generator2.next();
        if (v1.done && !v2.done) {
            while (!v2.done) {
                yield v2.value
                v2 = generator2.next();
            }
        } else if (v2.done && !v1.done) {
            while (!v1.done) {
                yield v1.value
                v1 = generator1.next();
            }
        }
    }
}

function* biased(generator1: Generator, generator2: Generator): Generator {
    let v1 = generator1.next();
    let v2 = generator2.next();
    while (!v1.done && !v2.done) {
        yield v1.value;
        v1 = generator1.next();
        yield v1.value;
        v1 = generator1.next();
        yield v2.value
        v2 = generator2.next();
        if (v1.done && !v2.done) {
            while (!v2.done) {
                yield v2.value
                v2 = generator2.next();
            }
        } else if (v2.done && !v1.done) {
            while (!v1.done) {
                yield v1.value
                v1 = generator1.next();
            }
        }
    }
}

function* gen1() { yield 3; yield 6; yield 9; yield 12; }
function* gen2() { yield 8; yield 10; } for (let n of take(4, biased(gen1(), gen2()))) { console.log(n); }

function* take(n: number, generator: Generator) {
    for (let x of generator) {
        if (n <= 0)
            return; n--;
        yield x;
    }
} 
