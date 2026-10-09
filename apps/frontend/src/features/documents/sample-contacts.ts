import type { Workspace } from "@retrosum/contracts";
import { sampleAssets } from "./sample-assets";

/** Owner-authored demo contact profiles, not PDF transcription or real mailboxes. */
const emails: Readonly<Record<string, string>> = {
  "cedar works": "cedar.works@retrosum.com",
  "maple retail": "maple.retail@retrosum.com",
  "northstar supplies": "northstar.supplies@retrosum.com",
  "cove spaces": "cove.spaces@retrosum.com",
  papercloud: "papercloud@retrosum.com",
  framecraft: "framecraft@retrosum.com",
  "beacon media": "beacon.media@retrosum.com",
};

export function withSampleContactEmails(
  workspace: Workspace,
  existingContactIds: ReadonlySet<string> = new Set(),
): Workspace {
  const prefixes = workspace.documents
    .filter(
      (doc) =>
        ["synthetic", "synthetic_handwriting"].includes(doc.provenance) &&
        sampleAssets.some((asset) => asset.id === doc.id && asset.sha256 === doc.sha256),
    )
    .map((doc) => `contact_${doc.id.replace(/^document_/u, "")}_`);
  let changed = false;
  const contacts = workspace.contacts.map((contact) => {
    const email = emails[contact.name.trim().toLowerCase()];
    if (
      !email ||
      contact.email ||
      existingContactIds.has(contact.id) ||
      !prefixes.some((prefix) => contact.id.startsWith(prefix))
    )
      return contact;
    changed = true;
    return { ...contact, email };
  });
  return changed ? { ...workspace, contacts } : workspace;
}
