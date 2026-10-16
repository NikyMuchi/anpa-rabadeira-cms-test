/**
 * Automated Unit Test Suite for Decap CMS Netlify OAuth Gatekeeper
 * Tests CSRF state protection, cookie lifecycle, exact origin allowlist, window.opener source validation, and secret protection.
 */

const assert = require("assert");
const auth = require("../netlify/functions/auth");
const callback = require("../netlify/functions/callback");

async function runOAuthTests() {
  let passed = 0;
  let failed = 0;

  async function asyncTest(description, fn) {
    try {
      await fn();
      console.log(`  ✓ ${description}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ ${description}`);
      console.error(`    ${err.message}`);
      failed++;
    }
  }

  console.log("=== Executing OAuth Gatekeeper Security & Origin Validation Tests ===\n");

  // Setup mock environment variables (never real secrets)
  process.env.GITHUB_CLIENT_ID = "mock_client_id_123";
  process.env.GITHUB_CLIENT_SECRET = "mock_client_secret_xyz";

  // Test 1: auth.js returns 500 if GITHUB_CLIENT_ID is missing
  await asyncTest("auth.js fails safely if GITHUB_CLIENT_ID is unset", async () => {
    delete process.env.GITHUB_CLIENT_ID;
    const res = await auth.handler({ headers: {} });
    assert.strictEqual(res.statusCode, 500);
    assert(res.body.includes("GITHUB_CLIENT_ID"));
    process.env.GITHUB_CLIENT_ID = "mock_client_id_123";
  });

  // Test 2: auth.js sets secure state cookie and redirects to GitHub
  await asyncTest("auth.js generates 32-byte cryptographic state, sets cookie and redirects", async () => {
    const res = await auth.handler({
      headers: { host: "anpa-rabadeira-cms-test.netlify.app", "x-forwarded-proto": "https" },
    });
    assert.strictEqual(res.statusCode, 302);
    assert(res.headers.Location.startsWith("https://github.com/login/oauth/authorize"));
    assert(res.headers.Location.includes("client_id=mock_client_id_123"));
    assert(res.headers.Location.includes("scope=public_repo%2Cread%3Auser"));
    assert(res.headers.Location.includes("state="));

    const stateMatch = res.headers.Location.match(/state=([a-f0-9]{64})/);
    assert(stateMatch, "State should be a 64-character hex string");

    const cookieHeader = res.headers["Set-Cookie"];
    assert(cookieHeader.includes(`decap_oauth_state=${stateMatch[1]}`));
    assert(cookieHeader.includes("HttpOnly"));
    assert(cookieHeader.includes("SameSite=Lax"));
    assert(cookieHeader.includes("Secure"));
  });

  // Test 3: callback.js rejects missing state query param
  await asyncTest("callback.js returns 403 when state is missing from query", async () => {
    const res = await callback.handler({
      headers: { cookie: "decap_oauth_state=teststate123" },
      queryStringParameters: { code: "mock_code" },
    });
    assert.strictEqual(res.statusCode, 403);
    assert(res.body.includes("CSRF"));
    assert(res.headers["Set-Cookie"].includes("Expires=Thu, 01 Jan 1970"));
  });

  // Test 4: callback.js rejects missing state cookie
  await asyncTest("callback.js returns 403 when state cookie is missing", async () => {
    const res = await callback.handler({
      headers: {},
      queryStringParameters: { code: "mock_code", state: "teststate123" },
    });
    assert.strictEqual(res.statusCode, 403);
    assert(res.body.includes("CSRF"));
  });

  // Test 5: callback.js rejects mismatched state (CSRF attack attempt)
  await asyncTest("callback.js returns 403 when state does not match cookie", async () => {
    const res = await callback.handler({
      headers: { cookie: "decap_oauth_state=legitimate_state_abc" },
      queryStringParameters: { code: "mock_code", state: "attacker_state_xyz" },
    });
    assert.strictEqual(res.statusCode, 403);
    assert(res.body.includes("CSRF"));
  });

  // Test 6: callback.js rejects missing authorization code
  await asyncTest("callback.js returns 400 when authorization code is missing", async () => {
    const res = await callback.handler({
      headers: { cookie: "decap_oauth_state=matching_state" },
      queryStringParameters: { state: "matching_state" },
    });
    assert.strictEqual(res.statusCode, 400);
    assert(res.body.includes("Non se recibiu o código"));
  });

  // Test 7: callback.js embeds the exact 2 allowed origins and validates event.source === window.opener
  await asyncTest("callback.js HTML embeds exact allowlist and enforces e.source === window.opener", async () => {
    const originalFetch = global.fetch;
    global.fetch = async () => ({
      json: async () => ({ access_token: "mock_token_sample", token_type: "bearer" }),
    });

    const res = await callback.handler({
      headers: {
        host: "anpa-rabadeira-cms-test.netlify.app",
        "x-forwarded-proto": "https",
        cookie: "decap_oauth_state=valid_state",
      },
      queryStringParameters: { code: "valid_code", state: "valid_state" },
    });

    global.fetch = originalFetch;

    assert.strictEqual(res.statusCode, 200);

    // Verify origin validation in generated HTML response
    assert(res.body.includes("function isAllowedOrigin(origin)"), "Missing isAllowedOrigin function in response");
    assert(res.body.includes('"https://anpa-rabadeira-cms-test.netlify.app"'), "Missing canonical sandbox in allowlist");
    assert(res.body.includes("/^https:\\/\\/deploy-preview-\\d+--anpa-rabadeira-cms-test\\.netlify\\.app$/"), "Missing Deploy Preview regex in response");
    assert(!res.body.includes('"https://anpa-rabadeira.netlify.app"'), "Production domain must NOT be in sandbox allowlist");

    // Verify origin and source checks
    assert(res.body.includes("!isAllowedOrigin(e.origin)"), "Missing isAllowedOrigin check");
    assert(res.body.includes("e.source !== window.opener"), "Missing e.source === window.opener check");

    // Verify targeted postMessage (no wildcard for credentials)
    assert(res.body.includes("window.opener.postMessage("), "Missing opener.postMessage call");
    assert(res.body.includes(",\n          e.origin\n        )"), "Credentials must be sent only to e.origin, never wildcard");

    // Verify secret is not exposed in HTML
    assert(!res.body.includes("mock_client_secret_xyz"), "Client secret must never be exposed");

    // Directly evaluate the extracted browser function to verify regular expression escaping and execution
    const matchFn = res.body.match(/function isAllowedOrigin\(origin\) \{[\s\S]*?\}/);
    assert(matchFn, "isAllowedOrigin function must be extractable from response HTML");
    const isAllowedOriginEvaluated = new Function("origin", matchFn[0] + "; return isAllowedOrigin(origin);");

    assert.strictEqual(isAllowedOriginEvaluated("https://anpa-rabadeira-cms-test.netlify.app"), true, "Canonical sandbox must be accepted by extracted script");
    assert.strictEqual(isAllowedOriginEvaluated("https://deploy-preview-17--anpa-rabadeira-cms-test.netlify.app"), true, "Deploy preview 17 must be accepted by extracted script");
    assert.strictEqual(isAllowedOriginEvaluated("https://anpa-rabadeira.netlify.app"), false, "Production domain must be rejected by extracted script");
    assert.strictEqual(isAllowedOriginEvaluated("https://deploy-preview-17--anpa-rabadeira.netlify.app"), false, "Production deploy preview must be rejected by extracted script");
  });

  // Test 8: Simulate receiveMessage client-side logic across comprehensive test cases
  await asyncTest("Client-side receiveMessage accepts canonical sandbox and numbered sandbox previews, strictly rejecting all others", () => {
    function isAllowedOrigin(origin) {
      if (!origin || typeof origin !== "string") return false;
      return origin === "https://anpa-rabadeira-cms-test.netlify.app" ||
        /^https:\/\/deploy-preview-\d+--anpa-rabadeira-cms-test\.netlify\.app$/.test(origin);
    }

    const mockOpener = {
      messagesSent: [],
      postMessage: function(msg, targetOrigin) {
        this.messagesSent.push({ msg, targetOrigin });
      }
    };

    const mockDifferentWindow = {
      messagesSent: [],
      postMessage: function(msg, targetOrigin) {
        this.messagesSent.push({ msg, targetOrigin });
      }
    };

    function simulateReceiveMessage(event, windowOpener) {
      if (!event || !isAllowedOrigin(event.origin) || event.source !== windowOpener) {
        return false; // Rejected
      }
      windowOpener.postMessage("authorization:github:success:mock_payload", event.origin);
      return true; // Accepted
    }

    // --- POSITIVE TEST CASES (Accepted) ---

    // 1. Exact Canonical Sandbox (Legitimate opener) -> ACCEPTED
    assert.strictEqual(
      simulateReceiveMessage({ origin: "https://anpa-rabadeira-cms-test.netlify.app", source: mockOpener }, mockOpener),
      true,
      "Canonical sandbox origin must be accepted"
    );
    assert.strictEqual(mockOpener.messagesSent[0].targetOrigin, "https://anpa-rabadeira-cms-test.netlify.app");

    // 2. Numbered Deploy Previews (#1, #7, #17, future #99, future #2048) -> ACCEPTED
    const acceptedPreviews = [1, 7, 17, 99, 2048];
    for (const prNum of acceptedPreviews) {
      mockOpener.messagesSent = [];
      const origin = `https://deploy-preview-${prNum}--anpa-rabadeira-cms-test.netlify.app`;
      assert.strictEqual(
        simulateReceiveMessage({ origin: origin, source: mockOpener }, mockOpener),
        true,
        `Deploy preview #${prNum} origin must be accepted`
      );
      assert.strictEqual(mockOpener.messagesSent[0].targetOrigin, origin, `Target origin must match exactly for PR #${prNum}`);
    }

    // --- NEGATIVE TEST CASES (Strictly Rejected) ---

    // 3. Production site and production previews -> REJECTED
    assert.strictEqual(
      simulateReceiveMessage({ origin: "https://anpa-rabadeira.netlify.app", source: mockOpener }, mockOpener),
      false,
      "Production site must be rejected"
    );
    assert.strictEqual(
      simulateReceiveMessage({ origin: "https://deploy-preview-17--anpa-rabadeira.netlify.app", source: mockOpener }, mockOpener),
      false,
      "Production deploy preview must be rejected"
    );

    // 4. Other Netlify sites / external sites -> REJECTED
    assert.strictEqual(
      simulateReceiveMessage({ origin: "https://attacker.netlify.app", source: mockOpener }, mockOpener),
      false,
      "External Netlify site must be rejected"
    );
    assert.strictEqual(
      simulateReceiveMessage({ origin: "https://evil.com", source: mockOpener }, mockOpener),
      false,
      "External domain must be rejected"
    );

    // 5. Lookalike domains -> REJECTED
    assert.strictEqual(
      simulateReceiveMessage({ origin: "https://anpa-rabadeira-cms-test.netlify.app.evil.com", source: mockOpener }, mockOpener),
      false,
      "Lookalike canonical domain must be rejected"
    );
    assert.strictEqual(
      simulateReceiveMessage({ origin: "https://deploy-preview-17--anpa-rabadeira-cms-test.netlify.app.evil.com", source: mockOpener }, mockOpener),
      false,
      "Lookalike preview domain must be rejected"
    );

    // 6. Subdomain prefix / infix spoofing -> REJECTED
    assert.strictEqual(
      simulateReceiveMessage({ origin: "https://evil-anpa-rabadeira-cms-test.netlify.app", source: mockOpener }, mockOpener),
      false,
      "Prefix spoofed domain must be rejected"
    );
    assert.strictEqual(
      simulateReceiveMessage({ origin: "https://deploy-preview-17--evil--anpa-rabadeira-cms-test.netlify.app", source: mockOpener }, mockOpener),
      false,
      "Infix spoofed domain must be rejected"
    );

    // 7. Non-numeric preview ID and empty preview ID -> REJECTED
    assert.strictEqual(
      simulateReceiveMessage({ origin: "https://deploy-preview-abc--anpa-rabadeira-cms-test.netlify.app", source: mockOpener }, mockOpener),
      false,
      "Non-numeric PR preview must be rejected"
    );
    assert.strictEqual(
      simulateReceiveMessage({ origin: "https://deploy-preview---anpa-rabadeira-cms-test.netlify.app", source: mockOpener }, mockOpener),
      false,
      "Empty PR preview number must be rejected"
    );

    // 8. Branch deploys -> REJECTED
    assert.strictEqual(
      simulateReceiveMessage({ origin: "https://feat-test--anpa-rabadeira-cms-test.netlify.app", source: mockOpener }, mockOpener),
      false,
      "Branch deploy origin must be rejected"
    );

    // 9. Insecure HTTP protocol -> REJECTED
    assert.strictEqual(
      simulateReceiveMessage({ origin: "http://anpa-rabadeira-cms-test.netlify.app", source: mockOpener }, mockOpener),
      false,
      "HTTP canonical origin must be rejected"
    );
    assert.strictEqual(
      simulateReceiveMessage({ origin: "http://deploy-preview-17--anpa-rabadeira-cms-test.netlify.app", source: mockOpener }, mockOpener),
      false,
      "HTTP preview origin must be rejected"
    );

    // 10. Port injection & Path injection -> REJECTED
    assert.strictEqual(
      simulateReceiveMessage({ origin: "https://deploy-preview-17--anpa-rabadeira-cms-test.netlify.app:8080", source: mockOpener }, mockOpener),
      false,
      "Port-injected origin must be rejected"
    );
    assert.strictEqual(
      simulateReceiveMessage({ origin: "https://deploy-preview-17--anpa-rabadeira-cms-test.netlify.app/admin", source: mockOpener }, mockOpener),
      false,
      "Path-injected origin must be rejected"
    );

    // 11. Malformed / non-string / falsy origins -> REJECTED
    for (const badOrigin of [null, undefined, "", 12345, {}, []]) {
      assert.strictEqual(
        simulateReceiveMessage({ origin: badOrigin, source: mockOpener }, mockOpener),
        false,
        `Malformed origin ${JSON.stringify(badOrigin)} must be rejected`
      );
    }

    // 12. Legitimate origin but message from a different window/iframe -> REJECTED
    assert.strictEqual(
      simulateReceiveMessage({ origin: "https://deploy-preview-17--anpa-rabadeira-cms-test.netlify.app", source: mockDifferentWindow }, mockOpener),
      false,
      "Message from window other than window.opener must be rejected"
    );
  });

  console.log(`\nOAuth Test Summary: ${passed} passed, ${failed} failed.\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

runOAuthTests();
