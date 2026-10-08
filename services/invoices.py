"""

Invoice PDF generation for sales and purchases.

Rendering (render_invoice_pdf) is separated from data loading

(build_sale_invoice / build_purchase_invoice) so the layout can be

tested without a database.

Requires:  pip install reportlab pillow

"""

from __future__ import annotations

import os

from dataclasses import dataclass, field

from datetime import date, datetime

from functools import lru_cache

from io import BytesIO

from pathlib import Path

from PIL import Image

from reportlab.lib import colors

from reportlab.lib.enums import TA_RIGHT

from reportlab.lib.pagesizes import A4

from reportlab.lib.styles import ParagraphStyle

from reportlab.lib.units import mm

from reportlab.lib.utils import ImageReader

from reportlab.platypus import (

    BaseDocTemplate,

    Frame,

    KeepTogether,

    NextPageTemplate,

    PageTemplate,

    Paragraph,

    Spacer,

    Table,

    TableStyle,

)

from sqlmodel import Session

from database.models import Customer, Supplier

from services.purchase import get_purchase_detail  # adjust module name if needed

from services.sales import get_sale_detail

# ============================================================

# CONFIG  (override with environment variables)

# ============================================================

COMPANY = {

    "name": os.getenv("COMPANY_NAME", "SAM COOL"),

    "tagline": os.getenv("COMPANY_TAGLINE", "For Trading & Contracting"),

    "website": os.getenv("COMPANY_WEBSITE", "www.yourwebsite.com"),

}

LOGO_PATH = Path(

    os.getenv(

        "INVOICE_LOGO_PATH",

        Path(__file__).resolve().parent.parent /"assets" / "logo-mdw.png",

    )

)

CURRENCY = os.getenv("INVOICE_CURRENCY_SYMBOL", "$")

BRAND = colors.HexColor("#03A0E9")  # taken from the logo

BRAND_DARK = colors.HexColor("#0279B3")

ROW_ALT = colors.HexColor("#E8F5FC")

INK = colors.HexColor("#0F172A")

MUTED = colors.HexColor("#64748B")

RULE = colors.HexColor("#CBD5E1")

PAGE_W, PAGE_H = A4

MARGIN = 18 * mm

CONTENT_W = PAGE_W - 2 * MARGIN

FIRST_HEADER_H = 38 * mm

LATER_HEADER_H = 26 * mm

# ============================================================

# DATA STRUCTURES

# ============================================================

@dataclass

class InvoiceLine:

    description: str

    quantity: int

    unit_price: float

    discount_pct: float

    total: float

@dataclass

class InvoiceData:

    kind: str  # "sale" | "purchase"

    number: str

    issue_date: str | None

    delivery_date: str | None

    status: str

    party_label: str

    party_name: str

    party_phone: str | None = None

    party_email: str | None = None

    party_address: str | None = None

    lines: list[InvoiceLine] = field(default_factory=list)

    subtotal: float = 0.0

    discount: float = 0.0

    total: float = 0.0

    @property

    def title(self) -> str:

        return "INVOICE" if self.kind == "sale" else "PURCHASE"

    @property

    def show_discount(self) -> bool:

        return self.kind == "sale" and any(l.discount_pct for l in self.lines)

# ============================================================

# HELPERS

# ============================================================

def money(value: float) -> str:

    return f"{CURRENCY}{value:,.2f}"

def fmt_date(value) -> str | None:

    if value is None or value == "":

        return None

    if isinstance(value, (datetime, date)):

        return value.strftime("%d %b %Y")

    try:

        return datetime.fromisoformat(str(value)).strftime("%d %b %Y")

    except ValueError:

        return str(value)

def pretty_status(status) -> str:
    if hasattr(status, "value"):
        status = status.value

    return str(status).replace("_", " ").title()

def status_color(status: str):

    s = str(status).upper()

    if s == "COMPLETED":

        return colors.HexColor("#059669")

    if s == "CANCELLED":

        return colors.HexColor("#DC2626")

    return colors.HexColor("#D97706")

@lru_cache(maxsize=1)

def _logo() -> ImageReader | None:

    """Load the logo, crop its transparent padding, and shrink it."""

    if not LOGO_PATH.exists():

        return None

    img = Image.open(LOGO_PATH).convert("RGBA")

    bbox = img.split()[-1].getbbox()

    if bbox:

        img = img.crop(bbox)

    if img.width > 900:

        img = img.resize((900, round(img.height * 900 / img.width)), Image.LANCZOS)

    buf = BytesIO()

    img.save(buf, format="PNG")

    buf.seek(0)

    return ImageReader(buf)

def _draw_logo(c, x, y, height):

    """Draw logo with its bottom-left at (x, y). Returns drawn width."""

    logo = _logo()

    if logo is None:

        return 0

    w, h = logo.getSize()

    width = height * w / h

    c.drawImage(logo, x, y, width=width, height=height, mask="auto")

    return width

def _rule(c, y):

    """Grey line with a short brand-coloured lead."""

    c.setStrokeColor(RULE)

    c.setLineWidth(0.8)

    c.line(MARGIN, y, PAGE_W - MARGIN, y)

    c.setStrokeColor(BRAND)

    c.setLineWidth(2)

    c.line(MARGIN, y, MARGIN + 22 * mm, y)

# ============================================================

# PAGE DECORATION (watermark / header)

# ============================================================

def _draw_watermark(c, data: InvoiceData):

    logo = _logo()

    if logo is not None:

        c.saveState()

        c.setFillAlpha(0.07)

        w, h = logo.getSize()

        width = 120 * mm

        height = width * h / w

        c.drawImage(

            logo,

            (PAGE_W - width) / 2,

            (PAGE_H - height) / 2 - 10 * mm,

            width=width,

            height=height,

            mask="auto",

        )

        c.restoreState()

    if str(data.status).upper() == "CANCELLED":

        c.saveState()

        c.setFillColor(colors.HexColor("#DC2626"))

        c.setFillAlpha(0.12)  # must come after setFillColor, which resets alpha

        c.setFont("Helvetica-Bold", 72)

        c.translate(PAGE_W / 2, PAGE_H / 2)

        c.rotate(35)

        c.drawCentredString(0, 0, "CANCELLED")

        c.restoreState()

def _first_page(data: InvoiceData):

    def draw(c, doc):

        top = PAGE_H - MARGIN

        logo_h = 17 * mm

        logo_w = _draw_logo(c, MARGIN, top - logo_h, logo_h)

        text_x = MARGIN + logo_w + 5 * mm

        c.setFillColor(INK)

        c.setFont("Helvetica-Bold", 18)

        c.drawString(text_x, top - 8 * mm, COMPANY["name"].upper())

        c.setFillColor(MUTED)

        c.setFont("Helvetica", 9)

        c.drawString(text_x, top - 14 * mm, COMPANY["tagline"].upper())

        c.setFillColor(BRAND)

        c.setFont("Helvetica-Bold", 32)

        c.drawRightString(PAGE_W - MARGIN, top - 10 * mm, data.title)

        if data.kind == "purchase":

            c.setFont("Helvetica-Bold", 11)

            c.setFillColor(BRAND_DARK)

            c.drawRightString(PAGE_W - MARGIN, top - 17 * mm, "INVOICE")

        rule_y = top - logo_h - 5 * mm

        _rule(c, rule_y)

        c.setFillColor(INK)

        c.setFont("Helvetica", 9)

        c.drawRightString(PAGE_W - MARGIN, rule_y - 12, COMPANY["website"].upper())

    return draw

def _later_pages(data: InvoiceData):

    def draw(c, doc):

        top = PAGE_H - MARGIN

        _draw_logo(c, MARGIN, top - 10 * mm, 10 * mm)

        c.setFillColor(INK)

        c.setFont("Helvetica-Bold", 11)

        c.drawRightString(PAGE_W - MARGIN, top - 5 * mm, f"{data.title} {data.number}")

        _rule(c, top - 13 * mm)

    return draw

# ============================================================

# RENDER

# ============================================================

def render_invoice_pdf(data: InvoiceData) -> bytes:

    buf = BytesIO()

    doc = BaseDocTemplate(

        buf,

        pagesize=A4,

        leftMargin=MARGIN,

        rightMargin=MARGIN,

        topMargin=MARGIN,

        bottomMargin=MARGIN,

        title=f"{data.title.title()} {data.number}",

        author=COMPANY["name"],

    )

    def frame(top_offset, fid):

        return Frame(

            MARGIN,

            MARGIN,

            CONTENT_W,

            PAGE_H - (2 * MARGIN) - top_offset,

            leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0,

            id=fid,

        )

    doc.addPageTemplates([

        PageTemplate(id="first", frames=[frame(FIRST_HEADER_H, "f1")], onPage=_first_page(data), onPageEnd=lambda c, d: _draw_watermark(c, data)),

        PageTemplate(id="later", frames=[frame(LATER_HEADER_H, "f2")], onPage=_later_pages(data), onPageEnd=lambda c, d: _draw_watermark(c, data)),

    ])

    # ---- styles ----

    base = ParagraphStyle("base", fontName="Helvetica", fontSize=9.5, leading=13, textColor=INK)

    small = ParagraphStyle("small", parent=base, fontSize=9, leading=12.5, textColor=MUTED)

    label = ParagraphStyle("label", parent=base, textColor=MUTED)

    name = ParagraphStyle("name", parent=base, fontName="Helvetica-Bold", fontSize=14, leading=18)

    right = ParagraphStyle("right", parent=base, alignment=TA_RIGHT)

    right_bold = ParagraphStyle("rb", parent=right, fontName="Helvetica-Bold", fontSize=11)

    cell = ParagraphStyle("cell", parent=base, fontSize=9.5, leading=12)

    bold = ParagraphStyle("bold", parent=base, fontName="Helvetica-Bold")

    story = [NextPageTemplate("later")]

    # ---- bill-to / meta block ----

    left = [Paragraph(data.party_label, label), Paragraph(data.party_name, name)]

    for v in (data.party_phone, data.party_email, data.party_address):

        if v:

            left.append(Paragraph(str(v), small))

    sc = status_color(data.status).hexval()[2:]

    meta_label = "Invoice no" if data.kind == "sale" else "Purchase no"

    right_col = [

        Paragraph(f"{meta_label} : {data.number}", right_bold),

        Paragraph(data.issue_date or "", right),

    ]

    if data.delivery_date:

        right_col.append(Paragraph(f"Delivery : {data.delivery_date}", right))

    right_col.append(Spacer(1, 3))

    right_col.append(

        Paragraph(f'Status : <font color="#{sc}"><b>{pretty_status(data.status)}</b></font>', right)

    )

    info = Table([[left, right_col]], colWidths=[CONTENT_W * 0.55, CONTENT_W * 0.45])

    info.setStyle(TableStyle([

        ("VALIGN", (0, 0), (-1, -1), "TOP"),

        ("LEFTPADDING", (0, 0), (-1, -1), 0),

        ("RIGHTPADDING", (0, 0), (-1, -1), 0),

    ]))

    story += [info, Spacer(1, 9 * mm)]

    # ---- items table ----

    if data.show_discount:

        widths = [10 * mm, 68 * mm, 16 * mm, 27 * mm, 18 * mm, 35 * mm]

        head = ["NO", "DESCRIPTION", "QTY", "PRICE", "DISC.", "TOTAL"]

    else:

        widths = [10 * mm, 86 * mm, 16 * mm, 27 * mm, 35 * mm]

        head = ["NO", "DESCRIPTION", "QTY", "PRICE", "TOTAL"]

    rows = [head]

    for i, l in enumerate(data.lines, 1):

        row = [str(i), Paragraph(l.description, cell), str(l.quantity), money(l.unit_price)]

        if data.show_discount:

            row.append(f"{l.discount_pct:g}%" if l.discount_pct else "-")

        row.append(money(l.total))

        rows.append(row)

    ncols = len(head)

    table = Table(rows, colWidths=widths, repeatRows=1)

    table.setStyle(TableStyle([

        ("BACKGROUND", (0, 0), (-1, 0), BRAND),

        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),

        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),

        ("FONTSIZE", (0, 0), (-1, 0), 9.5),

        ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),

        ("FONTSIZE", (0, 1), (-1, -1), 9.5),

        ("TEXTCOLOR", (0, 1), (-1, -1), INK),

        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, ROW_ALT]),

        ("ALIGN", (0, 0), (0, -1), "CENTER"),

        ("ALIGN", (1, 0), (1, 0), "CENTER"),

        ("ALIGN", (2, 0), (2, -1), "CENTER"),

        ("ALIGN", (3, 0), (ncols - 1, -1), "RIGHT"),

        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),

        ("TOPPADDING", (0, 0), (-1, -1), 6),

        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),

        ("LEFTPADDING", (0, 0), (-1, -1), 6),

        ("RIGHTPADDING", (0, 0), (-1, -1), 6),

        ("LINEBELOW", (0, -1), (-1, -1), 0.8, RULE),

    ]))

    story += [table, Spacer(1, 6 * mm)]

    # ---- totals ----

    t_rows = [["Sub Total :", money(data.subtotal)]]

    if data.discount:

        t_rows.append(["Discount :", f"-{money(data.discount)}"])

    t_rows.append(["GRAND TOTAL :", money(data.total)])

    last = len(t_rows) - 1

    totals = Table(t_rows, colWidths=[42 * mm, 38 * mm], hAlign="RIGHT")

    totals.setStyle(TableStyle([

        ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),

        ("FONTSIZE", (0, 0), (-1, -1), 10),

        ("TEXTCOLOR", (0, 0), (-1, -1), INK),

        ("ALIGN", (0, 0), (-1, -1), "RIGHT"),

        ("TOPPADDING", (0, 0), (-1, -1), 4),

        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),

        ("BACKGROUND", (0, last), (-1, last), BRAND),

        ("TEXTCOLOR", (0, last), (-1, last), colors.white),

        ("FONTNAME", (0, last), (-1, last), "Helvetica-Bold"),

        ("TOPPADDING", (0, last), (-1, last), 7),

        ("BOTTOMPADDING", (0, last), (-1, last), 7),

    ]))

    # ---- closing block ----

    if data.kind == "sale":

        thanks = "Thank you for your business!"

        terms_title = "Terms and Conditions :"

        terms = "Items and Products sold can't be returned once opened*"

    else:

        thanks = "Purchase recorded."

        terms_title = "Notes :"

        terms = "Goods received are subject to inspection."

    sig_line = Table([[""]], colWidths=[55 * mm], rowHeights=[1], hAlign="RIGHT")

    sig_line.setStyle(TableStyle([("LINEABOVE", (0, 0), (-1, 0), 0.8, MUTED)]))

    closing = Table(

        [[

            [Paragraph(thanks, bold), Spacer(1, 4 * mm), Paragraph(terms_title, bold), Paragraph(terms, small)],

            [Spacer(1, 12 * mm), sig_line,

             Paragraph("Authorized signature", ParagraphStyle("sig", parent=small, alignment=TA_RIGHT))],

        ]],

        colWidths=[CONTENT_W * 0.6, CONTENT_W * 0.4],

    )

    closing.setStyle(TableStyle([

        ("VALIGN", (0, 0), (-1, -1), "TOP"),

        ("LEFTPADDING", (0, 0), (-1, -1), 0),

        ("RIGHTPADDING", (0, 0), (-1, -1), 0),

    ]))

    story.append(KeepTogether([totals, Spacer(1, 10 * mm), closing]))

    doc.build(story)

    return buf.getvalue()

# ============================================================

# BUILDERS (load from DB -> render)

# ============================================================

def _contact(obj):

    return (

        getattr(obj, "phone", None),

        getattr(obj, "email", None),

        getattr(obj, "address", None),

    )

def build_sale_invoice(session: Session, sale_id: int) -> tuple[bytes, str]:

    detail = get_sale_detail(session, sale_id)  # raises 404 if missing

    customer = session.get(Customer, detail.customer_id)

    phone, email, address = _contact(customer) if customer else (None, None, None)

    data = InvoiceData(

        kind="sale",

        number=detail.invoice_number,

        issue_date=fmt_date(detail.sale_date),

        delivery_date=fmt_date(detail.delivery_date),

        status=detail.status,

        party_label="Invoice to :",

        party_name=detail.customer,

        party_phone=phone,

        party_email=email,

        party_address=address,

        lines=[

            InvoiceLine(

                description=i.product_name,

                quantity=i.quantity,

                unit_price=i.unit_price,

                discount_pct=i.discount_percentage or 0,

                total=i.line_total,

            )

            for i in detail.items

        ],

        subtotal=sum(i.line_subtotal for i in detail.items),

        discount=sum(i.discount_amount for i in detail.items),

        total=detail.total,

    )

    return render_invoice_pdf(data), f"{detail.invoice_number}.pdf"

def build_purchase_invoice(session: Session, purchase_id: int) -> tuple[bytes, str]:

    detail = get_purchase_detail(session, purchase_id)

    supplier = session.get(Supplier, detail.supplier_id)

    phone, email, address = _contact(supplier) if supplier else (None, None, None)

    data = InvoiceData(

        kind="purchase",

        number=detail.invoice_number,

        issue_date=fmt_date(detail.purchase_date),

        delivery_date=fmt_date(detail.delivery_date),

        status=detail.status,

        party_label="Supplier :",

        party_name=detail.supplier,

        party_phone=phone,

        party_email=email,

        party_address=address,

        lines=[

            InvoiceLine(

                description=i.product_name,

                quantity=i.quantity,

                unit_price=i.unit_cost,

                discount_pct=0,

                total=i.line_total,

            )

            for i in detail.items

        ],

        subtotal=detail.total_cost,

        discount=0,

        total=detail.total_cost,

    )

    return render_invoice_pdf(data), f"{detail.invoice_number}.pdf"