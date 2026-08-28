import { useRef, useState } from "react";
import { useStore } from "../data/store";
import { Button, Field, Input, Segmented } from "../components/ui/ui";
import { Icon } from "../components/Icon";
import "./auth.css";

type Mode = "signin" | "signup";
type Step = "phone" | "otp";

export function Auth({ onBack }: { onBack: () => void }) {
  const { login, signup, theme, toggleTheme } = useStore();
  const [mode, setMode] = useState<Mode>("signin");
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [err, setErr] = useState("");
  const boxes = useRef<(HTMLInputElement | null)[]>([]);

  const fullPhone = () => "+91 " + phone.replace(/\D/g, "").replace(/(\d{5})(\d{0,5})/, "$1 $2").trim();

  const sendCode = () => {
    setErr("");
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) { setErr("Enter a 10-digit mobile number."); return; }
    if (mode === "signup" && !name.trim()) { setErr("Please tell us your name."); return; }
    setStep("otp");
    setTimeout(() => boxes.current[0]?.focus(), 60);
  };

  const verify = () => {
    setErr("");
    if (otp.join("").length < 4) { setErr("Enter the 4-digit code."); return; }
    if (mode === "signin") {
      const u = login(fullPhone());
      if (!u) { setErr("No account with this number. Switch to Sign up to create one."); setStep("phone"); }
    } else {
      signup(name.trim(), fullPhone());
    }
  };

  const setDigit = (i: number, v: string) => {
    const d = v.replace(/\D/g, "").slice(-1);
    setOtp(o => o.map((x, j) => (j === i ? d : x)));
    if (d && i < 3) boxes.current[i + 1]?.focus();
  };

  return (
    <div className="auth">
      <button className="auth-theme" onClick={toggleTheme} title="Toggle appearance" aria-label="Toggle appearance">
        <Icon name={theme === "light" ? "moon" : "sun"} size={17} />
      </button>
      <div className="auth-card">
        <div className="auth-top">
          <div className="mark">S</div>
          <h2>{step === "otp" ? "Verify your number" : mode === "signin" ? "Welcome back" : "Create your account"}</h2>
          <p>
            {step === "otp"
              ? <>We sent a code to <b>{fullPhone()}</b></>
              : "One portal for your whole family. Track orders, fittings and payments."}
          </p>
          {step === "phone" && (
            <div className="auth-seg">
              <Segmented<Mode> value={mode} onChange={m => { setMode(m); setErr(""); }}
                options={[{ value: "signin", label: "Sign in" }, { value: "signup", label: "Sign up" }]} />
            </div>
          )}
        </div>

        <div className="auth-body">
          {err && <div className="auth-err">{err}</div>}

          {step === "phone" ? (
            <>
              {mode === "signup" && (
                <Field label="Your name"><Input value={name} placeholder="e.g. Anjali Sharma" onChange={e => setName(e.target.value)} /></Field>
              )}
              <Field label="Mobile number">
                <div className="phone-field">
                  <span className="cc">+91</span>
                  <input inputMode="numeric" value={phone} placeholder="98765 43210"
                    onChange={e => setPhone(e.target.value)} onKeyDown={e => e.key === "Enter" && sendCode()} />
                </div>
              </Field>
              <Button variant="primary" onClick={sendCode}>Send code →</Button>
              <div className="auth-hint">
                Demo accounts, tap to fill:<br />
                <code onClick={() => { setMode("signin"); setPhone("90000 00000"); }}>Owner · 90000 00000</code>{" "}
                <code onClick={() => { setMode("signin"); setPhone("98110 20304"); }}>Family · 98110 20304</code>
              </div>
            </>
          ) : (
            <>
              <div className="otp">
                {otp.map((d, i) => (
                  <input key={i} ref={el => (boxes.current[i] = el)} value={d} inputMode="numeric" maxLength={1}
                    onChange={e => setDigit(i, e.target.value)}
                    onKeyDown={e => { if (e.key === "Backspace" && !otp[i] && i > 0) boxes.current[i - 1]?.focus(); if (e.key === "Enter") verify(); }} />
                ))}
              </div>
              <div className="auth-hint">This is a demo. <code onClick={() => setOtp(["0", "0", "0", "0"])}>Any 4 digits</code> will verify.</div>
              <Button variant="primary" onClick={verify}>{mode === "signin" ? "Sign in" : "Create account"}</Button>
              <button className="btn btn-ghost" onClick={() => { setStep("phone"); setOtp(["", "", "", ""]); }}><Icon name="back" size={14} /> Change number</button>
            </>
          )}
        </div>

        <div className="auth-foot">
          <button onClick={onBack}>Back to showcase</button>
        </div>
      </div>
    </div>
  );
}
