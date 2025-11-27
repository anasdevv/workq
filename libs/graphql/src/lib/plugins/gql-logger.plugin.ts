import {
  ApolloServerPlugin,
  BaseContext,
  GraphQLRequestContext,
} from '@apollo/server';
import { Logger } from '@nestjs/common';

export class GqlLoggerPlugin implements ApolloServerPlugin {
  private readonly logger = new Logger(GqlLoggerPlugin.name);

  async requestDidStart(requestContext: GraphQLRequestContext<BaseContext>) {
    const { request } = requestContext;
    const startTime = Date.now();
    this.logger.log(
      `GraphQL request started at ${new Date(startTime).toISOString()}`
    );
    this.logger.log({
      headers: request.http?.headers,
      query: request.query,
      variables: request.variables,
    });
    return {
      async willSendResponse(
        requestContext: GraphQLRequestContext<BaseContext>
      ) {
        const duration = Date.now() - startTime;
        this.logger.log(`GraphQL request completed in ${duration}ms`);
        this.logger.log({
          query: request.query,
          statusCode: requestContext.response?.http?.status || 200,
          response: requestContext.response,
        });
      },
    };
  }
}
