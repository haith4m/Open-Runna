declare module "fastify-plugin" {
  import type { FastifyPluginAsync, FastifyPluginCallback } from "fastify";
  function fp<Options>(
    plugin: FastifyPluginAsync<Options> | FastifyPluginCallback<Options>,
    options?: { name?: string; fastify?: string; dependencies?: string[] }
  ): FastifyPluginAsync<Options> & FastifyPluginCallback<Options>;
  export = fp;
}
