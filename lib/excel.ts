import ExcelJS from "exceljs";
import { statusLabel } from "./format";
import type { Job } from "./types";

export async function exportJobsToExcel(jobs: Job[]) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Jobs");

  sheet.columns = [
    { header: "No.", key: "no", width: 6 },
    { header: "Company", key: "company", width: 20 },
    { header: "Role", key: "role", width: 32 },
    { header: "Function", key: "function", width: 18 },
    { header: "Location", key: "location", width: 24 },
    { header: "Years of experience", key: "yoe", width: 16 },
    { header: "Job type", key: "jobType", width: 12 },
    { header: "Work mode", key: "workMode", width: 12 },
    { header: "Work authorization", key: "workAuthorization", width: 20 },
    { header: "Industry", key: "industry", width: 14 },
    { header: "Status", key: "status", width: 18 },
    { header: "Saved", key: "saved", width: 8 },
    { header: "Discovered at", key: "discoveredAt", width: 22 },
    { header: "URL", key: "url", width: 40 },
  ];
  sheet.getRow(1).font = { bold: true };

  jobs.forEach((job, i) => {
    sheet.addRow({
      no: i + 1,
      company: job.sourceName,
      role: job.roleTitle,
      function: job.function,
      location: [job.locationCity, job.locationState || job.locationCountry].filter(Boolean).join(", "),
      yoe: job.yearsExperience,
      jobType: job.jobType,
      workMode: job.workMode,
      workAuthorization: job.workAuthorization,
      industry: job.industry,
      status: statusLabel(job),
      saved: job.saved ? "Yes" : "No",
      discoveredAt: job.discoveredAt,
      url: job.url,
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `jobs-scanner-export-${new Date().toISOString().slice(0, 10)}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
