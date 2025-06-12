#!/usr/bin/env node
 /*
  * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
  * SPDX-License-Identifier: Apache-2.0
  */

import { App, Aspects, DefaultStackSynthesizer } from 'aws-cdk-lib';
import {
  CentralizedNetworkInspectionStack,
  CentralizedNetworkInspectionStackProps
} from '../lib/centralized-network-inspection.stack';
import { CfnGuardSuppressResourceList } from '../utils/appUtils';

const SOLUTION_VERSION = process.env['DIST_VERSION'];
const SOLUTION_NAME = process.env['SOLUTION_NAME'];
const SOLUTION_ID = process.env['SOLUTION_ID'] || 'SO0108';
const SOLUTION_BUCKET = process.env['DIST_OUTPUT_BUCKET'];
const SOLUTION_TMN = process.env['SOLUTION_TRADEMARKEDNAME'];
const SOLUTION_PROVIDER = 'AWS Solution Development';

const app = new App();

let synthesizer = new DefaultStackSynthesizer({
  generateBootstrapVersionRule: false,
});

if (SOLUTION_BUCKET && SOLUTION_NAME && SOLUTION_VERSION) {
  synthesizer = new DefaultStackSynthesizer({
    generateBootstrapVersionRule: false,
    fileAssetsBucketName: `${SOLUTION_BUCKET}-\${AWS::Region}`,
    bucketPrefix: `${SOLUTION_NAME}/${SOLUTION_VERSION}/`,
  });
}

let centralizedNetworkInspectionStackProps: CentralizedNetworkInspectionStackProps = {
  synthesizer: synthesizer,
  solutionId: SOLUTION_ID,
  solutionTradeMarkName: SOLUTION_TMN,
  solutionProvider: SOLUTION_PROVIDER,
  solutionBucket: SOLUTION_BUCKET,
  solutionName: SOLUTION_NAME,
  solutionVersion: SOLUTION_VERSION,
  description: `(${SOLUTION_ID}) - The AWS CloudFormation template for deployment of the ${SOLUTION_NAME}, Version: ${SOLUTION_VERSION}`
};

const stack = new CentralizedNetworkInspectionStack(
  app,
  'centralized-network-inspection-on-aws',
  centralizedNetworkInspectionStackProps
);

const resourceSuppressions = {
  'AWS::Lambda::Function': ['LAMBDA_INSIDE_VPC', 'LAMBDA_CONCURRENCY_CHECK'],
  'AWS::Logs::LogGroup' : ['CW_LOGGROUP_RETENTION_PERIOD_CHECK']
};

Aspects.of(stack).add(new CfnGuardSuppressResourceList(resourceSuppressions));