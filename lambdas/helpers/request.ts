import { APIGatewayProxyEventV2 } from "aws-lambda";

export interface RequestBodyData {
  id?: string;
  action?: string;
  comments?: string;
  name?: string;
  description?: string;
  owner?: string;
  communityLink?: string;
  cellIds?: string[];
}

// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
export function getRequestBody(event: APIGatewayProxyEventV2): RequestBodyData {
  if ("body" in event && event.body != null) {
    if (typeof event.body === "string") {
      try {
        return JSON.parse(event.body) as RequestBodyData;
      } catch {
        return {};
      }
    }
    return event.body as RequestBodyData;
  }
  return {};
}
