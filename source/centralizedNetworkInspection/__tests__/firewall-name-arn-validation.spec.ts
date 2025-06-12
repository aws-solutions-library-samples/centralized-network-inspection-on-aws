/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { FirewallConfigValidation } from '../lib/common/firewall-config-validation';
import { CreateFirewallCommandInput } from '@aws-sdk/client-network-firewall';

jest.mock('@aws-sdk/client-network-firewall', () => {
  return {
    __esModule: true,
    NetworkFirewall: jest.fn().mockImplementation(() => {
      return {
        createRuleGroup: jest.fn().mockImplementation(() => {
          return Promise.resolve({});
        }),
        createFirewallPolicy: jest.fn().mockImplementation(() => {
          return Promise.resolve({});
        }),
      };
    }),
  };
});

describe('Firewall Name and ARN Validation', () => {
  let firewallConfigValidation: FirewallConfigValidation;

  beforeEach(() => {
    firewallConfigValidation = new FirewallConfigValidation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should detect when both FirewallName and FirewallPolicyArn are missing', () => {
    // Create firewall config with both fields missing
    const firewall = {
      Description: 'Test firewall with missing name and policy',
    } as CreateFirewallCommandInput;

    // Run validation
    firewallConfigValidation.validateFirewallFileNameAndArn(firewall);
    
    // Check results
    const invalidFiles = firewallConfigValidation.getInvalidFiles();
    expect(invalidFiles.length).toBe(1);
    expect(invalidFiles[0].path).toBe('[unknown firewall]');
    expect(invalidFiles[0].error).toContain('FirewallName and FirewallPolicyArn are both required');
  });

  it('should detect when only FirewallName is missing', () => {
    // Create firewall config with only name missing
    const firewall = {
      FirewallPolicyArn: 'path/to/policy.json',
      Description: 'Test firewall with missing name',
    } as CreateFirewallCommandInput;

    // Run validation
    firewallConfigValidation.validateFirewallFileNameAndArn(firewall);
    
    // Check results
    const invalidFiles = firewallConfigValidation.getInvalidFiles();
    expect(invalidFiles.length).toBe(1);
    expect(invalidFiles[0].path).toBe('[unnamed firewall]');
    expect(invalidFiles[0].referencedInFile).toBe('path/to/policy.json');
    expect(invalidFiles[0].error).toContain('FirewallName is required');
  });

  it('should detect when only FirewallPolicyArn is missing', () => {
    // Create firewall config with only policy missing
    const firewall = {
      FirewallName: 'TestFirewall',
      Description: 'Test firewall with missing policy',
    } as CreateFirewallCommandInput;

    // Run validation
    firewallConfigValidation.validateFirewallFileNameAndArn(firewall);
    
    // Check results
    const invalidFiles = firewallConfigValidation.getInvalidFiles();
    expect(invalidFiles.length).toBe(1);
    expect(invalidFiles[0].path).toBe('TestFirewall');
    expect(invalidFiles[0].referencedInFile).toBe('TestFirewall');
    expect(invalidFiles[0].error).toContain('FirewallPolicyArn is required');
  });

  it('should not add to invalidFiles when both fields are present', () => {
    // Create valid firewall config
    const firewall: CreateFirewallCommandInput = {
      FirewallName: 'TestFirewall',
      FirewallPolicyArn: 'path/to/policy.json',
      Description: 'Valid test firewall',
    };

    // Run validation
    firewallConfigValidation.validateFirewallFileNameAndArn(firewall);
    
    // Check results - should be no errors
    const invalidFiles = firewallConfigValidation.getInvalidFiles();
    expect(invalidFiles.length).toBe(0);
  });
});
