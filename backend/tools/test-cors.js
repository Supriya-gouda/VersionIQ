import fetch from "node-fetch";

async function run() {
  const url = "http://localhost:4000/auth/register";
  console.log("OPTIONS preflight to", url);
  const pre = await fetch(url, {
    method: "OPTIONS",
    headers: {
      Origin: "http://localhost:8081",
      "Access-Control-Request-Method": "POST",
    },
  });
  console.log("Status", pre.status);
  console.log("Headers:");
  for (const [k, v] of pre.headers) console.log(k, ":", v);

  console.log("\nPOST attempt (no body)");
  const post = await fetch(url, {
    method: "POST",
    headers: {
      Origin: "http://localhost:8081",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name: "x", email: "x@x.com", password: "Password123!" }),
  });
  console.log("POST Status", post.status);
  console.log("POST Headers:");
  for (const [k, v] of post.headers) console.log(k, ":", v);
  const text = await post.text();
  console.log("Body:", text);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
