export type RaceResult<T> = (T | Promise<T>)

export class Promises {
    static async raceAll<T extends any>(values: Promise<T>[]): Promise<RaceResult<T>[]> {
        const result: RaceResult<T>[] = values.slice();
        const tracked = values.map((p, i): Promise<T> => p.then(v => result[i] = v ));
        await Promise.race(tracked);
        return result;
    }
}