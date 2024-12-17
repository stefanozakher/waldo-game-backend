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

                    console.log('---> Setting', property, 'to', value, 'from', target[property]);
                    self.notifyObservers(property, value, target[property]);

                    return Reflect.set(...arguments);;
                }
            });

            // Initialize observers
            this.observers = new Map();
        }
        
        subscribe(property, callback) {
            if (!this.observers.has(property)) {
                this.observers.set(property, new Set());
            }
            this.observers.get(property).add(callback);

            console.log('Subscribed to', property, 'with callback', callback);

            // Return unsubscribe function
            return () => {
                this.observers.get(property).delete(callback);
            };
        }

        notifyObservers(property, newValue, oldValue) {
            if (this.observers.has(property)) {
                this.observers.get(property).forEach(callback => {
                    callback(newValue, oldValue);
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
