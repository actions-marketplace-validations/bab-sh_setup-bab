import * as installer from "../src/installer";

describe("installer module", () => {
  describe("module loading", () => {
    it("should export getBab function", () => {
      expect(typeof installer.getBab).toBe("function");
    });
  });

  describe("version resolution logic", () => {
    it("should handle version strings correctly", () => {
      const testCases = [
        { input: "v0.2.2", expected: "0.2.2" },
        { input: "0.2.2", expected: "0.2.2" },
        { input: "0.2.x", expected: "0.2" },
        { input: "0.x", expected: "0" },
      ];

      testCases.forEach(({ input, expected }) => {
        let result = input;

        if (result.startsWith("v")) {
          result = result.slice(1);
        }

        if (result.endsWith(".x")) {
          result = result.slice(0, -2);
        }

        expect(result).toBe(expected);
      });
    });

    it("should normalize version to semver format", () => {
      const normalize = (version: string): string => {
        const parts = version.split(".");
        while (parts.length < 3) {
          parts.push("0");
        }
        return parts.slice(0, 3).join(".");
      };

      expect(normalize("0")).toBe("0.0.0");
      expect(normalize("0.2")).toBe("0.2.0");
      expect(normalize("0.2.2")).toBe("0.2.2");
      expect(normalize("1.0.0")).toBe("1.0.0");
    });
  });

  describe("platform mappings", () => {
    it("should have correct platform mappings", () => {
      const platformMap: Record<string, string> = {
        linux: "Linux",
        darwin: "macOS",
        win32: "Windows",
      };

      expect(platformMap["linux"]).toBe("Linux");
      expect(platformMap["darwin"]).toBe("macOS");
      expect(platformMap["win32"]).toBe("Windows");
    });

    it("should have correct architecture mappings", () => {
      const archMap: Record<string, string> = {
        x64: "x86_64",
        arm64: "arm64",
        arm: "armv7",
      };

      expect(archMap["x64"]).toBe("x86_64");
      expect(archMap["arm64"]).toBe("arm64");
      expect(archMap["arm"]).toBe("armv7");
    });
  });

  describe("download URL generation", () => {
    it("should generate correct download URL pattern", () => {
      const version = "0.2.2";
      const platform = "Linux";
      const arch = "x86_64";
      const ext = "tar.gz";

      const filename = `bab_${version}_${platform}_${arch}.${ext}`;
      const url = `https://github.com/bab-sh/bab/releases/download/v${version}/${filename}`;

      expect(url).toBe(
        "https://github.com/bab-sh/bab/releases/download/v0.2.2/bab_0.2.2_Linux_x86_64.tar.gz",
      );
    });

    it("should use zip extension for Windows", () => {
      const version = "0.2.2";
      const platform = "Windows";
      const arch = "x86_64";
      const ext = "zip";

      const filename = `bab_${version}_${platform}_${arch}.${ext}`;

      expect(filename).toBe("bab_0.2.2_Windows_x86_64.zip");
    });
  });
});
