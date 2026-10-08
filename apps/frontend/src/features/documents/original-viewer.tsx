"use client";
import { useEffect, useState } from "react";
import type { SourceReference } from "@retrosum/contracts";
import { useSession } from "../session/session-provider";
import { sampleAssets } from "./sample-assets";
import { PdfViewer, type ViewerAsset } from "./pdf-viewer";
import { PaperDialog } from "../../components/ui/paper-dialog";

export function OriginalViewer({
  target,
  onClose,
}: {
  target: SourceReference | null;
  onClose(): void;
}) {
  const { controller } = useSession();
  const [selection, setSelection] = useState<{
    asset: ViewerAsset;
    target: SourceReference;
  } | null>(null);
  const [message, setMessage] = useState("Loading the original from this browser…");
  useEffect(() => {
    if (!target) return;
    let disposed = false;
    let url: string | undefined;
    void (async () => {
      const sample = sampleAssets.find((asset) => asset.id === target.documentId);
      if (sample) {
        if (!disposed) setSelection({ asset: sample, target });
        return;
      }
      try {
        const doc = controller
          .getSnapshot()
          .session?.workspace.documents.find((item) => item.id === target.documentId);
        if (!doc || target.page > doc.pageCount)
          throw new RangeError("This source page is unavailable.");
        const blob = await controller.original(doc);
        if (!blob)
          throw new RangeError(
            "This original is missing from browser storage. Re-select the same PDF; your records are preserved.",
          );
        if (disposed) return;
        url = URL.createObjectURL(blob);
        setSelection({ asset: { ...doc, title: doc.name, pdfPath: url }, target });
      } catch (error) {
        if (!disposed)
          setMessage(error instanceof Error ? error.message : "The original could not be opened.");
      }
    })();
    return () => {
      disposed = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [controller, target]);
  if (!target) return null;
  if (selection && selection.target === target)
    return <PdfViewer selection={selection} onClose={onClose} />;
  return (
    <PaperDialog open onClose={onClose} title="Original PDF" caption="Browser source">
      <p role="status">{message}</p>
    </PaperDialog>
  );
}
