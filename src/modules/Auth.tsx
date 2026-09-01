import { useRef, useState } from "react";
import { useStore } from "../data/store";
import { Avatar, Button, Field, Input, Segmented } from "../components/ui/ui";
import { Icon } from "../components/Icon";
import type { Customer } from "../data/types";
import "./auth.css";

type Role = "customer" | "staff";
type Step = "phone" | "otp" | "household" | "signup";

export function Auth({ onBack }: { onBack: () => void }) {
  const { staffLogin, customersForPhone, customerLogin, customerSignup, theme, toggleTheme } = useStore();
  const [role, setRole] = useState<Role>("customer");
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [household, setHousehold] = useState<Customer[]>([]);
  const [err, setErr] = useState("");
  const boxes = useRef<(HTMLInputElement | null)[]>([]);

  // `phone` holds digits only (max 10); this keeps letters and symbols
  // out of the field entirely, so nothing but a real mobile number passes.
  const digits = phone.replace(/\D/g, "").slice(0, 10);
  const fmtLocal = (d: string) => (d.length > 5 ? `${d.slice(0, 5)} ${d.slice(5)}` : d);
  const fullPhone = () => `+91 ${fmtLocal(digits)}`.trim();
  const reset = (r: Role) => { setRole(r); setStep("phone"); setErr(""); setOtp(["", "", "", ""]); setHousehold([]); };

  const sendCode = () => {
    setErr("");
    if (digits.length !== 10) { setErr("Enter a valid 10-digit mobile number."); return; }
    setStep("otp");
    setTimeout(() => boxes.current[0]?.focus(), 60);
  };

  const verify = () => {
    setErr("");
    if (otp.join("").length < 4) { setErr("Enter the 4-digit code."); return; }
    if (role === "staff") {
      if (!staffLogin(fullPhone())) setErr("No staff console for this number. Ask the owner, or use a customer sign-in.");
      return;
    }
    const list = customersForPhone(fullPhone());
    if (list.length) { setHousehold(list); setStep("household"); }
    else setStep("signup");
  };

  const setDigit = (i: number, v: string) => {
    const d = v.replace(/\D/g, "").slice(-1);
    setOtp(o => o.map((x, j) => (j === i ? d : x)));
    if (d && i < 3) boxes.current[i + 1]?.focus();
  };

  const heading = step === "household" ? "Who's this?"
    : step === "signup" ? "Create your profile"
    : step === "otp" ? "Verify your number"
    : role === "staff" ? "Staff console" : "Welcome";

  return (
    <div className="auth">
      <button className="auth-theme" onClick={toggleTheme} title="Toggle appearance" aria-label="Toggle appearance">
        <Icon name={theme === "light" ? "moon" : "sun"} size={17} />
      </button>
      <div className="auth-card">
        <div className="auth-top">
          <div className="mark">S</div>
          <h2>{heading}</h2>
          <p>
            {step === "otp" ? <>We sent a code to <b>{fullPhone()}</b></>
              : step === "household" ? "More than one profile uses this number. Pick yours."
              : step === "signup" ? "A separate profile is created for you, even on a shared number."
              : role === "staff" ? "For shop staff and the owner." : "Track your orders, fittings and measurements."}
          </p>
          {step === "phone" && (
            <div className="auth-seg">
              <Segmented<Role> value={role} onChange={reset}
                options={[{ value: "customer", label: "Customer" }, { value: "staff", label: "Staff console" }]} />
            </div>
          )}
        </div>

        <div className="auth-body">
          {err && <div className="auth-err">{err}</div>}

          {step === "phone" && (
            <>
              <Field label="Mobile number">
                <div className="phone-field">
                  <span className="cc">+91</span>
                  <input inputMode="numeric" maxLength={11} value={fmtLocal(digits)} placeholder="98765 43210"
                    onChange={e => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    onKeyDown={e => e.key === "Enter" && sendCode()} autoFocus />
                </div>
              </Field>
              <Button variant="primary" disabled={digits.length !== 10} onClick={sendCode}>Send code →</Button>
              <div className="auth-hint">
                Demo — tap to fill:<br />
                {role === "staff"
                  ? <code onClick={() => setPhone("9000000000")}>Owner · 90000 00000</code>
                  : <code onClick={() => setPhone("9811020304")}>Sharma household · 98110 20304</code>}
              </div>
            </>
          )}

          {step === "otp" && (
            <>
              <div className="otp">
                {otp.map((d, i) => (
                  <input key={i} ref={el => (boxes.current[i] = el)} value={d} inputMode="numeric" maxLength={1}
                    onChange={e => setDigit(i, e.target.value)}
                    onKeyDown={e => { if (e.key === "Backspace" && !otp[i] && i > 0) boxes.current[i - 1]?.focus(); if (e.key === "Enter") verify(); }} />
                ))}
              </div>
              <div className="auth-hint">Demo — <code onClick={() => setOtp(["0", "0", "0", "0"])}>any 4 digits</code> verify.</div>
              <Button variant="primary" onClick={verify}>{role === "staff" ? "Open console" : "Continue"}</Button>
              <button className="btn btn-ghost" onClick={() => { setStep("phone"); setOtp(["", "", "", ""]); }}><Icon name="back" size={14} /> Change number</button>
            </>
          )}

          {step === "household" && (
            <>
              <div className="household">
                {household.map(c => (
                  <button className="hh-row" key={c.id} onClick={() => customerLogin(c.id)}>
                    <Avatar name={c.name} />
                    <div className="grow"><div className="hh-name">{c.name}</div><div className="hh-id">{c.id}</div></div>
                    <Icon name="chevron" size={16} />
                  </button>
                ))}
              </div>
              <button className="btn btn-ghost" onClick={() => { setName(""); setStep("signup"); }}>
                <Icon name="plus" size={14} /> Someone else — add a member
              </button>
            </>
          )}

          {step === "signup" && (
            <>
              <Field label="Your name"><Input value={name} placeholder="e.g. Anjali Sharma" autoFocus onChange={e => setName(e.target.value)} onKeyDown={e => e.key === "Enter" && name.trim() && customerSignup(name.trim(), fullPhone())} /></Field>
              <p className="auth-hint" style={{ textAlign: "left" }}>Number: <b>{fullPhone()}</b> — you'll get your own Customer ID.</p>
              <Button variant="primary" disabled={!name.trim()} onClick={() => customerSignup(name.trim(), fullPhone())}>Create profile</Button>
              {household.length > 0 && <button className="btn btn-ghost" onClick={() => setStep("household")}><Icon name="back" size={14} /> Back to household</button>}
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
