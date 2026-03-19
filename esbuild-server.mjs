import * as esbuild from "esbuild";
import path from "path";

await esbuild.build({
  entryPoints: ["server/index.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  outfile: "dist-server/index.mjs",
  target: "node18",
  external: ["express", "socket.io", "firebase", "firebase/*"],
  alias: {
    "@": path.resolve("src"),
  },
});

console.log("Server bundle built successfully!");
