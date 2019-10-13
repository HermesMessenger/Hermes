import { Commands } from './'

export interface Response {
    originalCommand: keyof Commands | null;
    error: string | null;
}
