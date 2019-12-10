const restify = require('restify')
const errors = require('restify-errors')
const controllerArticles = require('./articles.controller')
const controllerCrypto = require('./crypto.controller')
const uuidv4 = require('uuid/v4')
const corsMiddleware = require('restify-cors-middleware');

const port = process.env.PORT || 3000;

let isSigned = false;

var server = restify.createServer({
  name: 'gbc083'
});

const cors = corsMiddleware({
  origins: ['*'],
  allowHeaders: ['X-App-Version'],
  exposeHeaders: []
});

server.use(restify.plugins.bodyParser());

server.pre(cors.preflight);
server.use(cors.actual);

server.pre((req, res, next) => {
  console.info(`${req.method} - ${req.url}`);
  return next();
});

server.post('/api/signin', (req, res, next) => {
  controllerCrypto.generateRSAPairKeys();

  if (!req.body) {
    return next(new errors.BadRequestError());
  }
  res.send(200, {
    public_key: controllerCrypto.getPublicKey(),
    secret: controllerCrypto.encryptRSA(req.body)
  });
  this.isSigned = true;
  return next();
});

server.get('/', (req, res, next) => {
  res.send(200, "API up and running...");
  return next();
});

server.get('/api/articles', (req, res, next) => {
  if (this.isSigned) {
    res.send(200, controllerCrypto.encryptAES(controllerArticles.getAll()));
  } else {
    res.send(200, controllerArticles.getAll());
  }
  return next();
});

server.get('/api/articles/:id', (req, res, next) => {
  if (!req.params.id) {
    return next(new errors.BadRequestError());
  }
  try {
    const article = controllerArticles.getById(req.params.id);
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
  controllerArticles.create(uuidv4(), req.body.name, req.body.description, req.body.author);
  res.send(201);
  return next();
});

server.put('/api/articles/:id', (req, res, next) => {
  if (!req.params.id || !req.body || !req.body.name || !req.body.description || !req.body.author) {
    return next(new errors.BadRequestError());
  }
  try {
    const article = controllerArticles.update(req.params.id, req.body.name, req.body.description, req.body.author);
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
    controllerArticles.del(req.params.id);
    res.send(204);
    return next();
  } catch (error) {
    return next(new errors.NotFoundError(error));
  }
});

server.listen(port, function () {
  console.info(`api is running on port ${port}`);
});