/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { handler } from "../index";
import { CDKAssetPackager } from "../asset-packager";

jest.mock("../asset-packager", () => {
  return {
    CDKAssetPackager: jest.fn().mockImplementation(() => {
      return {
        getAssetPaths: jest.fn(),
        createAssetZip: jest.fn(),
        moveZips: jest.fn(),
      };
    }),
  };
});

const consoleLogSpy = jest.spyOn(console, "log").mockImplementation();
const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

const originalArgv = process.argv;

describe("Handler Enhanced Tests", () => {
  let mockAssetPackager: any;
  let mockGetAssetPaths: jest.Mock;
  let mockCreateAssetZip: jest.Mock;
  let mockMoveZips: jest.Mock;
  
  beforeEach(() => {
    jest.clearAllMocks();

    mockGetAssetPaths = jest.fn();
    mockCreateAssetZip = jest.fn();
    mockMoveZips = jest.fn();
    
    mockAssetPackager = {
      getAssetPaths: mockGetAssetPaths,
      createAssetZip: mockCreateAssetZip,
      moveZips: mockMoveZips,
    };
    
    (CDKAssetPackager as jest.Mock).mockImplementation(() => mockAssetPackager);
  });
  
  afterEach(() => {
    process.argv = originalArgv;
  });

  describe("handler function", () => {
    it("should throw specific error message for null or undefined inputs", async () => {
      await expect(handler(null as any, "output")).rejects.toThrow("undefined input path");
      await expect(handler("input", null as any)).rejects.toThrow("undefined input path");
    });
    
    it("should process assets in correct order", async () => {

      const testAssets = ["asset1", "asset2", "asset3"];
      mockGetAssetPaths.mockResolvedValue(testAssets);

      await handler("testPath", "outputPath");
      
      expect(CDKAssetPackager).toHaveBeenCalledWith("testPath");
      expect(mockGetAssetPaths).toHaveBeenCalledTimes(1);
      expect(mockCreateAssetZip).toHaveBeenCalledTimes(3);
      expect(mockMoveZips).toHaveBeenCalledWith("outputPath");
      
      expect(mockCreateAssetZip.mock.calls[0][0]).toBe("asset1");
      expect(mockCreateAssetZip.mock.calls[1][0]).toBe("asset2");
      expect(mockCreateAssetZip.mock.calls[2][0]).toBe("asset3");
    });
    
    it("should handle errors during asset path retrieval", async () => {
      const testError = new Error("Failed to get asset paths");
      mockGetAssetPaths.mockRejectedValue(testError);
      
      await expect(handler("testPath", "outputPath")).rejects.toThrow(testError);
    });
    
    it("should handle errors during asset zip creation", async () => {
      mockGetAssetPaths.mockResolvedValue(["asset1"]);
      const zipError = new Error("Failed to create zip");
      mockCreateAssetZip.mockRejectedValue(zipError);
      
      await expect(handler("testPath", "outputPath")).rejects.toThrow(zipError);
    });
    
    it("should handle errors during zip moving", async () => {
      mockGetAssetPaths.mockResolvedValue(["asset1"]);
      const moveError = new Error("Failed to move zips");
      mockMoveZips.mockRejectedValue(moveError);
      
      await expect(handler("testPath", "outputPath")).rejects.toThrow(moveError);
    });
    
    it("should handle case with empty asset paths array", async () => {
      mockGetAssetPaths.mockResolvedValue([]);
      
      await handler("testPath", "outputPath");
      
      expect(mockCreateAssetZip).not.toHaveBeenCalled();
      expect(mockMoveZips).toHaveBeenCalledTimes(1);
    });
  });
  
  describe("command line execution", () => {
    
    it("should handle command line success path", async () => {
      mockGetAssetPaths.mockResolvedValue(["asset1"]);
      mockCreateAssetZip.mockResolvedValue(undefined);
      mockMoveZips.mockResolvedValue(undefined);
      
      await handler("testCmdPath", "testCmdOutput");
      
      expect(mockGetAssetPaths).toHaveBeenCalledTimes(1);
      expect(mockCreateAssetZip).toHaveBeenCalledTimes(1);
      expect(mockMoveZips).toHaveBeenCalledTimes(1);
    });
    
    it("should handle command line error paths", async () => {
      const handlerError = new Error("Command line execution error");
      mockGetAssetPaths.mockRejectedValue(handlerError);

      await expect(handler("testCmdPath", "testCmdOutput")).rejects.toThrow(handlerError);
    });
  });
});
