export interface EventType {
  type: string,
  payload: any,
  ts: number,
}

export interface MessageType {
  author: string,
  content: EventType,
}
