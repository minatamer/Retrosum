import { deflateSync } from "node:zlib";

/** Owned bounded synthetic fixture, never a visitor PDF or an unbounded fuzzer. */
export function pressurePdf({
  images = 6,
  width = 3000,
  height = 3900,
  pages = 1,
  operators = 0,
  padding = 0,
  inlineImages = 0,
} = {}) {
  if (
    !Number.isInteger(images) ||
    images < 0 ||
    images > 8 ||
    !Number.isInteger(pages) ||
    pages < 1 ||
    pages > 20 ||
    width * height > 12_000_000 ||
    width < 1 ||
    height < 1 ||
    operators < 0 ||
    operators > 110_000 ||
    padding < 0 ||
    padding > 5 * 1024 * 1024 ||
    !Number.isInteger(inlineImages) ||
    inlineImages < 0 ||
    inlineImages > 8500
  )
    throw new RangeError("Invalid bounded fixture");
  const image = deflateSync(Buffer.alloc(width * height * 3, 192));
  const objects = [],
    add = (value) => objects.push(Buffer.isBuffer(value) ? value : Buffer.from(value));
  const contentId = 3 + pages,
    imageStart = contentId + 1;
  add("<< /Type /Catalog /Pages 2 0 R >>");
  add(
    "<< /Type /Pages /Kids [" +
      Array.from({ length: pages }, (_, i) => 3 + i + " 0 R").join(" ") +
      "] /Count " +
      pages +
      " >>",
  );
  for (let i = 0; i < pages; i++)
    add(
      "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /XObject << " +
        Array.from({ length: images }, (_, n) => "/Im" + n + " " + (imageStart + n) + " 0 R").join(
          " ",
        ) +
        " >> >> /Contents " +
        contentId +
        " 0 R >>",
    );
  const inline = deflateSync(Buffer.alloc(99 * 99 * 3, 192));
  const content = Buffer.concat([
    Buffer.from(
      Array.from({ length: images }, (_, i) => "q 50 0 0 50 0 0 cm /Im" + i + " Do Q").join("\n") +
        "\n" +
        "0 0 m 1 1 l S\n".repeat(operators),
    ),
    ...Array.from({ length: inlineImages }, (_, i) =>
      Buffer.concat([
        Buffer.from("q BI /W 99 /H 99 /CS /RGB /BPC 8 /F /Fl /AuditId " + i + " ID\n"),
        inline,
        Buffer.from("\nEI Q\n"),
      ]),
    ),
  ]);
  add(
    Buffer.concat([
      Buffer.from("<< /Length " + content.length + " >>\nstream\n"),
      content,
      Buffer.from("\nendstream"),
    ]),
  );
  for (let i = 0; i < images; i++)
    add(
      Buffer.concat([
        Buffer.from(
          "<< /Type /XObject /Subtype /Image /Width " +
            width +
            " /Height " +
            height +
            " /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /FlateDecode /Length " +
            image.length +
            " >>\nstream\n",
        ),
        image,
        Buffer.from("\nendstream"),
      ]),
    );
  if (padding)
    add(
      Buffer.concat([
        Buffer.from("<< /Length " + padding + " >>\nstream\n"),
        Buffer.alloc(padding, 32),
        Buffer.from("\nendstream"),
      ]),
    );
  const pieces = [Buffer.from("%PDF-1.7\n")],
    offsets = [0];
  let cursor = pieces[0].length;
  for (let i = 0; i < objects.length; i++) {
    offsets.push(cursor);
    const object = Buffer.concat([
      Buffer.from(i + 1 + " 0 obj\n"),
      objects[i],
      Buffer.from("\nendobj\n"),
    ]);
    pieces.push(object);
    cursor += object.length;
  }
  pieces.push(
    Buffer.from(
      "xref\n0 " +
        offsets.length +
        "\n0000000000 65535 f \n" +
        offsets
          .slice(1)
          .map((n) => String(n).padStart(10, "0") + " 00000 n \n")
          .join("") +
        "trailer\n<< /Size " +
        offsets.length +
        " /Root 1 0 R >>\nstartxref\n" +
        cursor +
        "\n%%EOF\n",
    ),
  );
  return Buffer.concat(pieces);
}
