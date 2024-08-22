import { parseUrlParams } from "./utils/response";

export class Router {
  req;
  res;
  moduleName;
  handlerClassName;
  handlerClass;
  handlerMethod;
  handlerInstance;
  module;
  method;
  routes;
  defaults = {
    moduleName: "home",
    db: null,
  };
  defaultCodes = {
    OK: { statusCode: 200 },
    BAD_REQUEST: { statusCode: 400, data: { message: "Bad Request" } },
    UNAUTHORIZED: { statusCode: 401 },
    NOT_FOUND: { statusCode: 404, data: { message: "Not found" } },
    SERVER_ERROR: { statusCode: 500 },
  };
  urlParams;
  middleware = [];
  authMethod;
  authList = [];
  headers = { "Content-Type": "application/json" };

  constructor(req, res, config?) {
    this.res = res;
    this.req = req;
    this.override(config);
  }

  async override(config) {
    for (let i in config) {
      this[i] = config[i];
    }
  }

  async log(...messageN) {
    console.log(`[${this.handlerClassName}.${this.method}]`, ...messageN);
  }

  async parseUrl() {
    console.log("[Router.parseUrl]", this.req.method, this.req.url);
    let urlParts = this.req.url.split("/");
    this.moduleName = urlParts[1] || this.defaults.moduleName;
    this.method = this.req.method.toLowerCase();
    this.urlParams = parseUrlParams(`/${this.moduleName}/:id`, this.req.url);
  }

  async import() {
    if (!this.routes) {
      console.log("[Router.import] routes path", this.routes);
      return;
    }
    let path = this.routes + "/" + this.moduleName;
    try {
      this.module = await import(path);
      console.log("[Router.import]", path);
      return this.module;
    } catch (e) {
      console.log("[Router.import]", path, e);
    }
    return false;
  }

  async initClass() {
    if (!Object.keys(this.module).length) {
      console.log("[Router] 404 Imported empty", this.module);
      return false;
    }

    this.handlerClassName = Object.keys(this.module)[0];

    console.log("[Router.initClass]", this.handlerClassName);

    this.handlerClass = this.module[this.handlerClassName];

    if (!this.handlerClass) {
      console.log("[Router.initClass] 404", this.module);
      return false;
    }

    this.handlerInstance = new this.handlerClass();

    return this.handlerClassName;
  }

  async initMethod() {
    try {
      let keys = Object.keys(this.handlerInstance);
      console.log("[Router.handler]", this.handlerClassName, keys);

      this.handlerMethod = this.handlerInstance[this.method];

      if (!this.handlerMethod) {
        console.log(
          "[Router.handler] 404",
          `${this.handlerClassName}.${this.method}`
        );
        return false;
      }

      return this.handlerMethod;
    } catch (e) {
      console.log("[Router.handler]", e);
      return false;
    }
  }

  async execHandler() {
    let response;

    if (!this.handlerMethod) {
      return this.response(this.defaultCodes.NOT_FOUND);
    }

    try {
      this.log("Start");
      response = await this.handlerInstance[this.method](this);
      this.log("End");
    } catch (e) {
      response = this.defaultCodes.SERVER_ERROR;
      console.log(e);
    }

    if (!response) {
      response = this.defaultCodes.OK;
    }
    return this.response(response);
  }

  async execMiddleware() {
    // console.log("[Router.execMiddleware]");

    this.req.body = await this.body();

    for (let i in this.middleware) {
      let fn = this.middleware[i];
      console.log("[Router.execMiddleware start] ", fn);
      let shouldContinue = fn(this);
      console.log("[Router.execMiddleware end] ", fn);
      if (!shouldContinue) {
        return false;
      }
    }

    return true;
  }

  async route() {
    await this.parseUrl();

    /**
     *  * for url of /contacts import ./routes/contacts
     *  * for module find first export which should be the class we want
     *  * export class Contacts
     *  * within the class find the method that matches the HTTP method
     *  * Contacts.get for GET /contacts
     *  * If any of these things fails return 404
     *  * config auth middleware separately so we can choose which endpoints
     *  * need validation
     */

    let module = await this.import();
    if (!module) {
      return this.response(this.defaultCodes.NOT_FOUND);
    }

    let className = await this.initClass();
    if (!className) {
      return this.response(this.defaultCodes.NOT_FOUND);
    }

    let handler = await this.initMethod();
    if (!handler) {
      return this.response(this.defaultCodes.NOT_FOUND);
    }

    let doExec = await this.execMiddleware();
    if (!doExec) {
      return this.response(this.defaultCodes.NOT_FOUND);
    }

    await this.execHandler();
  }

  async body() {
    return new Promise((resolve) => {
      const chunks = [];
      let body;
      this.req
        .on("data", (chunk) => {
          chunks.push(chunk);
        })
        .on("end", () => {
          body = Buffer.concat(chunks).toString();
          resolve(body);
        });
    });
  }

  response(config) {
    this.res.writeHead(config.statusCode, {
      ...this.headers,
      ...config.headers,
    });
    this.res.write(JSON.stringify(config.data || config));
    this.res.end();
  }
}
