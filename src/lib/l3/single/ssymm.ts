/*  -- Jacob Bogers, 03/2018, jkfbogers@gmail.com
*>  -- Written on 8-February-1989.
*>     Jack Dongarra, Argonne National Laboratory.
*>     Iain Duff, AERE Harwell.
*>     Jeremy Du Croz, Numerical Algorithms Group Ltd.
*>     Sven Hammarling, Numerical Algorithms Group Ltd.
*/


import { errWrongArg, lowerChar, Matrix } from '../../f_func';
/*
*>
*> SSYMM  performs one of the matrix-matrix operations
*>
*>    C := alpha*A*B + beta*C,
*>
*> or
*>
*>    C := alpha*B*A + beta*C,
*>
*> where alpha and beta are scalars,  A is a symmetric matrix and  B and
*> C are  m by n matrices.
*> 
*/

const { max } = Math;

export function ssymm(
    side: 'l' | 'r',
    uplo: 'u' | 'l',
    m: number,
    n: number,
    alpha: number,
    a: Matrix,
    lda: number,
    b: Matrix,
    ldb: number,
    beta: number,
    c: Matrix,
    ldc: number): void {


    const si = lowerChar(side);
    const ul = lowerChar(uplo);

    const nrowA = si === 'l' ? m : n;

    //Test the input parameters.

    let info = 0;
    if (si !== 'l' && si !== 'r') {
        info = 1;
    }
    else if (ul !== 'u' && ul !== 'l') {
        info = 2;
    }
    else if (m < 0) {
        info = 3;
    }
    else if (n < 0) {
        info = 4;
    }
    else if (lda < max(1, nrowA)) {
        info = 7;
    }
    else if (ldb < max(1, m)) {
        info = 9;
    }
    else if (ldc < max(1, m)) {
        info = 12;
    }
    if (info !== 0) {
        throw new Error(errWrongArg('ssymm', info));
    }

    //*     Quick return if possible.

    if (m === 0 || n === 0 ||
        (alpha === 0 && beta === 1)
    ) return;

    //when alpha is zero
    if (alpha === 0) {
        if (beta === 0) {
            for (let j = 1; j <= n; j++) {
                c.setCol(j, 1, m, 0);
            }
        }
        else {
            for (let j = 1; j <= n; j++) {
                const coords = c.colOfEx(j);
                for (let i = 1; i <= m; i++) {
                    c.r[coords + i] *= beta;
                }
            }
        }
        return;
    }

    //   Start the operations.
    if (si === 'l') {
        //Form  C := alpha*A*B + beta*C.
        if (ul === 'u') {
            for (let j = 1; j <= n; j++) {
                const coorBJ = b.colOfEx(j);
                const coorCJ = c.colOfEx(j);
                for (let i = 1; i <= m; i++) {
                    const coorAI = a.colOfEx(i);
                    let temp1 = alpha * b.r[coorBJ + i];
                    let temp2 = 0;
                    for (let k = 1; k <= i - 1; k++) {
                        c.r[coorCJ + k] += temp1 * a.r[coorAI + k];
                        temp2 += b.r[coorBJ + k] * a.r[coorAI + k];
                    }
                    //TEMP1*A(I,I) + ALPHA*TEMP2
                    let re = temp1 * a.r[coorAI + i] + alpha * temp2;
                    if (beta !== 0) {
                        re += beta * c.r[coorCJ + i];
                    }
                    c.r[coorCJ + i] = re;
                }
            }
        }
        else {
            for (let j = 1; j <= n; j++) {
                const coorBJ = b.colOfEx(j);
                const coorCJ = b.colOfEx(j);
                for (let i = m; i >= 1; i--) {
                    const coorAI = a.colOfEx(i);
                    const temp1 = alpha * b.r[coorBJ + i];
                    let temp2 = 0;
                    for (let k = i + 1; k <= m; k++) {
                        c.r[coorCJ + k] += temp1 * a.r[coorAI + k];
                        temp2 += b.r[coorBJ + k] * a.r[coorAI + k];
                    }
                    let re = temp1 * a.r[coorAI + i] + alpha * temp2;
                    if (beta !== 0) {
                        re += beta * c.r[coorCJ + i];
                    }
                    c.r[coorCJ + i] = re;
                }
            }
        }
    }
    else {
        //  Form  C := alpha*B*A + beta*C.
        for (let j = 1; j <= n; j++) {
            //throw new Error('hh');
            //pre-calc
            // console.log(a, b, c);
            const coorAJ = a.colOfEx(j);
            const coorCJ = c.colOfEx(j);
            const coorBJ = b.colOfEx(j);

            const temp1 = alpha * a.r[coorAJ + j];
            if (beta === 0) {
                for (let i = 1; i <= m; i++) {
                    c.r[coorCJ + i] = temp1 * b.r[coorBJ + i];
                }
            }
            else {
                for (let i = 1; i <= m; i++) {

                    c.r[coorCJ + i] = beta * c.r[coorCJ + i] + temp1 * b.r[coorBJ + i];

                }
            }
            for (let k = 1; k <= j - 1; k++) {
                const coorAK = a.colOfEx(k);
                const coorBK = b.colOfEx(k);
                let temp1 = alpha * (ul === 'u' ? a.r[coorAJ + k] : a.r[coorAK + j]);
                for (let i = 1; i <= m; i++) {
                    c.r[coorCJ + i] += temp1 * b.r[coorBK + i];
                }
            }
            for (let k = j + 1; k <= n; k++) {
                const coorAK = a.colOfEx(k);
                const coorBK = b.colOfEx(k);

                let temp1 = alpha * (ul === 'u' ? a.r[coorAK + j] : a.r[coorAJ + k]);
                for (let i = 1; i <= m; i++) {
                    c.r[coorCJ + i] += temp1 * b.r[coorBK + i];
                }
            }
        }
    }
}
