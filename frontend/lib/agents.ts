export enum AgentsEnum {
  OpenInterpreter = 'OPEN_INTERPRETER'
}
export const Agents = {
  [AgentsEnum.OpenInterpreter]: 'Operator'
}

export enum ModelsEnum {
  GPT4 = 'GPT-4'
}
export const Models = {
  [ModelsEnum.GPT4]: 'GPT-4o'
}

export function getInitials(text: string): string {
  return (text.match(/[A-Z]/g) || []).join('')
}
