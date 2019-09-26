import CommandTypes from './'

export interface Response {
    originalCommand: keyof CommandTypes;
    ok: boolean;
}
