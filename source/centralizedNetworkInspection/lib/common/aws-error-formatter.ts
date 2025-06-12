/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Utility class for formatting AWS SDK v3 errors for proper logging
 */
export class AwsErrorFormatter {
  /**
   * Formats AWS SDK v3 errors for proper logging
   * @param error The AWS SDK v3 error object
   * @returns Formatted error object with key information extracted
   */
  public static format(error: any): any {
    return {
      name: error.name,
      message: error.message,
      statusCode: error.$metadata?.httpStatusCode,
      requestId: error.$metadata?.requestId,
      code: error.Code || error.code
    };
  }
}