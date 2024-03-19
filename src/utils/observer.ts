export class Observer<
  Key = any,
  // eslint-disable-next-line @typescript-eslint/ban-types
  Subscriber extends Function = (...args: any[]) => void,
> {
  protected subjects: Map<Key, Subscriber[]> = new Map();

  subscribe(key: Key, callback: Subscriber) {
    const subscribers = this.subjects.get(key) || [];
    subscribers.push(callback);
    this.subjects.set(key, subscribers);
    return () => {
      this.unsubscribe(key, callback);
    };
  }

  unsubscribe(key: Key, callback: Subscriber) {
    let subscribers = this.subjects.get(key) || [];
    subscribers = subscribers.filter((fn) => fn !== callback);
    this.subjects.set(key, subscribers);
  }

  notify(key: Key, ...args: any[]) {
    const subscribers = this.subjects.get(key) || [];
    for (let i = 0; i < subscribers.length; i++) {
      const callback = subscribers[i];
      callback(...args);
    }
  }
}
