const SUPABASE_URL = "https://hycgfmdyujfqfbinsuxx.supabase.co";
const SUPABASE_KEY = "sb_publishable_0HZGlLuuA5xUSu6TcFmS3w_1TQ-IuOf";
const COMPANY_ID = "0003";
const headers = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` };

function objectUrl(bucket: string, path: string) {
  return `${SUPABASE_URL}/storage/v1/object/${bucket}/${path.split("/").map(encodeURIComponent).join("/")}`;
}

export async function submitLoanApplication(form: FormData) {
  const str = (key: string) => String(form.get(key) || "").trim();
  const id = str("requestId");
  const kind = str("kind");
  const businessLicense = form.get("businessLicense");
  const definitions = [
    { field: "photo", bucket: "applicant-photos", documentType: "Applicant Photo" },
    { field: "nationalIdPhoto", bucket: "national-id-documents", documentType: "National ID Photo" },
    { field: "collateral", bucket: "collateral-documents", documentType: "Collateral Photo" },
    ...(kind === "business" && businessLicense instanceof File
      ? [{ field: "businessLicense", bucket: "business-licences", documentType: "Business Licence" }]
      : []),
  ];
  const files = definitions.map((definition) => {
    const file = form.get(definition.field);
    if (!(file instanceof File)) throw new Error("Add all required application images.");
    const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    return { ...definition, file, path: `${COMPANY_ID}/${id}/${definition.field}.${extension}` };
  });

  for (const item of files) {
    const upload = await fetch(objectUrl(item.bucket, item.path), {
      method: "POST",
      headers: { ...headers, "Content-Type": item.file.type, "x-upsert": "false" },
      body: item.file,
    });
    if (!upload.ok && upload.status !== 409) throw new Error("An image could not be uploaded. Please try again.");
  }

  const reference = `OHIO-${id.toUpperCase()}`;
  const name = str("name");
  const phone = str("phone");
  const guarantorName = str("guarantorName");
  const guarantorPhone = str("guarantorPhone");
  const amount = Number(str("amount"));
  const business = str("business");
  const submittedAt = new Date().toISOString();
  const documentUrls = files.map((item) => ({ bucket: item.bucket, path: item.path, type: item.documentType }));
  const application = {
    id, company_id: COMPANY_ID, customer_name: name, full_name: name, phone, national_id: null,
    amount, loan_amount: amount, status: "Pending", guarantor_name: guarantorName, guarantor_phone: guarantorPhone,
    business_name: kind === "business" ? business : null,
    form_type: kind === "business" ? "Business Loan" : "Personal Loan",
    form_data: { source: "Ohio website", reference, submittedAt, loanType: kind, fullName: name, phone, nationalIdPhotoProvided: true, loanAmount: amount, guarantorName, guarantorPhone, ...(kind === "business" ? { businessName: business } : {}) },
    document_urls: documentUrls,
  };
  const appInsert = await fetch(`${SUPABASE_URL}/rest/v1/loan_applications`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify(application),
  });
  if (!appInsert.ok && appInsert.status !== 409) throw new Error("The application could not be saved. Please try again.");
  if (appInsert.status !== 409) {
    const documents = files.map((item) => ({ company_id: COMPANY_ID, application_id: id, document_type: item.documentType, bucket: item.bucket, file_name: item.path, file_url: objectUrl(item.bucket, item.path) }));
    const docsInsert = await fetch(`${SUPABASE_URL}/rest/v1/customer_documents`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify(documents),
    });
    if (!docsInsert.ok) throw new Error("The application documents could not be linked. Please contact Ohio with your reference number.");
  }
  return { reference };
}
