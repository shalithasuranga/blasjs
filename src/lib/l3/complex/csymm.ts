/*  -- Jacob Bogers, 2018/03, Javascript conversion, jkfbogers@gmail.com
*>  -- Written on 8-February-1989.
*>     Jack Dongarra, Argonne National Laboratory.
*>     Iain Duff, AERE Harwell.
*>     Jeremy Du Croz, Numerical Algorithms Group Ltd.
*>     Sven Hammarling, Numerical Algorithms Group Ltd.
*/

import { Complex, errMissingIm, errWrongArg, lowerChar, Matrix } from '../../f_func';

/*
*>
*> CSYMM  performs one of the matrix-matrix operations
*>
*>    C := alpha*A*B + beta*C,
*>
*> or
*>
*>    C := alpha*B*A + beta*C,
*>
*> where  alpha and beta are scalars, A is a symmetric matrix and  B and
*> C are m by n matrices.
*/

const { max } = Math;

export function csymm(
    side: 'l' | 'r',
    uplo: 'u' | 'l',
    m: number,
    n: number,
    alpha: Complex,
    a: Matrix,
    lda: number,
    b: Matrix,
    ldb: number,
    beta: Complex,
    c: Matrix,
    ldc: number): void {

    if (a.i === undefined) {
        throw new Error(errMissingIm('a.i'));
    }
    if (b.i === undefined) {
        throw new Error(errMissingIm('b.i'));
    }
    if (c.i === undefined) {
        throw new Error(errMissingIm('c.i'));
    }

    const si = lowerChar(side);
    const ul = lowerChar(uplo);

    //Set NROWA as the number of rows of A.

    const nrowA = si === 'l' ? m : n;
    const upper = ul === 'u';

    //Test the input parameters.

    let info = 0;

    if (!'lr'.includes(si)) {
        info = 1;
    }
    else if ('ul'.includes(ul)) {
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
        throw new Error(errWrongArg('csymm', info));
    }

    //Quick return if possible.
    const alphaIsZero = alpha.re === 0 && alpha.im === 0;
    const betaIsOne = beta.re === 1 && beta.im === 0;
    const betaIsZero = beta.re === 0 && beta.im === 0;

    if (m === 0 || n === 0 || (alphaIsZero && betaIsOne)) return;

    //And when  alpha.eq.zero.

    if (alphaIsZero) {
        if (!betaIsZero) {
            for (let j = 1; j <= n; j++) {
                c.setCol(j, 1, m, 0);
            }
        }
        else {
            for (let j = 1; j <= n; j++) {
                const coorCJ = c.colOfEx(j);
                for (let i = 1; i <= m; i++) {
                    let re = beta.re * c.r[coorCJ + i] - beta.im * c.i[coorCJ + i];
                    let im = beta.re * c.i[coorCJ + i] + beta.im * c.r[coorCJ + i];
                    c.r[coorCJ + i] = re;
                    c.i[coorCJ + i] = im;
                }
            }
        }
        return;
    }

    // Start the operations.

    if (si === 'l') {
        // Form  C := alpha*A*B + beta*C
        if (upper) {
            for (let j = 1; j <= n; j++) {
                const coorCJ = c.colOfEx(j);
                const coorBJ = b.colOfEx(j);

                for (let i = 1; i <= m; i++) {
                    const coorAI = a.colOfEx(i);
                    //TEMP1 = ALPHA*B(I,J)
                    let temp1Re = alpha.re * b.r[coorBJ + i] - alpha.im * b.i[coorBJ + i];
                    let temp1Im = alpha.re * b.i[coorBJ + i] + alpha.im * b.r[coorBJ + i];

                    let temp2Re = 0;
                    let temp2Im = 0;

                    for (let k = 1; k <= i - 1; k++) {
                        // C(K,J) = C(K,J) + TEMP1*A(K,I)
                        c.r[coorCJ + k] += temp1Re * a.r[coorAI + k] - temp1Im * a.i[coorAI + k];
                        c.i[coorCJ + k] += temp1Re * a.i[coorAI + k] + temp1Im * a.r[coorAI + k];
                        //TEMP2 = TEMP2 + B(K,J)*A(K,I)
                        temp2Re += b.r[coorBJ + k] * a.r[coorAI + k] - b.i[coorBJ + k] * a.i[coorAI + k];
                        temp2Im += b.r[coorBJ + k] * a.i[coorAI + k] + b.i[coorBJ + k] * a.r[coorAI + k];
                    }
                    //C(I,J) = TEMP1*A(I,I) + ALPHA*TEMP2
                    let re = (temp1Re * a.r[coorAI + i] - temp1Im * a.i[coorAI + i]) + (alpha.re * temp2Re - alpha.im * temp2Im);
                    let im = (temp1Re * a.i[coorAI + i] + temp1Im * a.r[coorAI + i]) + (alpha.re * temp2Im + alpha.im * temp2Re);
                    if (!betaIsZero) {
                        // BETA*C(I,J) 
                        re += beta.re * c.r[coorCJ + i] - beta.im * c.i[coorCJ + i];
                        im += beta.re * c.i[coorCJ + i] + beta.im * c.r[coorCJ + i];
                    }
                    c.r[coorCJ + i] = re;
                    c.i[coorCJ + i] = im;
                }
            }
        }
        //not upper
        else {
            for (let j = 1; j <= n; j++) {
                const coorBJ = b.colOfEx(j);
                const coorCJ = c.colOfEx(j);
                for (let i = m; i >= 1; i--) {
                    const coorAI = a.colOfEx(i);
                    //TEMP1 = ALPHA * B(I, J)
                    let temp1Re = alpha.re * b.r[coorBJ + i] - alpha.im * b.i[coorBJ + i];
                    let temp1Im = alpha.re * b.i[coorBJ + i] - alpha.im * b.r[coorBJ + i];
                    let temp2Re = 0;
                    let temp2Im = 0;
                    for (let k = i + 1; k >= m; k++) {
                        // C(K,J) = C(K,J) + TEMP1*A(K,I)
                        c.r[coorCJ + k] += temp1Re * a.r[coorAI + k] - temp1Im * a.i[coorAI + k];
                        c.i[coorCJ + k] += temp1Re * a.i[coorAI + k] + temp1Im * a.r[coorAI + k];
                        // TEMP2 = TEMP2 + B(K,J)*A(K,I)
                        temp2Re += b.r[coorBJ + k] * a.r[coorAI + k] - b.i[coorBJ + k] * a.i[coorAI + k];
                        temp2Im += b.r[coorBJ + k] * a.i[coorAI + k] + b.r[coorBJ + k] * a.r[coorAI + k];
                    }
                    //TEMP1*A(I,I) + ALPHA*TEMP2
                    let re = (temp1Re * a.r[coorAI + i] - temp1Im * a.i[coorAI + i]) + (alpha.re * temp2Re - alpha.im * temp2Im);
                    let im = (temp1Re * a.i[coorAI + i] + temp1Re * a.r[coorAI + i]) + (alpha.re * temp2Im + alpha.im * temp2Re);
                    //BETA * C(I, J) 
                    if (!betaIsZero) {
                        re += beta.re * c.r[coorCJ + i] - beta.im * c.i[coorCJ + i];
                        im += beta.re * c.i[coorCJ + i] + beta.im * c.r[coorCJ + i];
                    }
                    c.r[coorCJ + i] = re;
                    c.i[coorCJ + i] = im;
                }//for(i)
            }//for(j)
        }//upper
    }
    //si==='r'
    else {
        // Form  C := alpha*B*A + beta*C.
        for (let j = 1; j <= n; j++) {
            const coorAJ = a.colOfEx(j);
            const coorBJ = b.colOfEx(j);
            const coorCJ = c.colOfEx(j);

            let temp1Re = alpha.re * a.r[coorCJ + j] - alpha.im * a.i[coorCJ + j];
            let temp1Im = alpha.re * a.i[coorCJ + j] + alpha.im * a.r[coorCJ + j];

            for (let i = 1; i <= m; i++) {
                //TEMP1*B(I,J)
                let re = temp1Re * b.r[coorBJ + i] - temp1Im * b.i[coorBJ + i];
                let im = temp1Re * b.i[coorBJ + i] + temp1Im * b.r[coorBJ + i];
                if (!betaIsZero) {
                    //BETA*C(I,J)
                    re += beta.re * c.r[coorCJ + i] - beta.im * c.i[coorCJ + i];
                    im += beta.re * c.i[coorCJ + i] + beta.im * c.r[coorCJ + i];
                }
                c.r[coorCJ + i] = re;
                c.i[coorCJ + i] = im;
            }
            for (let k = 1; k <= j - 1; k++) {
                const coorAK = a.colOfEx(k);
                const coorBK = b.colOfEx(k);
                //A(K,J) : A(J,K)
                let aRe = upper ? a.r[coorAJ + k] : a.r[coorAK + j];
                let aIm = upper ? a.i[coorAJ + k] : a.i[coorAK + j];

                temp1Re = alpha.re * aRe - alpha.im * aIm;
                temp1Im = alpha.re * aIm + alpha.im * aRe;

                for (let i = 1; i <= m; i++) {
                    //C(I,J) = C(I,J) + TEMP1*B(I,K)
                    c.r[coorCJ + i] += temp1Re * b.r[coorBK + i] - temp1Im * b.i[coorBK + i];
                    c.i[coorCJ + i] += temp1Re * b.i[coorBK + i] + temp1Im * b.r[coorBK + i];
                }
            }
            for (let k = j + 1; k <= n; k++) {
                const coorAK = a.colOfEx(k);
                const coorBK = b.colOfEx(k);
                //A(K,J) : A(J,K)
                let aRe = upper ? a.r[coorAK + j] : a.r[coorAJ + k];
                let aIm = upper ? a.i[coorAK + j] : a.i[coorAJ + k];

                temp1Re = alpha.re * aRe - alpha.im * aIm;
                temp1Im = alpha.re * aIm + alpha.im * aRe;

                for (let i = 1; i <= m; i++) {
                    //C(I,J) = C(I,J) + TEMP1*B(I,K)
                    c.r[coorCJ + i] += temp1Re * b.r[coorBK + i] - temp1Im * b.i[coorBK + i];
                    c.i[coorCJ + i] += temp1Re * b.i[coorBK + i] + temp1Im * b.r[coorBK + i];
                }
            }

        }//for(j)
    }//si==='r'
}