import {
  ApolloServerPlugin,
  BaseContext,
  GraphQLRequestContext,
} from '@apollo/server';
import { Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
export class GqlLoggerPlugin implements ApolloServerPlugin {
  private readonly logger = new Logger(GqlLoggerPlugin.name);

  async requestDidStart(requestContext: GraphQLRequestContext<BaseContext>) {
    const { request } = requestContext;
    const startTime = Date.now();
    const requestId = uuidv4();
    this.logger.log(
      `GraphQL request started at ${new Date(startTime).toISOString()}`
    );
    this.logger.log({
      headers: request.http?.headers,
      query: request.query,
      variables: request.variables,
      requestId,
    });
    return {
      async willSendResponse(
        requestContext: GraphQLRequestContext<BaseContext>
      ) {
        const duration = Date.now() - startTime;
        this.logger.log({
          requestId,
          duration,
          query: request.query,
          statusCode: requestContext.response?.http?.status || 200,
          response: requestContext.response,
        });
      },
    };
  }
}
