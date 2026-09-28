"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  LockKeyhole,
  Upload,
  UserRound,
  Store,
  X,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { MAX_PHOTO_BYTES, validateDetails, type LoanKind } from "@/lib/loan";
import { submitLoanApplication } from "@/lib/supabase-application";
import { asset } from "@/lib/site";
function PhotoUpload({
  id,
  title,
  note,
  file,
  setFile,
}: {
  id: string;
  title: string;
  note: string;
  file: File | null;
  setFile: (file: File | null) => void;
}) {
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!file) {
      // Clearing a browser-generated object URL is an external-file synchronization.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  async function choose(f?: File) {
    if (!f) return;
    setError("");
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(f.type) ||
      f.size > MAX_PHOTO_BYTES ||
      !f.size
    ) {
      setError("Choose a JPG, PNG or WebP image up to 5 MB.");
      if (input.current) input.current.value = "";
      return;
    }
    try {
      const bitmap = await createImageBitmap(f);
      bitmap.close();
      setFile(f);
    } catch {
      setError("This image could not be opened. Please choose another.");
    }
    if (input.current) input.current.value = "";
  }
  return (
    <div className="upload-wrap">
      <span className="field-label">{title}</span>
      <div
        className={"upload-box " + (file ? "uploaded" : "")}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          void choose(e.dataTransfer.files[0]);
        }}
      >
        {preview ? (
          <>
            <img src={preview} alt={`${title} preview`} />
            <div className="file-caption">
              <CheckCircle2 size={18} />
              <span>{file?.name}</span>
              <button
                type="button"
                aria-label={`Remove ${title.toLowerCase()}`}
                onClick={() => setFile(null)}
              >
                <X size={17} />
              </button>
            </div>
          </>
        ) : (
          <button
            type="button"
            className="upload-trigger"
            onClick={() => input.current?.click()}
          >
            <Upload size={25} />
            <strong>Choose a photo</strong>
            <span>{note}</span>
            <small>JPG, PNG or WebP · up to 5 MB</small>
          </button>
        )}
        <input
          ref={input}
          id={id}
          aria-label={title}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          tabIndex={-1}
          onChange={(e) => void choose(e.target.files?.[0])}
        />
      </div>
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
export default function Apply() {
  const [kind, setKind] = useState<LoanKind>("personal");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [guarantorName, setGuarantorName] = useState("");
  const [guarantorPhone, setGuarantorPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [business, setBusiness] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [nationalIdPhoto, setNationalIdPhoto] = useState<File | null>(null);
  const [collateral, setCollateral] = useState<File | null>(null);
  const [businessLicense, setBusinessLicense] = useState<File | null>(null);
  const [step, setStep] = useState(1);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [reference, setReference] = useState("");
  const requestId = useRef("");
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (new URLSearchParams(location.search).get("type") === "business")
      // The query string is only available after the client has mounted.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setKind("business");
  }, []);
  useEffect(() => {
    if (step !== 1) heading.current?.focus();
  }, [step]);
  useEffect(() => {
    const context = (
      document as Document & {
        modelContext?: {
          registerTool: (tool: unknown, options: unknown) => Promise<void>;
        };
      }
    ).modelContext;
    if (!context) return;
    const controller = new AbortController();
    void Promise.resolve(
      context.registerTool(
        {
          name: "start_loan_application",
          description:
            "Select a personal or business loan application. Does not submit an application or upload files.",
          inputSchema: {
            type: "object",
            properties: {
              type: { type: "string", enum: ["personal", "business"] },
            },
            required: ["type"],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: false },
          execute: (input: { type: string }) => {
            if (!["personal", "business"].includes(input.type))
              throw Error("Choose personal or business.");
            setKind(input.type as LoanKind);
            setStep(1);
            return { type: input.type, status: "application_started" };
          },
        },
        { signal: controller.signal },
      ),
    ).catch(() => {});
    return () => controller.abort();
  }, []);
  function review(e: React.FormEvent) {
    e.preventDefault();
    const message = validateDetails({
      kind,
      name,
      phone,
      guarantorName,
      guarantorPhone,
      amount,
      business,
    });
    if (message || !photo || !nationalIdPhoto || !collateral) {
      setError(message || "Please add your photo, National ID photo and collateral photo.");
      return;
    }
    requestId.current = "";
    setError("");
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  async function submit() {
    if (!consent) {
      setError(
        "Please confirm that Ohio may use these details to review your request.",
      );
      return;
    }
    if (busy) return;
    setBusy(true);
    setError("");
    requestId.current ||= crypto.randomUUID();
    const form = new FormData();
    Object.entries({
      kind,
      name,
      phone,
      guarantorName,
      guarantorPhone,
      amount,
      business: kind === "business" ? business : "",
      requestId: requestId.current,
      consent: "yes",
    }).forEach(([k, v]) => form.set(k, v));
    form.set("photo", photo!);
    form.set("nationalIdPhoto", nationalIdPhoto!);
    form.set("collateral", collateral!);
    if (kind === "business" && businessLicense) form.set("businessLicense", businessLicense);
    try {
      const data = await submitLoanApplication(form);
      setReference(data.reference);
      setStep(3);
      setPhoto(null);
      setNationalIdPhoto(null);
      setCollateral(null);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Connection interrupted. Your details are still here; please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="application-page">
      <header className="nav">
        <Link className="brand" href="/">
          <img className="brand-logo" src={asset("/images/logo.png")} alt="Ohio Microfinance Limited logo" />
          <span>
            OHIO<small>MICROFINANCE LIMITED</small>
          </span>
        </Link>
        <div className="application-nav-links">
          <Link className="textlink" href="/#calculator">Calculator</Link>
          <Link className="textlink" href="/">
            <ArrowLeft size={17} /> Back to home
          </Link>
        </div>
      </header>
      <div className="application-layout">
        <aside className="application-aside">
          <span className="eyebrow">YOUR NEXT CHAPTER</span>
          <h1>
            Big plans.
            <br />
            <em>Simple start.</em>
          </h1>
          <p>A few details are all it takes to start the conversation.</p>
          <ol className="application-steps">
            <li className={step === 1 ? "active" : ""}>
              <span>{step > 1 ? <Check size={18} /> : 1}</span>
              <div>
                <strong>Your essentials</strong>
                <small>Tell us about you and your request</small>
              </div>
            </li>
            <li className={step === 2 ? "active" : ""}>
              <span>{step > 2 ? <Check size={18} /> : 2}</span>
              <div>
                <strong>Check & send</strong>
                <small>Make sure everything looks right</small>
              </div>
            </li>
          </ol>
          <div className="aside-note">
            <LockKeyhole size={22} />
            <p>
              Your photos and details are used to assess your loan request.
              Submitting an application does not guarantee approval.
            </p>
          </div>
          <img
            className="aside-photo"
            src={asset("/images/grocer.webp")}
            alt="Shop owner standing beside fresh produce"
          />
        </aside>
        <section className="application-card">
          {step === 3 ? (
            <div className="success">
              <CheckCircle2 size={58} />
              <span className="eyebrow">APPLICATION RECEIVED</span>
              <h2 ref={heading} tabIndex={-1}>
                You’ve taken
                <br />
                the first step.
              </h2>
              <p>
                Your request has been saved for review. Keep your reference
                number for any follow-up.
              </p>
              <div className="reference">
                <small>YOUR APPLICATION REFERENCE</small>
                <strong>{reference}</strong>
              </div>
              <p className="fineprint">
                This is an acknowledgement, not a loan approval. Rates,
                repayment terms and any further requirements must be agreed
                before borrowing.
              </p>
              <Link className="button" href="/">
                Back to Ohio <ArrowRight size={18} />
              </Link>
            </div>
          ) : (
            <>
              <div className="card-heading">
                <span className="eyebrow">STEP {step} OF 2</span>
                <h2 ref={heading} tabIndex={-1}>
                  {step === 1
                    ? "Let’s get you started."
                    : "Check your application."}
                </h2>
                <p>
                  {step === 1
                    ? "Just the essentials. No lengthy paperwork to get started."
                    : "Take a moment to check your details before sending."}
                </p>
              </div>
              {step === 1 ? (
                <>
                  <Tabs
                    value={kind}
                    onValueChange={(v) => {
                      setKind(v as LoanKind);
                      setError("");
                    }}
                  >
                    <TabsList className="loan-tabs" aria-label="Loan type">
                      <TabsTrigger value="personal">
                        <UserRound /> Personal loan
                      </TabsTrigger>
                      <TabsTrigger value="business">
                        <Store /> Business loan
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="personal">
                      <p className="type-description">
                        For your personal goals and everyday priorities.
                      </p>
                    </TabsContent>
                    <TabsContent value="business">
                      <p className="type-description">
                        For stock, equipment and the next step for your
                        business.
                      </p>
                    </TabsContent>
                  </Tabs>
                  <form onSubmit={review}>
                    <div className="field-grid">
                      <label className="full">
                        Full name
                        <Input
                          autoComplete="name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                          maxLength={100}
                          placeholder="Your full name"
                        />
                      </label>
                      <label>
                        Phone number
                        <Input
                          type="tel"
                          autoComplete="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          required
                          maxLength={25}
                          placeholder="e.g. +265 888 123 456"
                        />
                      </label>
                      <label>
                        Loan amount (MWK)
                        <Input
                          inputMode="decimal"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          required
                          placeholder="e.g. 250000"
                        />
                      </label>
                      <label className="full">
                        Guarantor full name
                        <Input
                          value={guarantorName}
                          onChange={(e) => setGuarantorName(e.target.value)}
                          required
                          maxLength={100}
                          placeholder="Guarantor full name"
                        />
                      </label>
                      <label className="full">
                        Guarantor phone number
                        <Input
                          type="tel"
                          value={guarantorPhone}
                          onChange={(e) => setGuarantorPhone(e.target.value)}
                          required
                          maxLength={25}
                          placeholder="e.g. +265 888 123 456"
                        />
                      </label>
                      {kind === "business" && (
                        <label className="full">
                          Business name
                          <Input
                            autoComplete="organization"
                            value={business}
                            onChange={(e) => setBusiness(e.target.value)}
                            required
                            maxLength={150}
                            placeholder="The name of your business"
                          />
                        </label>
                      )}
                    </div>
                    <div className="upload-heading">
                      <h3>{kind === "business" ? "Your documents and photos" : "Two photos, and you’re set."}</h3>
                      <p>
                        Add a clear photo of yourself and the item you offer as collateral.
                        {kind === "business" ? " You may also include your business licence if available." : ""}
                      </p>
                    </div>
                    <div className="upload-grid">
                      <PhotoUpload
                        id="applicant-photo"
                        title="Your photo"
                        note="A clear photo of your face"
                        file={photo}
                        setFile={setPhoto}
                      />
                      <PhotoUpload
                        id="national-id-photo"
                        title="National ID photo"
                        note="Upload a clear photo of your National ID"
                        file={nationalIdPhoto}
                        setFile={setNationalIdPhoto}
                      />
                      <PhotoUpload
                        id="collateral-photo"
                        title="Collateral photo"
                        note="Show the item clearly"
                        file={collateral}
                        setFile={setCollateral}
                      />
                      {kind === "business" && (
                        <PhotoUpload
                          id="business-license"
                          title="Business licence (optional)"
                          note="Upload a clear photo if available"
                          file={businessLicense}
                          setFile={setBusinessLicense}
                        />
                      )}
                    </div>
                    {error && (
                      <p className="form-error" role="alert">
                        {error}
                      </p>
                    )}
                    <button className="button form-next" type="submit">
                      Review application <ArrowRight size={19} />
                    </button>
                    <p className="fineprint">
                      All fields above are required. Loan terms are confirmed
                      during review.
                    </p>
                  </form>
                </>
              ) : (
                <>
                  <dl className="review-details">
                    <div>
                      <dt>Loan type</dt>
                      <dd>
                        {kind === "personal"
                          ? "Personal loan"
                          : "Business loan"}
                      </dd>
                    </div>
                    <div>
                      <dt>Full name</dt>
                      <dd>{name}</dd>
                    </div>
                    <div>
                      <dt>Phone number</dt>
                      <dd>{phone}</dd>
                    </div>
                    <div>
                      <dt>National ID</dt>
                      <dd>Photo attached</dd>
                    </div>
                    <div>
                      <dt>Guarantor</dt>
                      <dd>{guarantorName}</dd>
                    </div>
                    <div>
                      <dt>Guarantor phone</dt>
                      <dd>{guarantorPhone}</dd>
                    </div>
                    <div>
                      <dt>Requested amount</dt>
                      <dd>
                        MWK{" "}
                        {Number(amount).toLocaleString("en-MW", {
                          maximumFractionDigits: 2,
                        })}
                      </dd>
                    </div>
                    {kind === "business" && (
                      <div>
                        <dt>Business name</dt>
                        <dd>{business}</dd>
                      </div>
                    )}
                    <div>
                      <dt>Photos</dt>
                      <dd>
                        Your photo, National ID photo & collateral photo attached
                        {kind === "business"
                          ? businessLicense
                            ? "; business licence attached"
                            : "; business licence not attached (optional)"
                          : ""}
                      </dd>
                    </div>
                  </dl>
                  <div className="consent">
                    <Checkbox
                      id="consent"
                      checked={consent}
                      onCheckedChange={(v) => setConsent(v === true)}
                    />
                    <label htmlFor="consent">
                      I confirm these details are correct and agree that Ohio
                      Microfinance Limited may use my details and photos to
                      review this request and contact me about it.
                    </label>
                  </div>
                  {error && (
                    <p className="form-error" role="alert">
                      {error}
                    </p>
                  )}
                  <div className="review-actions">
                    <button
                      disabled={busy}
                      type="button"
                      className="textlink"
                      onClick={() => {
                        setStep(1);
                        setError("");
                      }}
                    >
                      Edit details
                    </button>
                    <button
                      disabled={busy}
                      className="button"
                      type="button"
                      onClick={submit}
                    >
                      {busy ? "Sending…" : "Send application"}{" "}
                      <ArrowRight size={19} />
                    </button>
                  </div>
                  <p className="fineprint">
                    You are requesting a review, not accepting a loan agreement.
                  </p>
                </>
              )}
            </>
          )}
        </section>
      </div>
      <footer className="application-footer">
        © {new Date().getFullYear()} Ohio Microfinance Limited
      </footer>
    </main>
  );
}
