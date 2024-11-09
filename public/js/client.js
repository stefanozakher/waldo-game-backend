const socket = io();

socket.on('connect', () => {
    console.log('Connected to server');
});
socket.on('disconnect', () => {
    console.log('Disconnected from server');
});

// Register the helpers needed for the template
Handlebars.registerHelper('eq', function(a, b) {
    return a === b;
});
Handlebars.registerHelper('or', function() {
    return Array.prototype.slice.call(arguments, 0, -1).some(Boolean);
});
Handlebars.registerHelper('default', function(value, defaultValue) {
    return value || defaultValue;
});