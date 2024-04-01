export const OPEN_INTERPRETER = 'OPEN_INTERPRETER'


export enum AgentsEnum {
    OpenInterpreter= 'OPEN_INTERPRETER',

}
export const Agents = {
    [AgentsEnum.OpenInterpreter]: 'Open Interpreter'
}

export enum ModelsEnum {
    GPT3= 'GPT-3.5',
    GPT4= 'GPT-4',
}
export const Models = {
    [ModelsEnum.GPT3]: 'GPT-3.5',
    [ModelsEnum.GPT4]: 'GPT-4',
}

export function getInitials(text: string): string {
    return (text.match(/[A-Z]/g) || []).join('')
}

