import { Config } from "@remotion/cli/config";
import { enableTailwind } from "@remotion/tailwind-v4";

Config.setEntryPoint("remotion/index.ts");
Config.overrideWebpackConfig((config) => enableTailwind(config));
