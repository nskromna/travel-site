exports.handler = (event, contex, callback) => {
    callback(null, {
        statusCode: 200,
        body: 'Welcome to the super secret area'
    });
};