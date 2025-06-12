/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

// Mock for NetworkFirewallManager
const mockNetworkFirewallManager = jest.fn();
const mockFirewallOperations = jest.fn();
const mockArgs: any[] = [];

// Setup default implementations
mockNetworkFirewallManager.mockImplementation((...args) => {
  mockArgs.push(args[0]);
  return {
    firewallOperations: mockFirewallOperations
  };
});

// Export the mock
export const NetworkFirewallManager = mockNetworkFirewallManager;

// Type definition for environment properties
export interface EnvironmentProps {
  vpcId: string;
  subnets?: string[];
  logType?: string;
  logDestination?: string;
  logDestinationType?: string;
  logRetentionInDays?: number;
  stackId?: string;
}

// Define utilities for tests
export const __mocks = {
  mockNetworkFirewallManager,
  mockFirewallOperations,
  mockArgs,
  reset: () => {
    mockNetworkFirewallManager.mockClear();
    mockFirewallOperations.mockClear();
    mockArgs.length = 0;
  },
  __setMocks: (mocks: { NetworkFirewallManager?: any }) => {
    if (mocks.NetworkFirewallManager) {
      NetworkFirewallManager.mockImplementation(mocks.NetworkFirewallManager);
    }
  }
};
