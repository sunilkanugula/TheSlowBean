import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type ReceiptButtonProps = {
  order: any;
};

export default function ReceiptButton({ order }: ReceiptButtonProps) {
  const formatCurrency = (amount: number) => {
    return `Rs. ${Number(amount).toFixed(2)}`;
  };

  const downloadReceipt = () => {
    const doc = new jsPDF();
    const subtotal = order.items.reduce(
      (sum: number, item: any) => sum + Number(item.quantity) * Number(item.price),
      0
    );
    const grandTotal = Number(order.totalAmount ?? subtotal);

    const primaryColor: [number, number, number] = [22, 101, 52];

    /* ================= HEADER BAR ================= */
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 30, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(255);
    doc.text("THE SLOW BEAN", 14, 18);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("theslowbeanchocolate@gmail.com", 14, 24);

    /* ================= RECEIPT TITLE ================= */
    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("DELIVERY RECEIPT", 195, 45, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Order ID: #${order.id}`, 195, 52, { align: "right" });
    doc.text(
      `Date: ${new Date(order.createdAt).toLocaleDateString()}`,
      195,
      58,
      { align: "right" }
    );

    /* ================= CUSTOMER (LEFT) ================= */
    const a = order.address;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Bill To:", 14, 45);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(order.user?.name || "-", 14, 52);
    doc.text(order.user?.email || "-", 14, 58);

    const addressText = `${a?.line1 || ""}, ${a?.city || ""}, ${
      a?.state || ""
    } - ${a?.pincode || ""}`;

    doc.text(doc.splitTextToSize(addressText, 90), 14, 64);

    /* ================= SUPPLIER (RIGHT SIDE) ================= */
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Supplier:", 120, 45);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("The Slow Bean Chocolates", 120, 52);
    doc.text("Ippili Street, Srikakulam", 120, 58);
    doc.text("Andhra Pradesh - 532401", 120, 64);
    doc.text("Phone: +91 9XXXXXXXXX", 120, 70);

    /* ================= TABLE ================= */
    const tableStartY = 85;

    autoTable(doc, {
      startY: tableStartY,
      margin: { left: 14, right: 14 },
      tableWidth: 182,

      head: [["Item", "Qty", "Unit Price", "Amount"]],

      body: [
        ...order.items.map((item: any) => [
          item.product.title,
          item.quantity,
          formatCurrency(item.price),
          formatCurrency(item.quantity * item.price),
        ]),
        [
          {
            content: "Subtotal",
            colSpan: 3,
            styles: {
              halign: "right",
              fontStyle: "bold",
              fontSize: 10,
            },
          },
          {
            content: formatCurrency(subtotal),
            styles: {
              halign: "right",
              fontStyle: "bold",
              fontSize: 10,
            },
          },
        ],
        [
          {
            content: "Grand Total",
            colSpan: 3,
            styles: {
              halign: "right",
              fontStyle: "bold",
              fontSize: 11,
            },
          },
          {
            content: formatCurrency(grandTotal),
            styles: {
              halign: "right",
              fontStyle: "bold",
              fontSize: 11,
            },
          },
        ],
      ],

      theme: "striped",

      styles: {
        font: "helvetica",
        fontSize: 10,
        cellPadding: 6,
        textColor: 30,
      },

      headStyles: {
        fillColor: primaryColor,
        textColor: 255,
        fontStyle: "bold",
        halign: "center",
      },

      columnStyles: {
        0: { cellWidth: 85 },
        1: { cellWidth: 20, halign: "center" },
        2: { cellWidth: 35, halign: "right" },
        3: { cellWidth: 42, halign: "right" },
      },
    });

    const finalY = (doc as any).lastAutoTable.finalY;

    /* ================= SIGNATURE SECTION ================= */
    doc.setDrawColor(180);
    doc.line(14, finalY + 25, 80, finalY + 25);
    doc.setFontSize(9);
    doc.text("Authorized Signature", 14, finalY + 32);

    /* ================= FOOTER ================= */
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(
      "Thank you for shopping with The Slow Bean!",
      105,
      285,
      { align: "center" }
    );

    doc.save(`receipt-${order.id}.pdf`);
  };

  return (
    <button
      onClick={downloadReceipt}
      className="px-4 py-2 text-sm bg-[#7abf36] text-white rounded-lg shadow-md hover:bg-[#287a55] hover:scale-105 transition-all duration-200"
    >
      Download Receipt
    </button>
  );
}

