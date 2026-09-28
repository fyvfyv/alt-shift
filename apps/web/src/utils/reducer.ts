export type EventOf<Events, K extends keyof Events = keyof Events> = {
  [P in K]: { type: P } & Events[P];
}[K];

export type Transitions<State, Events> = {
  [K in keyof Events]: (state: State, event: EventOf<Events, K>) => State;
};

// A reducer written as one small transition per event type instead of a switch.
export function createReducer<State, Events>(transitions: Transitions<State, Events>) {
  return <K extends keyof Events>(state: State, event: EventOf<Events, K>): State =>
    transitions[event.type](state, event);
}
