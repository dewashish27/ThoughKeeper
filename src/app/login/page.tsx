"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase";

import styles from "./page.module.css";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();

    setMessage("");
    setLoading(true);

    try {
      // --------------------------------
      // 1. Login with Supabase
      // --------------------------------

      const { data, error } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (error) {
        setMessage(error.message);
        return;
      }

      if (!data.session) {
        setMessage(
          "Login succeeded, but no session was created."
        );
        return;
      }

      // --------------------------------
      // 2. Get access token
      // --------------------------------

      const accessToken = data.session.access_token;

      // --------------------------------
      // 3. Verify token with FastAPI
      // --------------------------------

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/test`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();

        console.error(
          "Backend authentication failed:",
          errorText
        );

        setMessage(
          "Login succeeded, but backend authentication failed."
        );

        return;
      }

      const backendUser = await response.json();

      console.log(
        "Backend authenticated user:",
        backendUser
      );

      // --------------------------------
      // 4. Go to Thoughts
      // --------------------------------

      router.push("/thoughts");
      router.refresh();
    } catch (error) {
      console.error(error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.loginGate}>
      <div className={styles.loginCard}>

        {/* Brand */}

        <div className={styles.brand}>
          life<span>journey</span>
        </div>

        <div className={styles.subtitle}>
          Your thoughts are personal. Sign in to continue.
        </div>

        {/* Login form */}

        <form
          onSubmit={handleLogin}
          className={styles.form}
        >

          <div className={styles.field}>
            <label htmlFor="email">
              Email
            </label>

            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              required
              autoComplete="email"
              disabled={loading}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="password">
              Password
            </label>

            <input
              id="password"
              type="password"
              placeholder="Your password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              required
              autoComplete="current-password"
              disabled={loading}
            />
          </div>

          {message && (
            <div className={styles.loginError}>
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={styles.loginButton}
          >
            {loading && <span className={styles.loginSpinner} />}
            {loading
              ? "Boarding..."
              : "Board the train"}
          </button>
        </form>

        <div className={styles.loginHint}>
          Your journey is private. Your thoughts belong
          to you.
        </div>

      </div>
    </main>
  );
}