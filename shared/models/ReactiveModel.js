// Check if ReactiveModel already exists in global scope
if (typeof window !== 'undefined' && window.ReactiveModel) {
    // If it exists, use the existing one
    module.exports = window.ReactiveModel;
} else {
    // If it doesn't exist, define it
    class ReactiveModel {
        constructor(initialState = {}) {
            this._state = initialState;
            
            const self = this;
            
            // Create proxy for reactive state
            this.state = new Proxy(this._state, {
                set(target, property, value) {
                    if (target[property] === value)
                        return Reflect.set(...arguments);

                    self.notifyObservers(property, value, target[property]);
                    self.notifyObservers('*', value, target[property]); // Notify wildcard observers

                    return Reflect.set(...arguments);
                }
            });

            // Initialize observers
            this.observers = new Map();
        }
        
        subscribe(properties, callback) {
            if (!Array.isArray(properties)) {
            properties = [properties];
            }

            properties.forEach(property => {
            if (!this.observers.has(property)) {
                this.observers.set(property, new Set());
            }
            this.observers.get(property).add(callback);
            });

            // Return unsubscribe function
            return () => {
            properties.forEach(property => {
                this.observers.get(property).delete(callback);
            });
            };
        }

        notifyObservers(property, newValue, oldValue) {
            if (this.observers.has(property)) {
                this.observers.get(property).forEach(callback => {
                    if (callback.length === 1) {
                        callback(newValue);
                    } else if (callback.length === 2) {
                        callback(newValue, oldValue);
                    } else {
                        callback(property, newValue, oldValue);
                    }
                });
            }
        }

        // Method to get the current state
        toJSON() {
            return { ...this.state };
        }
    }

    // Make it available to both Node.js and browser
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ReactiveModel;
    } else if (typeof window !== 'undefined') {
        window.ReactiveModel = ReactiveModel;
    }
}
