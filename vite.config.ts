import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { resolve } from "path";
import { createRequire } from "module";

// Read peerDependencies at build time so the `external` list below cannot
// drift from package.json. This is the same approach taken by
// rollup-plugin-peer-deps-external, inlined here to avoid an extra dep.
const require = createRequire(import.meta.url);
const pkg = require("./package.json") as {
  peerDependencies?: Record<string, string>;
};
const peerDepNames = Object.keys(pkg.peerDependencies ?? {});

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, "src/index.ts"),
        core: resolve(__dirname, "src/core/index.ts"),
      },
      formats: ["es"],
    },
    rollupOptions: {
      // Externalize every declared peer dependency plus React's JSX runtime
      // (which is a subpath import, not a package name, so it has to be
      // listed explicitly). This guarantees the SDK never bundles a second
      // copy of React, React Native, or any Expo native module — duplicate
      // native modules in React Native cause link-time failures.
      external: (id) => {
        if (id === "react/jsx-runtime") return true;
        // Match exact package names or any subpath import of a peer dep
        // (e.g. `expo-crypto/build/native`), but do not accidentally match
        // unrelated packages that happen to share a prefix.
        return peerDepNames.some(
          (name) => id === name || id.startsWith(`${name}/`)
        );
      },
    },
  },
});
