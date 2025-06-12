/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

const readdirMock = jest.fn();
const addLocalFolderMock = jest.fn();
const renameMock = jest.fn();
const writeZipMock = jest.fn();
const lstatMock = jest.fn();
const consoleSpy = jest.spyOn(console, 'error');

import path from "path";
import { CDKAssetPackager } from "../asset-packager";
jest
  .mock("node:fs/promises", () => {
    const originalModule = jest.requireActual("node:fs/promises");
    return {
      ...originalModule,
      __esModule: true,
      readdir: readdirMock,
      lstat: lstatMock,
      rename: renameMock,
    };
  })
  .mock("adm-zip", () => {
    const originalModule = jest.requireActual("adm-zip");
    return {
      ...originalModule,
      __esModule: true,
      default: jest.fn(() => ({
        addLocalFolder: addLocalFolderMock,
        writeZip: writeZipMock,
      })),
    };
  });

const __assetPath = "/myTestPath";
const __outputPath = "/outputPath";
const assetPackager = new CDKAssetPackager(__assetPath);
const __asset1 = "asset.1";
const __asset2 = "asset.2.zip";
const __nonAsset = "regular.file";

describe("CDKAssetPackager Enhanced Tests", () => {
  describe("getAssetPaths", function () {
    beforeEach(function () {
      readdirMock.mockClear();
      consoleSpy.mockClear();
    });

    it("should filter out non-asset files", async function () {
      readdirMock.mockResolvedValue([__asset1, __asset2, __nonAsset]);
      const result = await assetPackager.getAssetPaths();
      expect(result).toEqual([
        path.join(__assetPath, __asset1),
        path.join(__assetPath, __asset2),
      ]);
      expect(result).not.toContain(path.join(__assetPath, __nonAsset));
    });

    it("should log error and return empty array when readdir fails", async function () {
      const testError = new Error("Directory access error");
      readdirMock.mockRejectedValue(testError);
      const result = await assetPackager.getAssetPaths();
      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith(testError);
    });

    it("should handle mixed case in asset file names", async function () {
      readdirMock.mockResolvedValue(["AsSeT.mixedCase", "ASSET.upperCase", "asset.lowerCase"]);
      const result = await assetPackager.getAssetPaths();
      // CDKAssetPackager uses 'includes' which is case-sensitive, so only "asset.lowerCase" should match
      expect(result.length).toBe(1);
      expect(result[0]).toBe(path.join(__assetPath, "asset.lowerCase"));
    });
  });

  describe("createAssetZip", function () {
    beforeEach(function () {
      lstatMock.mockClear();
      addLocalFolderMock.mockClear();
      writeZipMock.mockClear();
    });

    it("should handle file names with special characters", async function () {
      const specialFileName = "asset.special-chars_123!";
      lstatMock.mockResolvedValue({
        isDirectory: () => true,
      });
      
      await assetPackager.createAssetZip(specialFileName);
      expect(addLocalFolderMock).toBeCalledWith(path.join(specialFileName, "./"));
      expect(writeZipMock).toBeCalledWith(`${path.join(__assetPath, "special-chars_123!")}.zip`);
    });

    it("should handle errors during zip creation", async function () {
      lstatMock.mockResolvedValue({
        isDirectory: () => true,
      });
      
      const zipError = new Error("Zip creation failed");
      addLocalFolderMock.mockImplementation(() => {
        throw zipError;
      });
      
      await expect(assetPackager.createAssetZip(__asset1)).rejects.toThrow(zipError);
    });

    it("should handle errors during zip writing", async function () {
      lstatMock.mockResolvedValue({
        isDirectory: () => true,
      });
      
      const writeError = new Error("Zip write failed");
      writeZipMock.mockImplementation(() => {
        throw writeError;
      });
      
      await expect(assetPackager.createAssetZip(__asset1)).rejects.toThrow(writeError);
    });
  });

  describe("moveZips", function () {
    beforeEach(function () {
      readdirMock.mockClear();
      renameMock.mockClear();
    });

    it("should handle case when no zip files exist", async function () {
      readdirMock.mockResolvedValue(["file1.txt", "file2.jpg"]);
      await assetPackager.moveZips(__outputPath);
      expect(renameMock).not.toHaveBeenCalled();
    });

    it("should handle errors during rename operation", async function () {
      const renameError = new Error("Rename operation failed");
      readdirMock.mockResolvedValue([__asset2]);
      renameMock.mockRejectedValue(renameError);
      
      await expect(assetPackager.moveZips(__outputPath)).rejects.toThrow(renameError);
    });

    it("should correctly handle filenames with multiple 'asset.' prefixes", async function () {
      const complexZipName = "asset.complex.asset.name.zip";
      readdirMock.mockResolvedValue([complexZipName]);
      
      await assetPackager.moveZips(__outputPath);
      
      // Should remove only the first "asset." prefix
      expect(renameMock).toHaveBeenCalledWith(
        path.join(__assetPath, complexZipName),
        path.join(__outputPath, "complex.asset.name.zip")
      );
    });
  });
});
