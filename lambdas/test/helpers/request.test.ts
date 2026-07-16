import { describe, it, expect, vi, beforeEach } from "vitest";
import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { getRequestBody, RequestBodyData } from "../../helpers/request";

describe("getRequestBody helper", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns an empty object if the event has no body property", () => {
    const event = {} as APIGatewayProxyEventV2;

    const result = getRequestBody(event);

    expect(result).toEqual({});
  });

  it("returns an empty object if the event body is null", () => {
    const event = {
      body: null,
    } as unknown as APIGatewayProxyEventV2;

    const result = getRequestBody(event);

    expect(result).toEqual({});
  });

  it("successfully parses and returns the payload when the body is a valid JSON string", () => {
    const data: RequestBodyData = {
      id: "entity-123",
      action: "create",
      comments: "Initial submission",
    };

    const event = {
      body: JSON.stringify(data),
    } as unknown as APIGatewayProxyEventV2;

    const result = getRequestBody(event);

    expect(result).toEqual(data);
  });

  it("returns an empty object if JSON parsing fails on a malformed body string", () => {
    const event = {
      body: "{invalid-json:",
    } as unknown as APIGatewayProxyEventV2;

    const result = getRequestBody(event);

    expect(result).toEqual({});
  });

  it("returns the body as-is if it is already parsed as an object", () => {
    const data: RequestBodyData = {
      name: "Test Community",
      scope: "global",
    };

    const event = {
      body: data,
    } as unknown as APIGatewayProxyEventV2;

    const result = getRequestBody(event);

    expect(result).toBe(data);
  });
});