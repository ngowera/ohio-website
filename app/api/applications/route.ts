import { MAX_PHOTO_BYTES, validateDetails } from "@/lib/loan";

const SUPABASE_URL = "https://hycgfmdyujfqfbinsuxx.supabase.co";
const SUPABASE_KEY = "sb_publishable_0HZGlLuuA5xUSu6TcFmS3w_1TQ-IuOf";
const COMPANY_ID = "0001";
const MAX_REQUEST_BYTES = MAX_PHOTO_BYTES * 3 + 65_536;
const json = (value: unknown, status = 200) => Response.json(value, { status, headers: { "Cache-Control": "no-store" } });
const supabaseHeaders = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` };

function isValidImage(bytes: Uint8Array, type: string) {
  const png = bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71;
  const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  const webp = String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  return (type === "image/png" && png) || (type === "image/jpeg" && jpeg) || (type === "image/webp" && webp);
}
function objectUrl(bucket: string, path: string) {
  return `${SUPABASE_URL}/storage/v1/object/${bucket}/${path.split("/").map(encodeURIComponent).join("/")}`;
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return json({ error: "Please submit from the Ohio website." }, 403);
  if (!request.headers.get("content-type")?.startsWith("multipart/form-data")) return json({ error: "Invalid application format." }, 400);
  const reader = request.body?.getReader();
  if (!reader) return json({ error: "Application is empty." }, 400);
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_REQUEST_BYTES) {
      await reader.cancel();
      return json({ error: "Each uploaded image must be 5 MB or smaller." }, 413);
    }
    chunks.push(value);
  }

  try {
    const form = await new Response(new Blob(chunks as BlobPart[]), { headers: { "Content-Type": request.headers.get("content-type")! } }).formData();
    const str = (key: string) => String(form.get(key) || "").trim();
    const details = { kind: str("kind"), name: str("name"), phone: str("phone"), nationalId: str("nationalId").replace(/[\s-]+/g, ""), guarantorName: str("guarantorName"), guarantorPhone: str("guarantorPhone"), amount: str("amount"), business: str("business") };
    const validationError = validateDetails(details);
    if (validationError) return json({ error: validationError }, 400);
    if (str("consent") !== "yes") return json({ error: "Please confirm permission to review your request." }, 400);
    const id = str("requestId");
    if (!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(id)) return json({ error: "Invalid request. Please review your application again." }, 400);

    const definitions = [
      { field: "photo", bucket: "applicant-photos", documentType: "Applicant Photo" },
      { field: "collateral", bucket: "collateral-documents", documentType: "Collateral Photo" },
      ...(details.kind === "business" ? [{ field: "businessLicense", bucket: "business-licences", documentType: "Business Licence" }] : []),
    ];
    const files: Array<{ bucket: string; documentType: string; file: File; bytes: Uint8Array; path: string }> = [];
    for (const definition of definitions) {
      const file = form.get(definition.field);
      if (!(file instanceof File) || !file.size || file.size > MAX_PHOTO_BYTES || !["image/jpeg", "image/png", "image/webp"].includes(file.type)) return json({ error: "Add all required JPG, PNG or WebP images up to 5 MB each." }, 400);
      const bytes = new Uint8Array(await file.arrayBuffer());
      if (!isValidImage(bytes, file.type)) return json({ error: "An uploaded image is not valid. Please choose another." }, 400);
      const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
      files.push({ ...definition, file, bytes, path: `${COMPANY_ID}/${id}/${definition.field}.${extension}` });
    }

    for (const item of files) {
      const upload = await fetch(objectUrl(item.bucket, item.path), { method: "POST", headers: { ...supabaseHeaders, "Content-Type": item.file.type, "x-upsert": "false" }, body: item.bytes });
      if (!upload.ok && upload.status !== 409) throw new Error(`Storage upload failed: ${upload.status}`);
    }

    const reference = `OHIO-${id.toUpperCase()}`;
    const submittedAt = new Date().toISOString();
    const documentUrls = files.map((item) => ({ bucket: item.bucket, path: item.path, type: item.documentType }));
    const application = {
      id, company_id: COMPANY_ID, customer_name: details.name, full_name: details.name, phone: details.phone,
      national_id: details.nationalId, amount: Number(details.amount), loan_amount: Number(details.amount), status: "Pending",
      guarantor_name: details.guarantorName, guarantor_phone: details.guarantorPhone,
      business_name: details.kind === "business" ? details.business : null,
      form_type: details.kind === "business" ? "Business Loan" : "Personal Loan",
      form_data: { source: "Ohio website", reference, submittedAt, loanType: details.kind, fullName: details.name, phone: details.phone, nationalId: details.nationalId, loanAmount: Number(details.amount), guarantorName: details.guarantorName, guarantorPhone: details.guarantorPhone, ...(details.kind === "business" ? { businessName: details.business } : {}) },
      document_urls: documentUrls,
    };
    const appInsert = await fetch(`${SUPABASE_URL}/rest/v1/loan_applications`, { method: "POST", headers: { ...supabaseHeaders, "Content-Type": "application/json", Prefer: "return=minimal" }, body: JSON.stringify(application) });
    if (!appInsert.ok && appInsert.status !== 409) throw new Error(`Application insert failed: ${appInsert.status}`);
    if (appInsert.status !== 409) {
      const documents = files.map((item) => ({ company_id: COMPANY_ID, application_id: id, document_type: item.documentType, bucket: item.bucket, file_name: item.path, file_url: objectUrl(item.bucket, item.path) }));
      const docsInsert = await fetch(`${SUPABASE_URL}/rest/v1/customer_documents`, { method: "POST", headers: { ...supabaseHeaders, "Content-Type": "application/json", Prefer: "return=minimal" }, body: JSON.stringify(documents) });
      if (!docsInsert.ok) throw new Error(`Document metadata insert failed: ${docsInsert.status}`);
    }
    return json({ reference }, 201);
  } catch (error) {
    console.error("Supabase application submission failed", error);
    return json({ error: "We could not save your application. Your details are still here; please try again." }, 503);
  }
}
