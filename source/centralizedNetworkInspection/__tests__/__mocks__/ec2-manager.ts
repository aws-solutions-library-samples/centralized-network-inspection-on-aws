/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

// Mock for Ec2Manager
const mockEc2Manager = jest.fn();
const mockRouteTableOperations = jest.fn();
const mockUpdateTransitGatewayAttachementApplianceMode = jest.fn();

// Setup default implementations
mockEc2Manager.mockImplementation(() => ({
  routeTableOperations: mockRouteTableOperations
}));

// Export the mock
export const Ec2Manager = mockEc2Manager;
export const updateTransitGatewayAttachementApplianceMode = mockUpdateTransitGatewayAttachementApplianceMode;

// Define utilities for tests
export const __mocks = {
  mockEc2Manager,
  mockRouteTableOperations,
  mockUpdateTransitGatewayAttachementApplianceMode,
  reset: () => {
    mockEc2Manager.mockClear();
    mockRouteTableOperations.mockClear();
    mockUpdateTransitGatewayAttachementApplianceMode.mockClear();
  }
};
