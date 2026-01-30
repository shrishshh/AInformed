export async function queryPerplexity(prompt: string) {
      // TEMP: Disable during development to preserve API quota. Remove to re-enable.
    return "Perplexity API is disabled during development to preserve API quota.";
    /*
    const res = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar-pro",
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: prompt },
        ],
      }),
    });
  console.log(res);
    const data = await res.json();
    return data.choices[0].message.content;
    */
  }