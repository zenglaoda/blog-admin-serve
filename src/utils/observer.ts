type Key = string | symbol;
type Subscriber = (...args: any[]) => Promise<any>;

export class Observer {
  private builtInKey: string | symbol = Symbol('built-in Key');
  private subjects: Map<Key, Subscriber[]> = new Map();

  constructor(defKey: string | symbol) {
    this.builtInKey = defKey;
  }

  subscribe(callback: Subscriber, eventName: Key) {
    const key = eventName || this.builtInKey;
    const subscribers = this.subjects.get(key) || [];
    subscribers.push(callback);
    this.subjects.set(key, subscribers);
  }

  /**
   * @description 取消订阅
   * @param {function} callback
   * @param {string} [eventName]
   */
  unsubscribe(callback, eventName) {
    const key = eventName || this.builtInKey;
    const subscribers = (this.subscribers[key] = this.subscribers[key] || []);

    subscribers.filter((ele) => ele !== callback);
  }

  /**
   * @description 通知某种类型的事件
   * @param {any} data
   * @param {string} [eventName]
   */
  notify(data, eventName) {
    const key = eventName || this.builtInKey;
    const subscribers = (this.subscribers[key] = this.subscribers[key] || []);

    for (let i = 0; i < subscribers.length; i++) {
      const callback = subscribers[i];
      callback(data);
    }
  }
}
