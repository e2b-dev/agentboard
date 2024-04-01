'use client'

import { createContext, useContext, useMemo, useState } from 'react'
import { Agents, AgentsEnum, Models, ModelsEnum } from '@/lib/agents'

type AgentContextType = {
  agent: keyof typeof Agents
  model: keyof typeof Models
  setAgent: (agent: keyof typeof Agents) => void
  setModel: (model: keyof typeof Models) => void
}

export const AgentContext = createContext<AgentContextType>({
  agent: AgentsEnum.OpenInterpreter,
  model: ModelsEnum.GPT3,
  setAgent: () => {},
  setModel: () => {}
})

export const AgentContextProvider = (props: { children: React.ReactNode }) => {
  const [agent, setAgent] = useState<AgentsEnum>(AgentsEnum.OpenInterpreter)
  const [model, setModel] = useState(ModelsEnum.GPT3)

  const value: AgentContextType = useMemo(() => {
    return {
      agent,
      model,
      setAgent,
      setModel
    }
  }, [setModel, setAgent, agent, model])

  return <AgentContext.Provider value={value} {...props} />
}

export const useAgent = (): AgentContextType => {
  const context = useContext(AgentContext)
  if (context === undefined)
    throw new Error('useAgent must be used within a AgentContextProvider.')
  return context
}
