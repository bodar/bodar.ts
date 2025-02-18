import {Text} from "../template/Text.ts";

export class SetQuantifier extends Text {
    static All = new SetQuantifier('all');
    static Distinct = new SetQuantifier('distinct');

    private constructor(value: string) {
        super(value);
    }
}

export const all = SetQuantifier.All;
export const distinct = SetQuantifier.Distinct;