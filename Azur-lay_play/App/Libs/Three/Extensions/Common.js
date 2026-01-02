import * as THREE from "three";

Object.assign(THREE.EventDispatcher.prototype, {
  on: function (type, callback, context, priority = 100) {
    if (!this.__enhancedListeners) this.__enhancedListeners = {};
    const listeners =
      this.__enhancedListeners[type] || (this.__enhancedListeners[type] = []);
    listeners.push({ callback, context, priority });
    listeners.sort((a, b) => a.priority - b.priority);
  },
  off: function (type, callback, context) {
    if (!this.__enhancedListeners || !this.__enhancedListeners[type]) return;

    const listeners = this.__enhancedListeners[type];
    for (let i = listeners.length - 1; i >= 0; i--) {
      const listener = listeners[i];
      if (listener.callback === callback && listener.context === context) {
        listeners.splice(i, 1);
        break;
      }
    }
  },
  emit: function (type, ...args) {
    if (!this.__enhancedListeners || !this.__enhancedListeners[type]) return;

    const listeners = this.__enhancedListeners[type].slice();
    for (const listener of listeners) {
      listener.callback.apply(listener.context, args);
    }
  },
});

Object.assign(THREE.Color.prototype, {
  toGLSLString() {
    return (
      "vec3(" +
      Math.toGLSLFloatString(this.r) +
      ", " +
      Math.toGLSLFloatString(this.g) +
      ", " +
      Math.toGLSLFloatString(this.b) +
      ")"
    );
  },
});
