import { useState } from "react";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    const res = await fetch("/api/newsletter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (data.success) {
      setStatus("success");
      setEmail("");
    } else {
      setStatus(data.error || "error");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 max-w-sm mx-auto">
      <input
        type="email"
        required
        placeholder="Enter your email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        className="border rounded px-3 py-2"
      />
      <button type="submit" disabled={status === "loading"} className="bg-blue-600 text-white rounded px-4 py-2">
        {status === "loading" ? "Subscribing..." : "Subscribe"}
      </button>
      {status === "success" && <p className="text-green-600">Subscribed!</p>}
      {status && status !== "success" && status !== "loading" && <p className="text-red-600">{status}</p>}
    </form>
  );
} 