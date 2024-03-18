// eslint-disable-next-line @typescript-eslint/ban-types
export class Observer<Key = any, Subscriber extends Function = () => void> {
  protected builtInKey: Key = {};
  protected subjects: Map<Key, Subscriber[]> = new Map();

  constructor(defaultKey?: Key) {
    if (defaultKey !== undefined) {
      this.builtInKey = defaultKey;
    }
  }

  subscribe(callback: Subscriber, eventName?: Key) {
    const key = eventName || this.builtInKey;
    const subscribers = this.subjects.get(key) || [];
    subscribers.push(callback);
    this.subjects.set(key, subscribers);
    return () => {
      this.unsubscribe(callback, key);
    };
  }

  unsubscribe(callback: Subscriber, eventName?: Key) {
    const key = eventName || this.builtInKey;
    let subscribers = this.subjects.get(key) || [];
    subscribers = subscribers.filter((fn) => fn !== callback);
    this.subjects.set(key, subscribers);
  }

  // notify(eventName: Key, ...args: any[]) {
  //   if (eventName === null || eventName === undefined) {

  //   } else {

  //   }
  //   const key = eventName || this.builtInKey;
  //   const subscribers = this.subjects.get(key) || [];

  //   for (let i = 0; i < subscribers.length; i++) {
  //     const callback = subscribers[i];
  //     callback(...args);
  //   }
  // }
}
