/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * @description This class setup the retry options for AWS APIs
 */
export class AwsClientConfig {
  /**
   * @description Returns the configuration options for AWS SDK v3 clients
   * @returns Configuration object with retry options
   */
  getRetryConfigurationOptions(): any {
    return {
      retryMode: "standard",
      maxRetries: 10,
      customUserAgent: process.env.CUSTOM_SDK_USER_AGENT,
    };
  }
}
