const path = require("node:path");

// Load the existing backend configuration while serving both parts on one port.
process.env.SERVE_FRONTEND = "true";
process.chdir(path.join(__dirname, "Backend"));
require("./Backend/server");
