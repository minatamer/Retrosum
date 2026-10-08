"""Original fictional PDF layouts. No expected-output or provider imports.

Use the pinned requirements and Poppler; run from any working directory.
PDF/page/thumbnail hashes are computed from the actual authored bytes.
"""
from pathlib import Path
import hashlib
import json
import subprocess
from PIL import Image, ImageDraw, ImageFont, ImageOps
from pypdf import PdfReader
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "apps/frontend/public/samples/harbor-v1"
SCRATCH = ROOT / "artifacts/local/harbor-v1"
VERSION = "harbor-v1"
WIDTH, HEIGHT = 612, 792
FOREST = "#263c34"
RUST = "#98442f"
PAPER = "#faf6ed"
manifest = []


def render(arguments):
    result = subprocess.run(["pdftoppm", *arguments], capture_output=True, text=True)
    if result.stderr:
        with (SCRATCH / "poppler-diagnostics.log").open("a", encoding="utf-8") as log:
            log.write(result.stderr)
    result.check_returncode()


def text(pdf, value, x, y, size=11, font="Helvetica", color=FOREST):
    pdf.setFillColor(color)
    pdf.setFont(font, size)
    pdf.drawString(x, HEIGHT - y, value)


def rule(pdf, y, color="#ded9cf", start=48, end=564):
    pdf.setStrokeColor(color)
    pdf.line(start, HEIGHT - y, end, HEIGHT - y)


def page(pdf, title, subtitle, footer="Fictional demo document - not a payment request"):
    pdf.setFillColor(PAPER)
    pdf.rect(0, 0, WIDTH, HEIGHT, fill=1, stroke=0)
    text(pdf, title, 48, 70, 28, "Times-Bold")
    text(pdf, subtitle, 48, 98, 11, color=RUST)
    rule(pdf, 120)
    rule(pdf, 726)
    text(pdf, footer, 48, 747, 9)


def new_pdf(filename):
    pdf = canvas.Canvas(str(OUT / filename), pagesize=(WIDTH, HEIGHT), invariant=1)
    pdf.setTitle(filename)
    pdf.setAuthor("Retrosum - original fictional Harbor Studio corpus")
    pdf.setSubject("Synthetic English USD financial evidence; no real transaction")
    return pdf


def table(pdf, rows, y=280, heading=("Description", "Qty", "Unit / USD", "Amount / USD")):
    positions = [48, 340, 400, 500]
    for column, value in enumerate(heading):
        text(pdf, value, positions[column], y, 10, "Helvetica-Bold")
    rule(pdf, y + 12)
    for row_index, row in enumerate(rows):
        row_y = y + 44 + row_index * 42
        for column, value in enumerate(row):
            text(pdf, value, positions[column], row_y, 11)
        rule(pdf, row_y + 14)


def totals(pdf, values, y=470):
    for index, (label, amount) in enumerate(values):
        text(pdf, label, 340, y + index * 29, 11)
        pdf.setFont("Helvetica-Bold", 14 if index == len(values) - 1 else 11)
        pdf.setFillColor(FOREST)
        pdf.drawRightString(564, HEIGHT - y - index * 29, amount)


def register(filename, label, title, kind, layout, pages, provenance="synthetic", duplicate=None):
    asset = OUT / filename
    reader = PdfReader(asset)
    assert len(reader.pages) == pages
    prefix = SCRATCH / label
    render(["-r", "100", "-png", str(asset), str(prefix)])
    first = sorted(SCRATCH.glob(label + "-*.png"))[0]
    with Image.open(first) as image:
        image.thumbnail((420, 560))
        image.save(OUT / (label + ".webp"), "WEBP", quality=82)
    record = {
        "id": "document_" + label, "label": label, "name": filename,
        "title": title, "mime": "application/pdf",
        "sha256": hashlib.sha256(asset.read_bytes()).hexdigest(),
        "byteLength": asset.stat().st_size, "pageCount": pages,
        "kind": kind, "state": "selected", "provenance": provenance,
        "layoutFamily": layout,
        "pdfPath": "/samples/harbor-v1/" + filename,
        "thumbnailPath": "/samples/harbor-v1/" + label + ".webp",
    }
    if duplicate:
        record["duplicateOf"] = "document_" + duplicate
    manifest.append(record)


def raster_pdf(filename, image):
    pdf = new_pdf(filename)
    pdf.drawImage(ImageReader(image), 0, 0, width=WIDTH, height=HEIGHT)
    pdf.save()
    assert not PdfReader(OUT / filename).pages[0].extract_text()


def author():
    OUT.mkdir(parents=True, exist_ok=True)
    SCRATCH.mkdir(parents=True, exist_ok=True)
    pdf = new_pdf("harbor-HS-101.pdf")
    page(pdf, "Harbor Studio", "SERVICE INVOICE / HS-101")
    text(pdf, "From: Harbor Studio / studio@harbor.example", 48, 157)
    text(pdf, "Bill to: Cedar Works / accounts@cedar.example", 48, 186)
    text(pdf, "Issued: 2026-09-04", 48, 218)
    text(pdf, "Due: 2026-09-18", 340, 218)
    table(pdf, [("Brand discovery / hours", "12", "150.00", "1,800.00"),
                ("Visual direction / hours", "8", "150.00", "1,200.00")])
    totals(pdf, [("Subtotal / USD", "3,000.00"), ("Separate tax / USD", "0.00"),
                 ("Invoice total / USD", "3,000.00")])
    text(pdf, "Issued invoice. Payment evidence is recorded separately.", 48, 620)
    pdf.showPage()
    page(pdf, "A clear scope", "HS-101 / SERVICE NOTES")
    for index, value in enumerate([
        "Harbor Studio provides brand discovery and visual direction to Cedar Works.",
        "The invoice covers the completed September service work.",
        "Brand discovery: 12 hours at USD 150.00 = USD 1,800.00.",
        "Visual direction: 8 hours at USD 150.00 = USD 1,200.00.",
        "Total agreed service value: USD 3,000.00. Separate tax: USD 0.00.",
        "Payment due: 2026-09-18. Reference the invoice number HS-101.",
        "These notes explain the same invoice; they do not create another sale.",
    ]):
        text(pdf, value, 48, 173 + index * 47, 11)
    pdf.save()
    register("harbor-HS-101.pdf", "D01", "Cedar Works invoice", "invoice", "editorial-service", 2)

    pdf = new_pdf("harbor-HS-102.pdf")
    page(pdf, "An invoice for Maple Retail", "HARBOR STUDIO / HS-102")
    pdf.setFillColor("#e5ecef")
    pdf.rect(48, HEIGHT - 248, 516, 100, fill=1, stroke=0)
    text(pdf, "FROM / Harbor Studio", 64, 177, 12, "Helvetica-Bold")
    text(pdf, "TO / Maple Retail", 64, 204, 12)
    text(pdf, "Issued / 2026-09-24", 346, 177)
    text(pdf, "Due / 2026-10-08", 346, 204)
    text(pdf, "Currency / USD", 64, 231)
    table(pdf, [("Launch creative / project", "1", "1,200.00", "1,200.00"),
                ("Retail workshop / sessions", "2", "300.00", "600.00")], y=300)
    totals(pdf, [("Subtotal / USD", "1,800.00"), ("Separate tax / USD", "0.00"),
                 ("Total open / USD", "1,800.00")], y=490)
    text(pdf, "Status: OPEN. No payment recorded on this invoice.", 48, 636, 12, "Helvetica-Bold")
    pdf.save()
    register("harbor-HS-102.pdf", "D02", "Maple Retail invoice", "invoice", "grid-sidebar", 1)

    # Two different raster renditions of the same original supplier bill.
    pdf = new_pdf("northstar-master.pdf")
    page(pdf, "NORTHSTAR SUPPLIES", "SUPPLIER BILL / A-77")
    for value, y in [("Supplier: Northstar Supplies", 162), ("Customer: Harbor Studio", 190),
                     ("Issued: 2026-09-20", 220), ("Due: 2026-10-10", 248)]:
        text(pdf, value, 48, y, 12, "Courier")
    table(pdf, [("Print materials / packs", "12", "30.00", "360.00")], y=302)
    totals(pdf, [("Net / USD", "360.00"), ("Tax rate", "10%"), ("Tax / USD", "36.00"),
                 ("Gross open / USD", "396.00")], y=458)
    text(pdf, "Status: OPEN / Payable by Harbor Studio", 48, 632, 12, "Courier-Bold")
    pdf.save()
    render(["-r", "160", "-singlefile", "-png",
            str(OUT / "northstar-master.pdf"), str(SCRATCH / "northstar-master")])
    with Image.open(SCRATCH / "northstar-master.png") as master:
        scan = ImageOps.grayscale(master).convert("RGB")
        raster_pdf("northstar-A-77-scan.pdf", scan)
        second = scan.rotate(-0.35, resample=Image.Resampling.BICUBIC, fillcolor="white")
        ImageDraw.Draw(second).text((100, 1450), "SECOND COPY - SAME BILL A-77",
                                   font=ImageFont.load_default(size=23), fill="#696969")
        raster_pdf("northstar-A-77-second-copy.pdf", second)
    (OUT / "northstar-master.pdf").unlink()
    register("northstar-A-77-scan.pdf", "D03", "Northstar supplier bill", "bill", "scanned-monospace", 1)

    image = Image.new("RGB", (1530, 1980), "#f9f2df")
    draw = ImageDraw.Draw(image)
    handwriting = ROOT / "scripts/fixtures/assets/Caveat.ttf"
    for y in range(450, 1740, 120):
        draw.line((120, y, 1410, y), fill="#ddd8c9", width=2)
    lines = [
        ("Cove Spaces", 180, 91), ("Rent receipt / R-091", 350, 64),
        ("Received from: Harbor Studio", 550, 64), ("Date: 2026-09-01", 675, 64),
        ("For: September 2026 studio rent", 800, 64),
        ("Amount received: USD 800.00", 960, 73),
        ("Paid in full", 1125, 73), ("Separate tax: USD 0.00", 1280, 60),
        ("Signed: Cove Spaces (fictional)", 1440, 60),
    ]
    for index, (value, y, size) in enumerate(lines):
        draw.text((138 + (index % 3) * 7, y), value,
                  font=ImageFont.truetype(str(handwriting), size), fill="#203e5a")
    draw.text((122, 1820), "Synthetic handwriting-style demo - not human-written",
              font=ImageFont.load_default(size=31), fill="#594c39")
    image.save(SCRATCH / "rent-raster.png")
    raster_pdf("rent-R-091-handwritten.pdf", image)
    register("rent-R-091-handwritten.pdf", "D04", "Cove Spaces rent receipt", "receipt",
             "handwriting-notebook", 1, "synthetic_handwriting")

    pdf = new_pdf("papercloud-September.pdf")
    page(pdf, "PaperCloud", "SUBSCRIPTION RECEIPT / PC-091")
    pdf.setFillColor("#eae5f0")
    pdf.roundRect(92, 190, 428, 420, 12, fill=1, stroke=0)
    for index, value in enumerate([
        "Billed to: Harbor Studio", "Plan: Studio software subscription", "Quantity: 1 month",
        "Period: 2026-09-01 to 2026-09-30", "Paid on: 2026-09-12", "Unit price / USD: 120.00",
        "Separate tax / USD: 0.00", "Total paid / USD: 120.00", "Status: PAID",
    ]):
        text(pdf, value, 120, 225 + index * 37, 12)
    pdf.showPage()
    page(pdf, "Your subscription", "PC-091 / SERVICE NOTES")
    for index, value in enumerate([
        "PaperCloud supplies studio software to Harbor Studio.",
        "Subscription covers 2026-09-01 through 2026-09-30.",
        "One month at USD 120.00. No separate tax (USD 0.00).",
        "Paid on 2026-09-12. See receipt PC-091 for the same purchase.",
        "This service note is not another expense or another payment.",
    ]):
        text(pdf, value, 48, 180 + index * 48)
    pdf.save()
    register("papercloud-September.pdf", "D05", "PaperCloud software receipt", "receipt", "compact-subscription", 2)
    register("northstar-A-77-second-copy.pdf", "D06", "Northstar second copy", "bill", "scanned-monospace", 1, duplicate="D03")

    pdf = new_pdf("harbor-payments-September.pdf")
    for index, rows in enumerate([
        [("P-901", "2026-09-18", "Cedar Works", "+3,000.00", "HS-101 / customer payment"),
         ("P-902", "2026-09-01", "Cove Spaces", "-800.00", "R-091 / rent payment")],
        [("P-903", "2026-09-12", "PaperCloud", "-120.00", "PC-091 / software payment"),
         ("P-904", "2026-09-26", "Harbor-owned reserve", "-200.00", "TR-091 / internal transfer")],
    ]):
        page(pdf, "Harbor Studio", "PAYMENT REGISTER / September 2026 / USD")
        text(pdf, "Supplied movements; not a complete bank statement or bank balance.", 48, 154)
        if index == 0:
            text(pdf, "Snapshot as of: 2026-10-03", 48, 181)
        for row_index, (row_id, date, party, amount, reference) in enumerate(rows):
            y = 216 + row_index * 145
            text(pdf, row_id + " / " + date, 48, y, 11, "Helvetica-Bold")
            text(pdf, party, 48, y + 31, 16, "Times-Bold")
            text(pdf, reference, 48, y + 62)
            text(pdf, amount + " USD", 412, y + 31, 15, "Helvetica-Bold")
            rule(pdf, y + 88)
        if index == 0:
            text(pdf, "Positive is money received. Negative is money paid out.", 48, 589)
            text(pdf, "Continue to the next page for the remaining supplied movements.", 48, 623)
        else:
            text(pdf, "TR-091: from Harbor checking to Harbor-owned reserve.", 48, 542)
            text(pdf, "Internal transfer, not income or an operating cost.", 48, 570)
            text(pdf, "Operating received: USD 3,000.00 / paid: USD 920.00", 48, 612)
            text(pdf, "Net operating movement: USD 2,080.00", 48, 640)
            text(pdf, "Net of all supplied rows including transfer: USD 1,880.00", 48, 669)
        pdf.showPage()
    pdf.save()
    register("harbor-payments-September.pdf", "D07", "September payment register", "payment_register", "movement-register", 2)

    pdf = new_pdf("harbor-August-records.pdf")
    page(pdf, "The August record pack", "HARBOR STUDIO / AUGUST 2026 / USD")
    text(pdf, "Every record behind the comparison is included in this pack.", 48, 165)
    for index, value in enumerate([
        "SALES / AU-101 Cedar Works: USD 2,500.00", "SALES / AU-102 Maple Retail: USD 1,500.00",
        "COST / R-081 Cove Spaces rent: USD 800.00", "COST / NS-A-10 Northstar materials: USD 200.00",
        "COST / PC-081 PaperCloud software: USD 100.00", "Total documented sales: USD 4,000.00",
        "Total documented costs: USD 1,100.00", "Profit preview (sales less costs): USD 2,900.00",
    ]):
        text(pdf, value, 48, 220 + index * 43, 12)
    text(pdf, "Details follow. No payment movements or bank balances are supplied.", 48, 652)
    pdf.showPage()
    page(pdf, "August sales", "HARBOR STUDIO / SOURCE RECORDS")
    for index, (ref, party, issued, due, qty, amount) in enumerate([
        ("AU-101", "Cedar Works", "2026-08-06", "2026-08-20", "10", "2,500.00"),
        ("AU-102", "Maple Retail", "2026-08-21", "2026-09-04", "6", "1,500.00"),
    ]):
        y = 173 + index * 250
        text(pdf, ref + " / Harbor Studio bills " + party, 48, y, 15, "Times-Bold")
        text(pdf, "Issued: " + issued + " / Due: " + due, 48, y + 37)
        text(pdf, "Design services / hours: " + qty + " / Unit price USD: 250.00", 48, y + 74)
        text(pdf, "Net and total USD: " + amount + " / Separate tax USD: 0.00", 48, y + 111)
        text(pdf, "Payment status not recorded in this pack.", 48, y + 148)
        rule(pdf, y + 177)
    pdf.showPage()
    page(pdf, "August recurring costs", "HARBOR STUDIO / SOURCE RECORDS")
    for index, (ref, party, item, date, amount) in enumerate([
        ("R-081", "Cove Spaces", "August studio rent", "2026-08-01", "800.00"),
        ("PC-081", "PaperCloud", "August software subscription", "2026-08-12", "100.00"),
    ]):
        y = 173 + index * 250
        text(pdf, ref + " / " + party + " bills Harbor Studio", 48, y, 15, "Times-Bold")
        text(pdf, "Issued: " + date + " / Currency: USD", 48, y + 37)
        text(pdf, item + " / Quantity: 1 / Unit price: " + amount, 48, y + 74)
        text(pdf, "Net and total USD: " + amount + " / Separate tax USD: 0.00", 48, y + 111)
        text(pdf, "Payment status not recorded in this pack.", 48, y + 148)
        rule(pdf, y + 177)
    pdf.showPage()
    page(pdf, "August supplier cost", "HARBOR STUDIO / SOURCE RECORDS")
    for index, value in enumerate([
        "NS-A-10 / Northstar Supplies bills Harbor Studio", "Issued: 2026-08-15 / Currency: USD",
        "Print materials / packs: 4 / Unit price USD: 50.00", "Net and total USD: 200.00",
        "Separate tax USD: 0.00", "Payment status not recorded in this pack.",
        "This pack contains five events. Summary repeats are not new events.",
    ]):
        text(pdf, value, 48, 182 + index * 48, 12)
    pdf.save()
    register("harbor-August-records.pdf", "D08", "August comparison records", "history", "archive-record-pack", 4)

    assert sum(item["pageCount"] for item in manifest) == 14
    assert all(item["byteLength"] <= 5 * 1024 * 1024 for item in manifest)
    assert sum(item["byteLength"] for item in manifest) <= 20 * 1024 * 1024
    result = {"fixtureVersion": VERSION, "business": "Harbor Studio", "currency": "USD",
              "period": "2026-09", "asOf": "2026-10-03", "documents": manifest}
    destination = ROOT / "apps/frontend/src/features/documents/sample-manifest.json"
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"files": len(manifest), "pages": 14,
                      "bytes": sum(item["byteLength"] for item in manifest)}))


if __name__ == "__main__":
    author()
