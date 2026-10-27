export default function SetupPage() {
  return (
    <div className="prose-sm max-w-3xl space-y-8 text-groww-text">
      <div>
        <h1 className="text-2xl font-semibold">Setup (for you, as PM)</h1>
        <p className="mt-2 text-sm leading-6 text-groww-muted">
          You only need to create four accounts and paste two values. I already
          built the app. Do these steps once, locally, in this order.
        </p>
      </div>

      <section className="rounded-2xl border border-groww-line p-5">
        <h2 className="text-base font-semibold">0. Create the env file</h2>
        <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm leading-6">
          <li>
            In this project folder, copy <code>.env.example</code> and rename the copy to{" "}
            <code>.env.local</code>.
          </li>
          <li>You will paste Neon and Groq values into that file. Never put keys in GitHub.</li>
        </ol>
      </section>

      <section className="rounded-2xl border border-groww-line p-5">
        <h2 className="text-base font-semibold">1. Groq (AI) — required</h2>
        <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm leading-6">
          <li>
            Open{" "}
            <a className="text-groww-greenDark" href="https://console.groq.com" target="_blank">
              console.groq.com
            </a>{" "}
            and sign up.
          </li>
          <li>Go to API Keys → Create API Key. Copy it (starts with gsk_).</li>
          <li>
            In <code>.env.local</code> set:
            <pre className="mt-2 rounded-xl bg-groww-wash p-3 text-xs">GROQ_API_KEY=gsk_your_key</pre>
          </li>
        </ol>
      </section>

      <section className="rounded-2xl border border-groww-line p-5">
        <h2 className="text-base font-semibold">2. Neon (database) — required</h2>
        <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm leading-6">
          <li>
            Open{" "}
            <a className="text-groww-greenDark" href="https://console.neon.tech" target="_blank">
              console.neon.tech
            </a>{" "}
            and sign up.
          </li>
          <li>Create a project. Any region is fine. Name it groww-discovery.</li>
          <li>Open Dashboard → Connect. Copy the connection string (it starts with postgresql://).</li>
          <li>
            In <code>.env.local</code> set:
            <pre className="mt-2 rounded-xl bg-groww-wash p-3 text-xs">
              DATABASE_URL=postgresql://...
            </pre>
          </li>
          <li>You do not need to create tables. The app creates them on first run.</li>
        </ol>
      </section>

      <section className="rounded-2xl border border-groww-line p-5">
        <h2 className="text-base font-semibold">3. Run it on your laptop</h2>
        <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm leading-6">
          <li>Open a terminal in this folder.</li>
          <li>
            Run <code>npm install</code> then <code>npm run dev</code>.
          </li>
          <li>
            Open{" "}
            <a className="text-groww-greenDark" href="http://localhost:3000">
              http://localhost:3000
            </a>
            .
          </li>
          <li>
            Click <b>1. Collect</b>, then click <b>2. Extract batch</b> a few times until
            Analysed ≈ Conversations, then click <b>3. Themes & opportunities</b>.
          </li>
        </ol>
      </section>

      <section className="rounded-2xl border border-groww-line p-5">
        <h2 className="text-base font-semibold">4. GitHub — required for Vercel</h2>
        <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm leading-6">
          <li>
            Open{" "}
            <a className="text-groww-greenDark" href="https://github.com/new" target="_blank">
              github.com/new
            </a>
            . Create a <b>private</b> repository. Do not add a README.
          </li>
          <li>Copy the repo URL (https://github.com/YOU/groww-discovery-engine.git).</li>
          <li>
            In a terminal in this folder:
            <pre className="mt-2 rounded-xl bg-groww-wash p-3 text-xs">{`git init
git add .
git commit -m "Add SIP discovery engine"
git branch -M main
git remote add origin https://github.com/YOU/groww-discovery-engine.git
git push -u origin main`}</pre>
          </li>
          <li>Confirm <code>.env.local</code> is not on GitHub (it is in .gitignore).</li>
        </ol>
      </section>

      <section className="rounded-2xl border border-groww-line p-5">
        <h2 className="text-base font-semibold">5. Vercel (live website) — required</h2>
        <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm leading-6">
          <li>
            Open{" "}
            <a className="text-groww-greenDark" href="https://vercel.com/new" target="_blank">
              vercel.com/new
            </a>{" "}
            and sign in with GitHub.
          </li>
          <li>Import the repository you just pushed.</li>
          <li>
            Framework: Next.js (auto). Before Deploy, open Environment Variables and add the
            same two as local:
            <ul className="mt-1 list-disc pl-5">
              <li>
                <code>DATABASE_URL</code>
              </li>
              <li>
                <code>GROQ_API_KEY</code>
              </li>
            </ul>
          </li>
          <li>Click Deploy. When it finishes, open the .vercel.app URL.</li>
          <li>Run Collect → Extract → Themes again on the live site (the cloud database starts empty).</li>
        </ol>
      </section>

      <section className="rounded-2xl border border-groww-line p-5">
        <h2 className="text-base font-semibold">Optional: YouTube comments</h2>
        <p className="mt-2 text-sm leading-6 text-groww-muted">
          Only if you want a fourth live source. Google Cloud → create a project → enable
          YouTube Data API v3 → create an API key. Add{" "}
          <code>YOUTUBE_API_KEY=...</code> to <code>.env.local</code> and to Vercel.
        </p>
      </section>
    </div>
  );
}
