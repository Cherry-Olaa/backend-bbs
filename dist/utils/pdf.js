"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateReportPdf = generateReportPdf;
const puppeteer_1 = __importDefault(require("puppeteer"));
const Result_1 = __importDefault(require("../models/Result"));
const Student_1 = __importDefault(require("../models/Student"));
async function generateReportPdf(studentId, session, term) {
    const result = await Result_1.default.findOne({ studentId, session, term }).populate("results.subjectId").lean();
    if (!result)
        throw new Error("Result not found");
    const student = await Student_1.default.findById(studentId).lean();
    if (!student)
        throw new Error("Student not found");
    const html = renderHtml(result, student);
    const browser = await puppeteer_1.default.launch({ args: ["--no-sandbox", "--disable-setuid-sandbox"] });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({ format: "A4", printBackground: true, margin: { top: "20px", bottom: "20px" } });
    await browser.close();
    return pdfBuffer;
}
function renderHtml(result, student) {
    const rows = result.results.map((r) => {
        const subjectName = (r.subjectId && r.subjectId.name) || "Unknown";
        return `<tr>
      <td>${subjectName}</td>
      <td style="text-align:center">${r.ca}</td>
      <td style="text-align:center">${r.exam}</td>
      <td style="text-align:center">${r.total}</td>
      <td style="text-align:center">${r.grade}</td>
      <td>${r.comment || ""}</td>
    </tr>`;
    }).join("");
    return `
  <html>
  <head>
  <style>
    body { font-family: Arial, sans-serif; font-size: 12px; }
    .header { text-align:center; margin-bottom: 10px; }
    table { width:100%; border-collapse: collapse; }
    th, td { border: 1px solid #333; padding: 6px; }
  </style>
  </head>
  <body>
    <div class="header">
      <h2>BUSYBRAINS SCHOOLS</h2>
      <div>Session: ${result.session} — Term: ${result.term}</div>
    </div>
    <div>
      <strong>Name:</strong> ${student.firstName} ${student.lastName || ""}
      &nbsp;&nbsp; <strong>Admission No:</strong> ${student.admissionNumber}
      &nbsp;&nbsp; <strong>Class:</strong> ${student.classId || ""}
    </div>
    <br/>
    <table>
      <thead>
        <tr>
          <th>Subject</th><th>CA</th><th>Exam</th><th>Total</th><th>Grade</th><th>Teacher's comment</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
    <br/>
    <div><strong>Overall Total:</strong> ${result.overallTotal || ""} &nbsp;&nbsp; <strong>Average:</strong> ${result.average || ""}</div>
    <div style="margin-top:30px">Teacher's remark: ${result.remarks || ""}</div>
  </body>
  </html>
  `;
}
