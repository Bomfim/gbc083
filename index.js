const restify = require('restify')
const errors = require('restify-errors')
const controllerArticles = require('./articles.controller')
const controllerCrypto = require('./crypto.controller')
const uuidv4 = require('uuid/v4')
const corsMiddleware = require('restify-cors-middleware');


const port = process.env.PORT || 3000;

let isEncrypted = false;
let isHealthy = false;
let isAuthenticated = false;
let clientPublicKey = "";

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

  if (!req.body) {
    return next(new errors.BadRequestError());
  }
  clientPublicKey = req.body;
  controllerCrypto.generateRSAPairKeys();
  isEncrypted = true;
  res.send(200, {
    public_key: controllerCrypto.getPublicKey(),
    secret: controllerCrypto.encryptRSA(req.body)
  });
  return next();
});

server.post('/api/signout', (req, res, next) => {
  isEncrypted = false;
  res.send(200);
  return next();
});

server.get('/', (req, res, next) => {
  res.send(200, "API up and running...");
  return next();
});

server.get('/api/articles', (req, res, next) => {
  if (isEncrypted) {
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
    let article;
    if (isEncrypted) {
      article = controllerCrypto.encryptAES(controllerArticles.getById(req.params.id));
    } else {
      article = controllerArticles.getById(req.params.id);
    }
    res.send(200, article);
    return next();
  } catch (error) {
    return next(new errors.NotFoundError(error));
  }
});

server.post('/api/articles', (req, res, next) => {
  if (!req.body) {
    return next(new errors.BadRequestError());
  }

  // Está cifrado?
  if (isEncrypted) {
    const decrypted = controllerCrypto.decryptAES(req.body);

    if (controllerCrypto.verifyIntegrity({ // Está íntegro?
        name: decrypted.name,
        description: decrypted.description,
        author: decrypted.author
      }) == decrypted.checksum.toLowerCase()) {

      isHealthy = true;

      if (controllerCrypto.decryptRSA(decrypted.signature, clientPublicKey) == decrypted.checksum) { //Está autenticado?
        isAuthenticated = true;
      } else {
        isAuthenticated = false;
      }
      controllerArticles.create(uuidv4(), decrypted.name, decrypted.description, decrypted.author, decrypted.checksum, decrypted.signature);
      res.send(201, {
        healthy: isHealthy,
        authenticated: isAuthenticated
      });

    } else {
      isHealthy = false;
      res.send(500);
    }
  } else {
    controllerArticles.create(uuidv4(), req.body.name, req.body.description, req.body.author, req.body.checksum, req.body.signature);
    res.send(201, {
      healthy: isHealthy,
      authenticated: isAuthenticated
    });
  }
  return next();
});

server.put('/api/articles/:id', (req, res, next) => {
  if (!req.params.id || !req.body) {
    return next(new errors.BadRequestError());
  }
  try {
    let article;
    if (isEncrypted) {
      const decrypted = controllerCrypto.decryptAES(req.body);
      article = controllerArticles.update(req.params.id, decrypted.name, decrypted.description, decrypted.author, decrypted.checksum, decrypted.signature);
    } else {
      article = controllerArticles.update(req.params.id, req.body.name, req.body.description, req.body.author, req.body.checksum, req.body.signature);
    }
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