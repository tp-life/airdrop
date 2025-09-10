
export interface Result<T = undefined> {
    ok: boolean,
    msg?: string,
    data?: T,
}