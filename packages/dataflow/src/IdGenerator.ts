import {simpleHash} from "./simpleHash.ts";

export interface IdGenerator {
    generate(seed: string): string;
}

export const SimpleHashGenerator: IdGenerator = { generate: seed => simpleHash(seed)}

export class CountingIdGenerator implements IdGenerator {
    private count: number = 0;

    generate(seed: string): string {
        return `${simpleHash(seed)}_${this.count++}`;
    }
}