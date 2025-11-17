
const url = require("url");

function parseURL(inputUrl) {
    const parsed = url.parse(inputUrl, true);

    return {
        hostname: parsed.hostname,
        pathname: parsed.pathname,
        query: parsed.query
    };
}

module.exports = parseURL;
