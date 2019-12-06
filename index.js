const restify = require('restify');
const errors = require('restify-errors');
const controller = require('./articles.controller');
const uuidv4 = require('uuid/v4');


const port = process.env.PORT || 3000;

var server = restify.createServer({
  name: 'gbc083'
});

server.use(restify.plugins.bodyParser());

server.pre((req, res, next) => {
  console.info(`${req.method} - ${req.url}`);
  return next();
});

server.get('/api/articles', (req, res, next) => {
  res.send(200, controller.getAll());
  return next();
});

server.get('/api/articles/:id', (req, res, next) => {
  if (!req.params.id) {
    return next(new errors.BadRequestError());
  }
  try {
    const article = controller.getById(req.params.id);
    res.send(200, article);
    return next();
  } catch (error) {
    return next(new errors.NotFoundError(error));
  }
});

server.post('/api/articles', (req, res, next) => {
  if (!req.body || !req.body.name || !req.body.description || !req.body.author) {
    return next(new errors.BadRequestError());
  }
  controller.create(uuidv4(), req.body.name, req.body.description, req.body.author);
  res.send(201);
  return next();
});

server.put('/api/articles/:id', (req, res, next) => {
  if (!req.params.id || !req.body || !req.body.name || !req.body.description || !req.body.author) {
    return next(new errors.BadRequestError());
  }
  try {
    const article = controller.update(req.params.id, req.body.name, req.body.description, req.body.author);
    res.send(200, article);
    return next();
  } catch (error) {
    return next(new errors.NotFoundError(error));
  }
});

server.del('/api/articles/:id', (req, res, next) => {
  if (!req.params.id) {
    return next(new errors.BadRequestError());
  }
  try {
    controller.del(req.params.id);
    res.send(204);
    return next();
  } catch (error) {
    return next(new errors.NotFoundError(error));
  }
});

server.listen(port, function () {
  console.info(`api is running on port ${port}`);
});