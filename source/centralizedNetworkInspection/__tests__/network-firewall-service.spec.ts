/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { NetworkFirewallService } from '../lib/service/network-firewall-service';

jest.mock('@aws-sdk/client-network-firewall', () => {
  const mockSend = jest.fn();

  class MockNetworkFirewallClient {
    send = mockSend;
  }

  // Reset mockSend implementation before each test
  beforeEach(() => {
    mockSend.mockReset();
    
    // Default implementation for send method based on the command type
    mockSend.mockImplementation((command) => {
      if (command.constructor.name === 'DescribeRuleGroupCommand') {
        if (command.input.RuleGroupName === 'ThrottlingException') {
          throw { name: 'ThrottlingException' };
        }
        if (command.input.RuleGroupName === 'ResourceNotFoundException') {
          throw { name: 'ResourceNotFoundException' };
        }
        if (command.input.RuleGroupName === 'Error') {
          return Promise.reject({ message: 'Error' });
        }
        
        // Return mock data for normal operation
        return Promise.resolve({
          RuleGroup: {
            RuleVariables: {
              IPSets: [
                {
                  foo: {
                    Definition: [''],
                    Reference: 'AWS_ARN'
                  }
                }
              ],
              PortSets: [
                {
                  foo: {
                    Definition: ['']
                  }
                }
              ]
            },
            RulesSource: {
              RulesString: '',
              RulesSourceList: [
                {
                  Targets: [''],
                  TargetType: [''],
                  GeneratedRulesType: ''
                }
              ],
              StatefulRules: [
                {
                  Action: '',
                  Header: {
                    Protocol: '',
                    Source: '',
                    SourcePort: '',
                    Direction: '',
                    Destination: '',
                    DestinationPort: ''
                  },
                  RuleOptions: [
                    {
                      Keyword: '',
                      Settings: ['']
                    }
                  ]
                }
              ],
              StatelessRulesAndCustomActions: {
                StatelessRules: [
                  {
                    RuleDefinition: {
                      MatchAttributes: {
                        Sources: [''],
                        Destinations: [''],
                        SourcePorts: [
                          {
                            FromPort: 0,
                            ToPort: 999
                          }
                        ],
                        DestinationPorts: [
                          {
                            FromPort: 0,
                            ToPort: 999
                          }
                        ],
                        Protocols: [0, 1, 2, 3],
                        TCPFlags: [
                          {
                            Flags: [''],
                            Masks: ['']
                          }
                        ]
                      },
                      Actions: ['']
                    },
                    Priority: 9999
                  }
                ],
                CustomAction: {
                  PublishMetrics: {
                    Dimensions: [
                      {
                        Value: ''
                      }
                    ]
                  }
                }
              }
            }
          },
          RuleGroupResponse: {
            RuleGroupArn: '',
            RuleGroupName: '',
            RuleGroupId: '',
            Description: '',
            Type: '',
            Capacity: 9999,
            RuleGroupStatus: 'ACTIVE|DELETING|string',
            Tags: [
              {
                Key: '',
                Value: ''
              }
            ]
          },
          UpdateToken: 'aaa',
          $metadata: { requestId: 'test-request-id' }
        });
      }

      if (command.constructor.name === 'DescribeFirewallPolicyCommand') {
        return Promise.resolve({
          UpdateToken: 'aaaa',
          FirewallPolicyResponse: {
            FirewallPolicyName: 'test-firewall-policy',
            FirewallPolicyArn: '',
            FirewallPolicyId: '',
            Description: '',
            FirewallPolicyStatus: 'ACTIVE',
            Tags: [
              {
                Key: '',
                Value: ''
              }
            ]
          },
          FirewallPolicy: {
            StatelessRuleGroupReferences: [
              {
                ResourceArn: 'arn:aws:network-firewall:us-east-1:1234:stateless-rulegroup/StatelessExample2',
                Priority: 999
              }
            ],
            StatelessDefaultActions: [''],
            StatelessFragmentDefaultActions: [''],
            StatelessCustomActions: [
              {
                ActionName: '',
                CustomAction: {
                  PublishMetrics: {
                    Dimensions: [
                      {
                        Value: ''
                      }
                    ]
                  }
                }
              }
            ],
            StatefulRuleGroupReferences: [
              {
                ResourceArn: ''
              }
            ]
          },
          $metadata: { requestId: 'test-request-id' }
        });
      }

      if (command.constructor.name === 'UpdateRuleGroupCommand') {
        if (command.input.UpdateToken === 'invalid token') {
          throw { message: 'Update token is invalid.' };
        }
        if (command.input.UpdateToken === 'error') {
          return Promise.reject(new Error('Error updating rule group'));
        }

        return Promise.resolve({
          UpdateToken: '',
          RuleGroupResponse: {
            RuleGroupArn: '',
            RuleGroupName: '',
            RuleGroupId: '',
            Description: '',
            Type: 'STATEFUL',
            Capacity: 999,
            RuleGroupStatus: 'ACTIVE',
            Tags: [
              {
                Key: '',
                Value: ''
              }
            ]
          },
          $metadata: { requestId: 'test-request-id' }
        });
      }

      if (command.constructor.name === 'UpdateFirewallPolicyCommand') {
        if (command.input && command.input.UpdateToken === 'test invalid token scenario') {
          throw { message: 'Update token is invalid.' };
        }
        if (command.input && command.input.UpdateToken === 'error') {
          throw { message: 'error' };
        }

        return Promise.resolve({
          UpdateToken: 'aaa',
          FirewallPolicyResponse: {
            FirewallPolicyName: '',
            FirewallPolicyArn: '',
            FirewallPolicyId: '',
            Description: '',
            FirewallPolicyStatus: 'ACTIVE',
            Tags: [
              {
                Key: '',
                Value: ''
              }
            ]
          },
          $metadata: { requestId: 'test-request-id' }
        });
      }

      if (command.constructor.name === 'CreateFirewallCommand') {
        if (command.input.Description === 'Error') {
          throw { name: 'ResourceNotFoundException' };
        }
        return Promise.resolve({
          $metadata: { requestId: 'test-request-id' }
        });
      }

      if (command.constructor.name === 'CreateFirewallPolicyCommand' || command.constructor.name === 'CreateRuleGroupCommand') {
        return Promise.resolve({
          $metadata: { requestId: 'test-request-id' }
        });
      }

      if (command.constructor.name === 'DescribeFirewallCommand') {
        if (command.input.FirewallName === 'error') {
          throw { name: 'ResourceNotFoundException' };
        }
        return Promise.resolve({
          $metadata: { requestId: 'test-request-id' }
        });
      }

      if (command.constructor.name === 'DescribeLoggingConfigurationCommand') {
        return Promise.resolve({
          LoggingConfiguration: {
            LogDestinationConfigs: [
              {
                LogType: 'ALERT',
                LogDestinationType: 'CloudWatchLogs',
                LogDestination: {
                  logGroup: 'centralized-network-inspection-solution',
                  prefix: 'alerts'
                }
              }
            ]
          },
          $metadata: { requestId: 'test-request-id' }
        });
      }

      if (command.constructor.name === 'UpdateLoggingConfigurationCommand') {
        if (!command.input.LoggingConfiguration || !command.input.LoggingConfiguration.LogDestinationConfigs || 
            command.input.LoggingConfiguration.LogDestinationConfigs.length === 0) {
          return Promise.resolve({
            LoggingConfiguration: {
              LogDestinationConfigs: []
            },
            $metadata: { requestId: 'test-request-id' }
          });
        }
        
        if (command.input.LoggingConfiguration.LogDestinationConfigs[0].LogDestinationType === 'CloudWatchLogs') {
          return Promise.resolve({
            LoggingConfiguration: {
              LogDestinationConfigs: []
            },
            $metadata: { requestId: 'test-request-id' }
          });
        }

        return Promise.resolve({
          LoggingConfiguration: {
            LogDestinationConfigs: [command.input.LoggingConfiguration.LogDestinationConfigs[0]]
          },
          $metadata: { requestId: 'test-request-id' }
        });
      }

      if (command.constructor.name === 'AssociateFirewallPolicyCommand') {
        if (command.input && command.input.FirewallName === 'error') {
          throw { message: 'error' };
        }
        return Promise.resolve({
          $metadata: { requestId: 'test-request-id' }
        });
      }

      if (command.constructor.name === 'UpdateSubnetChangeProtectionCommand') {
        if (command.input && command.input.FirewallName === 'error') {
          throw { message: 'error' };
        }
        return Promise.resolve({
          $metadata: { requestId: 'test-request-id' }
        });
      }

      if (command.constructor.name === 'UpdateFirewallDescriptionCommand') {
        if (command.input && command.input.FirewallName === 'error') {
          throw { message: 'error' };
        }
        return Promise.resolve({
          $metadata: { requestId: 'test-request-id' }
        });
      }

      if (command.constructor.name === 'UpdateFirewallPolicyChangeProtectionCommand') {
        if (command.input && command.input.FirewallName === 'error') {
          throw { message: 'error' };
        }
        return Promise.resolve({
          $metadata: { requestId: 'test-request-id' }
        });
      }

      if (command.constructor.name === 'UpdateFirewallDeleteProtectionCommand') {
        if (command.input && command.input.FirewallName === 'error') {
          throw { message: 'error' };
        }
        return Promise.resolve({
          $metadata: { requestId: 'test-request-id' }
        });
      }

      if (command.constructor.name === 'DeleteRuleGroupCommand') {
        return Promise.resolve({
          $metadata: { requestId: 'test-request-id' }
        });
      }

      return Promise.resolve({
        $metadata: { requestId: 'test-request-id' }
      });
    });
  });

  return {
    __esModule: true,
    NetworkFirewallClient: MockNetworkFirewallClient,
    RuleGroupType: {
      STATELESS: 'STATELESS',
      STATEFUL: 'STATEFUL'
    },
    // Export all the command classes
    CreateFirewallCommand: jest.fn().mockImplementation((params) => ({
      constructor: { name: 'CreateFirewallCommand' },
      input: params
    })),
    CreateFirewallPolicyCommand: jest.fn().mockImplementation((params) => ({
      constructor: { name: 'CreateFirewallPolicyCommand' },
      input: params
    })),
    CreateRuleGroupCommand: jest.fn().mockImplementation((params) => ({
      constructor: { name: 'CreateRuleGroupCommand' },
      input: params
    })),
    DescribeFirewallCommand: jest.fn().mockImplementation((params) => ({
      constructor: { name: 'DescribeFirewallCommand' },
      input: params
    })),
    DescribeFirewallPolicyCommand: jest.fn().mockImplementation((params) => ({
      constructor: { name: 'DescribeFirewallPolicyCommand' },
      input: params
    })),
    DescribeRuleGroupCommand: jest.fn().mockImplementation((params) => ({
      constructor: { name: 'DescribeRuleGroupCommand' },
      input: params
    })),
    AssociateFirewallPolicyCommand: jest.fn().mockImplementation((params) => ({
      constructor: { name: 'AssociateFirewallPolicyCommand' },
      input: params
    })),
    TagResourceCommand: jest.fn().mockImplementation((params) => ({
      constructor: { name: 'TagResourceCommand' },
      input: params
    })),
    UpdateFirewallPolicyCommand: jest.fn().mockImplementation((params) => ({
      constructor: { name: 'UpdateFirewallPolicyCommand' },
      input: params
    })),
    UpdateRuleGroupCommand: jest.fn().mockImplementation((params) => ({
      constructor: { name: 'UpdateRuleGroupCommand' },
      input: params
    })),
    UpdateFirewallDescriptionCommand: jest.fn().mockImplementation((params) => ({
      constructor: { name: 'UpdateFirewallDescriptionCommand' },
      input: params
    })),
    UpdateFirewallDeleteProtectionCommand: jest.fn().mockImplementation((params) => ({
      constructor: { name: 'UpdateFirewallDeleteProtectionCommand' },
      input: params
    })),
    UpdateFirewallPolicyChangeProtectionCommand: jest.fn().mockImplementation((params) => ({
      constructor: { name: 'UpdateFirewallPolicyChangeProtectionCommand' },
      input: params
    })),
    UpdateSubnetChangeProtectionCommand: jest.fn().mockImplementation((params) => ({
      constructor: { name: 'UpdateSubnetChangeProtectionCommand' },
      input: params
    })),
    DescribeLoggingConfigurationCommand: jest.fn().mockImplementation((params) => ({
      constructor: { name: 'DescribeLoggingConfigurationCommand' },
      input: params
    })),
    UpdateLoggingConfigurationCommand: jest.fn().mockImplementation((params) => ({
      constructor: { name: 'UpdateLoggingConfigurationCommand' },
      input: params
    })),
    DeleteRuleGroupCommand: jest.fn().mockImplementation((params) => ({
      constructor: { name: 'DeleteRuleGroupCommand' },
      input: params
    }))
  };
}, { virtual: true });

test('test describe firewall policy', async () => {
  const service = new NetworkFirewallService();
  await expect(service.describeFirewallPolicy('test-network-firewall')).resolves.toBeDefined();
});

test('test describe rule group', async () => {
  const service = new NetworkFirewallService();
  await expect(service.describeRuleGroup('test-stateless-rg1', 'STATEFUL')).resolves.toBeDefined();
});

test('test describe rule group throttling error response', async () => {
  const service = new NetworkFirewallService();
  await expect(service.describeRuleGroup('ThrottlingException', 'STATEFUL')).rejects.toStrictEqual({
    message: 'Unable to resolve request and completed retries.'
  });
});

test('test describe rule group resource not found exception response', async () => {
  const service = new NetworkFirewallService();
  await expect(service.describeRuleGroup('ResourceNotFoundException', 'STATEFUL')).resolves.toBeUndefined();
});

test('create firewall ', async () => {
  const service = new NetworkFirewallService();
  await expect(
    service.createFirewall({
      FirewallName: 'VpcFirewall-1',
      FirewallPolicyArn: '__tests__/firewall-test-configuration/firewallPolicies/firewall-policy.example.json',
      Description: 'Network Firewall created by AWS Solutions',
      DeleteProtection: true,
      FirewallPolicyChangeProtection: true,
      SubnetChangeProtection: true,
      SubnetMappings: [],
      VpcId: '',
      Tags: [
        {
          Key: 'SampleKey',
          Value: 'SampleValue'
        }
      ]
    })
  ).resolves.toBeDefined();
});

test('create firewall handle error response from the sdk. ', async () => {
  const service = new NetworkFirewallService();
  await expect(
    service.createFirewall({
      FirewallName: 'VpcFirewall-1',
      FirewallPolicyArn: '__tests__/firewall-test-configuration/firewallPolicies/firewall-policy.example.json',
      Description: 'Error',
      DeleteProtection: true,
      FirewallPolicyChangeProtection: true,
      SubnetChangeProtection: true,
      SubnetMappings: [],
      VpcId: '',
      Tags: [
        {
          Key: 'SampleKey',
          Value: 'SampleValue'
        }
      ]
    })
  ).resolves.toBeUndefined();
});

test('create Firewall policy', async () => {
  const service = new NetworkFirewallService();
  await expect(
    service.createFirewallPolicy({
      FirewallPolicyName: 'Firewall-Policy-1',
      FirewallPolicy: {
        StatelessDefaultActions: ['aws:drop'],
        StatelessFragmentDefaultActions: ['aws:drop'],
        StatelessRuleGroupReferences: [
          {
            Priority: 30,
            ResourceArn: 'arn:aws:network-firewall:us-east-1:1234:stateless-rulegroup/StatelessExample2'
          },
          {
            Priority: 20,
            ResourceArn: 'arn:aws:network-firewall:us-east-1:1234:stateless-rulegroup/StatelessExample1'
          }
        ],
        StatefulRuleGroupReferences: [
          {
            ResourceArn: 'arn:aws:network-firewall:us-east-1:1234:stateful-rulegroup/StatefulRulesExample1'
          }
        ]
      }
    })
  ).resolves.toBeDefined();
});

test('create rule group', async () => {
  const service = new NetworkFirewallService();
  await expect(
    service.createRuleGroup({
      RuleGroupName: 'StatefulRulesExample1',
      RuleGroup: {
        RulesSource: {
          RulesSourceList: {
            Targets: ['test.example.com'],
            TargetTypes: ['HTTP_HOST', 'TLS_SNI'],
            GeneratedRulesType: 'DENYLIST'
          }
        }
      },
      Type: 'STATEFUL',
      Description: 'Stateful Rule3',
      Capacity: 100
    })
  ).resolves.toBeDefined();
});

test('describe firewall', async () => {
  const service = new NetworkFirewallService();
  await expect(service.describeFirewall('firewall-name')).resolves.toBeDefined();
});

test('describe firewall handle sdk error', async () => {
  const service = new NetworkFirewallService();
  await expect(service.describeFirewall('error')).resolves.toBeUndefined();
});

test('Update firewall policy', async () => {
  const service = new NetworkFirewallService();
  await expect(
    service.updateFirewallPolicy({
      UpdateToken: '',
      FirewallPolicyArn: '',
      FirewallPolicyName: 'test',
      FirewallPolicy: {
        StatelessDefaultActions: ['aws:drop'],
        StatelessFragmentDefaultActions: ['aws:drop'],
        StatelessRuleGroupReferences: [
          {
            Priority: 30,
            ResourceArn: 'arn:aws:network-firewall:us-east-1:1234:stateless-rulegroup/StatelessExample2'
          },
          {
            Priority: 20,
            ResourceArn: 'arn:aws:network-firewall:us-east-1:1234:stateless-rulegroup/StatelessExample1'
          }
        ],
        StatefulRuleGroupReferences: [
          {
            ResourceArn: 'arn:aws:network-firewall:us-east-1:1234:stateful-rulegroup/StatefulRulesExample1'
          }
        ]
      }
    })
  ).resolves.toBeDefined();
});

test('Update firewall policy handle invalid token scenario.', async () => {
  const service = new NetworkFirewallService();
  await expect(
    service.updateFirewallPolicy({
      UpdateToken: 'test invalid token scenario',
      FirewallPolicyArn: '',
      FirewallPolicyName: 'test',
      FirewallPolicy: {
        StatelessDefaultActions: ['aws:drop'],
        StatelessFragmentDefaultActions: ['aws:drop'],
        StatelessRuleGroupReferences: [
          {
            Priority: 30,
            ResourceArn: 'arn:aws:network-firewall:us-east-1:1234:stateless-rulegroup/StatelessExample2'
          },
          {
            Priority: 20,
            ResourceArn: 'arn:aws:network-firewall:us-east-1:1234:stateless-rulegroup/StatelessExample1'
          }
        ],
        StatefulRuleGroupReferences: [
          {
            ResourceArn: 'arn:aws:network-firewall:us-east-1:1234:stateful-rulegroup/StatefulRulesExample1'
          }
        ]
      }
    })
  ).resolves.toBeDefined();
});

test('Update firewall policy handle error.', async () => {
  const service = new NetworkFirewallService();
  await expect(
    service.updateFirewallPolicy({
      UpdateToken: 'error',
      FirewallPolicyArn: '',
      FirewallPolicyName: 'test',
      FirewallPolicy: {
        StatelessDefaultActions: ['aws:drop'],
        StatelessFragmentDefaultActions: ['aws:drop'],
        StatelessRuleGroupReferences: [
          {
            Priority: 30,
            ResourceArn: 'arn:aws:network-firewall:us-east-1:1234:stateless-rulegroup/StatelessExample2'
          },
          {
            Priority: 20,
            ResourceArn: 'arn:aws:network-firewall:us-east-1:1234:stateless-rulegroup/StatelessExample1'
          }
        ],
        StatefulRuleGroupReferences: [
          {
            ResourceArn: 'arn:aws:network-firewall:us-east-1:1234:stateful-rulegroup/StatefulRulesExample1'
          }
        ]
      }
    })
  ).rejects.toBeDefined();
});

test('Update rule groups', async () => {
  const service = new NetworkFirewallService();
  await expect(
    service.updateRuleGroup({
      UpdateToken: '',
      RuleGroupName: 'test'
    })
  ).resolves.toBeDefined();
});

test('Update rule groups handle invalid token error', async () => {
  const service = new NetworkFirewallService();
  await expect(
    service.updateRuleGroup({
      UpdateToken: 'invalid token',
      RuleGroupName: 'test'
    })
  ).resolves.toBeDefined();
});

test('Update rule groups handle error', async () => {
  const service = new NetworkFirewallService();
  await expect(
    service.updateRuleGroup({
      UpdateToken: 'error',
      RuleGroupName: 'test'
    })
  ).rejects.toThrowError();
});

test('Update logging configuration', async () => {
  const service = new NetworkFirewallService();
  const response = await service.updateLoggingConfiguration('firewallName', {
    LogDestinationConfigs: [
      {
        LogType: 'ALERT',
        LogDestination: {
          bucketName: 'centralized-network-inspection-solution',
          prefix: 'alerts'
        },
        LogDestinationType: 'S3'
      }
    ]
  });
  
  expect(response).toBeDefined();
  expect(response?.LoggingConfiguration?.LogDestinationConfigs).toBeDefined();
  expect(response?.LoggingConfiguration?.LogDestinationConfigs?.length).toBe(1);
  expect(response?.LoggingConfiguration?.LogDestinationConfigs?.[0].LogType).toBe('ALERT');
});

test('List rule groups for firewall Policy', async () => {
  const service = new NetworkFirewallService();
  await expect(service.listRuleGroupsForPolicy('FirewallName')).resolves.toBeDefined();
});

test('delete rule Group', async () => {
  const service = new NetworkFirewallService();
  await expect(service.deleteRuleGroup('')).resolves.toBeUndefined();
});

test('associate firewall policy', async () => {
  const service = new NetworkFirewallService();
  await expect(
    service.associateFirewallPolicy({
      FirewallPolicyArn: '',
      FirewallName: ''
    })
  ).resolves.toBeDefined();
});

test('associate firewall policy error response', async () => {
  const service = new NetworkFirewallService();
  await expect(
    service.associateFirewallPolicy({
      FirewallPolicyArn: '',
      FirewallName: 'error'
    })
  ).rejects.toBeDefined();
});

test('update firewall description.', async () => {
  const service = new NetworkFirewallService();
  await expect(
    service.updateFirewallDescription({
      Description: '',
      FirewallName: ''
    })
  ).resolves.toBeDefined();
});

test('associate firewall description error response', async () => {
  const service = new NetworkFirewallService();
  await expect(
    service.updateFirewallDescription({
      Description: '',
      FirewallName: 'error'
    })
  ).rejects.toBeDefined();
});

test('update firewall deletion protection.', async () => {
  const service = new NetworkFirewallService();
  await expect(
    service.updateFirewallDeleteProtection({
      DeleteProtection: false,
      FirewallName: ''
    })
  ).resolves.toBeDefined();
});

test('associate firewall deletion protection error response', async () => {
  const service = new NetworkFirewallService();
  await expect(
    service.updateFirewallDeleteProtection({
      DeleteProtection: false,
      FirewallName: 'error'
    })
  ).rejects.toBeDefined();
});

test('update firewall policy change protection.', async () => {
  const service = new NetworkFirewallService();
  await expect(
    service.updateFirewallPolicyChangeProtection({
      FirewallPolicyChangeProtection: false,
      FirewallName: ''
    })
  ).resolves.toBeDefined();
});

test('update firewall policy change protection error response.', async () => {
  const service = new NetworkFirewallService();
  await expect(
    service.updateFirewallPolicyChangeProtection({
      FirewallPolicyChangeProtection: false,
      FirewallName: 'error'
    })
  ).rejects.toBeDefined();
});

test('update subnet change protection.', async () => {
  const service = new NetworkFirewallService();
  await expect(
    service.updateSubnetChangeProtection({
      SubnetChangeProtection: false,
      FirewallName: ''
    })
  ).resolves.toBeDefined();
});

test('update subnet change protection error response.', async () => {
  const service = new NetworkFirewallService();
  await expect(
    service.updateSubnetChangeProtection({
      SubnetChangeProtection: false,
      FirewallName: 'error'
    })
  ).rejects.toBeDefined();
});
