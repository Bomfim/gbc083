const restify = require('restify');

const port = process.env.PORT || 3000;

const articles = [
    {id: '', description: 'Artigo sobre blockchain', date: new Date()},
    {id: '', description: 'Artigo sobre blockchain', date: new Date()},
]

function respond(req, res, next) {
  res.send('hello ' + req.params.name);
  next();
}

var server = restify.createServer();
server.get('/hello/:name', respond);
server.head('/hello/:name', respond);

server.listen(port, function() {
  console.log('%s listening at %s', server.name, server.url);
});