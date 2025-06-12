/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { NetworkFirewallService } from '../lib/service/network-firewall-service';

// Mock counter to track consecutive invalid token errors
let invalidTokenErrorCount = 0;

jest.mock('@aws-sdk/client-network-firewall', () => {
  const mockSend = jest.fn();

  class MockNetworkFirewallClient {
    send = mockSend;
  }

  // Reset mockSend implementation before each test
  beforeEach(() => {
    mockSend.mockReset();
    invalidTokenErrorCount = 0;
    
    // Default implementation for send method based on the command type
    mockSend.mockImplementation((command) => {
      
      // Handle UpdateFirewallPolicyCommand for max retry testing
      if (command.constructor.name === 'UpdateFirewallPolicyCommand') {
        if (command.input && command.input.UpdateToken === 'max-retry-test') {
          invalidTokenErrorCount++;
          // Always return invalid token error to test retry limit
          throw { message: 'Update token is invalid.' };
        }
      }

      // Handle DescribeFirewallPolicyCommand when testing max retries
      if (command.constructor.name === 'DescribeFirewallPolicyCommand') {
        if (command.input && command.input.FirewallPolicyName === 'max-retry-test') {
          return Promise.resolve({
            UpdateToken: 'max-retry-test',
            FirewallPolicyResponse: {
              FirewallPolicyName: 'max-retry-test'
            }
          });
        }
      }

      // Handle UpdateRuleGroupCommand for max retry testing
      if (command.constructor.name === 'UpdateRuleGroupCommand') {
        if (command.input && command.input.UpdateToken === 'rule-group-max-retry') {
          invalidTokenErrorCount++;
          // Always return invalid token error to test retry limit
          throw { message: 'Update token is invalid.' };
        }
      }

      // Handle DescribeRuleGroupCommand when testing max retries
      if (command.constructor.name === 'DescribeRuleGroupCommand') {
        if (command.input && command.input.RuleGroupArn === 'rule-group-max-retry') {
          return Promise.resolve({
            UpdateToken: 'rule-group-max-retry',
            RuleGroupResponse: {
              RuleGroupName: 'max-retry-test'
            }
          });
        }
      }

      // Default response for all other cases
      return Promise.resolve({
        $metadata: { requestId: 'test-request-id' }
      });
    });
  });

  return {
    __esModule: true,
    NetworkFirewallClient: MockNetworkFirewallClient,
    // Export all the command classes
    UpdateFirewallPolicyCommand: jest.fn().mockImplementation((params) => ({
      constructor: { name: 'UpdateFirewallPolicyCommand' },
      input: params
    })),
    UpdateRuleGroupCommand: jest.fn().mockImplementation((params) => ({
      constructor: { name: 'UpdateRuleGroupCommand' },
      input: params
    })),
    DescribeFirewallPolicyCommand: jest.fn().mockImplementation((params) => ({
      constructor: { name: 'DescribeFirewallPolicyCommand' },
      input: params
    })),
    DescribeRuleGroupCommand: jest.fn().mockImplementation((params) => ({
      constructor: { name: 'DescribeRuleGroupCommand' },
      input: params
    }))
  };
}, { virtual: true });

describe('NetworkFirewallService retry limits tests', () => {
  test('updateFirewallPolicy should reject after maximum retry attempts', async () => {
    const service = new NetworkFirewallService();
    
    await expect(
      service.updateFirewallPolicy({
        UpdateToken: 'max-retry-test',
        FirewallPolicyArn: 'arn:aws:network-firewall:us-east-1:123456789012:firewall-policy/max-retry-test',
        FirewallPolicyName: 'max-retry-test',
        FirewallPolicy: {
          StatelessDefaultActions: ['aws:drop'],
          StatelessFragmentDefaultActions: ['aws:drop']
        }
      })
    ).rejects.toThrow('Maximum token retry attempts exceeded for firewall policy update');
    
    // Verify we attempted the maximum number of retries (5) before rejecting
    expect(invalidTokenErrorCount).toBe(5);
  });
  
  test('updateRuleGroup should reject after maximum retry attempts', async () => {
    const service = new NetworkFirewallService();
    
    await expect(
      service.updateRuleGroup({
        UpdateToken: 'rule-group-max-retry',
        RuleGroupArn: 'rule-group-max-retry',
        RuleGroupName: 'max-retry-test',
        RuleGroup: {
          RulesSource: {
            StatelessRulesAndCustomActions: {
              StatelessRules: []
            }
          }
        },
        Type: 'STATELESS'
      })
    ).rejects.toThrow('Maximum token retry attempts exceeded for rule group update');
    
    // Verify we attempted the maximum number of retries (5) before rejecting
    expect(invalidTokenErrorCount).toBe(5);
  });
});
